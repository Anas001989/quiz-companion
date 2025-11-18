# Quick Connection Pooler Setup (Simplified)

Since you're on the free tier and couldn't find the pooler connection string in the dashboard, here's the easiest way:

## 🚀 Quick Method (2 minutes)

### Step 1: Open Your `.env` File

Find your current `DATABASE_URL` line. It probably looks like one of these:

```env
DATABASE_URL="postgresql://postgres:[PASSWORD]@db.xxxxx.supabase.co:5432/postgres"
```

OR

```env
DATABASE_URL="postgresql://postgres.xxxxx:[PASSWORD]@aws-0-xxx.pooler.supabase.com:5432/postgres"
```

### Step 2: Make These Simple Changes

**Just do TWO things:**

1. **Change the port**: `5432` → `6543`
2. **Add at the end**: `?pgbouncer=true&connection_limit=10`

### Example Transformation:

**BEFORE (Direct - Slow):**
```env
DATABASE_URL="postgresql://postgres.xxxxx:password@aws-0-us-east-1.pooler.supabase.com:5432/postgres"
```

**AFTER (Pooled - Fast):**
```env
DATABASE_URL="postgresql://postgres.xxxxx:password@aws-0-us-east-1.pooler.supabase.com:6543/postgres?pgbouncer=true&connection_limit=10"
```

**Key Changes:**
- Port changed: `5432` → `6543` ✅
- Added: `?pgbouncer=true&connection_limit=10` ✅

### Step 3: Restart Server

```bash
# Stop server (Ctrl+C)
npm run dev
```

### Step 4: Test

Click around your app - queries should be **much faster** now!

## ⚠️ Important Notes

1. **If your URL has other parameters** (like `?sslmode=require`), remove them and replace with `?pgbouncer=true&connection_limit=10`

2. **For Prisma Migrations**: 
   - The pooler (port 6543) works for queries
   - For `prisma migrate dev`, you might need to temporarily use port 5432 (direct connection)
   - Or set up `DIRECT_URL` as shown in `docs/SUPABASE_SETUP.md`

3. **If connection fails**:
   - Try without `&connection_limit=10`: `?pgbouncer=true`
   - Or reduce limit: `&connection_limit=5`
   - Verify port is `6543` (not `5432`)

## 🎯 Expected Results

- **Before**: 1-3 seconds per query
- **After**: 200-500ms per query (2-5x faster!)

---

**That's it!** Just change the port and add the parameters. Your app should be much faster now! 🚀

