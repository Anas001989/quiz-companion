# Fix "Bucket Does Not Exist" Error

## The Problem

Your test endpoint shows `buckets: []`, which means:
- Either the buckets don't exist in Supabase
- OR RLS policies prevent listing buckets (even if they exist)

## Solution Steps

### Step 1: Verify Buckets Exist in Supabase

1. Go to [Supabase Dashboard](https://supabase.com/dashboard)
2. Select your project
3. Click **Storage** in the left sidebar
4. **Check if you see these buckets:**
   - `question-images`
   - `answer-images`

**If you DON'T see them:**
- Click **"New bucket"** button
- Create `question-images` (set to **Public**)
- Create `answer-images` (set to **Public**)

**If you DO see them:**
- Continue to Step 2

### Step 2: Check Bucket Settings

For each bucket (`question-images` and `answer-images`):

1. Click on the bucket name
2. Check that it shows **"Public"** badge
3. Go to **Policies** tab
4. You should see policies that allow:
   - **SELECT** (read) - for public access
   - **INSERT** (upload) - for authenticated users

**If policies are missing**, create them:

**Policy 1: Public Read**
```sql
CREATE POLICY "Public read access" ON storage.objects
FOR SELECT
TO public
USING (bucket_id = 'question-images');
```

**Policy 2: Allow Uploads**
```sql
CREATE POLICY "Allow authenticated uploads" ON storage.objects
FOR INSERT
TO authenticated
WITH CHECK (bucket_id = 'question-images');
```

Repeat for `answer-images` bucket.

### Step 3: Restart Dev Server

The code has been updated to handle RLS issues. **You must restart your dev server:**

1. Stop the current server (Ctrl+C in terminal)
2. Run: `npm run dev`
3. Wait for it to start

### Step 4: Test Again

1. Visit: `http://localhost:3000/api/test-storage`
2. Try uploading an image in your app

## Why This Happens

Supabase RLS (Row Level Security) can prevent the `listBuckets()` API from working, even if buckets exist. The updated code now:
- ✅ Tries to upload even if listing fails
- ✅ Only throws error if upload actually fails
- ✅ Provides better error messages

## Still Not Working?

If buckets exist and are public, but upload still fails:

1. **Check environment variables:**
   - Open `.env.local`
   - Verify `NEXT_PUBLIC_SUPABASE_URL` matches your project
   - Verify `NEXT_PUBLIC_SUPABASE_ANON_KEY` is correct

2. **Check Supabase project:**
   - Make sure you're looking at the correct project
   - The URL in `.env.local` should match the project URL

3. **Try direct upload test:**
   - Go to Supabase Dashboard → Storage
   - Click on a bucket
   - Try uploading a file manually
   - If this works, the bucket exists and the issue is with the code
   - If this fails, the bucket permissions are wrong

## Quick Checklist

- [ ] Buckets exist in Supabase Dashboard
- [ ] Both buckets are set to **Public**
- [ ] Storage policies are created (read + upload)
- [ ] Dev server has been restarted
- [ ] Environment variables are correct
- [ ] Test endpoint shows buckets (or at least doesn't error)
- [ ] Try uploading an image

