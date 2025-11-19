# How to Check API Performance Logs

## Quick Start

### 1. Start Your Development Server

```bash
npm run dev
```

### 2. Watch the Terminal Output

All API requests will now log their timing information. Look for lines starting with `[API]`:

```
[API] GET /api/teacher/quiz/clxxx123/questions - 45ms
[API] POST /api/teacher/quiz/clxxx123/questions (BATCH: 10 questions) - 120ms
[API] POST /api/teacher/quiz/clxxx123/generate-questions - 3500ms
```

## Understanding the Logs

### Log Format

```
[API] <METHOD> <ENDPOINT> <DETAILS> - <DURATION>ms
```

### Examples

**Single Question Fetch:**
```
[API] GET /api/teacher/quiz/clxxx123/questions - 45ms
```
- ✅ **45ms** - Excellent performance

**Batch Question Save:**
```
[API] POST /api/teacher/quiz/clxxx123/questions (BATCH: 10 questions) - 120ms
```
- ✅ **120ms** for 10 questions - Excellent (previously would be 10 separate calls)

**AI Question Generation:**
```
[API] POST /api/teacher/quiz/clxxx123/generate-questions - 3500ms
```
- ⚠️ **3500ms** - This is normal for AI generation (OpenAI API dependent)

**Error Logs:**
```
[API] GET /api/teacher/quiz/clxxx123/questions - ERROR after 500ms: [error details]
```

## Performance Benchmarks

| Duration | Status | Meaning |
|----------|--------|---------|
| < 200ms | ✅ Excellent | Very fast, optimal performance |
| 200-500ms | ⚠️ Good | Acceptable, may be network latency |
| 500-1000ms | ⚠️ Acceptable | Slow, but functional |
| > 1000ms | ❌ Needs Improvement | Too slow, investigate |

## Testing Specific Scenarios

### Test 1: Batch Question Saving (Before vs After)

**Before Optimization:**
- You would see 10 separate API calls:
```
[API] POST /api/teacher/quiz/clxxx123/questions (SINGLE) - 150ms
[API] POST /api/teacher/quiz/clxxx123/questions (SINGLE) - 145ms
[API] POST /api/teacher/quiz/clxxx123/questions (SINGLE) - 152ms
... (7 more times)
```
- Total: ~1500ms for 10 questions

**After Optimization:**
- You should see 1 batch API call:
```
[API] POST /api/teacher/quiz/clxxx123/questions (BATCH: 10 questions) - 120ms
```
- Total: ~120ms for 10 questions
- **Improvement: ~92% faster!**

### Test 2: Check for Duplicate Calls

**Before Fix:**
- You might see the same endpoint called twice:
```
[API] GET /api/teacher/quiz/clxxx123/questions - 45ms
[API] GET /api/teacher/quiz/clxxx123/questions - 48ms
```

**After Fix:**
- Should only see one call per page load:
```
[API] GET /api/teacher/quiz/clxxx123/questions - 45ms
```

## How to Test Performance Improvements

### Step 1: Generate AI Questions

1. Go to your teacher dashboard
2. Open a quiz
3. Click "🤖 Generate Questions With AI"
4. Generate 10 questions
5. Click "Save Questions"

**Watch the terminal** - You should see:
```
[API] POST /api/teacher/quiz/[quizId]/generate-questions - Starting...
[API] POST /api/teacher/quiz/[quizId]/generate-questions - Completed in 3500ms (Generated 10 questions)
[API] POST /api/teacher/quiz/[quizId]/questions (BATCH: 10 questions) - 120ms
```

**Key Point:** Notice it's **ONE** batch call, not 10 separate calls!

### Step 2: Load Quiz Questions

1. Navigate to a quiz questions page
2. **Watch the terminal** - You should see:
```
[API] GET /api/teacher/quiz/[quizId]/questions - 45ms
```

**Key Point:** Should only see **ONE** call, not multiple duplicates.

### Step 3: Load Teacher Dashboard

1. Go to `/teacher/dashboard?teacherId=YOUR_ID`
2. **Watch the terminal** - You should see:
```
[API] GET /api/teacher/quizzes?teacherId=YOUR_ID - 120ms
```

**Key Point:** Should only see **ONE** call per page load.

## Filtering Logs

### On Windows (PowerShell)

```powershell
# Filter only API logs
npm run dev | Select-String "\[API\]"
```

### On Mac/Linux

```bash
# Filter only API logs
npm run dev | grep "\[API\]"
```

## Common Issues to Look For

### 1. Slow Database Queries (>500ms)

**Symptom:**
```
[API] GET /api/teacher/quiz/[quizId]/questions - 800ms
```

**Possible Causes:**
- Supabase region is far away (your case: ap-southeast-1 from Canada)
- Database connection pooling not enabled
- Missing database indexes

**Solution:**
- Consider migrating Supabase to a closer region
- Enable connection pooling
- Check database indexes

### 2. Duplicate API Calls

**Symptom:**
```
[API] GET /api/teacher/quiz/[quizId]/questions - 45ms
[API] GET /api/teacher/quiz/[quizId]/questions - 48ms
```

**Solution:**
- Check React useEffect dependencies
- Ensure proper dependency arrays
- Use React DevTools to identify re-renders

### 3. Batch Operations Still Using Single Calls

**Symptom:**
```
[API] POST /api/teacher/quiz/[quizId]/questions (SINGLE) - 150ms
[API] POST /api/teacher/quiz/[quizId]/questions (SINGLE) - 145ms
... (multiple times)
```

**Solution:**
- Ensure frontend is sending `{ questions: [...] }` format
- Check that batch detection is working in API

## Performance Monitoring Tips

1. **Baseline Measurement:** Note your current average response times
2. **Compare Before/After:** Test the same operations before and after optimizations
3. **Monitor Patterns:** Look for consistently slow endpoints
4. **Network vs Database:** 
   - Fast endpoints (<200ms) = Good database performance
   - Slow endpoints (>500ms) = Likely network/database latency

## Expected Performance (Your Setup)

Given your current setup:
- **Supabase Region:** ap-southeast-1 (Singapore)
- **Your Location:** Surrey, BC, Canada
- **Expected Latency:** 150-300ms per database query

**Normal Performance:**
- Simple queries: 200-400ms ✅
- Complex queries: 300-600ms ⚠️
- Batch operations: 400-800ms ⚠️

**With Region Change (us-west-2):**
- Simple queries: 80-150ms ✅✅
- Complex queries: 100-250ms ✅
- Batch operations: 150-300ms ✅

## Next Steps

1. ✅ Monitor your terminal logs during normal usage
2. ✅ Test the batch question saving feature
3. ✅ Verify no duplicate API calls
4. ⏳ Consider Supabase region migration for better performance
5. ⏳ Enable connection pooling if not already done

