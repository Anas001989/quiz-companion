# Quick Storage Bucket Setup (5 Minutes)

## The Error You're Seeing

```
Storage bucket "question-images" does not exist
```

This means you need to create the storage buckets in Supabase.

## Step-by-Step Setup

### Step 1: Open Supabase Dashboard

1. Go to [https://supabase.com](https://supabase.com)
2. Sign in to your account
3. Select your project

### Step 2: Create Storage Buckets

1. In the left sidebar, click **"Storage"**
2. Click **"New bucket"** button (top right)
3. Create the first bucket:
   - **Name**: `question-images`
   - **Public bucket**: ✅ **Check this box** (IMPORTANT!)
   - Click **"Create bucket"**
4. Click **"New bucket"** again
5. Create the second bucket:
   - **Name**: `answer-images`
   - **Public bucket**: ✅ **Check this box** (IMPORTANT!)
   - Click **"Create bucket"**

### Step 3: Set Up Policies (IMPORTANT!)

For **each bucket** (`question-images` and `answer-images`):

1. Click on the bucket name
2. Go to the **"Policies"** tab
3. Click **"New Policy"**
4. Select **"For full customization"**
5. Copy and paste this SQL:

**Policy 1: Allow Public Uploads**
```sql
CREATE POLICY "Allow public uploads" ON storage.objects
FOR INSERT
TO public
WITH CHECK (bucket_id = 'question-images' OR bucket_id = 'answer-images');
```

**Policy 2: Allow Public Reads**
```sql
CREATE POLICY "Allow public reads" ON storage.objects
FOR SELECT
TO public
USING (bucket_id = 'question-images' OR bucket_id = 'answer-images');
```

6. Click **"Review"** then **"Save policy"**

**Note**: You need to create BOTH policies for BOTH buckets (4 policies total, or use the OR condition to cover both buckets in one policy).

### Step 4: Test

1. Go back to your app (`http://localhost:3000`)
2. Try uploading an image again
3. It should work now! ✅

## Quick Checklist

- [ ] Bucket `question-images` created and set to **Public**
- [ ] Bucket `answer-images` created and set to **Public**
- [ ] Upload policy created (allows public to INSERT)
- [ ] Read policy created (allows public to SELECT)
- [ ] Tested image upload in the app

## Still Not Working?

1. **Verify buckets are Public**: 
   - Go to Storage → Click bucket → Check "Public bucket" is enabled

2. **Check Policies**:
   - Go to Storage → Click bucket → Policies tab
   - You should see 2 policies (upload and read)

3. **Check Browser Console**:
   - Press F12 → Console tab
   - Look for any additional error messages

4. **Check Server Logs**:
   - Look at your terminal where `npm run dev` is running
   - Check for detailed error messages

## Common Issues

### Issue: "Permission denied" after creating buckets
**Solution**: Make sure you created the policies AND the buckets are set to Public

### Issue: Buckets exist but upload still fails
**Solution**: 
1. Check bucket names are exactly `question-images` and `answer-images` (case-sensitive)
2. Verify policies are active (not disabled)
3. Try refreshing the page

### Issue: Can't see "New bucket" button
**Solution**: Make sure you're in the Storage section, not Settings or Database

