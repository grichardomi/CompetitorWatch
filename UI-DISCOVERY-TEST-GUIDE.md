# Competitor Discovery UI - Testing Guide

**Status:** ✅ Ready to Test
**Test URL:** http://localhost:3000/test-ui-discovery

---

## Quick Test Instructions

### 1. Open Test Page

```bash
# Server is already running, just open in browser:
http://localhost:3000/test-ui-discovery
```

### 2. Fill in the Form

Use these test values:

- **Industry:** Pizza Restaurant
- **City:** Austin
- **State:** TX (select from dropdown)
- **Zipcode:** 78701 (optional)

### 3. Click "Find Competitors" 🔍

The system will:
1. Search Google for competitor candidates (~3-5 seconds)
2. Use AI to rank and filter results (~10-15 seconds)
3. Display top competitors with relevance scores

**Expected:** 10-15 competitors with 75-95% match scores

### 4. Review Results

You should see competitors like:
- ✅ Home Slice Pizza (95% match)
- ✅ Pinthouse Pizza (90% match)
- ✅ Aviator Pizza & Drafthouse (85% match)
- ✅ Austin's Pizza (80% match)
- ✅ DeSano Pizza (75% match)

### 5. Select Competitors

- Top 2-3 competitors are auto-selected
- Click any card to toggle selection
- Click "Select All" to select all results
- Click "Deselect All" to clear selection

### 6. Click "Continue with X competitors" →

The page will display:
- Success message ✅
- List of selected competitors
- JSON output of the data

---

## What the UI Looks Like

### Step 1: Form Input
```
┌─────────────────────────────────────────────┐
│  Find Your Competitors                      │
│  We'll help you discover competitors in     │
│  your area using AI                         │
├─────────────────────────────────────────────┤
│                                             │
│  Industry / Business Type *                 │
│  ┌─────────────────────────────────────┐   │
│  │ Pizza Restaurant                    │   │
│  └─────────────────────────────────────┘   │
│                                             │
│  City *              State *                │
│  ┌──────────────┐   ┌──────────────┐       │
│  │ Austin       │   │ TX ▼         │       │
│  └──────────────┘   └──────────────┘       │
│                                             │
│  Zipcode (optional)                         │
│  ┌─────────────────────────────────────┐   │
│  │ 78701                               │   │
│  └─────────────────────────────────────┘   │
│                                             │
│  [🔍 Find Competitors]  [Skip - Add Manually]│
│                                             │
└─────────────────────────────────────────────┘
```

### Step 2: Loading State
```
┌─────────────────────────────────────────────┐
│  Find Your Competitors                      │
├─────────────────────────────────────────────┤
│                                             │
│         ⟳ Discovering...                    │
│                                             │
│         Please wait while we find           │
│         competitors in your area            │
│                                             │
└─────────────────────────────────────────────┘
```

### Step 3: Results Display
```
┌─────────────────────────────────────────────┐
│  We found 11 competitors                    │
│  Select the ones you want to monitor        │
│                          [Select All]        │
├─────────────────────────────────────────────┤
│  ☑ [1] Home Slice Pizza        [95% match] │
│     https://homeslicepizza.com              │
│     Direct competitor, local independent    │
│                                             │
│  ☑ [2] Pinthouse Pizza         [90% match] │
│     https://pinthouse.com                   │
│     Direct competitor, local independent    │
│                                             │
│  ☑ [3] Aviator Pizza           [85% match] │
│     https://aviatorpizza.com                │
│     Local chain with pizza and beer         │
│                                             │
│  ☐ [4] Austin's Pizza          [80% match] │
│  ☐ [5] DeSano Pizza            [75% match] │
│  ... (6 more)                               │
├─────────────────────────────────────────────┤
│  Don't see a competitor you want to monitor?│
│  [+ Add Competitor Manually]                │
├─────────────────────────────────────────────┤
│  [← Back]  [Continue with 3 competitors →] │
└─────────────────────────────────────────────┘
```

---

## Features to Test

### ✅ Form Validation
- [ ] Empty fields show error
- [ ] Industry field is required
- [ ] City field is required
- [ ] State dropdown works
- [ ] Zipcode is optional

### ✅ Discovery Process
- [ ] "Find Competitors" button triggers search
- [ ] Loading spinner appears
- [ ] Progress updates shown
- [ ] Results appear after ~15-20 seconds

### ✅ Results Display
- [ ] Competitors show with relevance scores
- [ ] Website links are clickable
- [ ] Match reasons are displayed
- [ ] Top 2-3 are auto-selected

### ✅ Selection Interaction
- [ ] Click card to toggle selection
- [ ] Checkbox updates on click
- [ ] Selected cards have blue highlight
- [ ] "Select All" button works
- [ ] "Deselect All" appears when all selected

