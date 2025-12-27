# How to Regenerate Prisma Client

## The Problem

You're seeing this error:
```
Invalid `prisma.quiz.findUnique()` invocation
```

This happens because:
1. The database schema was updated (new columns added)
2. The Prisma client code hasn't been regenerated
3. Prisma tries to query fields that don't exist in its type definitions

## Solution

### Step 1: Stop the Dev Server
**IMPORTANT**: You MUST stop the dev server first!

1. Go to the terminal where `npm run dev` is running
2. Press `Ctrl+C` to stop it
3. Wait for it to fully stop

### Step 2: Regenerate Prisma Client
Run this command:

```bash
npx prisma generate
```

You should see output like:
```
✔ Generated Prisma Client to .\src\generated\prisma in XXXms
```

### Step 3: Restart Dev Server
```bash
npm run dev
```

## Why This Is Necessary

When you add new fields to the Prisma schema:
1. ✅ Migration creates the database columns
2. ❌ Prisma client code is NOT automatically regenerated
3. ❌ You must manually run `npx prisma generate`

The Prisma client is TypeScript code that needs to match your schema. Without regenerating, it doesn't know about new fields like `questionImageUrl` and `answerImageUrl`.

## Verification

After regenerating, the error should disappear and quizzes should load correctly.

## If It Still Fails

1. **Check if dev server is really stopped**:
   - Look for any `node` processes still running
   - Kill them if needed: `taskkill /F /IM node.exe` (Windows)

2. **Clear Prisma cache**:
   ```bash
   Remove-Item -Recurse -Force src\generated\prisma
   npx prisma generate
   ```

3. **Verify schema is correct**:
   ```bash
   npx prisma validate
   ```

4. **Check migration status**:
   ```bash
   npx prisma migrate status
   ```

