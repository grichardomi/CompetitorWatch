require('dotenv').config({ path: '.env.local' });
const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function check() {
  const userId = process.argv[2] || 5;
  const sub = await prisma.subscription.findFirst({
    where: { userId: parseInt(userId) },
  });

  if (!sub) {
    console.log(`❌ No subscription found for user ${userId}`);
    process.exit(1);
  }

  console.log('\n📊 Subscription Status:');
  console.log(`   User ID: ${sub.userId}`);
  console.log(`   Status: ${sub.status}`);
  console.log(`   Trial End: ${sub.currentPeriodEnd.toISOString()}`);
  console.log(`   Is Expired: ${new Date() > sub.currentPeriodEnd ? 'YES' : 'NO'}\n`);
  await prisma.$disconnect();
}

check().catch(console.error);
