# Fix: "prepared statement already exists" Error

## Quick Fix (5 minutes)

You're getting this error because you're using **PgBouncer in Transaction mode**, which doesn't support prepared statements that Prisma requires.

### Step-by-Step Solution

1. **Go to Supabase Dashboard**
   - Visit: https://supabase.com/dashboard
   - Select your project

2. **Navigate to Database Settings**
   - Click **Settings** (gear icon in left sidebar)
   - Click **Database** in the settings menu

3. **Find Connection Pooling Section**
   - Scroll down to **"Connection Pooling"** section
   - You'll see multiple connection modes

4. **Select Session Mode** ⚠️ **CRITICAL STEP**
   - Look for tabs or dropdown: **Transaction**, **Session**, **Statement**
   - Click on **"Session"** mode (NOT Transaction!)
   - Transaction mode = ❌ Doesn't work with Prisma
   - Session mode = ✅ Works with Prisma

5. **Copy the Connection String**
   - The connection string should look like:
     ```
     postgresql://postgres.[PROJECT_REF]:[PASSWORD]@aws-0-[REGION].pooler.supabase.com:6543/postgres?pgbouncer=true
     ```
   - Notice: Port is **6543** (not 5432)
   - Notice: Has `?pgbouncer=true` parameter

6. **Update Your `.env.local` File**
   - Open `.env.local` in your project root
   - Find the `DATABASE_URL` line
   - Replace it with the Session mode connection string you just copied
   - Example:
     ```env
     DATABASE_URL="postgresql://postgres.xxxxx:yourpassword@aws-0-us-east-1.pooler.supabase.com:6543/postgres?pgbouncer=true"
     ```

7. **Restart Your Dev Server** ⚠️ **REQUIRED**
   - Stop your server (Ctrl+C in terminal)
   - Start it again: `npm run dev`
   - **Important**: The Prisma client caches the connection, so you MUST restart

8. **Test It**
   - Try loading the dashboard again
   - The error should be gone!

## Why This Happens

- **Prisma uses prepared statements** for better performance and security
- **PgBouncer Transaction mode** doesn't support prepared statements
- **PgBouncer Session mode** DOES support prepared statements
- Both modes provide connection pooling, but Session mode is required for Prisma

## Alternative: Use Direct Connection (Not Recommended)

If you can't use Session mode for some reason, you can use the direct connection (port 5432) instead of the pooler:

```env
DATABASE_URL="postgresql://postgres:[PASSWORD]@[HOST]:5432/postgres"
```

**Downsides:**
- No connection pooling (slower)
- More connection errors under load
- Less efficient for serverless functions

## Still Having Issues?

1. **Verify your connection string:**
   - Should have port `6543` (pooler), not `5432` (direct)
   - Should have `?pgbouncer=true` parameter
   - Should be from **Session mode**, not Transaction mode

2. **Check you restarted the server:**
   - The Prisma client is cached, so changes to `.env.local` require a restart
   - Stop the server completely (Ctrl+C)
   - Start it again (`npm run dev`)

3. **Clear Prisma cache:**
   ```bash
   npx prisma generate
   ```

4. **Verify in Supabase Dashboard:**
   - Go to Settings → Database → Connection Pooling
   - Make sure you're looking at **Session mode** connection string
   - The URL should have port 6543

## Visual Guide

In Supabase Dashboard, you should see something like:

```
Connection Pooling
┌─────────────┬─────────────┬─────────────┐
│ Transaction │   Session   │  Statement  │
│     ❌      │     ✅      │      ❌     │
└─────────────┴─────────────┴─────────────┘
              ↑
        Click this one!
```

## Need More Help?

- Check `docs/FIX_PRISMA_CONNECTION.md` for more details
- See Supabase docs: https://supabase.com/docs/guides/database/connecting-to-postgres#connection-pooler

