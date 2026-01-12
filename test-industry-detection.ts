/**
 * Test script for Industry Detection System
 * Tests the complete flow from URL detection to extraction
 */

import dotenv from 'dotenv';
dotenv.config({ path: '.env.local' });

import { detectCompetitorIndustry, getIndustryHintFromUrl, getEffectiveIndustry } from './services/competitor/industry-detector';
import { INDUSTRIES } from './lib/config/industries';

const colors = {
  reset: '\x1b[0m',
  green: '\x1b[32m',
  red: '\x1b[31m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  cyan: '\x1b[36m',
  bold: '\x1b[1m',
};

function logSuccess(message: string) {
  console.log(`${colors.green}✓ ${message}${colors.reset}`);
}

function logError(message: string) {
  console.log(`${colors.red}✗ ${message}${colors.reset}`);
}

function logInfo(message: string) {
  console.log(`${colors.blue}ℹ ${message}${colors.reset}`);
}

function logSection(title: string) {
  console.log(`\n${colors.bold}${colors.cyan}${'='.repeat(70)}${colors.reset}`);
  console.log(`${colors.bold}${colors.cyan}${title}${colors.reset}`);
  console.log(`${colors.bold}${colors.cyan}${'='.repeat(70)}${colors.reset}\n`);
}

async function testUrlHints() {
  logSection('TEST 1: URL Pattern Matching');

  const testCases = [
    { url: 'https://www.dominos.com', expected: INDUSTRIES.RESTAURANT_FOOD },
    { url: 'https://www.amazon.com', expected: INDUSTRIES.RETAIL_ECOMMERCE },
    { url: 'https://www.cvs.com', expected: INDUSTRIES.HEALTHCARE_PHARMACY },
    { url: 'https://www.lawfirm.com', expected: INDUSTRIES.PROFESSIONAL_SERVICES },
    { url: 'https://pizzahut.com/menu', expected: INDUSTRIES.RESTAURANT_FOOD },
    { url: 'https://target.com/shop', expected: INDUSTRIES.RETAIL_ECOMMERCE },
  ];

  let passed = 0;
  let failed = 0;

  for (const test of testCases) {
    const result = getIndustryHintFromUrl(test.url);
    if (result === test.expected) {
      logSuccess(`${test.url} → ${result || 'null'}`);
      passed++;
    } else {
      logError(`${test.url} → Expected: ${test.expected}, Got: ${result || 'null'}`);
      failed++;
    }
  }

  console.log(`\n${passed} passed, ${failed} failed`);
  return failed === 0;
}

async function testAIDetection() {
  logSection('TEST 2: AI-Powered Industry Detection');

  const testCases = [
    {
      url: 'https://www.sweetgreen.com',
      businessIndustry: INDUSTRIES.RESTAURANT_FOOD,
      expectMatch: true,
    },
    {
      url: 'https://www.amazon.com',
      businessIndustry: INDUSTRIES.RESTAURANT_FOOD,
      expectMatch: false,
    },
    {
      url: 'https://www.walmart.com',
      businessIndustry: INDUSTRIES.RETAIL_ECOMMERCE,
      expectMatch: true,
    },
  ];

  let passed = 0;
  let failed = 0;

  for (const test of testCases) {
    logInfo(`Testing: ${test.url}...`);

    try {
      const result = await detectCompetitorIndustry(
        test.url,
        undefined,
        test.businessIndustry
      );

      console.log(`  Industry: ${result.industry}`);
      console.log(`  Confidence: ${(result.confidence * 100).toFixed(0)}%`);
      console.log(`  Reasoning: ${result.reasoning}`);
      console.log(`  Matches Business: ${result.matchesBusinessIndustry}`);

      if (result.matchesBusinessIndustry === test.expectMatch) {
        logSuccess(`Correct match detection`);
        passed++;
      } else {
        logError(`Expected match: ${test.expectMatch}, Got: ${result.matchesBusinessIndustry}`);
        failed++;
      }

      if (result.warning) {
        console.log(`  ${colors.yellow}⚠ Warning: ${result.warning}${colors.reset}`);
      }
    } catch (error) {
      logError(`Detection failed: ${error instanceof Error ? error.message : error}`);
      failed++;
    }

    console.log('');
  }

  console.log(`${passed} passed, ${failed} failed`);
  return failed === 0;
}

async function testEffectiveIndustry() {
  logSection('TEST 3: Effective Industry Resolution');

  const testCases = [
    {
      name: 'Manual override takes priority',
      competitor: {
        industry: INDUSTRIES.RETAIL_ECOMMERCE,
        detectedIndustry: INDUSTRIES.RESTAURANT_FOOD,
      },
      businessIndustry: INDUSTRIES.PROFESSIONAL_SERVICES,
      expected: INDUSTRIES.RETAIL_ECOMMERCE,
    },
    {
      name: 'Detected industry used when no manual override',
      competitor: {
        industry: null,
        detectedIndustry: INDUSTRIES.RESTAURANT_FOOD,
      },
      businessIndustry: INDUSTRIES.RETAIL_ECOMMERCE,
      expected: INDUSTRIES.RESTAURANT_FOOD,
    },
    {
      name: 'Falls back to business industry',
      competitor: {
        industry: null,
        detectedIndustry: null,
      },
      businessIndustry: INDUSTRIES.HEALTHCARE_PHARMACY,
      expected: INDUSTRIES.HEALTHCARE_PHARMACY,
    },
  ];

  let passed = 0;
  let failed = 0;

  for (const test of testCases) {
    const result = getEffectiveIndustry(test.competitor, test.businessIndustry);
    if (result === test.expected) {
      logSuccess(`${test.name}: ${result}`);
      passed++;
    } else {
      logError(`${test.name}: Expected ${test.expected}, Got ${result}`);
      failed++;
    }
  }

  console.log(`\n${passed} passed, ${failed} failed`);
  return failed === 0;
}

async function main() {
  console.log(`\n${colors.bold}${colors.cyan}`);
  console.log('╔════════════════════════════════════════════════════════════════════╗');
  console.log('║        Industry Detection System - Integration Tests              ║');
  console.log('╚════════════════════════════════════════════════════════════════════╝');
  console.log(colors.reset);

  const results = {
    urlHints: false,
    aiDetection: false,
    effectiveIndustry: false,
  };

  try {
    results.urlHints = await testUrlHints();
    results.aiDetection = await testAIDetection();
    results.effectiveIndustry = await testEffectiveIndustry();
  } catch (error) {
    logError(`Test suite error: ${error instanceof Error ? error.message : error}`);
    console.error(error);
  }

  // Summary
  logSection('SUMMARY');

  const tests = [
    { name: 'URL Pattern Matching', result: results.urlHints },
    { name: 'AI-Powered Detection', result: results.aiDetection },
    { name: 'Effective Industry Resolution', result: results.effectiveIndustry },
  ];

  let totalPassed = 0;
  let totalFailed = 0;

  tests.forEach((test) => {
    if (test.result) {
      logSuccess(`${test.name}: PASSED`);
      totalPassed++;
    } else {
      logError(`${test.name}: FAILED`);
      totalFailed++;
    }
  });

  console.log(`\n${colors.bold}Total: ${tests.length} | Passed: ${totalPassed} | Failed: ${totalFailed}${colors.reset}\n`);

  if (totalFailed === 0) {
    console.log(`${colors.green}${colors.bold}✓ All tests passed! Industry detection system is working correctly.${colors.reset}\n`);
  } else {
    console.log(`${colors.red}${colors.bold}✗ Some tests failed. Please review the output above.${colors.reset}\n`);
    process.exit(1);
  }
}

main().catch((error) => {
  console.error('Fatal error:', error);
  process.exit(1);
});
