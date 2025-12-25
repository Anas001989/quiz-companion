# Supabase Migration Summary

## ✅ What's Ready

I've created migration guides and scripts to help you migrate from `ap-southeast-1` to `ca-central-1`:

### 📚 Documentation Created

1. **`docs/SUPABASE_MIGRATION_GUIDE.md`** - Complete step-by-step guide
2. **`docs/MIGRATION_QUICK_START.md`** - Quick reference for migration
3. **`scripts/migrate-database.ps1`** - PowerShell script for Windows
4. **`scripts/migrate-database.sh`** - Bash script for Mac/Linux
5. **`scripts/verify-migration.sql`** - SQL queries to verify migration
6. **`scripts/backup-database.sql`** - Backup queries

## 🚀 Next Steps

### Step 1: Get Your Connection Strings

**From Old Project (ap-southeast-1):**
1. Supabase Dashboard → Your old project
2. Settings → Database
3. Copy "Connection string" (URI format)
4. This is your `DATABASE_URL_OLD`

**From New Project (quiz-companion-west):**
1. Supabase Dashboard → quiz-companion-west
2. Settings → Database
3. Copy "Connection string" (URI format)
4. This is your new `DATABASE_URL`

**From New Project API Settings:**
1. Settings → API
2. Copy "Project URL" → `NEXT_PUBLIC_SUPABASE_URL`
3. Copy "anon public" key → `NEXT_PUBLIC_SUPABASE_ANON_KEY`

### Step 2: Update .env.local

Create or update your `.env.local` file:

```env
# Old database (backup - keep for reference)
DATABASE_URL_OLD=postgresql://postgres:[OLD_PASSWORD]@db.[OLD_REF].supabase.co:5432/postgres

# New database (ca-central-1) - PRIMARY
DATABASE_URL=postgresql://postgres:[NEW_PASSWORD]@db.[NEW_REF].supabase.co:5432/postgres

# Supabase Client (new project)
NEXT_PUBLIC_SUPABASE_URL=https://[NEW_REF].supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=[NEW_ANON_KEY]
```

### Step 3: Run Migrations

```bash
# This will create all tables in your new database
npx prisma migrate deploy
```

### Step 4: Backup & Import Data

**Option A: Use the Script (Easiest)**

```powershell
# Windows PowerShell
.\scripts\migrate-database.ps1
```

The script will:
1. Backup your old database
2. Run migrations on new database
3. Import all data

**Option B: Manual Process**

1. **Backup old database:**
   - Use Supabase dashboard backup feature, OR
   - Use `pg_dump` command (see full guide)

2. **Import to new database:**
   - Use Supabase SQL Editor, OR
   - Use `psql` command (see full guide)

### Step 5: Verify & Test

```bash
# Open Prisma Studio to view data
npx prisma studio

# Start your app
npm run dev

# Check terminal for [API] logs - should see faster queries!
```

## 📊 Expected Results

After migration, you should see:

| Operation | Current | After Migration | Improvement |
|-----------|---------|-----------------|-------------|
| Get Quizzes | 1.8s | 500-800ms | 60-70% faster |
| Get Questions | 3s | 800ms-1.2s | 60-70% faster |
| Batch Save | 8s | 2-3s | 70% faster |
| Single Save | 5.4s | 1.5-2s | 65-70% faster |

## 🔄 Rollback Plan

If something goes wrong:
1. Update `.env.local`: Change `DATABASE_URL` to `DATABASE_URL_OLD`
2. Restart app
3. Everything works with old database

## 📝 Important Notes

- ✅ **Keep old project:** Don't delete it - keep as backup
- ✅ **Test thoroughly:** Verify all features work
- ✅ **Monitor logs:** Check `[API]` logs for performance
- ⚠️ **Connection pooling:** Consider using pooler URL for even better performance

## 🆘 Need Help?

- Full guide: `docs/SUPABASE_MIGRATION_GUIDE.md`
- Quick start: `docs/MIGRATION_QUICK_START.md`
- Verify migration: Run `scripts/verify-migration.sql` in SQL Editor

## 🎯 Ready to Start?

1. Get your connection strings from both Supabase projects
2. Update `.env.local` with new values
3. Run `npx prisma migrate deploy`
4. Run the migration script or import data manually
5. Test and verify!

Good luck with the migration! 🚀

