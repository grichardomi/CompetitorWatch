/**
 * Cleanup Test Users
 *
 * Removes all test users created by test-trial-expiration.js
 */

// Load environment variables
require('dotenv').config({ path: '.env.local' });

const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
  console.log('🧹 Cleaning up test users...\n');

  try {
    // Find all test users
    const testUsers = await prisma.user.findMany({
      where: {
        email: {
          startsWith: 'trial-test-',
        },
      },
      include: {
        businesses: {
          include: {
            competitors: true,
          },
        },
        subscriptions: true,
      },
    });

    if (testUsers.length === 0) {
      console.log('✅ No test users found to clean up.\n');
      return;
    }

    console.log(`Found ${testUsers.length} test user(s) to delete:\n`);

    for (const user of testUsers) {
      console.log(`Deleting user: ${user.email} (ID: ${user.id})`);

      // Delete related data
      for (const business of user.businesses) {
        // Get competitor IDs first for cascade deletes
        const competitorIds = business.competitors.map(c => c.id);

        // Delete crawl queue entries for these competitors
        if (competitorIds.length > 0) {
          const deletedCrawls = await prisma.crawlQueue.deleteMany({
            where: {
              competitorId: { in: competitorIds },
            },
          });
          console.log(`  ├─ Deleted ${deletedCrawls.count} crawl queue(s)`);

          // Delete alerts for these competitors
          const deletedAlerts = await prisma.alert.deleteMany({
            where: {
              competitorId: { in: competitorIds },
            },
          });
          console.log(`  ├─ Deleted ${deletedAlerts.count} alert(s)`);

          // Delete price snapshots
          const deletedSnapshots = await prisma.priceSnapshot.deleteMany({
            where: {
              competitorId: { in: competitorIds },
            },
          });
          console.log(`  ├─ Deleted ${deletedSnapshots.count} price snapshot(s)`);
        }

        // Delete competitors
        const deletedCompetitors = await prisma.competitor.deleteMany({
          where: { businessId: business.id },
        });
        console.log(`  ├─ Deleted ${deletedCompetitors.count} competitor(s)`);

        // Delete business
        await prisma.business.delete({
          where: { id: business.id },
        });
        console.log(`  ├─ Deleted business: ${business.name}`);
      }

      // Delete subscriptions
      const deletedSubscriptions = await prisma.subscription.deleteMany({
        where: { userId: user.id },
      });
      console.log(`  ├─ Deleted ${deletedSubscriptions.count} subscription(s)`);

      // Delete email queue
      const deletedEmails = await prisma.emailQueue.deleteMany({
        where: { userId: user.id },
      });
      console.log(`  ├─ Deleted ${deletedEmails.count} queued email(s)`);

      // Delete user
      await prisma.user.delete({
        where: { id: user.id },
      });
      console.log(`  └─ ✅ Deleted user: ${user.email}\n`);
    }

    console.log(`✅ Cleanup complete! Removed ${testUsers.length} test user(s).\n`);

  } catch (error) {
    console.error('❌ Error during cleanup:', error);
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
