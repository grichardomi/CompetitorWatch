# Trial Expiration Fixes - Phase 1 Implementation

**Date**: 2026-01-11
**Status**: ✅ Complete

## Overview

Implemented critical trial expiration handling to prevent users from accessing services after their trial period ends.

---

## Files Created

### 1. `/app/api/cron/expire-trials/route.ts`
**Purpose**: Hourly cron job to expire trials that have passed their end date

**Features**:
- Finds all trials where `currentPeriodEnd < now`
- Updates subscription status from `'trialing'` to `'expired'`
- Sends trial_ended email if not already sent
- Protected by `CRON_SECRET`

**Usage**:
```bash
# Add to cron scheduler (Railway, Vercel Cron, etc.)
# Run every hour
curl -H "Authorization: Bearer $CRON_SECRET" \
  https://your-domain.com/api/cron/expire-trials
```

**Response**:
```json
{
  "status": "success",
  "message": "Expired 5 trials, sent 3 emails, 0 errors",
  "stats": {
    "found": 5,
    "expired": 5,
    "emailsSent": 3,
    "errors": 0
  }
}
```

---

### 2. `/lib/middleware/check-subscription.ts`
**Purpose**: Reusable subscription validation middleware

**Functions**:

#### `requireActiveSubscription(userId: number)`
Validates that user has an active subscription.

**Checks**:
- ✅ Subscription exists
- ✅ Trial is not expired
- ✅ Status is `'trialing'` or `'active'`

**Returns**:
```typescript
{
  valid: boolean;
  subscription?: Subscription;
  error?: string;
  errorCode?: 'NO_SUBSCRIPTION' | 'TRIAL_EXPIRED' |
               'SUBSCRIPTION_INACTIVE' | 'SUBSCRIPTION_CANCELED';
}
```

#### `canAddCompetitor(userId: number)`
Checks if user can add more competitors.

**Checks**:
- ✅ Subscription is active (via `requireActiveSubscription`)
- ✅ User hasn't reached competitor limit

**Returns**:
```typescript
{
  allowed: boolean;
  error?: string;
  limit?: number;
  current?: number;
  remaining?: number;
}
```

#### `getSubscriptionWithValidation(userId: number)`
Gets subscription details with validation.

**Returns**:
```typescript
{
  isActive: boolean;
  subscription?: {
    id: number;
    status: string;
    competitorLimit: number;
    daysRemaining: number | null;
    // ...
  };
  error?: string;
  errorCode?: string;
}
```

---

## Files Updated

### 3. `/app/api/competitors/route.ts`
**Changes**:
- Added import: `canAddCompetitor` middleware
- Replaced manual limit check with `canAddCompetitor(user.id)`
- Now blocks expired trials from adding competitors
- Fixed bug: removed undefined `plan` variable reference

**Before**:
```typescript
// ❌ Only checked limit, not subscription status
if (currentCount >= limit) {
  return Response.json({ error: 'Limit reached' }, { status: 403 });
}
```

**After**:
```typescript
// ✅ Checks subscription status AND limit
const canAdd = await canAddCompetitor(user.id);
if (!canAdd.allowed) {
  return Response.json({ error: canAdd.error }, { status: 403 });
}
```

---

### 4. `/services/scheduler/index.ts`
**Changes**:
- Updated `enqueueJobs()` SQL query to exclude expired trials
- Updated `getCompetitorsDue()` SQL query with same logic
- Added `INNER JOIN` to Business and Subscription tables
- Added subscription status checks

**Before**:
```sql
SELECT c.* FROM "Competitor" c
WHERE c."isActive" = true
  -- ❌ No subscription check!
```

**After**:
```sql
SELECT c.* FROM "Competitor" c
INNER JOIN "Business" b ON c."businessId" = b.id
INNER JOIN "Subscription" s ON s."userId" = b."userId"
WHERE c."isActive" = true
  -- ✅ Only active subscriptions
  AND s.status IN ('trialing', 'active')
  -- ✅ Check trials not expired
  AND (s.status != 'trialing' OR s."currentPeriodEnd" > NOW())
```

**Impact**: Crawler will automatically skip competitors from expired trials.

