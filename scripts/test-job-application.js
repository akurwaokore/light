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

async function runTest() {
  const supabase = createClient(
    env.NEXT_PUBLIC_SUPABASE_URL,
    env.SUPABASE_SERVICE_ROLE_KEY
  );

  // Values from detailed inspection
  const jobId = '4052e982-c32d-4cef-9a8d-039e06d2a14e'; // Senior Full Stack Developer
  const applicantId = '54d1f960-7181-4340-8888-534e8fa2699d'; // Admin User
  const coverLetter = "I am a senior developer with 10 years of experience in full stack development. I would love to join your team.";

  console.log('--- Starting Job Application Test (Workaround Notifications) ---');

  // 1. Fetch job and poster details
  const { data: jobData, error: jobError } = await supabase
    .from("jobs")
    .select("title, posted_by")
    .eq("id", jobId)
    .single();

  if (jobError || !jobData) {
    console.error("Error fetching job data:", jobError?.message);
    return;
  }
  console.log(`Fetched Job: "${jobData.title}" posted by ${jobData.posted_by}`);

  // 2. Fetch CV details (just for name)
  const { data: cvData } = await supabase
    .from("cvs")
    .select("user_name")
    .eq("user_id", applicantId)
    .limit(1)
    .maybeSingle();

  const applicantName = cvData?.user_name || "Admin User";

  // 3. Cleaning up existing applications
  console.log("Cleaning up existing applications...");
  await supabase
    .from("job_applications")
    .delete()
    .eq("job_id", jobId)
    .eq("user_id", applicantId);

  // 4. Submit application
  console.log("Submitting application...");
  
  const payload = {
    job_id: jobId,
    user_id: applicantId,
    cover_letter: coverLetter,
    status: "pending"
  };

  const { data: application, error: applyError } = await supabase
    .from("job_applications")
    .insert([payload])
    .select()
    .maybeSingle();

  if (!application) {
    console.error("Application insert failed:", applyError?.message);
    return;
  }
  console.log("Successfully inserted application record ID:", application.id);

  // 5. Send notification to job poster - USING 'general' TYPE WORKAROUND
  console.log("Sending notification to job poster...");
  
  const { error: posterNotifError } = await supabase.from("notifications").insert({
    user_id: jobData.posted_by,
    type: "general",
    title: "New Job Application! (TEST)",
    message: `${applicantName} has applied for your job posting: ${jobData.title}.`,
    link: `/profile/listings/jobs/${jobId}/applications`,
    metadata: {
      jobId,
      applicationId: application.id,
      applicantId: applicantId,
      original_type: "job_application"
    }
  });

  if (posterNotifError) {
    console.error("Poster notification failed:", posterNotifError.message);
  } else {
    console.log("Poster notification sent successfully.");
  }

  // 6. Send confirmation notification to applicant - USING 'general' TYPE WORKAROUND
  console.log("Sending notification to applicant...");
  const { error: applicantNotifError } = await supabase.from("notifications").insert({
    user_id: applicantId,
    type: "general",
    title: "Application Sent (TEST)",
    message: `Your application for ${jobData.title} has been successfully submitted.`,
    link: "/careers",
    metadata: { 
      jobId, 
      applicationId: application.id,
      original_type: "application_submitted"
    }
  });

  if (applicantNotifError) {
    console.error("Applicant notification failed:", applicantNotifError.message);
  } else {
    console.log("Applicant notification sent successfully.");
  }

  // 7. Verification - check the notifications table
  console.log('\n--- Verification ---');
  const { data: latestNotifs } = await supabase
    .from("notifications")
    .select("user_id, type, title, message, link")
    .order('created_at', { ascending: false })
    .limit(5);
  
  console.log("Latest Notifications in DB:");
  console.log(JSON.stringify(latestNotifs, null, 2));

  console.log('\n--- Test Completed Successfully ---');
}

runTest();
