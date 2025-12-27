# Troubleshooting Guide

## "Quiz Not Found" Error

If you're seeing a "Quiz not found" error, here are the steps to resolve it:

### 1. Check if the Quiz Exists

The error usually means the quiz ID in the URL doesn't match any quiz in your database. This can happen if:

- The quiz was deleted
- You're using an incorrect quiz ID
- The database connection is failing

### 2. Verify Database Connection

Check your `.env.local` file has the correct database URL:

```env
DATABASE_URL=your-supabase-connection-string
```

### 3. Check Migration Status

Run this command to verify all migrations are applied:

```bash
npx prisma migrate status
```

If migrations are pending, apply them:

```bash
npx prisma migrate deploy
```

### 4. Regenerate Prisma Client

After schema changes, regenerate the Prisma client:

```bash
# Stop your dev server first, then:
npx prisma generate
```

### 5. Check Browser Console

Open your browser's developer console (F12) and check:
- Network tab: Look for the API request to `/api/teacher/quiz/[quizId]/questions`
- Console tab: Check for any error messages

### 6. Verify Quiz ID

1. Go to your teacher dashboard
2. Check the quiz list - do you see your quizzes?
3. Click on a quiz from the dashboard (don't manually type the URL)
4. This ensures you're using a valid quiz ID

### 7. Common Solutions

**Solution 1: Create a New Quiz**
- If old quizzes are causing issues, create a new quiz from the dashboard
- This ensures it has the latest schema

**Solution 2: Check Database Directly**
- Connect to your Supabase database
- Run: `SELECT id, title FROM "Quiz" LIMIT 10;`
- Verify the quiz IDs match what you're using in the URL

**Solution 3: Clear Browser Cache**
- Sometimes cached data can cause issues
- Try a hard refresh (Ctrl+Shift+R or Cmd+Shift+R)
- Or clear browser cache

### 8. Still Not Working?

If none of the above works:

1. **Check Server Logs**: Look at your terminal where the dev server is running for error messages
2. **Check API Response**: In browser DevTools → Network tab, click on the failed request and check the Response tab
3. **Verify Environment Variables**: Make sure all required env vars are set correctly

## Next.js Portal Positioning Issue

If you see positioning issues with modals (nextjs-portal), this has been fixed in `src/styles/globals.css`. 

If the issue persists:
1. Hard refresh your browser (Ctrl+Shift+R)
2. Clear browser cache
3. Restart your dev server

## Database Schema Issues

If you're getting database errors:

1. **Check Migration Status**:
   ```bash
   npx prisma migrate status
   ```

2. **Apply Pending Migrations**:
   ```bash
   npx prisma migrate deploy
   ```

3. **Reset Database (⚠️ WARNING: Deletes all data)**:
   ```bash
   npx prisma migrate reset
   ```

4. **Regenerate Prisma Client**:
   ```bash
   npx prisma generate
   ```

## Image Upload Issues

If image uploads aren't working:

1. **Check Supabase Storage Buckets**:
   - Verify `question-images` and `answer-images` buckets exist
   - Check they're set to public
   - See `docs/SETUP_IMAGE_STORAGE.md` for setup instructions

2. **Check Environment Variables**:
   ```env
   NEXT_PUBLIC_SUPABASE_URL=your-url
   NEXT_PUBLIC_SUPABASE_ANON_KEY=your-key
   ```

3. **Check Browser Console**: Look for CORS or permission errors

4. **Verify File Size**: Images must be under 5MB

## Getting Help

If you're still experiencing issues:

1. Check the browser console for errors
2. Check the server terminal for errors
3. Verify all environment variables are set
4. Ensure all migrations are applied
5. Try creating a new quiz to test if it's a data issue

