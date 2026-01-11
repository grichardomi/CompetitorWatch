/**
 * Test Subscription Middleware
 *
 * Tests that the middleware correctly blocks actions for expired trials
 */

require('dotenv').config({ path: '.env.local' });
const { requireActiveSubscription, canAddCompetitor } = require('../lib/middleware/check-subscription');

async function main() {
  console.log('🧪 Testing Subscription Middleware\n');

  const userId = parseInt(process.argv[2] || '5');

  try {
    // Test 1: requireActiveSubscription
    console.log('Test 1: requireActiveSubscription()');
    const result = await requireActiveSubscription(userId);
    console.log(`   Valid: ${result.valid}`);
    console.log(`   Error: ${result.error || 'N/A'}`);
    console.log(`   Error Code: ${result.errorCode || 'N/A'}\n`);

    // Test 2: canAddCompetitor
    console.log('Test 2: canAddCompetitor()');
    const canAdd = await canAddCompetitor(userId);
    console.log(`   Allowed: ${canAdd.allowed}`);
    console.log(`   Error: ${canAdd.error || 'N/A'}`);
    console.log(`   Limit: ${canAdd.limit || 'N/A'}`);
    console.log(`   Current: ${canAdd.current || 'N/A'}\n`);

    if (!result.valid) {
      console.log('✅ SUCCESS: Middleware correctly blocked expired trial!\n');
    } else {
      console.log('❌ FAILURE: Middleware should have blocked expired trial!\n');
    }

  } catch (error) {
    console.error('❌ Error testing middleware:', error);
    throw error;
  }
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error('Fatal error:', error);
    process.exit(1);
  });