---

### 5. `/app/api/crawl/trigger/route.ts`
**Changes**:
- Added import: `requireActiveSubscription` middleware
- Added subscription validation before allowing manual crawl
- Returns clear error messages for expired/inactive subscriptions

**Before**:
```typescript
// ❌ No subscription check
if (!competitor) {
  return NextResponse.json({ error: 'Not found' }, { status: 404 });
}

// Queue crawl immediately
```

**After**:
```typescript
// ✅ Check subscription first
const subscriptionCheck = await requireActiveSubscription(user.id);
if (!subscriptionCheck.valid) {
  return NextResponse.json(
    { error: subscriptionCheck.error, errorCode: subscriptionCheck.errorCode },
    { status: 403 }
  );
}

// Queue crawl only if active
```

---

## How It Works

### Trial Lifecycle

1. **Day 0**: User completes onboarding
   - Trial subscription created with status `'trialing'`
   - `currentPeriodEnd` set to 14 days from now
   - Trial emails scheduled (Day 7, 11, 14)

2. **Day 7**: Reminder email sent
   - "Halfway through your trial"
   - Email sent by email-worker cron

3. **Day 11**: Urgency email sent
   - "Your trial ends in 3 days"
   - Upgrade CTA with pricing

4. **Day 14**: Trial end date reaches
   - ⏰ **expire-trials cron** runs (hourly)
   - Status updated: `'trialing'` → `'expired'`
   - Final email sent: "Your trial has ended"

5. **Post-expiration**:
   - ❌ Cannot add competitors (`canAddCompetitor` blocks)
   - ❌ No new crawls scheduled (scheduler excludes)
   - ❌ Cannot trigger manual crawls (endpoint blocks)
   - ✅ Can still view dashboard (read-only access)
   - ✅ Can upgrade anytime to reactivate

---

## Setup Instructions

### 1. Deploy Cron Job

Add to your cron scheduler (Railway Cron, Vercel Cron, or external service):

**Railway Cron** (recommended):
```yaml
# railway.json
{
  "crons": [
    {
      "schedule": "0 * * * *",  // Every hour
      "command": "curl -H 'Authorization: Bearer $CRON_SECRET' https://your-domain.com/api/cron/expire-trials"
    }
  ]
}
```

**Vercel Cron**:
```json
// vercel.json
{
  "crons": [{
    "path": "/api/cron/expire-trials",
    "schedule": "0 * * * *"
  }]
}
```

**External Cron** (cron-job.org, EasyCron):
```bash
# Set up HTTP request every hour
URL: https://your-domain.com/api/cron/expire-trials
Method: GET
Header: Authorization: Bearer YOUR_CRON_SECRET
```

### 2. Set Environment Variable

Ensure `CRON_SECRET` is set in your environment:

```bash
# .env.local or Railway environment variables
CRON_SECRET="your-secure-random-secret-here"
```

Generate a secure secret:
```bash
openssl rand -base64 32
```

---

## Testing

### Test Trial Expiration

1. **Create test user with expired trial**:
```sql
-- Update trial end date to past
UPDATE "Subscription"
SET "currentPeriodEnd" = NOW() - INTERVAL '1 day'
WHERE "userId" = YOUR_TEST_USER_ID;
```

2. **Trigger expiration cron manually**:
```bash
curl -H "Authorization: Bearer $CRON_SECRET" \
  http://localhost:3000/api/cron/expire-trials
```

3. **Verify results**:
```sql
-- Check subscription status updated
SELECT status, "currentPeriodEnd"
FROM "Subscription"
WHERE "userId" = YOUR_TEST_USER_ID;
-- Should show status = 'expired'
```

4. **Test blocked actions**:
   - Try to add a competitor → Should get "trial expired" error
   - Try to trigger manual crawl → Should get 403 error
   - Check if scheduled crawls skip this user → They should

---

### Test Competitor Creation Block

```bash
# Attempt to add competitor with expired trial
curl -X POST http://localhost:3000/api/competitors \
  -H "Content-Type: application/json" \
  -H "Cookie: your-session-cookie" \
  -d '{"name": "Test", "url": "https://example.com"}'

# Expected response:
{
  "error": "Your free trial has ended. Please upgrade to continue monitoring competitors."
}
```

