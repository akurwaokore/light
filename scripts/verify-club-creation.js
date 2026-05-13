import { createServerClient } from "./lib/supabase/server.js";

async function testClubCreation() {
  console.log("Testing club creation API logic...");
  const supabase = await createServerClient();

  // 1. Get a test user
  const { data: profiles, error: pError } = await supabase
    .from('profiles')
    .select('id, email')
    .limit(1);

  if (pError || !profiles || profiles.length === 0) {
    console.error("Could not find a test user", pError);
    return;
  }

  const testUser = profiles[0];
  console.log(`Using test user: ${testUser.email} (${testUser.id})`);

  // 2. Try to insert a club
  const clubName = `Test Club ${Date.now()}`;
  const { data: club, error: cError } = await supabase
    .from('clubs')
    .insert({
      name: clubName,
      description: "A test club created by verification script",
      category: "interest",
      icon: "users",
      creator_id: testUser.id
    })
    .select()
    .single();

  if (cError) {
    console.error("FAILED to create club:", cError.message);
    if (cError.code === '42703') {
      console.error("Hint: Column 'created_by' might not exist or is named differently.");
    }
    return;
  }

  console.log("SUCCESS: Created club", club.id);

  // 3. Try to add membership
  const { error: mError } = await supabase
    .from('club_memberships')
    .insert({
      club_id: club.id,
      user_id: testUser.id
    });

  if (mError) {
    console.error("FAILED to add membership:", mError.message);
  } else {
    console.log("SUCCESS: Added membership");
  }

  // 4. Cleanup (optional)
  const { error: dError } = await supabase
    .from('clubs')
    .delete()
    .eq('id', club.id);

  if (dError) {
    console.error("Cleanup failed:", dError.message);
  } else {
    console.log("SUCCESS: Cleaned up test club");
  }
}

testClubCreation().catch(console.error);
