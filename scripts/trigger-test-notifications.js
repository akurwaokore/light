import { createClient } from "@supabase/supabase-js";
import fs from "fs";
import path from "path";

async function triggerNotifications() {
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
  
  // 1. Find your latest post
  const { data: posts } = await supabase
    .from('posts')
    .select('id, author_id, content')
    .order('created_at', { ascending: false })
    .limit(1);

  if (!posts || posts.length === 0) {
    console.log("No posts found to interact with.");
    return;
  }

  const post = posts[0];
  const targetUserId = post.author_id;

  // 2. Find a different user to act as
  const { data: profiles } = await supabase
    .from('profiles')
    .select('id, display_name')
    .neq('id', targetUserId)
    .limit(1);

  if (!profiles || profiles.length === 0) {
    console.log("No other users found to trigger notification.");
    return;
  }

  const actor = profiles[0];

  console.log(`User ${actor.display_name} (${actor.id}) is interacting with Post ${post.id} by User ${targetUserId}`);

  // 3. Create Reaction
  const { error: reactionError } = await supabase
    .from('post_reactions')
    .upsert({
      post_id: post.id,
      user_id: actor.id,
      reaction_type: 'like'
    });

  if (reactionError) console.error("Reaction error:", reactionError);

  // 4. Create Notification for Reaction
  const { error: notif1Error } = await supabase
    .from('notifications')
    .insert({
      user_id: targetUserId,
      type: 'general',
      title: 'New Reaction',
      message: `${actor.display_name} liked your post: "${post.content?.substring(0, 30)}..."`,
      link: `/feed`,
      metadata: { post_id: post.id, reaction_type: 'like', real_type: 'post_like' }
    });

  if (notif1Error) console.error("Notification 1 error:", notif1Error);
  else console.log("Created 'Like' notification.");

  // 5. Create Comment
  const { data: comment, error: commentError } = await supabase
    .from('comments')
    .insert({
      post_id: post.id,
      author_id: actor.id,
      content: "This is a test comment to trigger the notification system!"
    })
    .select()
    .single();

  if (commentError) console.error("Comment error:", commentError);

  // 6. Create Notification for Comment
  if (comment) {
      const { error: notif2Error } = await supabase
        .from('notifications')
        .insert({
          user_id: targetUserId,
          type: 'general',
          title: 'New Comment',
          message: `${actor.display_name} commented on your post: "${post.content?.substring(0, 30)}..."`,
          link: `/feed`,
          metadata: { post_id: post.id, comment_id: comment.id, real_type: 'post_comment' }
        });

      if (notif2Error) console.error("Notification 2 error:", notif2Error);
      else console.log("Created 'Comment' notification.");
  }
}

triggerNotifications().catch(console.error);