# Quick Supabase Connection Pooling Setup

## ⚡ Why This Matters
Connection pooling can make your app **2-5x faster** by reusing database connections instead of creating new ones for each query.

## 📋 What You Need to Do (5 minutes)

### Step 1: Get Your Connection Pooler URL

**Option A: Find Connection String in Supabase Dashboard**

1. Go to: https://supabase.com/dashboard
2. Select your project
3. Click **Settings** → **Database**
4. Look for **Connection string** section (above Connection Pooling)
5. Copy your current `DATABASE_URL` (port **5432** - direct connection)

**Option B: Use Your Existing DATABASE_URL (Easier)**

If you already have `DATABASE_URL` in your `.env` file, we can just modify it! See Step 2 below.

### Step 2: Update Your `.env` File

**Simple Method: Just modify your existing `DATABASE_URL`**

1. Open your `.env` file
2. Find your current `DATABASE_URL` line
3. Make these changes:

**Example - Before (Direct Connection - Slow):**
```env
DATABASE_URL="postgresql://postgres.xxxxx:yourpassword@aws-0-us-east-1.pooler.supabase.com:5432/postgres"
```

**Example - After (Pooler Connection - Fast):**
```env
DATABASE_URL="postgresql://postgres.xxxxx:yourpassword@aws-0-us-east-1.pooler.supabase.com:6543/postgres?pgbouncer=true&connection_limit=10"
```

**What to Change:**
1. **Port**: Change `5432` → `6543` 
2. **Add parameters**: Add `?pgbouncer=true&connection_limit=10` at the very end

**Important Notes:**
- If your URL has existing parameters like `?sslmode=require`, remove them and replace with `?pgbouncer=true&connection_limit=10`
- If it has NO parameters, just add `?pgbouncer=true&connection_limit=10` at the end
- Keep everything else exactly the same (hostname, username, password, database name)

### Step 3: Restart Your Dev Server

After updating `.env`:
```bash
# Stop your server (Ctrl+C)
npm run dev
```

### Step 4: Test It

1. Click around your app (dashboard, quizzes, etc.)
2. Check if queries feel faster
3. Monitor Supabase dashboard → Database → Connection Pooler to see active connections

## 🎯 Expected Results

- **Before**: Queries take 1-3 seconds
- **After**: Queries take 200-500ms (2-5x faster!)

## ⚠️ Important Notes

### For Migrations Only

If you run `npx prisma migrate dev`, you might need to use the direct connection (port 5432) temporarily, or set up a separate `DIRECT_URL`:

1. In Supabase dashboard, copy the **Direct connection** (port 5432)
2. Add to `.env`:
   ```env
   DATABASE_URL="postgresql://...6543...?pgbouncer=true"  # For app
   DIRECT_URL="postgresql://...5432..."                    # For migrations
   ```
3. Update `prisma/schema.prisma`:
   ```prisma
   datasource db {
     provider = "postgresql"
     url      = env("DATABASE_URL")
     directUrl = env("DIRECT_URL")  // Add this line
   }
   ```

### Database Status Check

Free tier databases can pause after 1 week of inactivity:
- Go to Supabase Dashboard → Database
- If paused, click "Restore" to wake it up

## 🔍 Troubleshooting

**Still slow after setup?**
- Verify port is `6543` (not `5432`)
- Check if database is paused (wake it up)
- Restart dev server after `.env` changes
- Check Supabase region matches your location

**Connection errors?**
- Reduce `connection_limit=10` to `connection_limit=5` if you hit limits
- Free tier has ~60 max connections

## 📊 Performance Monitoring

Check your Supabase dashboard:
- **Database** → **Connection Pooler** tab
- See active connections and query stats
- Monitor for any connection errors

---

**Need help?** Check `docs/PERFORMANCE_OPTIMIZATION.md` for detailed information.

