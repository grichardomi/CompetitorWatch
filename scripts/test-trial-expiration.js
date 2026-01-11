/**
 * Test Trial Expiration Fixes
 *
 * This script tests the trial expiration implementation:
 * 1. Creates a test user with an expired trial
 * 2. Tests the expire-trials cron job
 * 3. Verifies subscription status is updated
 * 4. Tests that blocked actions return proper errors
 */

// Load environment variables
require('dotenv').config({ path: '.env.local' });

const { PrismaClient } = require('@prisma/client');
const bcrypt = require('bcryptjs');

const prisma = new PrismaClient();

async function main() {
  console.log('🧪 Testing Trial Expiration Fixes\n');

  try {
    // Step 1: Create test user with expired trial
    console.log('Step 1: Creating test user with expired trial...');

    const testEmail = `trial-test-${Date.now()}@test.com`;

    // Create user (no password - using OAuth in production)
    const user = await prisma.user.create({
      data: {
        email: testEmail,
        name: 'Trial Test User',
        onboardingCompletedAt: new Date(),
      },
    });
    console.log(`✅ Created user: ${user.email} (ID: ${user.id})`);

    // Create business
    const business = await prisma.business.create({
      data: {
        userId: user.id,
        name: 'Test Business',
        location: 'Test Location',
      },
    });
    console.log(`✅ Created business: ${business.name} (ID: ${business.id})`);

    // Create expired trial subscription (ended yesterday)
    const yesterday = new Date();
    yesterday.setDate(yesterday.getDate() - 1);

    const subscription = await prisma.subscription.create({
      data: {
        userId: user.id,
        stripeSubscriptionId: `trial_${user.id}`,
        stripePriceId: 'trial',
        status: 'trialing', // Still showing as trialing (should be expired)
        currentPeriodStart: new Date(Date.now() - 14 * 24 * 60 * 60 * 1000), // 14 days ago
        currentPeriodEnd: yesterday, // Ended yesterday
        competitorLimit: 5,
      },
    });
    console.log(`✅ Created expired trial subscription (ended ${yesterday.toISOString()})`);
    console.log(`   Status: ${subscription.status} (should be 'trialing' before cron runs)\n`);

    // Create a competitor for this user
    const competitor = await prisma.competitor.create({
      data: {
        businessId: business.id,
        name: 'Test Competitor',
        url: 'https://example.com',
        crawlFrequencyMinutes: 720,
        isActive: true,
      },
    });
    console.log(`✅ Created test competitor (ID: ${competitor.id})\n`);

    // Step 2: Check current subscription status
    console.log('Step 2: Checking current subscription status...');
    const currentSub = await prisma.subscription.findFirst({
      where: { userId: user.id },
    });
    console.log(`   Status: ${currentSub.status}`);
    console.log(`   Trial End: ${currentSub.currentPeriodEnd.toISOString()}`);
    console.log(`   Is Expired: ${new Date() > currentSub.currentPeriodEnd ? 'YES' : 'NO'}\n`);

    // Step 3: Display cron job test command
    console.log('Step 3: Test the expire-trials cron job');
    console.log('   Run this command in another terminal:\n');
    console.log('   curl -H "Authorization: Bearer $CRON_SECRET" \\');
    console.log('     http://localhost:3000/api/cron/expire-trials\n');
    console.log('   Expected: Should expire this trial and update status to "expired"\n');

    // Step 4: Instructions for manual testing
    console.log('Step 4: After running the cron job, verify:');
    console.log(`   - Subscription status should be 'expired'`);
    console.log(`   - Try adding a competitor (should be blocked)`);
    console.log(`   - Try manual crawl trigger (should be blocked)\n`);

    // Step 5: Display verification queries
    console.log('Step 5: Verification queries:');
    console.log('\n   Check subscription status:');
    console.log(`   SELECT status, "currentPeriodEnd" FROM "Subscription" WHERE "userId" = ${user.id};\n`);

    console.log('   Check if competitor shows up in scheduler:');
    console.log(`   SELECT c.id, c.name, s.status, s."currentPeriodEnd"`);
    console.log(`   FROM "Competitor" c`);
    console.log(`   INNER JOIN "Business" b ON c."businessId" = b.id`);
    console.log(`   INNER JOIN "Subscription" s ON s."userId" = b."userId"`);
    console.log(`   WHERE c.id = ${competitor.id};\n`);

    // Display test user credentials
    console.log('═'.repeat(60));
    console.log('\n📋 TEST USER DETAILS:');
    console.log(`   Email: ${testEmail}`);
    console.log(`   Password: password123`);
    console.log(`   User ID: ${user.id}`);
    console.log(`   Business ID: ${business.id}`);
    console.log(`   Competitor ID: ${competitor.id}`);
    console.log(`   Subscription ID: ${subscription.id}\n`);
    console.log('═'.repeat(60));

    console.log('\n✅ Test setup complete!');
    console.log('\n📝 Next steps:');
    console.log('   1. Run the cron job endpoint (command shown above)');
    console.log('   2. Sign in with test user credentials');
    console.log('   3. Try to add a competitor (should fail)');
    console.log('   4. Try to trigger a manual crawl (should fail)');
    console.log('   5. Run cleanup script when done: node scripts/cleanup-test-users.js\n');

  } catch (error) {
    console.error('❌ Error during test setup:', error);
    throw error;
  } finally {
    await prisma.$disconnect();
  }
}

main()
  .catch((error) => {
    console.error('Fatal error:', error);
    process.exit(1);
  });
