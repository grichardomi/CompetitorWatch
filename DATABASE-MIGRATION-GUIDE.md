# Database Migration Guide - Competitor Discovery

## 📋 Overview

This guide will help you migrate your database to add the competitor discovery feature.

**Changes:**
1. Add location fields to `users` table (industry, city, state, zipcode)
2. Keep location fields on `businesses` table (for multi-location support)
3. Add `competitor_discovery_cache` table
4. Add `discovery_event` table for analytics

---

## 🚀 Migration Methods

### Option 1: Prisma Migrate (Recommended for Development)

```bash
# Generate and apply migration
npx prisma migrate dev --name add_competitor_discovery

# Generate Prisma Client
npx prisma generate
```

**What this does:**
- Creates a new migration file in `prisma/migrations/`
- Applies the migration to your database
- Regenerates the Prisma Client with new fields

---

### Option 2: Manual SQL (For Production)

If you prefer to review the SQL before applying:

```bash
# Generate migration without applying
npx prisma migrate dev --create-only --name add_competitor_discovery

# Review the generated SQL in:
# prisma/migrations/XXXXXX_add_competitor_discovery/migration.sql

# Apply manually
npx prisma migrate deploy
```

---

### Option 3: Direct SQL (Manual Control)

If you want full control, run this SQL directly:

```sql
-- ============================================================================
-- Add location fields to users table
-- ============================================================================

ALTER TABLE users
  ADD COLUMN industry VARCHAR(255),
  ADD COLUMN city VARCHAR(255),
  ADD COLUMN state VARCHAR(2),
  ADD COLUMN zipcode VARCHAR(10);

-- Create index for discovery queries
CREATE INDEX idx_users_location ON users(industry, city, state);

-- ============================================================================
-- Add location fields to businesses table (already done, but for reference)
-- ============================================================================

ALTER TABLE businesses
  ADD COLUMN city VARCHAR(255),
  ADD COLUMN state VARCHAR(2),
  ADD COLUMN zipcode VARCHAR(10);

-- Create index for business location
CREATE INDEX idx_businesses_location ON businesses(city, state);

-- ============================================================================
-- Create competitor discovery cache table
-- ============================================================================

CREATE TABLE competitor_discovery_cache (
  id SERIAL PRIMARY KEY,
  cache_key VARCHAR(32) UNIQUE NOT NULL,  -- MD5 hash of industry + city + state
  industry VARCHAR(255) NOT NULL,
  city VARCHAR(255) NOT NULL,
  state VARCHAR(2) NOT NULL,
  results JSONB NOT NULL,  -- Array of RankedCompetitor objects
  expires_at TIMESTAMP NOT NULL,
  created_at TIMESTAMP DEFAULT NOW() NOT NULL,
  updated_at TIMESTAMP DEFAULT NOW() NOT NULL
);

-- Create indexes
CREATE INDEX idx_competitor_discovery_cache_key ON competitor_discovery_cache(cache_key);
CREATE INDEX idx_competitor_discovery_expires ON competitor_discovery_cache(expires_at);
CREATE INDEX idx_competitor_discovery_location ON competitor_discovery_cache(industry, city, state);

-- ============================================================================
-- Create discovery event table (analytics)
-- ============================================================================

CREATE TABLE discovery_event (
  id SERIAL PRIMARY KEY,
  user_id INTEGER NOT NULL,
  industry VARCHAR(255) NOT NULL,
  city VARCHAR(255) NOT NULL,
  state VARCHAR(2) NOT NULL,
  result_count INTEGER NOT NULL,
  cached BOOLEAN DEFAULT FALSE,
  duration INTEGER,  -- Duration in milliseconds
  created_at TIMESTAMP DEFAULT NOW() NOT NULL
);

-- Create indexes
CREATE INDEX idx_discovery_event_user ON discovery_event(user_id);
CREATE INDEX idx_discovery_event_created ON discovery_event(created_at);
```

---

## ✅ Verification

After migration, verify the changes:

```sql
-- Check users table structure
\d users

-- Should show new columns:
-- industry, city, state, zipcode

-- Check new tables exist
\dt

-- Should show:
-- competitor_discovery_cache
-- discovery_event

-- Test discovery cache table
SELECT COUNT(*) FROM competitor_discovery_cache;
-- Should return 0 (empty initially)
```

---

## 🔄 Rollback (If Needed)

If something goes wrong:

### Using Prisma

```bash
# Rollback last migration
npx prisma migrate resolve --rolled-back MIGRATION_NAME
```

### Manual SQL

```sql
-- Remove columns from users table
ALTER TABLE users
  DROP COLUMN industry,
  DROP COLUMN city,
  DROP COLUMN state,
  DROP COLUMN zipcode;

-- Drop index
DROP INDEX IF EXISTS idx_users_location;

-- Remove columns from businesses table
ALTER TABLE businesses
  DROP COLUMN city,
  DROP COLUMN state,
  DROP COLUMN zipcode;

-- Drop index
DROP INDEX IF EXISTS idx_businesses_location;

-- Drop new tables
DROP TABLE IF EXISTS discovery_event;
DROP TABLE IF EXISTS competitor_discovery_cache;
```

