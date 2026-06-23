import { test, expect } from '@playwright/test';
import { createClient } from '@supabase/supabase-js';
import * as dotenv from 'dotenv';
import * as fs from 'fs';
import * as path from 'path';

// Parse env variables directly from file to bypass any runtime issues
let supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || process.env.SUPABASE_URL;
let supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.SUPABASE_SERVICE_KEY;

if (!supabaseUrl || !supabaseKey) {
  const envPath = fs.existsSync('.env.local') ? '.env.local' : '.env';
  if (fs.existsSync(envPath)) {
    const envContent = fs.readFileSync(envPath, 'utf8');
    envContent.split(/\r?\n/).forEach((line) => {
      const parts = line.split('=');
      if (parts.length >= 2) {
        const key = parts[0].trim();
        let value = parts.slice(1).join('=').trim();
        if (value.startsWith('"') && value.endsWith('"')) value = value.slice(1, -1);
        if (value.startsWith("'") && value.endsWith("'")) value = value.slice(1, -1);
        if (key === 'NEXT_PUBLIC_SUPABASE_URL' || key === 'SUPABASE_URL') supabaseUrl = value;
        if (key === 'SUPABASE_SERVICE_ROLE_KEY' || key === 'SUPABASE_SERVICE_KEY') supabaseKey = value;
      }
    });
  }
}

const supabase = createClient(supabaseUrl!, supabaseKey!);

