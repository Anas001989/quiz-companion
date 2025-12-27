# Debug Storage Bucket Issues

## Test Your Storage Setup

I've created a test endpoint to help debug storage issues. Visit this URL in your browser:

```
http://localhost:3000/api/test-storage
```

This will show you:
- ✅ If Supabase environment variables are set
- ✅ What buckets exist in your Supabase project
- ✅ Which required buckets are missing
- ✅ Whether buckets are set to public

## Common Issues

### Issue 1: Bucket exists but code says it doesn't

**Possible causes:**
1. **Bucket name mismatch** - Check for typos, extra spaces, or case sensitivity
   - Required: `question-images` (lowercase, with hyphen)
   - Required: `answer-images` (lowercase, with hyphen)

2. **RLS policies blocking bucket listing** - The code can't see the buckets even though they exist
   - Solution: The upload will still work, but the check might fail
   - The code now tries to upload anyway if listing fails

3. **Wrong Supabase project** - Environment variables point to a different project
   - Check `.env.local` matches your actual Supabase project

### Issue 2: "Permission denied" after creating buckets

**Solution**: You need to create storage policies:

1. Go to Supabase Dashboard → Storage
2. Click on `question-images` bucket
3. Go to **Policies** tab
4. Create these policies:

**Policy 1: Public Upload**
```sql
CREATE POLICY "Public uploads" ON storage.objects
FOR INSERT
TO public
WITH CHECK (bucket_id = 'question-images');
```

**Policy 2: Public Read**
```sql
CREATE POLICY "Public reads" ON storage.objects
FOR SELECT
TO public
USING (bucket_id = 'question-images');
```

5. Repeat for `answer-images` bucket

### Issue 3: File type restrictions

I've updated the code to only allow:
- ✅ JPEG (`image/jpeg`, `image/jpg`)
- ✅ PNG (`image/png`)
- ✅ WebP (`image/webp`)
- ❌ GIF removed (as you requested)

## Step-by-Step Verification

1. **Check environment variables**:
   ```bash
   # In your terminal, check if variables are loaded
   echo $NEXT_PUBLIC_SUPABASE_URL
   ```
   Or visit: `http://localhost:3000/api/test-storage`

2. **Verify buckets in Supabase**:
   - Go to Supabase Dashboard → Storage
   - You should see both `question-images` and `answer-images`
   - Both should show "Public" badge

3. **Check bucket names exactly**:
   - Must be: `question-images` (not `question_images` or `Question-Images`)
   - Must be: `answer-images` (not `answer_images` or `Answer-Images`)

4. **Test the endpoint**:
   - Visit `http://localhost:3000/api/test-storage`
   - It will tell you exactly what's wrong

## Quick Fix Checklist

- [ ] Visit `http://localhost:3000/api/test-storage` to see what buckets exist
- [ ] Verify bucket names are exactly `question-images` and `answer-images`
- [ ] Check both buckets are set to **Public** in Supabase
- [ ] Create storage policies for both buckets (upload and read)
- [ ] Restart your dev server after making changes
- [ ] Try uploading again

## Still Not Working?

1. **Check server logs** - Look at your terminal for detailed error messages
2. **Check browser console** - Press F12 → Console tab
3. **Verify Supabase project** - Make sure you're looking at the right project in dashboard
4. **Test with the endpoint** - Visit `/api/test-storage` to see what's actually available

