import { createClient } from "@supabase/supabase-js";
import fs from "fs";
import path from "path";

async function testCommenting() {
  const envPath = fs.existsSync(path.join(process.cwd(), ".env.local")) 
    ? path.join(process.cwd(), ".env.local")
    : path.join(process.cwd(), ".env");
  const envContent = fs.readFileSync(envPath, "utf8");
  const env = {};
  envContent.split("\n").forEach(line => {
    const [key, ...valueParts] = line.split("=");
    if (key && valueParts.length > 0) {
      env[key.trim()] = valueParts.join("=").trim().replace(/^["']|["']$/g, "");
    }
  });

  const supabaseUrl = env.NEXT_PUBLIC_SUPABASE_URL;
  const supabaseServiceKey = env.SUPABASE_SERVICE_ROLE_KEY;

  const supabase = createClient(supabaseUrl, supabaseServiceKey);
  
  const postId = 'c5ec4389-724f-44eb-ac39-166863ce759c';
  const userId = 'fda3ed06-5b44-4b39-a2fc-a734e2630bf3'; // nmramadhan14

  console.log(`Attempting to add comment to post ${postId} as user ${userId}...`);

  const { data, error } = await supabase
    .from('comments')
    .insert({
      post_id: postId,
      author_id: userId,
      content: "Can I comment on this post? Testing now."
    })
    .select();

  if (error) {
    console.error("FAILED to add comment:", error);
    
    // Check if post exists
    const { data: post } = await supabase.from('posts').select('id').eq('id', postId).single();
    console.log("Post exists check:", post ? "YES" : "NO");

    // Check if user exists
    const { data: user } = await supabase.from('profiles').select('id').eq('id', userId).single();
    console.log("User exists check:", user ? "YES" : "NO");
    
    // Check table structure
    const { data: columns } = await supabase.rpc('exec_sql', { sql_query: `SELECT column_name, data_type FROM information_schema.columns WHERE table_name = 'comments'` });
    if (columns) console.log("Comments columns:", columns);
  } else {
    console.log("SUCCESSFULLY added comment:", data);
  }
}

testCommenting().catch(console.error);