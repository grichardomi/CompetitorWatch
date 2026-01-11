#!/bin/bash

# Test API Blocks for Expired Trial
# This script tests that APIs correctly block expired trial users

echo "🧪 Testing API Blocks for Expired Trial"
echo ""

USER_ID=5
TEST_EMAIL="trial-test-1768156894242@test.com"

# Colors
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

echo "Test User: $TEST_EMAIL (ID: $USER_ID)"
echo ""

# Test 1: Check subscription status via API
echo "Test 1: Checking subscription status via API..."
RESPONSE=$(curl -s http://localhost:3000/api/billing/subscription \
  -H "Content-Type: application/json" \
  -b "next-auth.session-token=test" 2>&1)

echo "$RESPONSE" | jq . 2>/dev/null || echo "$RESPONSE"
echo ""

# Test 2: Try to add a competitor (should fail)
echo "Test 2: Trying to add competitor (should be blocked)..."
RESPONSE=$(curl -s -X POST http://localhost:3000/api/competitors \
  -H "Content-Type: application/json" \
  -d '{"name": "Blocked Competitor", "url": "https://blocked.com", "crawlFrequencyMinutes": 720, "isActive": true}' \
  2>&1)

if echo "$RESPONSE" | grep -q "trial.*expired\|expired"; then
  echo -e "${GREEN}✅ SUCCESS: API blocked competitor creation${NC}"
  echo "$RESPONSE" | jq . 2>/dev/null || echo "$RESPONSE"
else
  echo -e "${RED}❌ FAILURE: API should have blocked this${NC}"
  echo "$RESPONSE" | jq . 2>/dev/null || echo "$RESPONSE"
fi
echo ""

# Test 3: Try manual crawl trigger (should fail)
echo "Test 3: Trying manual crawl trigger (should be blocked)..."
RESPONSE=$(curl -s -X POST http://localhost:3000/api/crawl/trigger \
  -H "Content-Type: application/json" \
  -d '{"competitorId": 6}' \
  2>&1)

if echo "$RESPONSE" | grep -q "trial.*expired\|expired"; then
  echo -e "${GREEN}✅ SUCCESS: API blocked manual crawl${NC}"
  echo "$RESPONSE" | jq . 2>/dev/null || echo "$RESPONSE"
else
  echo -e "${RED}❌ FAILURE: API should have blocked this${NC}"
  echo "$RESPONSE" | jq . 2>/dev/null || echo "$RESPONSE"
fi
echo ""

echo -e "${YELLOW}Note: These tests need a valid session cookie to work properly.${NC}"
echo -e "${YELLOW}The best way to test is to:${NC}"
echo -e "${YELLOW}1. Sign in to the app${NC}"
echo -e "${YELLOW}2. Try to add a competitor via the UI${NC}"
echo -e "${YELLOW}3. Check browser dev tools for error messages${NC}"
echo ""
