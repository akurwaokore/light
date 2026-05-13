const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: '.env.local' });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

const supabase = createClient(supabaseUrl, supabaseKey);

async function checkJobApplications() {
  const { data, error } = await supabase
    .from('job_applications')
    .select('*')
    .limit(1);
    
  console.log("Data:", data);
  console.log("Error:", error);
  
  // also check if we can insert
  if (!error) {
    // Check columns
    const { data: cols, error: colsErr } = await supabase.rpc('get_columns_for_table', { table_name: 'job_applications' });
    console.log("Columns via rpc (if exists):", cols, colsErr);
  }
}

checkJobApplications();
