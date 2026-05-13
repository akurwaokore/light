import { createClient } from '@supabase/supabase-js';
import path from 'path';
import fs from 'fs';

// Load environment variables from .env.local or .env
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

const supabaseUrl = env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseServiceKey = env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseServiceKey) {
  throw new Error('Missing Supabase environment variables');
}

export const supabase = createClient(supabaseUrl, supabaseServiceKey, {
  auth: {
    autoRefreshToken: false,
    persistSession: false
  }
});

export const createServerClient = async () => {
  return supabase;
};
