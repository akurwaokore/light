const { createClient } = require('@supabase/supabase-js');
const fs = require('fs');
const path = require('path');

// Basic manual env loader
const envPath = fs.existsSync(path.join(process.cwd(), '.env.local'))
  ? path.join(process.cwd(), '.env.local')
  : path.join(process.cwd(), '.env');
const envContent = fs.readFileSync(envPath, 'utf8');
const env = {};
envContent.split('\n').forEach(line => {
  const [key, ...valueParts] = line.split('=');
  if (key && valueParts.length > 0) {
    env[key.trim()] = valueParts.join('=').trim().replace(/^["']|["']$/g, '');
  }
});

async function inspectNotifications() {
  const supabase = createClient(
    env.NEXT_PUBLIC_SUPABASE_URL,
    env.SUPABASE_SERVICE_ROLE_KEY
  );

  console.log('--- Inspecting notifications columns ---');
  const { data, error } = await supabase.from('notifications').select('*').limit(1);
  
  if (data && data.length > 0) {
    console.log('Columns found:', Object.keys(data[0]));
  } else {
    console.log('No data found to inspect columns. Error:', error?.message);
  }
}

inspectNotifications();
