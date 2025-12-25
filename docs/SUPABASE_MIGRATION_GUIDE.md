# Supabase Region Migration Guide

## Overview

Migrating from `ap-southeast-1` (Singapore) to `ca-central-1` (Canada) for better performance.

**Old Project:** Current project (ap-southeast-1) - **KEEP AS BACKUP**  
**New Project:** quiz-companion-west (ca-central-1)

## Prerequisites

1. ✅ New Supabase project created: `quiz-companion-west` in `ca-central-1`
2. ✅ Old project still accessible (for backup)
3. ✅ Access to both Supabase project dashboards

## Step-by-Step Migration

### Step 1: Backup Current Database (Old Project)

1. Go to your **old Supabase project** dashboard
2. Navigate to **SQL Editor**
3. Run the backup script (see `scripts/backup-database.sql`)
4. Or use Supabase's built-in backup feature:
   - Go to **Settings** → **Database**
   - Click **Backup** (if available on your plan)

### Step 2: Get Database URLs

#### Old Project (ap-southeast-1)
1. Go to **Settings** → **Database**
2. Copy the **Connection string** (URI format)
3. Save it as `DATABASE_URL_OLD` in your `.env.local` (for reference)

#### New Project (quiz-companion-west)
1. Go to **Settings** → **Database**
2. Copy the **Connection string** (URI format)
3. This will be your new `DATABASE_URL`

### Step 3: Update Environment Variables

Update your `.env.local` file:

```env
# Old database (backup - keep for reference)
DATABASE_URL_OLD=postgresql://postgres:[PASSWORD]@db.[OLD_PROJECT_REF].supabase.co:5432/postgres

# New database (ca-central-1)
DATABASE_URL=postgresql://postgres:[PASSWORD]@db.[NEW_PROJECT_REF].supabase.co:5432/postgres

# Supabase Client (update these too)
NEXT_PUBLIC_SUPABASE_URL=https://[NEW_PROJECT_REF].supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=[NEW_ANON_KEY]
```

**Important:** Get the new values from your new project's **Settings** → **API**

### Step 4: Run Migrations on New Database

```bash
# Set the new DATABASE_URL temporarily
export DATABASE_URL="postgresql://postgres:[PASSWORD]@db.[NEW_PROJECT_REF].supabase.co:5432/postgres"

# Run all migrations on the new database
npx prisma migrate deploy

# Or if you want to reset and apply fresh:
npx prisma migrate reset
npx prisma migrate deploy
```

### Step 5: Export Data from Old Database

Use the provided script or pg_dump:

```bash
# Using pg_dump (recommended)
pg_dump "postgresql://postgres:[OLD_PASSWORD]@db.[OLD_PROJECT_REF].supabase.co:5432/postgres" \
  --no-owner --no-acl --clean --if-exists \
  --file=backup-$(date +%Y%m%d).sql
```

### Step 6: Import Data to New Database

```bash
# Import the backup
psql "postgresql://postgres:[NEW_PASSWORD]@db.[NEW_PROJECT_REF].supabase.co:5432/postgres" \
  < backup-YYYYMMDD.sql
```

### Step 7: Verify Migration

1. Check data in new database:
   ```bash
   npx prisma studio
   ```
   (Make sure DATABASE_URL points to new database)

2. Test your application:
   ```bash
   npm run dev
   ```

3. Verify:
   - Teachers can log in
   - Quizzes are visible
   - Questions load correctly
   - Performance is improved (should see 60-75% faster queries)

### Step 8: Update Supabase Client (if using)

If you're using Supabase client directly (not just Prisma), update:
- `NEXT_PUBLIC_SUPABASE_URL`
- `NEXT_PUBLIC_SUPABASE_ANON_KEY`

## Using Connection Pooler (Recommended)

For better performance, use Supabase's connection pooler:

**Format:**
```
postgresql://postgres.[PROJECT_REF]:[PASSWORD]@aws-0-ca-central-1.pooler.supabase.com:6543/postgres
```

**Benefits:**
- Better for serverless/edge functions
- Reduced connection overhead
- 20-40% performance improvement

## Rollback Plan (If Needed)

If something goes wrong, you can rollback:

1. Update `.env.local` to use `DATABASE_URL_OLD`
2. Restart your application
3. Everything should work with the old database

## Performance Expectations

### Before Migration (ap-southeast-1)
- Database queries: 1.3-7.6 seconds
- Batch saves: 8 seconds
- Network latency: 200-300ms per query

### After Migration (ca-central-1)
- Database queries: 500ms-2 seconds (60-75% faster)
- Batch saves: 2-3 seconds (70% faster)
- Network latency: 30-60ms per query

## Troubleshooting

### Issue: Migrations fail
- Check DATABASE_URL is correct
- Verify database is accessible
- Check Supabase project is in ca-central-1

### Issue: Data not appearing
- Verify import completed successfully
- Check for errors in psql output
- Verify foreign key constraints

### Issue: Connection errors
- Check connection string format
- Verify password is correct
- Check Supabase project status

## Next Steps After Migration

1. ✅ Test all functionality
2. ✅ Monitor performance logs
3. ✅ Update documentation
4. ✅ Keep old project as backup for 30 days
5. ⚠️ Consider enabling connection pooling

## Notes

- **Keep old project:** Don't delete it yet - keep as backup
- **Test thoroughly:** Verify all features work before switching
- **Monitor logs:** Check `[API]` logs for performance improvements
- **Backup regularly:** Set up automated backups on new project

