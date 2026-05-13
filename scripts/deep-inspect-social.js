const { createClient } = require('@supabase/supabase-js');
const fs = require('fs');

// Basic env parser
const envFile = fs.readFileSync('.env', 'utf8');
const env = {};
envFile.split(/\r?\n/).forEach(line => {
  const parts = line.split('=');
  if (parts.length >= 2) {
    const key = parts[0].trim();
    let value = parts.slice(1).join('=').trim();
    if (value.startsWith('"') && value.endsWith('"')) value = value.slice(1, -1);
    if (value.startsWith("'") && value.endsWith("'")) value = value.slice(1, -1);
    env[key] = value;
  }
});

const supabaseUrl = env.NEXT_PUBLIC_SUPABASE_URL || env.SUPABASE_URL;
const supabaseKey = env.SUPABASE_SERVICE_ROLE_KEY || env.SUPABASE_SERVICE_KEY;

const supabase = createClient(supabaseUrl, supabaseKey);

async function deepInspect() {
  console.log('--- Deep Inspection ---');

  // Inspect Friendships
  const { data: friendships, error: friendError } = await supabase.from('friendships').select('*').limit(1);
  console.log('Friendships Columns:', friendships ? Object.keys(friendships[0]) : 'Error or empty');
  if (friendError) console.error('Friendships Error:', friendError.message);

  // Inspect Comments
  const { data: comments, error: commentError } = await supabase.from('comments').select('*').limit(1);
  console.log('Comments Columns:', comments ? Object.keys(comments[0]) : 'Error or empty');
  if (commentError) console.error('Comments Error:', commentError.message);

  // Inspect Post Reactions
  const { data: reactions, error: reactError } = await supabase.from('post_reactions').select('*').limit(1);
  console.log('Post Reactions Columns:', reactions ? Object.keys(reactions[0]) : 'Error or empty');
  if (reactError) console.error('Post Reactions Error:', reactError.message);

  // Check for any suspicious constraints on post_reactions
  const { data: constraints, error: constError } = await supabase.rpc('exec_sql', { 
    sql_string: "SELECT conname, pg_get_constraintdef(c.oid) FROM pg_constraint c JOIN pg_namespace n ON n.oid = c.connamespace WHERE n.nspname = 'public' AND conrelid = 'post_reactions'::regclass;"
  });
  if (constraints) console.log('Post Reactions Constraints:', constraints);
}

deepInspect().catch(err => console.error(err));
