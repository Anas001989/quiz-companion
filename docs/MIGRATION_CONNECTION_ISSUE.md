# Migration Connection Issue - Solution

## Problem

**Error:** `Timed out trying to acquire a postgres advisory lock`

**Cause:** Connection poolers (port 6543) don't support Prisma migrations. Migrations need advisory locks which poolers don't allow.

## Solution: Use Direct Connection for Migrations

You need **TWO** connection strings:

1. **Direct connection** (port 5432) - For migrations only
2. **Pooler connection** (port 6543) - For your app (faster)

### Step 1: Get Direct Connection String

1. Go to Supabase Dashboard → Settings → Database
2. Under "Connection string":
   - Select **"Direct connection"** (NOT Connection pooling)
   - Select **"URI"** format
3. Copy the connection string
4. This will have port **5432** (not 6543)

### Step 2: Update .env for Migration

Temporarily use direct connection for migrations:

```env
# For migrations (direct connection - port 5432)
DATABASE_URL=postgresql://postgres:[PASSWORD]@db.[PROJECT_REF].supabase.co:5432/postgres

# For app (pooler - port 6543) - Use this after migration
# DATABASE_URL=postgresql://postgres.[PROJECT_REF]:[PASSWORD]@aws-1-ca-central-1.pooler.supabase.com:6543/postgres
```

### Step 3: Run Migration

```bash
npx prisma migrate deploy
```

### Step 4: Switch Back to Pooler

After migration succeeds, switch back to pooler for better performance:

```env
# For app (pooler - port 6543) - Better performance
DATABASE_URL=postgresql://postgres.[PROJECT_REF]:[PASSWORD]@aws-1-ca-central-1.pooler.supabase.com:6543/postgres
```

## Quick Summary

- **Migrations:** Use direct connection (port 5432)
- **App runtime:** Use pooler (port 6543) for better performance