---

## 📊 Migration Checklist

Before running migration:
- [ ] Backup your database
- [ ] Review the migration SQL
- [ ] Test on development environment first
- [ ] Check for any custom indexes or constraints

After running migration:
- [ ] Verify table structure
- [ ] Run `npx prisma generate`
- [ ] Restart your application
- [ ] Test discovery API endpoint
- [ ] Monitor for errors

---

## 🧪 Testing After Migration

### 1. Test Prisma Client

```typescript
// Test that new fields are accessible
const user = await prisma.user.findUnique({
  where: { email: 'test@example.com' },
  select: {
    id: true,
    email: true,
    industry: true,  // New field
    city: true,      // New field
    state: true,     // New field
    zipcode: true,   // New field
  },
});

console.log(user);
```

### 2. Test Discovery Cache

```typescript
// Test cache operations
import { saveToCache, getCached } from '@/lib/discovery/cache';

// Save to cache
await saveToCache(
  'Pizza Restaurant',
  'Austin',
  'TX',
  [{ name: 'Test Pizza', website: 'https://test.com', relevanceScore: 95, matchReason: 'Test' }]
);

// Get from cache
const cached = await getCached('Pizza Restaurant', 'Austin', 'TX');
console.log(cached); // Should return the cached competitor
```

### 3. Test Discovery API

```bash
curl -X POST http://localhost:3000/api/competitors/discover \
  -H "Content-Type: application/json" \
  -H "Cookie: your-session-cookie" \
  -d '{
    "industry": "Coffee Shop",
    "city": "Seattle",
    "state": "WA"
  }'
```

---

## ⚠️ Common Issues

### Issue 1: "Column already exists"

**Cause:** Migration was partially applied

**Solution:**
```sql
-- Check which columns exist
SELECT column_name
FROM information_schema.columns
WHERE table_name = 'users'
  AND column_name IN ('industry', 'city', 'state', 'zipcode');

-- Drop existing columns and retry
ALTER TABLE users DROP COLUMN IF EXISTS industry;
-- etc...
```

---

### Issue 2: "Prisma Client validation failed"

**Cause:** Prisma Client not regenerated after migration

**Solution:**
```bash
npx prisma generate
npm run dev  # Restart server
```

---

### Issue 3: "Table does not exist"

**Cause:** Migration not applied to database

**Solution:**
```bash
# Check migration status
npx prisma migrate status

# Apply pending migrations
npx prisma migrate deploy
```

---

## 🔍 Verify Data Model

After migration, your models should look like:

### User Model
```typescript
{
  id: number;
  email: string;
  // ... existing fields ...
  industry: string | null;    // NEW
  city: string | null;        // NEW
  state: string | null;       // NEW
  zipcode: string | null;     // NEW
}
```

### Business Model
```typescript
{
  id: number;
  userId: number;
  name: string;
  location: string;
  industry: string;
  city: string | null;        // NEW
  state: string | null;       // NEW
  zipcode: string | null;     // NEW
  // ... other fields ...
}
```

### CompetitorDiscoveryCache Model
```typescript
{
  id: number;
  cacheKey: string;           // MD5 hash
  industry: string;
  city: string;
  state: string;
  results: any;               // JSON
  expiresAt: Date;
  createdAt: Date;
  updatedAt: Date;
}
```

### DiscoveryEvent Model
```typescript
{
  id: number;
  userId: number;
  industry: string;
  city: string;
  state: string;
  resultCount: number;
  cached: boolean;
  duration: number | null;    // milliseconds
  createdAt: Date;
}
```

---

## 📈 Post-Migration Analytics

Query discovery statistics:

```sql
-- Total discoveries
SELECT COUNT(*) FROM discovery_event;

-- Cache hit rate
SELECT
  COUNT(*) FILTER (WHERE cached = true) * 100.0 / COUNT(*) as cache_hit_rate_percent
FROM discovery_event;

-- Average discovery duration
SELECT AVG(duration) as avg_duration_ms
FROM discovery_event
WHERE duration IS NOT NULL;

-- Most popular industries
SELECT industry, COUNT(*) as discoveries
FROM discovery_event
GROUP BY industry
ORDER BY discoveries DESC
LIMIT 10;

-- Most popular cities
SELECT city, state, COUNT(*) as discoveries
FROM discovery_event
GROUP BY city, state
ORDER BY discoveries DESC
LIMIT 10;
```

---

## 🎯 Next Steps

After successful migration:

1. **Configure API Keys** (see `/COMPETITOR-DISCOVERY-README.md`)
   - OpenAI API key
   - Google Custom Search API key

2. **Test Discovery Flow**
   - Use the UI component in onboarding
   - Verify results are cached properly
   - Check analytics tracking

3. **Monitor Performance**
   - Track cache hit rates
   - Monitor API costs
   - Check discovery durations

---

## 📞 Support

**Migration issues?**
- Check Prisma docs: https://www.prisma.io/docs/concepts/components/prisma-migrate
- See full schema: `/prisma/schema.prisma`
- Questions: tech@getmarketpulse.com

---

**Last Updated:** January 2026
**Migration Version:** v1.0
**Status:** Ready to Apply ✅
