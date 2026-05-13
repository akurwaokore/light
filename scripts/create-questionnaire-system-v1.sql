-- Create questionnaires table
CREATE TABLE IF NOT EXISTS questionnaires (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  title VARCHAR(255) NOT NULL,
  description TEXT,
  created_by UUID REFERENCES profiles(id) ON DELETE SET NULL,
  status VARCHAR(50) DEFAULT 'draft', -- draft, active, closed
  target_audience VARCHAR(50) DEFAULT 'all', -- all, annual_members, lifetime_members, specific_campus
  target_filters JSONB, -- For specific targeting like campus, graduation_year, etc.
  start_date TIMESTAMP WITH TIME ZONE,
  end_date TIMESTAMP WITH TIME ZONE,
  is_required BOOLEAN DEFAULT false,
  send_notification BOOLEAN DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create questionnaire_questions table
CREATE TABLE IF NOT EXISTS questionnaire_questions (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  questionnaire_id UUID REFERENCES questionnaires(id) ON DELETE CASCADE,
  question_text TEXT NOT NULL,
  question_type VARCHAR(50) NOT NULL, -- multiple_choice, single_choice, text, scale, yes_no
  options JSONB, -- For choice-based questions
  is_required BOOLEAN DEFAULT false,
  order_index INTEGER NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create questionnaire_responses table
CREATE TABLE IF NOT EXISTS questionnaire_responses (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  questionnaire_id UUID REFERENCES questionnaires(id) ON DELETE CASCADE,
  user_id UUID REFERENCES profiles(id) ON DELETE CASCADE,
  responses JSONB NOT NULL, -- Array of {question_id, answer}
  completed_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  time_taken_seconds INTEGER,
  UNIQUE(questionnaire_id, user_id) -- One response per user per questionnaire
);

-- Create index for faster queries
CREATE INDEX IF NOT EXISTS idx_questionnaires_status ON questionnaires(status);
CREATE INDEX IF NOT EXISTS idx_questionnaires_created_by ON questionnaires(created_by);
CREATE INDEX IF NOT EXISTS idx_questionnaire_questions_questionnaire_id ON questionnaire_questions(questionnaire_id);
CREATE INDEX IF NOT EXISTS idx_questionnaire_responses_questionnaire_id ON questionnaire_responses(questionnaire_id);
CREATE INDEX IF NOT EXISTS idx_questionnaire_responses_user_id ON questionnaire_responses(user_id);

-- Enable RLS
ALTER TABLE questionnaires ENABLE ROW LEVEL SECURITY;
ALTER TABLE questionnaire_questions ENABLE ROW LEVEL SECURITY;
ALTER TABLE questionnaire_responses ENABLE ROW LEVEL SECURITY;

-- RLS Policies for questionnaires
CREATE POLICY "Anyone can view active questionnaires" ON questionnaires
  FOR SELECT USING (status = 'active');

CREATE POLICY "Admins can manage questionnaires" ON questionnaires
  FOR ALL USING (
    EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND is_admin = true)
  );

-- RLS Policies for questions
CREATE POLICY "Anyone can view questions of active questionnaires" ON questionnaire_questions
  FOR SELECT USING (
    EXISTS (SELECT 1 FROM questionnaires WHERE id = questionnaire_id AND status = 'active')
  );

CREATE POLICY "Admins can manage questions" ON questionnaire_questions
  FOR ALL USING (
    EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND is_admin = true)
  );

-- RLS Policies for responses
CREATE POLICY "Users can view their own responses" ON questionnaire_responses
  FOR SELECT USING (user_id = auth.uid());

CREATE POLICY "Users can submit responses" ON questionnaire_responses
  FOR INSERT WITH CHECK (user_id = auth.uid());

CREATE POLICY "Admins can view all responses" ON questionnaire_responses
  FOR SELECT USING (
    EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND is_admin = true)
  );

-- Function to send notifications when questionnaire is activated
CREATE OR REPLACE FUNCTION notify_users_new_questionnaire()
RETURNS TRIGGER AS $$
BEGIN
  -- Only send notifications when status changes to 'active' and send_notification is true
  IF NEW.status = 'active' AND NEW.send_notification = true AND (OLD.status IS NULL OR OLD.status != 'active') THEN
    -- Insert notifications for all users (simplified - in production would respect target_audience)
    INSERT INTO notifications (user_id, type, title, message, link, metadata)
    SELECT 
      id,
      'questionnaire',
      NEW.title,
      COALESCE(NEW.description, 'Please take a moment to complete this questionnaire'),
      '/questionnaires/' || NEW.id,
      jsonb_build_object('questionnaire_id', NEW.id, 'is_required', NEW.is_required)
    FROM profiles
    WHERE status = 'active';
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger
DROP TRIGGER IF EXISTS trigger_notify_new_questionnaire ON questionnaires;
CREATE TRIGGER trigger_notify_new_questionnaire
  AFTER INSERT OR UPDATE ON questionnaires
  FOR EACH ROW
  EXECUTE FUNCTION notify_users_new_questionnaire();

-- Grant permissions
GRANT SELECT, INSERT ON questionnaires TO authenticated;
GRANT SELECT, INSERT ON questionnaire_questions TO authenticated;
GRANT SELECT, INSERT ON questionnaire_responses TO authenticated;
