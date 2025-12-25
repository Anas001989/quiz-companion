# How to Run Migration Script in Bash

## Option 1: Git Bash (Windows)

If you have Git for Windows installed:

```bash
# Navigate to project directory
cd "c:\Users\Faten\Downloads\River\React Projects\quiz-companion"

# Make script executable
chmod +x scripts/migrate-database.sh

# Run the script
./scripts/migrate-database.sh
```

## Option 2: WSL (Windows Subsystem for Linux)

If you have WSL installed:

```bash
# Navigate to project (from WSL)
cd /mnt/c/Users/Faten/Downloads/River/React\ Projects/quiz-companion

# Make script executable
chmod +x scripts/migrate-database.sh

# Run the script
./scripts/migrate-database.sh
```

## Option 3: Linux/Mac Terminal

```bash
# Navigate to project directory
cd /path/to/quiz-companion

# Make script executable
chmod +x scripts/migrate-database.sh

# Run the script
./scripts/migrate-database.sh
```

## Prerequisites

Before running, make sure:

1. **`.env.local` file exists** with:
   ```env
   DATABASE_URL_OLD=postgresql://postgres:[OLD_PASSWORD]@db.[OLD_REF].supabase.co:5432/postgres
   DATABASE_URL=postgresql://postgres.[NEW_REF]:[NEW_PASSWORD]@aws-0-ca-central-1.pooler.supabase.com:6543/postgres
   ```

2. **PostgreSQL client tools installed:**
   - `pg_dump` - for backup
   - `psql` - for import
   
   Check if installed:
   ```bash
   which pg_dump
   which psql
   ```

   If not installed:
   - **Windows:** Install PostgreSQL from postgresql.org
   - **Mac:** `brew install postgresql`
   - **Linux:** `sudo apt-get install postgresql-client` (Ubuntu/Debian)

## What the Script Does

1. ✅ Checks for `.env.local` file
2. ✅ Loads `DATABASE_URL_OLD` and `DATABASE_URL`
3. ✅ Backs up old database to `.sql` file
4. ✅ Runs migrations on new database
5. ✅ Imports backup to new database

## Troubleshooting

### "Permission denied"
```bash
chmod +x scripts/migrate-database.sh
```

### "pg_dump: command not found"
Install PostgreSQL client tools (see Prerequisites above)

### "psql: command not found"
Install PostgreSQL client tools (see Prerequisites above)

### Script fails at backup step
- Check `DATABASE_URL_OLD` is correct
- Verify old database is accessible
- Try manual backup via Supabase Dashboard

### Script fails at import step
- Check `DATABASE_URL` is correct
- Verify new database is accessible
- Check backup file was created successfully

## Alternative: Manual Process

If the script doesn't work, do it manually:

1. **Run migrations:**
   ```bash
   npx prisma migrate deploy
   ```

2. **Backup old database:**
   - Use Supabase Dashboard → Settings → Database → Backup
   - Or use `pg_dump` manually

3. **Import to new database:**
   - Use Supabase Dashboard → SQL Editor
   - Paste and run the backup SQL

