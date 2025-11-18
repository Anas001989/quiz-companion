# Performance Optimization Guide

This guide explains the performance optimizations implemented and how to configure Supabase connection pooling for maximum performance.

## Implemented Optimizations

### 1. Database Indexes ✅
All critical fields are indexed:
- `Quiz`: `teacherId`, `createdAt`
- `Question`: `quizId`
- `Option`: `questionId`
- `Attempt`: `quizId`, `studentId`, `createdAt`
- `Answer`: `attemptId`, `questionId`

### 2. Query Optimizations ✅
- **Using `_count` instead of loading records**: The quizzes list now uses `_count` to get question/attempt counts without loading all records
- **Select specific fields**: Only fetching needed fields from database
- **Optimized includes**: Reduced unnecessary data loading

### 3. Prisma Client Configuration ✅
- Optimized logging (only errors in production)
- Connection pooling ready (requires Supabase pooler URL)

## Supabase Connection Pooling Setup

**This is the MOST IMPORTANT step for performance!** Connection pooling dramatically improves query speed by reusing database connections.

### Step 1: Get Your Connection Pooler URL

1. Go to your Supabase project dashboard: https://supabase.com/dashboard
2. Navigate to **Settings** → **Database**
3. Scroll down to **Connection Pooling** section
4. You'll see multiple connection strings. You need the **Transaction** pooler:
   - **Connection String**: `postgresql://[user]:[password]@[host]:6543/postgres?pgbouncer=true`

### Step 2: Update Your `.env` File

**Option A: Use Pooler for All Connections (Recommended)**

Replace your current `DATABASE_URL` with the pooler connection string:

```env
# Old direct connection (remove this)
# DATABASE_URL="postgresql://user:pass@host:5432/postgres"

# New pooler connection (use this)
DATABASE_URL="postgresql://user:pass@host:6543/postgres?pgbouncer=true&connection_limit=10"
```

**Option B: Use Separate URLs (Advanced)**

You can keep both URLs and use pooler for app, direct for migrations:

```env
# For application (pooled connections)
DATABASE_URL="postgresql://user:pass@host:6543/postgres?pgbouncer=true&connection_limit=10"

# For migrations (direct connection)
DIRECT_URL="postgresql://user:pass@host:5432/postgres"
```

Then update `prisma/schema.prisma`:

```prisma
datasource db {
  provider = "postgresql"
  url      = env("DATABASE_URL")
  directUrl = env("DIRECT_URL")  // For migrations only
}
```

### Step 3: Verify Connection Pooler

After updating your `.env`:
1. Restart your dev server
2. Test the connection - queries should be significantly faster
3. Check Supabase dashboard for connection pool metrics

## Expected Performance Improvements

With connection pooling enabled, you should see:
- **50-80% faster query times** for most operations
- **Reduced connection errors** under load
- **Better handling of concurrent requests**

## Additional Performance Tips

### 1. Check Database Status
- Free tier databases pause after 1 week of inactivity
- Wake up paused databases in Supabase dashboard if needed

### 2. Monitor Query Performance
- Check Supabase dashboard for slow queries
- Use Prisma query logging in development to identify bottlenecks

### 3. Consider Paid Tier Benefits
Paid tiers provide:
- No database pausing
- Better CPU resources
- More concurrent connections
- Better network performance

### 4. Further Optimizations (Future)
- Implement Redis caching for frequently accessed data
- Add API response caching headers
- Use Prisma Accelerate for global edge caching
- Implement pagination for large result sets

## Troubleshooting

### Still Slow After Pooler Setup?
1. Verify pooler URL is correct (port 6543, not 5432)
2. Check if database is paused (wake it up in dashboard)
3. Restart dev server after changing `.env`
4. Check Supabase region matches your location

### Connection Errors?
- Pooler has connection limits (10-100 depending on plan)
- Free tier: ~60 connections max
- Reduce `connection_limit` in connection string if needed

## Performance Monitoring

To track improvements:
1. **Before optimization**: Note query times in browser DevTools
2. **After pooler setup**: Compare query times
3. **Supabase Dashboard**: Monitor connection pool metrics

Expected improvement: **2-5x faster** for most operations.

