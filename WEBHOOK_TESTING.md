# Stripe Webhook Testing Guide

This guide explains how to test the Stripe webhook integration for CompetitorWatch.

## Prerequisites

1. Stripe CLI installed: https://stripe.com/docs/stripe-cli
2. Stripe account with test mode enabled
3. Local development server running on port 3000

## Setup

### 1. Install Stripe CLI

```bash
# macOS
brew install stripe/stripe-cli/stripe

# Linux
wget https://github.com/stripe/stripe-cli/releases/latest/download/stripe_X.X.X_linux_x86_64.tar.gz
tar -xvf stripe_X.X.X_linux_x86_64.tar.gz
sudo mv stripe /usr/local/bin/
```

### 2. Login to Stripe CLI

```bash
stripe login
```

This will open your browser to authenticate with Stripe.

### 3. Get Your Webhook Secret

When you start webhook forwarding (next step), Stripe CLI will provide a webhook signing secret that looks like:

```
whsec_xxxxxxxxxxxxxxxxxxxxx
```

Add this to your `.env.local` file:

```bash
STRIPE_WEBHOOK_SECRET="whsec_xxxxxxxxxxxxxxxxxxxxx"
```

## Running Webhook Tests

### Start Webhook Forwarding

In a separate terminal window, run:

```bash
stripe listen --forward-to localhost:3000/api/webhooks/stripe
```

This will:
- Listen for webhook events from Stripe
- Forward them to your local development server
- Show you the webhook secret (add this to `.env.local`)
- Display incoming webhooks in real-time

Expected output:
```
> Ready! Your webhook signing secret is whsec_xxxxxxxxxxxxxxxxxxxxx (^C to quit)
```

### Test Individual Events

#### Test Checkout Session Completed

```bash
stripe trigger checkout.session.completed
```

**Expected behavior:**
- Webhook received and logged to `WebhookEvent` table
- User's `stripeCustomerId` updated
- Subscription created in database
- Trial subscription deleted (if exists)
- Console logs show "Successfully processed webhook"

**Check database:**
```sql
SELECT * FROM "Subscription" ORDER BY "createdAt" DESC LIMIT 1;
SELECT * FROM "WebhookEvent" ORDER BY "createdAt" DESC LIMIT 1;
```

#### Test Subscription Created/Updated

```bash
stripe trigger customer.subscription.updated
```

**Expected behavior:**
- Subscription record upserted
- Status, price ID, and competitor limit updated
- Console logs show subscription details

#### Test Payment Success

```bash
stripe trigger invoice.payment_succeeded
```

**Expected behavior:**
- Payment record created in `Payment` table
- If subscription was `past_due`, status changes to `active`
- Reactivation email sent (if recovering from past_due)

**Check database:**
```sql
SELECT * FROM "Payment" ORDER BY "createdAt" DESC LIMIT 1;
```

#### Test Payment Failure

```bash
stripe trigger invoice.payment_failed
```

**Expected behavior:**
- Subscription status updated to `past_due`
- Payment failure email sent to user
- Email includes link to update payment method

**Check logs:**
```bash
# Should see email sent
tail -f logs/app.log | grep "payment failure email"
```

#### Test Subscription Canceled

```bash
stripe trigger customer.subscription.deleted
```

**Expected behavior:**
- Subscription status updated to `canceled`
- Record remains in database (soft delete)

## End-to-End Test Flow

### 1. Create Test Customer and Subscription

```bash
# Create a test customer
stripe customers create --email="test@example.com" --name="Test User"

# Note the customer ID (cus_xxxxx)

# Create a subscription
stripe subscriptions create \
  --customer cus_xxxxx \
  --items '[{"price": "price_starter_monthly_49"}]' \
  --payment-behavior=default_incomplete
```

### 2. Monitor Webhook Events

In your Stripe CLI terminal, you should see:
```
2024-01-10 12:00:00   --> customer.subscription.created [evt_xxxxx]
2024-01-10 12:00:00   <--  [200] POST http://localhost:3000/api/webhooks/stripe [evt_xxxxx]
```

### 3. Check Application State

```bash
# Check subscription was created
psql $DATABASE_URL -c "SELECT * FROM \"Subscription\" WHERE \"stripeSubscriptionId\" = 'sub_xxxxx';"

# Check webhook was logged
psql $DATABASE_URL -c "SELECT * FROM \"WebhookEvent\" ORDER BY \"createdAt\" DESC LIMIT 5;"
```

## Testing in Stripe Dashboard

### 1. Configure Webhook Endpoint (for deployed app)

1. Go to https://dashboard.stripe.com/test/webhooks
2. Click "Add endpoint"
3. Enter URL: `https://your-domain.com/api/webhooks/stripe`
4. Select events:
   - `checkout.session.completed`
   - `customer.subscription.created`
   - `customer.subscription.updated`
   - `customer.subscription.deleted`
   - `invoice.payment_succeeded`
   - `invoice.payment_failed`
5. Copy the webhook signing secret to your production `.env` file

### 2. Test via Dashboard

1. Go to https://dashboard.stripe.com/test/webhooks
2. Click your webhook endpoint
3. Click "Send test webhook"
4. Select event type and send
5. View response and logs

## Debugging Webhooks

### Check Webhook Logs

