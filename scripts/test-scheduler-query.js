/**
 * Test Scheduler Query
 *
 * Tests that the scheduler query correctly excludes expired trials
 */

require('dotenv').config({ path: '.env.local' });
const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
  console.log('🧪 Testing Scheduler Query\n');

  try {
    // Test the exact query used by the scheduler
    console.log('Running scheduler query (should exclude expired trials)...\n');

    const dueCompetitors = await prisma.$queryRaw`
      SELECT c.id, c.name, c.url, c."crawlFrequencyMinutes", c."lastCrawledAt",
             s.status as subscription_status, s."currentPeriodEnd" as trial_end
      FROM "Competitor" c
      INNER JOIN "Business" b ON c."businessId" = b.id
      INNER JOIN "Subscription" s ON s."userId" = b."userId"
      WHERE c."isActive" = true
        AND (
          c."lastCrawledAt" IS NULL
          OR c."lastCrawledAt" + (c."crawlFrequencyMinutes" * INTERVAL '1 minute') < NOW()
        )
        AND NOT EXISTS (
          SELECT 1 FROM "CrawlQueue" cq
          WHERE cq."competitorId" = c.id
        )
        -- Only include active subscriptions
        AND s.status IN ('trialing', 'active')
        -- Check that trials are not expired
        AND (
          s.status != 'trialing'
          OR s."currentPeriodEnd" > NOW()
        )
      ORDER BY c."lastCrawledAt" ASC NULLS FIRST
      LIMIT 100
    `;

    console.log(`Found ${dueCompetitors.length} competitors due for crawling:\n`);

    if (dueCompetitors.length === 0) {
      console.log('   (No competitors due for crawling)\n');
    }

    dueCompetitors.forEach((comp, i) => {
      console.log(`${i + 1}. ${comp.name} (ID: ${comp.id})`);
      console.log(`   URL: ${comp.url}`);
      console.log(`   Subscription Status: ${comp.subscription_status}`);
      console.log(`   Trial End: ${comp.trial_end ? new Date(comp.trial_end).toISOString() : 'N/A'}\n`);
    });

    // Check if our test competitor (ID: 6) is excluded
    const testCompetitorIncluded = dueCompetitors.some(c => c.id === 6);

    console.log('═'.repeat(60));
    console.log('\n📊 Test Results:\n');

    if (testCompetitorIncluded) {
      console.log('❌ FAILURE: Expired trial competitor was included in results!');
      console.log('   Competitor ID 6 should have been excluded.\n');
    } else {
      console.log('✅ SUCCESS: Scheduler query correctly excluded expired trial!');
      console.log('   Competitor ID 6 (expired trial) was not in results.\n');
    }

    // Show all competitors for context
    console.log('All competitors in database:');
    const allCompetitors = await prisma.$queryRaw`
      SELECT c.id, c.name, s.status as sub_status, s."currentPeriodEnd"
      FROM "Competitor" c
      INNER JOIN "Business" b ON c."businessId" = b.id
      INNER JOIN "Subscription" s ON s."userId" = b."userId"
      ORDER BY c.id
    `;

    allCompetitors.forEach(comp => {
      const isExpired = comp.sub_status === 'trialing' && new Date() > new Date(comp.currentPeriodEnd);
      const status = comp.sub_status === 'expired' || isExpired ? '❌ EXPIRED' : '✅ ACTIVE';
      console.log(`   ID ${comp.id}: ${comp.name} - ${status} (${comp.sub_status})`);
    });

    console.log('\n');

  } catch (error) {
    console.error('❌ Error testing scheduler:', error);
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