---

### Test Manual Crawl Block

```bash
# Attempt to trigger manual crawl with expired trial
curl -X POST http://localhost:3000/api/crawl/trigger \
  -H "Content-Type: application/json" \
  -H "Cookie: your-session-cookie" \
  -d '{"competitorId": 123}'

# Expected response:
{
  "error": "Your free trial has ended. Please upgrade to continue monitoring competitors.",
  "errorCode": "TRIAL_EXPIRED"
}
```

---

## Error Messages

Users with expired/inactive subscriptions will see:

| Status | Error Message |
|--------|---------------|
| `expired` (trial ended) | "Your free trial has ended. Please upgrade to continue monitoring competitors." |
| `canceled` | "Your subscription has been canceled. Please reactivate to continue." |
| `past_due` | "Your payment is past due. Please update your payment method to continue." |
| No subscription | "No subscription found. Please upgrade to continue." |

---

## Monitoring

### Check Expiration Cron Logs

```bash
# Railway logs
railway logs --filter="expire-trials"

# Or check API response
curl -H "Authorization: Bearer $CRON_SECRET" \
  https://your-domain.com/api/cron/expire-trials
```

### Monitor Failed Trials

```sql
-- Find trials that should be expired but aren't
SELECT u.email, s.status, s."currentPeriodEnd"
FROM "Subscription" s
JOIN "User" u ON s."userId" = u.id
WHERE s.status = 'trialing'
  AND s."currentPeriodEnd" < NOW()
ORDER BY s."currentPeriodEnd" ASC;
```

---

## Impact Summary

### ✅ Problems Solved

1. **Trial never expires** - FIXED
   - Cron job automatically expires trials after `currentPeriodEnd`

2. **Users keep access after trial** - FIXED
   - Cannot add competitors
   - No crawls scheduled
   - Cannot trigger manual crawls

3. **No enforcement** - FIXED
   - Middleware validates all critical actions
   - Clear error messages guide users to upgrade

### 🎯 Service Restrictions Applied

| Action | Before | After |
|--------|--------|-------|
| Add competitor | ✅ Always allowed | ❌ Blocked if trial expired |
| Scheduled crawls | ✅ Always runs | ❌ Skipped if trial expired |
| Manual crawl trigger | ✅ Always works | ❌ Blocked if trial expired |
| View dashboard | ✅ Works | ✅ Still works (read-only) |
| View past data | ✅ Works | ✅ Still works (encourages upgrade) |

---

## Next Steps (Phase 2)

Consider implementing:

1. **Grace period** (3 days after trial ends)
   - Allow read-only access but show upgrade banner
   - Stop all crawls immediately

2. **Stripe webhook for `trial_will_end`**
   - Stripe sends event 3 days before trial ends
   - Send urgent upgrade email with discount code

3. **Reactivation flow**
   - Special "welcome back" email after upgrade
   - Resume all competitors automatically

4. **Usage analytics**
   - Track trial conversion rate
   - A/B test different trial lengths

---

## Files Changed Summary

| File | Type | Changes |
|------|------|---------|
| `app/api/cron/expire-trials/route.ts` | NEW | Trial expiration cron job |
| `lib/middleware/check-subscription.ts` | NEW | Subscription validation middleware |
| `app/api/competitors/route.ts` | UPDATED | Added subscription validation |
| `services/scheduler/index.ts` | UPDATED | Exclude expired trials from crawls |
| `app/api/crawl/trigger/route.ts` | UPDATED | Added subscription validation |

---

## Rollback Instructions

If you need to rollback these changes:

1. **Disable cron job** (stop calling expire-trials endpoint)
2. **Revert file changes**:
   ```bash
   git revert HEAD  # Revert last commit
   ```
3. **Remove middleware**:
   ```bash
   rm lib/middleware/check-subscription.ts
   rm app/api/cron/expire-trials/route.ts
   ```

---

**Implementation Complete** ✅

All Phase 1 critical trial expiration fixes have been successfully implemented. Trial subscriptions will now properly expire and users will be blocked from using premium features after their trial ends.
