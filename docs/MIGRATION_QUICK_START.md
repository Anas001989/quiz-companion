# Quick Start: Supabase Migration

## 🎯 Goal
Migrate from `ap-southeast-1` (Singapore) to `ca-central-1` (Canada) for 60-75% performance improvement.

## ⚡ Quick Steps

### 1. Get Connection Strings

**Old Project (ap-southeast-1):**
1. Go to Supabase Dashboard → Your old project
2. Settings → Database
3. Copy "Connection string" (URI format)
4. Save as `DATABASE_URL_OLD`

**New Project (quiz-companion-west):**
1. Go to Supabase Dashboard → quiz-companion-west
2. Settings → Database  
3. Copy "Connection string" (URI format)
4. Save as `DATABASE_URL`

**New Project API Keys:**
1. Settings → API
2. Copy `Project URL` → `NEXT_PUBLIC_SUPABASE_URL`
3. Copy `anon public` key → `NEXT_PUBLIC_SUPABASE_ANON_KEY`

### 2. Update .env.local

Create/update `.env.local`:

```env
# Old database (backup - keep for reference)
DATABASE_URL_OLD=postgresql://postgres:[OLD_PASSWORD]@db.[OLD_REF].supabase.co:5432/postgres

# New database (ca-central-1) - PRIMARY
DATABASE_URL=postgresql://postgres:[NEW_PASSWORD]@db.[NEW_REF].supabase.co:5432/postgres

# Supabase Client (new project)
NEXT_PUBLIC_SUPABASE_URL=https://[NEW_REF].supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=[NEW_ANON_KEY]
```

### 3. Run Migrations on New Database

```bash
# Make sure DATABASE_URL points to new database
npx prisma migrate deploy
```

### 4. Backup & Import Data

**Option A: Using Script (Recommended)**
```bash
# Windows PowerShell
.\scripts\migrate-database.ps1

# Mac/Linux
chmod +x scripts/migrate-database.sh
./scripts/migrate-database.sh
```

**Option B: Manual (Supabase Dashboard)**
1. Old project → SQL Editor → Run backup queries
2. New project → SQL Editor → Paste and run

### 5. Verify Migration

```bash
# Open Prisma Studio (points to DATABASE_URL)
npx prisma studio

# Test your app
npm run dev
```

### 6. Check Performance

Watch terminal for `[API]` logs - should see 60-75% improvement:
- Before: 1.3-7.6s queries
- After: 500ms-2s queries

## ✅ Verification Checklist

- [ ] Migrations run successfully on new database
- [ ] Data imported (check Prisma Studio)
- [ ] App connects to new database
- [ ] Teachers can log in
- [ ] Quizzes load correctly
- [ ] Questions display properly
- [ ] Performance improved (check API logs)
- [ ] Old project still accessible (backup)

## 🔄 Rollback (If Needed)

If something goes wrong:
1. Update `.env.local`: Change `DATABASE_URL` back to `DATABASE_URL_OLD`
2. Restart app: `npm run dev`
3. Everything works with old database

## 📊 Expected Performance

| Operation | Before | After | Improvement |
|-----------|--------|-------|--------------|
| Get Quizzes | 1.8s | 500-800ms | 60-70% |
| Get Questions | 3s | 800ms-1.2s | 60-70% |
| Batch Save | 8s | 2-3s | 70% |
| Single Save | 5.4s | 1.5-2s | 65-70% |

## 🆘 Need Help?

See full guide: `docs/SUPABASE_MIGRATION_GUIDE.md`

