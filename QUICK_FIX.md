# Quick Fix for "Failed to fetch quiz questions" Error

## The Problem

The error "Failed to fetch quiz questions" occurs when the Prisma client is out of sync with the database schema. This happens after adding new columns (`questionImageUrl` and `answerImageUrl`).

## Solution

**Stop your dev server** (Ctrl+C), then run:

```bash
npx prisma generate
```

Then **restart your dev server**:

```bash
npm run dev
```

## Why This Happens

1. The database schema was updated (migrations applied)
2. The Prisma client code needs to be regenerated to know about the new columns
3. Without regenerating, Prisma tries to query columns that don't exist in its type definitions

## Verification

After running `npx prisma generate`, you should see:
- Generated Prisma client in `src/generated/prisma/`
- No more "Failed to fetch quiz questions" errors
- Quizzes should load correctly

## If It Still Doesn't Work

1. **Check migration status**:
   ```bash
   npx prisma migrate status
   ```

2. **Apply migrations manually** (if needed):
   ```bash
   npx prisma migrate deploy
   ```

3. **Verify database connection** in `.env.local`:
   ```env
   DATABASE_URL=your-supabase-connection-string
   ```

4. **Check server logs** for the actual error message