### ✅ Navigation
- [ ] "Back" button returns to form
- [ ] "Continue" button shows selection count
- [ ] "Continue" is disabled when nothing selected
- [ ] "Skip" button navigates to manual entry

### ✅ Error Handling
- [ ] No results shows appropriate message
- [ ] API errors display user-friendly message
- [ ] Can retry after error

---

## Expected Behavior

### Successful Flow
1. **User fills form** → Validation passes
2. **Clicks "Find Competitors"** → Loading state
3. **API calls execute:**
   - Google Search API (3-5 seconds)
   - OpenAI AI Ranking (10-15 seconds)
   - Total: ~18 seconds
4. **Results display** → 10-15 competitors
5. **User selects competitors** → Checkboxes toggle
6. **Clicks "Continue"** → onComplete callback fires

### Cached Flow (Second Discovery)
1. Same query parameters
2. **Results instant** → <1 second
3. Same competitors returned
4. Cached indicator shown

---

## Testing Different Scenarios

### Test 1: Pizza in Austin, TX ✅
- **Expected:** 10-15 results
- **Quality:** High (real restaurants)
- **Speed:** 18 seconds (fresh), <1 second (cached)

### Test 2: Coffee Shop in Seattle, WA
```
Industry: Coffee Shop
City: Seattle
State: WA
```
- **Expected:** 15-20 results (competitive market)

### Test 3: Hair Salon in Small Town
```
Industry: Hair Salon
City: Bozeman
State: MT
```
- **Expected:** 5-10 results (smaller market)

### Test 4: Invalid/Empty
```
Industry: (empty)
City: (empty)
State: (empty)
```
- **Expected:** Validation error

---

## Browser Console Logs

You should see logs like:

```javascript
[Discovery] Starting for: Pizza Restaurant in Austin, TX
[Discovery] Cache MISS - performing fresh discovery
[Discovery] Step 1: Searching for candidates...
[Discovery] Found 14 search results
[Discovery] Step 2: Ranking with AI...
[Discovery] AI ranked 11 competitors
[Discovery] Step 3: Resolving URLs...
[Discovery] Final result: 11 unique competitors
[Discovery] Completed in 18226ms
✅ Discovery completed! (11 competitors)
```

---

## Screenshots Location

When testing, you might want to capture:
- [ ] Form filled in (before search)
- [ ] Loading state
- [ ] Results with selection
- [ ] Success message

---

## Common Issues & Solutions

### Issue: "No competitors found"
**Possible Causes:**
- API quota exceeded (Google: 100/day)
- Invalid location/industry
- Network issues

**Solution:**
- Check Google Cloud Console quota
- Try different city/industry
- Check browser console for errors

### Issue: "API key not configured"
**Cause:** Environment variables not loaded

**Solution:**
```bash
# Restart dev server
Ctrl+C
npm run dev
```

### Issue: Page not loading
**Solution:**
```bash
# Check if server is running
curl http://localhost:3000
```

---

## After Testing

### ⚠️ Important: Clean Up

**Before production deployment, remove:**

1. Test UI page:
   ```bash
   rm app/test-ui-discovery/page.tsx
   ```

2. Test API endpoint:
   ```bash
   rm app/api/test-discovery/route.ts
   ```

### ✅ Integration into Real Onboarding

To integrate into actual onboarding flow:

**File:** `app/onboarding/page.tsx`

Replace Step 2 (manual competitor entry) with:
```tsx
{step === 2 && (
  <CompetitorDiscovery
    onComplete={(competitors) => {
      // Add competitors to database
      // Move to next step
      setStep(3);
    }}
    onSkip={() => {
      // Go to manual entry
      router.push('/dashboard/competitors/new');
    }}
    initialIndustry={businessData.industry}
    initialCity={cityFromLocation}
    initialState={stateFromLocation}
  />
)}
```

---

## Test Checklist

- [ ] Page loads at http://localhost:3000/test-ui-discovery
- [ ] Form accepts input correctly
- [ ] "Find Competitors" triggers discovery
- [ ] Loading state appears
- [ ] Results display after ~18 seconds
- [ ] Competitors have realistic relevance scores (75-95%)
- [ ] No directories (Yelp, Google Maps) in results
- [ ] Selection works (click to toggle)
- [ ] "Continue" button works
- [ ] Selected competitors shown on success page
- [ ] Second discovery uses cache (<1 second)
- [ ] Browser console shows proper logs

---

## Success Criteria

✅ **UI works correctly if:**
- Form validation prevents empty submissions
- Discovery takes 15-20 seconds (fresh)
- Returns 10-15 real competitors
- All competitors are relevant (no directories)
- Relevance scores are 75-95%
- Selection interface works smoothly
- Cache speeds up second discovery (42x faster)
- No errors in browser console

---

**Ready to test!** Open: http://localhost:3000/test-ui-discovery 🚀
