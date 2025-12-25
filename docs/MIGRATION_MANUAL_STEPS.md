# Manual Migration Steps (If pg_dump Not Available)

Since `pg_dump` is not installed, here's how to migrate manually using Supabase Dashboard.

## Option 1: Use Supabase Dashboard (Easiest)

### Step 1: Run Migrations on New Database

```bash
# Make sure DATABASE_URL points to new database in .env
npx prisma migrate deploy
```

### Step 2: Export Data from Old Database

1. Go to **Old Supabase Project** (ap-southeast-1)
2. Navigate to **SQL Editor**
3. Run this query to export all data:

```sql
-- Export Teachers
SELECT * FROM "Teacher";

-- Export Students  
SELECT * FROM "Student";

-- Export Quizzes
SELECT * FROM "Quiz";

-- Export Questions
SELECT * FROM "Question";

-- Export Options
SELECT * FROM "Option";

-- Export Attempts
SELECT * FROM "Attempt";

-- Export Answers
SELECT * FROM "Answer";
```

4. Copy the results for each table

### Step 3: Import Data to New Database

1. Go to **New Supabase Project** (quiz-companion-west, ca-central-1)
2. Navigate to **SQL Editor**
3. For each table, run INSERT statements with your data

**Example for Teachers:**
```sql
INSERT INTO "Teacher" (id, email, name, "createdAt")
VALUES 
  ('id1', 'email1@example.com', 'Name1', '2024-01-01'),
  ('id2', 'email2@example.com', 'Name2', '2024-01-02');
```

**Important:** Insert in this order to respect foreign keys:
1. Teachers
2. Students
3. Quizzes
4. Questions
5. Options
6. Attempts
7. Answers

## Option 2: Install PostgreSQL Tools

### Windows

1. Download PostgreSQL from: https://www.postgresql.org/download/windows/
2. Install (includes `pg_dump` and `psql`)
3. Add to PATH or use full path:
   ```
   C:\Program Files\PostgreSQL\15\bin\pg_dump.exe
   ```

### Mac

```bash
brew install postgresql
```

### Linux (Ubuntu/Debian)

```bash
sudo apt-get install postgresql-client
```

Then run the script again:
```bash
./scripts/migrate-database.sh
```

## Option 3: Use Supabase CLI (Advanced)

If you have Supabase CLI installed:

```bash
# Export from old project
supabase db dump --project-ref [OLD_REF] > backup.sql

# Import to new project
supabase db push --project-ref [NEW_REF] < backup.sql
```

## Recommended: Use Supabase Dashboard

For most users, **Option 1 (Supabase Dashboard)** is the easiest and doesn't require installing anything.

## After Migration

1. Verify data:
   ```bash
   npx prisma studio
   ```

2. Test your app:
   ```bash
   npm run dev
   ```

3. Check performance - should see 60-75% improvement!


