/**
 * Comprehensive test script for Playwright + Claude AI Crawler
 *
 * Tests:
 * 1. Playwright browser launching and crawling
 * 2. Claude API data extraction
 * 3. Change detection logic
 * 4. Alert creation
 */

// Load environment variables
import dotenv from 'dotenv';
dotenv.config({ path: '.env.local' });

import { crawlUrl, closeBrowser } from './services/crawler/playwright-client';
import { extractData } from './services/crawler/ai-extractor';
import { detectChanges } from './services/crawler/change-detector';
import { processJob, dequeueNextJob } from './services/crawler/worker';
import { checkRateLimit } from './services/crawler/rate-limiter';
import { db } from './lib/db/prisma';
import { INDUSTRIES } from './lib/config/industries';
import crypto from 'crypto';

// Test configuration
const TEST_CONFIG = {
  // Use a simple restaurant website for testing
  testUrl: 'https://www.sweetgreen.com/menu',
  testIndustry: INDUSTRIES.RESTAURANT_FOOD,
  testCompetitorName: 'Test Competitor - Sweetgreen',
  businessName: 'Test Business',
  businessEmail: 'test@example.com',
};

// Colors for console output
const colors = {
  reset: '\x1b[0m',
  bright: '\x1b[1m',
  green: '\x1b[32m',
  red: '\x1b[31m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  cyan: '\x1b[36m',
};

function log(message: string, color = colors.reset) {
  console.log(`${color}${message}${colors.reset}`);
}

function logSection(title: string) {
  console.log('\n' + '='.repeat(60));
  log(title, colors.bright + colors.cyan);
  console.log('='.repeat(60) + '\n');
}

function logSuccess(message: string) {
  log(`✓ ${message}`, colors.green);
}

function logError(message: string) {
  log(`✗ ${message}`, colors.red);
}

function logWarning(message: string) {
  log(`⚠ ${message}`, colors.yellow);
}

function logInfo(message: string) {
  log(`ℹ ${message}`, colors.blue);
}

/**
 * Test 1: Playwright Crawler
 */
async function testPlaywrightCrawler() {
  logSection('TEST 1: Playwright Crawler');

  try {
    logInfo(`Crawling URL: ${TEST_CONFIG.testUrl}`);
    const startTime = Date.now();

    const html = await crawlUrl(TEST_CONFIG.testUrl, {
      timeoutMs: 30000,
      waitForNetworkIdle: true,
    });

    const elapsed = Date.now() - startTime;

    logSuccess(`Crawl completed in ${elapsed}ms`);
    logInfo(`HTML size: ${(html.length / 1024).toFixed(2)} KB`);

    // Check if HTML contains expected content
    if (html.length < 1000) {
      logWarning('HTML content seems too small, might not have loaded properly');
    } else {
      logSuccess('HTML content looks good');
    }

    // Extract a snippet
    const snippet = html.substring(0, 200).replace(/\s+/g, ' ');
    logInfo(`HTML snippet: ${snippet}...`);

    return { success: true, html };
  } catch (error) {
    logError(`Playwright crawler failed: ${error instanceof Error ? error.message : error}`);
    return { success: false, error };
  }
}

/**
 * Test 2: Claude AI Extraction
 */
async function testClaudeExtraction(html: string) {
  logSection('TEST 2: Claude AI Data Extraction');

  try {
    logInfo('Calling Claude API for data extraction...');
    const startTime = Date.now();

    const extractedData = await extractData(html, TEST_CONFIG.testIndustry);

    const elapsed = Date.now() - startTime;

    logSuccess(`Extraction completed in ${elapsed}ms`);

    // Log extracted data statistics
    logInfo(`Prices found: ${extractedData.prices?.length || 0}`);
    logInfo(`Promotions found: ${extractedData.promotions?.length || 0}`);
    logInfo(`Menu items found: ${extractedData.menu_items?.length || 0}`);

    // Show samples
    if (extractedData.prices?.length > 0) {
      logSuccess('Sample prices:');
      extractedData.prices.slice(0, 3).forEach(p => {
        console.log(`  - ${p.item}: ${p.price}${p.category ? ` (${p.category})` : ''}`);
      });
    }

    if (extractedData.promotions?.length > 0) {
      logSuccess('Sample promotions:');
      extractedData.promotions.slice(0, 2).forEach(p => {
        console.log(`  - ${p.title}: ${p.description}`);
      });
    }

    if (extractedData.menu_items?.length > 0) {
      logSuccess('Sample menu items:');
      extractedData.menu_items.slice(0, 3).forEach(m => {
        console.log(`  - ${m.name}${m.price ? `: ${m.price}` : ''}${m.category ? ` (${m.category})` : ''}`);
      });
    }

    return { success: true, extractedData };
  } catch (error) {
    logError(`Claude extraction failed: ${error instanceof Error ? error.message : error}`);
    return { success: false, error };
  }
}

/**
 * Test 3: Change Detection & Alerts
 */
async function testChangeDetectionAndAlerts() {
  logSection('TEST 3: Change Detection & Alert Creation');

  try {
    // Create test business if it doesn't exist
    logInfo('Setting up test business and competitor...');

    let business = await db.business.findFirst({
      where: { name: TEST_CONFIG.businessName },
    });

    if (!business) {
      const user = await db.user.findFirst();
      if (!user) {
        throw new Error('No user found in database. Please create a user first.');
      }

      business = await db.business.create({
        data: {
          name: TEST_CONFIG.businessName,
          userId: user.id,
          industry: TEST_CONFIG.testIndustry,
          location: 'Test Location',
          updatedAt: new Date(),
        },
      });
      logSuccess('Test business created');
    } else {
      logInfo('Using existing test business');
    }

    // Create or get test competitor
    let competitor = await db.competitor.findFirst({
      where: {
        businessId: business.id,
        name: TEST_CONFIG.testCompetitorName,
      },
    });

    if (!competitor) {
      competitor = await db.competitor.create({
        data: {
          businessId: business.id,
          name: TEST_CONFIG.testCompetitorName,
          url: TEST_CONFIG.testUrl,
          updatedAt: new Date(),
        },
      });
      logSuccess('Test competitor created');
    } else {
      logInfo('Using existing test competitor');
    }

    // Crawl and extract data
    logInfo('Crawling competitor website...');
    const html = await crawlUrl(TEST_CONFIG.testUrl, { timeoutMs: 30000 });
    logSuccess('Crawl completed');

    logInfo('Extracting data with Claude AI...');
    const extractedData = await extractData(html, TEST_CONFIG.testIndustry);
    logSuccess('Data extraction completed');

    // Create snapshot
    const snapshotHash = crypto
      .createHash('sha256')
      .update(JSON.stringify(extractedData))
      .digest('hex');

    await db.priceSnapshot.create({
      data: {
        competitorId: competitor.id,
        extractedData: extractedData as any,
        snapshotHash,
        detectedAt: new Date(),
      },
    });
    logSuccess('Snapshot created');

    // Test change detection (will create alerts if changes detected)
    logInfo('Running change detection...');
    const changeResult = await detectChanges(
      competitor.id,
      business.id,
      extractedData,
      snapshotHash
    );

    logInfo(`Has changes: ${changeResult.hasChanges}`);
    logInfo(`Change types: ${changeResult.changeTypes.join(', ') || 'none'}`);
    logInfo(`Message: ${changeResult.message}`);

    // Check for created alerts
    const alerts = await db.alert.findMany({
      where: {
        competitorId: competitor.id,
        businessId: business.id,
      },
      orderBy: {
        createdAt: 'desc',
      },
      take: 5,
    });

    if (alerts.length > 0) {
      logSuccess(`Found ${alerts.length} alert(s):`);
      alerts.forEach((alert, idx) => {
        console.log(`\n  Alert ${idx + 1}:`);
        console.log(`    Type: ${alert.alertType}`);
        console.log(`    Message: ${alert.message}`);
        console.log(`    Read: ${alert.isRead ? 'Yes' : 'No'}`);
        console.log(`    Created: ${alert.createdAt.toISOString()}`);
      });
    } else {
      logInfo('No alerts created (this is normal for first crawl or if no changes detected)');
    }

    // Modify data slightly and test again to create alerts
    if (!changeResult.hasChanges) {
      logInfo('\nSimulating changes to test alert creation...');

      const modifiedData = {
        ...extractedData,
        prices: [
          ...(extractedData.prices || []),
          { item: 'New Test Item', price: '$9.99', currency: 'USD', category: 'Test' },
        ],
        promotions: [
          ...(extractedData.promotions || []),
          { title: 'Test Promotion', description: '20% off test items!', discount: '20%' },
        ],
      };

      const modifiedHash = crypto
        .createHash('sha256')
        .update(JSON.stringify(modifiedData))
        .digest('hex');

      await db.priceSnapshot.create({
        data: {
          competitorId: competitor.id,
          extractedData: modifiedData as any,
          snapshotHash: modifiedHash,
          detectedAt: new Date(),
        },
      });

      const modifiedChangeResult = await detectChanges(
        competitor.id,
        business.id,
        modifiedData,
        modifiedHash
      );

      logSuccess('Simulated change detection completed');
      logInfo(`Changes detected: ${modifiedChangeResult.changeTypes.join(', ')}`);

      // Check alerts again
      const newAlerts = await db.alert.findMany({
        where: {
          competitorId: competitor.id,
          businessId: business.id,
        },
        orderBy: {
          createdAt: 'desc',
        },
        take: 3,
      });

      if (newAlerts.length > alerts.length) {
        logSuccess(`\nNew alerts created (${newAlerts.length - alerts.length}):`);
        newAlerts.slice(0, newAlerts.length - alerts.length).forEach((alert, idx) => {
          console.log(`\n  Alert ${idx + 1}:`);
          console.log(`    Type: ${alert.alertType}`);
          console.log(`    Message: ${alert.message}`);
        });
      }
    }

    return { success: true, business, competitor, alerts };
  } catch (error) {
    logError(`Change detection test failed: ${error instanceof Error ? error.message : error}`);
    console.error(error);
    return { success: false, error };
  }
}

/**
 * Test 4: Rate Limiting
 */
async function testRateLimiting() {
  logSection('TEST 4: Rate Limiting');

  try {
    logInfo(`Testing rate limit for ${TEST_CONFIG.testUrl}`);

    const isAllowed = await checkRateLimit(TEST_CONFIG.testUrl);

    if (isAllowed) {
      logSuccess('Rate limit check passed - request allowed');
    } else {
      logWarning('Rate limit exceeded - request would be blocked');
    }

    return { success: true, isAllowed };
  } catch (error) {
    logError(`Rate limiting test failed: ${error instanceof Error ? error.message : error}`);
    return { success: false, error };
  }
}

/**
 * Test 5: Full Worker Integration
 */
async function testWorkerIntegration() {
  logSection('TEST 5: Full Worker Integration (End-to-End)');

  try {
    // Get test business and competitor
    const business = await db.business.findFirst({
      where: { name: TEST_CONFIG.businessName },
    });

    if (!business) {
      logWarning('Skipping worker test - no test business found');
      return { success: false, skipped: true };
    }

    const competitor = await db.competitor.findFirst({
      where: {
        businessId: business.id,
        name: TEST_CONFIG.testCompetitorName,
      },
    });

    if (!competitor) {
      logWarning('Skipping worker test - no test competitor found');
      return { success: false, skipped: true };
    }

    // Enqueue a job
    logInfo('Enqueueing test job...');
    await db.crawlQueue.create({
      data: {
        competitorId: competitor.id,
        url: competitor.url,
        priority: 10,
        attempt: 0,
        maxAttempts: 3,
        scheduledFor: new Date(),
      },
    });
    logSuccess('Job enqueued');

    // Dequeue and process
    logInfo('Dequeueing and processing job...');
    const job = await dequeueNextJob();

    if (!job) {
      logError('Failed to dequeue job');
      return { success: false };
    }

    logSuccess('Job dequeued');
    logInfo(`Job ID: ${job.id}, Competitor ID: ${job.competitorId}`);

    const result = await processJob(job);

    if (result.success) {
      logSuccess('Worker job completed successfully');
      logInfo(`Message: ${result.message}`);
      logInfo(`Alerts created: ${result.alertsCreated || 0}`);
    } else {
      logError(`Worker job failed: ${result.message}`);
    }

    return { success: result.success, result };
  } catch (error) {
    logError(`Worker integration test failed: ${error instanceof Error ? error.message : error}`);
    console.error(error);
    return { success: false, error };
  }
}

/**
 * Main test runner
 */
async function runAllTests() {
  console.log('\n');
  log('╔════════════════════════════════════════════════════════════╗', colors.bright);
  log('║  MarketPulse - Crawler & AI Integration Test Suite   ║', colors.bright);
  log('╚════════════════════════════════════════════════════════════╝', colors.bright);
  console.log('\n');

  const results: any = {};

  try {
    // Test 1: Playwright Crawler
    results.playwright = await testPlaywrightCrawler();

    // Test 2: Claude AI Extraction (only if Test 1 succeeded)
    if (results.playwright.success && results.playwright.html) {
      results.claude = await testClaudeExtraction(results.playwright.html);
    } else {
      logWarning('Skipping Claude test - Playwright crawl failed');
    }

    // Test 3: Change Detection & Alerts
    results.changeDetection = await testChangeDetectionAndAlerts();

    // Test 4: Rate Limiting
    results.rateLimiting = await testRateLimiting();

    // Test 5: Full Worker Integration
    results.worker = await testWorkerIntegration();

  } catch (error) {
    logError(`Test suite error: ${error instanceof Error ? error.message : error}`);
    console.error(error);
  } finally {
    // Clean up
    logSection('CLEANUP');
    await closeBrowser();
    logSuccess('Browser closed');
    await db.$disconnect();
    logSuccess('Database disconnected');
  }

  // Summary
  logSection('TEST SUMMARY');

  const tests = [
    { name: 'Playwright Crawler', result: results.playwright },
    { name: 'Claude AI Extraction', result: results.claude },
    { name: 'Change Detection & Alerts', result: results.changeDetection },
    { name: 'Rate Limiting', result: results.rateLimiting },
    { name: 'Worker Integration', result: results.worker },
  ];

  let passed = 0;
  let failed = 0;
  let skipped = 0;

  tests.forEach(test => {
    if (!test.result) {
      skipped++;
      logWarning(`${test.name}: SKIPPED`);
    } else if (test.result.skipped) {
      skipped++;
      logWarning(`${test.name}: SKIPPED`);
    } else if (test.result.success) {
      passed++;
      logSuccess(`${test.name}: PASSED`);
    } else {
      failed++;
      logError(`${test.name}: FAILED`);
    }
  });

  console.log('\n');
  log(`Total: ${tests.length} | Passed: ${passed} | Failed: ${failed} | Skipped: ${skipped}`, colors.bright);

  if (failed === 0 && passed > 0) {
    console.log('\n');
    logSuccess('All tests passed! 🎉');
  } else if (failed > 0) {
    console.log('\n');
    logError('Some tests failed. Please review the output above.');
  }

  console.log('\n');
}

// Run tests
runAllTests().catch((error) => {
  console.error('Fatal error:', error);
  process.exit(1);
});