test.describe('Multi-user Social & Marketplace Flow', () => {
  let userAId: string;
  let userBId: string;

  test.beforeAll(async () => {
    // 1. Resolve User A (edamoke@gmail.com) and User B (sbirzhan@gmail.com) UUIDs
    const { data: profileA } = await supabase
      .from('profiles')
      .select('id')
      .eq('email', 'edamoke@gmail.com')
      .single();

    const { data: profileB } = await supabase
      .from('profiles')
      .select('id')
      .eq('email', 'sbirzhan@gmail.com')
      .single();

    userAId = profileA?.id || '';
    userBId = profileB?.id || '';

    console.log(`Resolved user IDs: User A = ${userAId}, User B = ${userBId}`);

    // 2. Perform DB cleanup before starting the test to guarantee clean, repeatable runs
    if (userAId && userBId) {
      console.log('Cleaning up existing friendships...');
      await supabase
        .from('friendships')
        .delete()
        .eq('user_id', userAId)
        .eq('friend_id', userBId);

      await supabase
        .from('friendships')
        .delete()
        .eq('user_id', userBId)
        .eq('friend_id', userAId);
    }

    console.log('Cleaning up test products and posts...');
    await supabase.from('products').delete().ilike('title', '[Test Product]%');
    await supabase.from('posts').delete().ilike('content', '[Test Purchase Post]%');
  });

  test('should execute complete multi-user flow successfully', async ({ browser }) => {
    // Implement browser context setup for dual-user testing
    const contextA = await browser.newContext({
      storageState: 'playwright/.auth/user.json',
    });
    const contextB = await browser.newContext({
      storageState: 'playwright/.auth/admin.json',
    });

    const pageA = await contextA.newPage();
    const pageB = await contextB.newPage();

    // Step 1: Send Friend Request from User A to User B
    console.log('Step 1: Sending friend request from User A to User B...');
    await pageA.goto(`/members/${userBId}`);
    await pageA.waitForLoadState('networkidle');

    // Clicking the connect button on User B's profile page
    const connectBtn = pageA.locator('button:has-text("Connect to View Profile")');
    await expect(connectBtn).toBeVisible({ timeout: 15000 });
    await connectBtn.click();

    // Wait for the friendship button state to change to "Request Pending"
    const pendingBtn = pageA.locator('button:has-text("Request Pending")');
    await expect(pendingBtn).toBeVisible({ timeout: 15000 });
    console.log('Step 1 complete: Friend request sent!');

    // Step 2: Accept Friend Request by User B
    console.log('Step 2: Accepting friend request by User B...');
    await pageB.goto('/friends');
    await pageB.waitForLoadState('networkidle');

    // Click the "Accept" button inside the pending requests container
    const acceptBtn = pageB.locator('button:has-text("Accept")');
    await expect(acceptBtn).toBeVisible({ timeout: 15000 });
    await acceptBtn.click();

    // Verify friendship is accepted (no pending buttons should remain, or accepted toast appears)
    await expect(acceptBtn).not.toBeVisible({ timeout: 15000 });
    console.log('Step 2 complete: Friend request accepted!');

    // Step 3: Add product to marketplace by User B
    console.log('Step 3: Listing product on marketplace by User B...');
    await pageB.goto('/marketplace');
    await pageB.waitForLoadState('networkidle');

    // Click the "Add Product" trigger button
    const addProductTrigger = pageB.locator('button:has-text("Add Product")');
    await expect(addProductTrigger).toBeVisible({ timeout: 10000 });
    await addProductTrigger.click();

    // Fill the product creation form
    const productTitleInput = pageB.locator('input[id="title"]');
    const productPriceInput = pageB.locator('input[id="price"]');
    const productCategorySelect = pageB.locator('button:has-text("Select category")');
    const productDescriptionInput = pageB.locator('textarea[id="description"]');

    await expect(productTitleInput).toBeVisible({ timeout: 10000 });
    const testProductTitle = `[Test Product] Amazing Item ${Date.now()}`;
    await productTitleInput.fill(testProductTitle);
    await productPriceInput.fill('150');

    // Open category dropdown and select Electronics
    await productCategorySelect.click();
    await pageB.locator('span:has-text("Electronics")').click();

    await productDescriptionInput.fill('This is a high quality test product listed by User B on the alumni marketplace.');

    // Submit form by clicking Post Product
    const postProductBtn = pageB.locator('button[type="submit"]:has-text("Post Product")');
    await expect(postProductBtn).toBeVisible();
    await postProductBtn.click();

    // Verify creation by waiting for the dialog to close
    await expect(postProductBtn).not.toBeVisible({ timeout: 15000 });
    console.log('Step 3 complete: Product successfully listed!');

    // Step 4: Purchase product on marketplace by User A
    console.log('Step 4: Purchasing product on marketplace by User A...');
    await pageA.goto('/marketplace');
    await pageA.waitForLoadState('networkidle');

    // Search for the newly listed product
    const searchInput = pageA.locator('input[placeholder="Search marketplace..."]');
    await expect(searchInput).toBeVisible({ timeout: 10000 });
    await searchInput.fill(testProductTitle);

    // Click Buy Now on the filtered product card
    const buyNowBtn = pageA.locator(`div:has-text("${testProductTitle}") >> button:has-text("Buy Now")`).first();
    await expect(buyNowBtn).toBeVisible({ timeout: 15000 });
    await buyNowBtn.click();

    // Confirm purchase in the checkout dialog
    const confirmPurchaseBtn = pageA.locator('button:has-text("Confirm Purchase")');
    await expect(confirmPurchaseBtn).toBeVisible({ timeout: 10000 });
    await confirmPurchaseBtn.click();

    // Wait for the confirmation modal with "Purchase Confirmed!" text
    await expect(pageA.locator('h2:has-text("Purchase Confirmed!")')).toBeVisible({ timeout: 15000 });
    console.log('Step 4 complete: Product purchased successfully!');

    // Close the checkout success dialog
    await pageA.keyboard.press('Escape');

    // Step 5: Post timeline status update about the purchase by User A
    console.log('Step 5: Posting timeline status update about the purchase by User A...');
    await pageA.goto('/feed');
    await pageA.waitForLoadState('networkidle');

    // Type the post content
    const testPostContent = `[Test Purchase Post] I just bought the amazing item "${testProductTitle}" from the marketplace!`;
    const postTextArea = pageA.locator('textarea[placeholder^="What\'s on your mind"]');
    await expect(postTextArea).toBeVisible({ timeout: 10000 });
    await postTextArea.fill(testPostContent);

    // Click the "Post" button
    const postBtn = pageA.locator('button:has-text("Post")');
    await expect(postBtn).toBeVisible();
    await postBtn.click();

    // Verify post is displayed on page A's feed
    await expect(pageA.locator(`p:has-text("${testPostContent}")`)).toBeVisible({ timeout: 15000 });
    console.log('Step 5 complete: Status update posted successfully!');

    // Step 6: Like and comment on User A's timeline post by User B
    console.log('Step 6: Liking and commenting on User A\'s timeline post by User B...');
    await pageB.goto('/feed');
    await pageB.waitForLoadState('networkidle');

    // Find User A's post container on Page B's feed
    const postContainer = pageB.locator(`div:has-text("${testPostContent}")`).last();
    await expect(postContainer).toBeVisible({ timeout: 15000 });

    // Click React button inside that post container
    const reactBtn = postContainer.locator('button:has-text("React")');
    await expect(reactBtn).toBeVisible();
    await reactBtn.click();

    // Choose the "like" reaction from the picker
    const likeBtn = pageB.locator('button[aria-label="React with like"]');
    await expect(likeBtn).toBeVisible({ timeout: 5000 });
    await likeBtn.click();

    // Add a comment to the post
    const commentInput = postContainer.locator('input[placeholder="Add a comment..."]');
    await expect(commentInput).toBeVisible({ timeout: 10000 });
    await commentInput.fill('Congratulations on your purchase! Truly a magnificent find.');
    await commentInput.press('Enter');

    // Verify the comment is visible
    await expect(postContainer.locator('p:has-text("Congratulations on your purchase! Truly a magnificent find.")')).toBeVisible({ timeout: 15000 });
    console.log('Step 6 complete: Post liked and commented successfully!');

    // Cleanup page sessions
    await pageA.close();
    await pageB.close();
    await contextA.close();
    await contextB.close();
  });
});
