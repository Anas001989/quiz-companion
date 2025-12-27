# Fix Image Upload Issues

## Common Image Upload Errors

### Error 1: "Bucket not found" or "Storage bucket does not exist"

**Solution**: Create the storage buckets in Supabase

1. Go to your Supabase Dashboard
2. Navigate to **Storage**
3. Click **"New bucket"**
4. Create two buckets:
   - Name: `question-images` (Public: Yes)
   - Name: `answer-images` (Public: Yes)
5. Set both buckets to **Public**

See `docs/SETUP_IMAGE_STORAGE.md` for detailed instructions.

### Error 2: "Permission denied" or "row-level security" error

**Solution**: Configure storage bucket policies

1. Go to Supabase Dashboard → Storage
2. Click on the bucket (e.g., `question-images`)
3. Go to **Policies** tab
4. Create policies:

**Policy 1: Allow public uploads**
```sql
CREATE POLICY "Allow public uploads" ON storage.objects
FOR INSERT
TO public
WITH CHECK (bucket_id = 'question-images' OR bucket_id = 'answer-images');
```

**Policy 2: Allow public reads**
```sql
CREATE POLICY "Allow public reads" ON storage.objects
FOR SELECT
TO public
USING (bucket_id = 'question-images' OR bucket_id = 'answer-images');
```

### Error 3: "Storage access error"

**Solution**: Check environment variables

Verify your `.env.local` file has:
```env
NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key
```

**Important Notes:**
- **Supabase URL** must start with `https://` (this is your Supabase cloud URL)
- **Local development server** uses `http://localhost:3000` (NOT HTTPS - Next.js dev server doesn't use SSL)
- No extra spaces or quotes around values
- Keys are the **anon/public** key (not the service role key)

**Common Mistake**: Don't try to access `https://localhost:3000` - use `http://localhost:3000` instead!

### Error 4: "The resource already exists"

**Solution**: This is handled automatically - the code will retry with a new unique filename.

If it persists:
- Clear browser cache
- Try uploading a different image
- Check if the file was actually uploaded (check Supabase Storage)

## Quick Checklist

- [ ] Storage buckets `question-images` and `answer-images` exist in Supabase
- [ ] Both buckets are set to **Public**
- [ ] Storage policies allow public uploads and reads
- [ ] Environment variables are set correctly
- [ ] File size is under 5MB
- [ ] File type is JPEG, PNG, WebP, or GIF

## Testing

1. Try uploading a small test image (< 1MB)
2. Check browser console (F12) for detailed error messages
3. Check server terminal for error logs
4. Verify the image appears in Supabase Storage dashboard

## Still Not Working?

1. **Check browser console** for the exact error message
2. **Check server logs** in your terminal
3. **Verify Supabase connection** by visiting `/api/test-supabase` (if that route exists)
4. **Test storage directly** in Supabase dashboard - try uploading a file manually