```sql
-- View all webhooks
SELECT
  id,
  "eventType",
  processed,
  error,
  "createdAt"
FROM "WebhookEvent"
ORDER BY "createdAt" DESC
LIMIT 10;

-- View failed webhooks
SELECT * FROM "WebhookEvent" WHERE error IS NOT NULL;

-- View unprocessed webhooks
SELECT * FROM "WebhookEvent" WHERE processed = false;
```

### Check Stripe Webhook Delivery Attempts

In Stripe Dashboard:
1. Go to Developers → Webhooks
2. Click your webhook endpoint
3. View "Recent deliveries"
4. Click on individual events to see:
   - Request body
   - Response status
   - Response body
   - Retry attempts

### Common Issues

#### 1. Signature Verification Failed

**Symptoms:**
```
Webhook signature verification failed
```

**Solutions:**
- Check `STRIPE_WEBHOOK_SECRET` is correct in `.env.local`
- Restart your dev server after updating env variables
- Make sure you're using the webhook secret from `stripe listen` output

#### 2. User Not Found

**Symptoms:**
```
User not found for Stripe customer: cus_xxxxx
```

**Solutions:**
- Check user has `stripeCustomerId` set in database
- Run checkout flow first to associate customer ID with user
- Manually update user:
  ```sql
  UPDATE "User" SET "stripeCustomerId" = 'cus_xxxxx' WHERE email = 'test@example.com';
  ```

#### 3. Event Already Processed

**Symptoms:**
```
Event already processed: evt_xxxxx
```

**Solutions:**
- This is normal behavior (idempotency working)
- If you need to reprocess, delete the webhook event:
  ```sql
  DELETE FROM "WebhookEvent" WHERE payload->>'id' = 'evt_xxxxx';
  ```

#### 4. Duplicate Events

**Symptoms:**
- Multiple webhook events for same action
- Multiple payment records

**Solutions:**
- Check idempotency logic is working
- Verify `webhookEventId` is being tracked correctly
- Check for duplicate webhook endpoints in Stripe dashboard

## Production Checklist

Before going live with webhooks:

- [ ] Production webhook endpoint configured in Stripe dashboard
- [ ] `STRIPE_WEBHOOK_SECRET` set in production environment
- [ ] Webhook endpoint is publicly accessible (not localhost)
- [ ] SSL/HTTPS enabled on production domain
- [ ] All 6 webhook events enabled:
  - [ ] checkout.session.completed
  - [ ] customer.subscription.created
  - [ ] customer.subscription.updated
  - [ ] customer.subscription.deleted
  - [ ] invoice.payment_succeeded
  - [ ] invoice.payment_failed
- [ ] Error monitoring configured (Sentry, LogRocket, etc.)
- [ ] Email delivery working (Resend API key configured)
- [ ] Test subscription flow end-to-end in test mode
- [ ] Monitor webhook delivery rate in Stripe dashboard
- [ ] Set up alerts for webhook failures

## Monitoring in Production

### Key Metrics to Track

1. **Webhook Success Rate**
   ```sql
   SELECT
     COUNT(*) FILTER (WHERE processed = true) * 100.0 / COUNT(*) as success_rate,
     COUNT(*) as total_webhooks
   FROM "WebhookEvent"
   WHERE "createdAt" > NOW() - INTERVAL '24 hours';
   ```

2. **Failed Webhooks**
   ```sql
   SELECT
     "eventType",
     COUNT(*) as failure_count
   FROM "WebhookEvent"
   WHERE error IS NOT NULL
     AND "createdAt" > NOW() - INTERVAL '7 days'
   GROUP BY "eventType"
   ORDER BY failure_count DESC;
   ```

3. **Processing Time**
   - Monitor `processedAt - createdAt` duration
   - Alert if processing takes > 5 seconds
   - Stripe expects response within 30 seconds

### Alerts to Configure

- Webhook failure rate > 5%
- Unprocessed webhooks older than 10 minutes
- Payment failure emails not sending
- Subscription status mismatches with Stripe

## Testing Checklist

Use this checklist to verify webhook integration:

### Basic Functionality
- [ ] Webhook signature verification works
- [ ] Idempotency prevents duplicate processing
- [ ] Events are logged to `WebhookEvent` table
- [ ] Processed events marked as `processed = true`
- [ ] Failed events log error messages

### Subscription Lifecycle
- [ ] New subscription created after checkout
- [ ] Trial subscription deleted when user upgrades
- [ ] Subscription status updates (active → past_due → canceled)
- [ ] Competitor limit updates when plan changes
- [ ] Current period dates update on renewal

### Payment Handling
- [ ] Successful payments create `Payment` records
- [ ] Failed payments send email alerts
- [ ] Past due subscriptions reactivate on successful payment
- [ ] Payment amounts recorded correctly (in cents)

### Email Notifications
- [ ] Payment failure email sent
- [ ] Subscription reactivation email sent
- [ ] Emails contain correct user name and amounts
- [ ] Links in emails work correctly

### Edge Cases
- [ ] Webhook retries are idempotent
- [ ] Unknown event types are logged but don't crash
- [ ] Missing customer ID handled gracefully
- [ ] Missing subscription items handled gracefully
- [ ] Concurrent webhook processing works

## Resources

- [Stripe Webhook Docs](https://stripe.com/docs/webhooks)
- [Stripe CLI Reference](https://stripe.com/docs/stripe-cli)
- [Testing Webhooks](https://stripe.com/docs/webhooks/test)
- [Webhook Best Practices](https://stripe.com/docs/webhooks/best-practices)
