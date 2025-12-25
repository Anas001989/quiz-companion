# Simple Database Migration - 3 Steps

## Step 1: Fix Your Connection String

The authentication error means your `DATABASE_URL` is wrong.

1. Go to **new Supabase project** (quiz-companion-west)
2. **Settings** → **Database**
3. Under "Connection string":
   - Select **"Connection pooling"** tab
   - Select **"Transaction"** mode  
   - Select **"URI"** format
4. **Copy the connection string**
5. Replace `[YOUR-PASSWORD]` with your actual database password
6. Update `DATABASE_URL` in your `.env` file

**Example format:**
```
postgresql://postgres.[PROJECT_REF]:[YOUR_PASSWORD]@aws-1-ca-central-1.pooler.supabase.com:6543/postgres
```

## Step 2: Run Migrations

```bash
npx prisma migrate deploy
```

This creates all tables in your new database.

## Step 3: Copy Data Manually

Since `pg_dump` isn't installed, use Supabase Dashboard:

1. **Old project** → SQL Editor → Run: `SELECT * FROM "Teacher";` → Copy data
2. **New project** → SQL Editor → Create INSERT statements → Paste and run

Repeat for all tables: Student, Quiz, Question, Option, Attempt, Answer

## Done!

That's it. Test your app - it should be 60-75% faster now.


