# Supabase Storage Delete Policies Setup

When deleting questions or options, the system will attempt to delete associated images from Supabase Storage. If you haven't set up delete policies, the image deletion will fail silently (with a warning in logs), but the question/option will still be deleted from the database.

## Setting Up Delete Policies (Optional but Recommended)

To enable automatic image deletion when questions/options are deleted:

### Option 1: Single Policy for Both Buckets (Recommended)

1. Go to Supabase Dashboard → Storage → Policies
2. Click "New Policy" on `storage.objects`
3. Create a policy with:
   - **Policy Name**: `Allow public deletes for quiz images` (or similar)
   - **Allowed Operation**: `DELETE`
   - **Policy Definition**: 
     ```sql
     (bucket_id = 'question-images'::text) OR (bucket_id = 'answer-images'::text)
     ```
   - **Policy Target**: `storage.objects`
   - **Policy Roles**: `public` ⚠️ **Important: Use `public`, not `authenticated`**
   - **Policy Check**: Leave empty or use `true` for unrestricted deletes

**Why `public`?** The server-side code uses `NEXT_PUBLIC_SUPABASE_ANON_KEY`, which operates as the `public` role in RLS policies.

### Option 2: Separate Policies for Each Bucket

If you prefer separate policies:

#### For `question-images` bucket:

1. Go to Supabase Dashboard → Storage → Policies
2. Click "New Policy" on `storage.objects`
3. Create a policy with:
   - **Policy Name**: `Allow public deletes for question images`
   - **Allowed Operation**: `DELETE`
   - **Policy Definition**: 
     ```sql
     (bucket_id = 'question-images'::text)
     ```
   - **Policy Roles**: `public`

#### For `answer-images` bucket:

1. Repeat the same steps
2. Use policy name: `Allow public deletes for answer images`
3. Use policy definition: `(bucket_id = 'answer-images'::text)`

## Important Notes

### Why `public` role?

The application uses `NEXT_PUBLIC_SUPABASE_ANON_KEY` for server-side operations, which operates as the `public` role in Supabase RLS. Therefore:
- ✅ Use `public` role for the delete policy
- ❌ Don't use `authenticated` role (this requires user authentication)
- ❌ Don't use `service_role` (this would require changing the code to use service role key)

### Alternative: Using Service Role Key

If you want to use the service role key (bypasses RLS entirely):
1. Create a separate Supabase client using `SUPABASE_SERVICE_ROLE_KEY` (server-side only)
2. Use that client for delete operations
3. This would bypass RLS, so no policies needed

**Note**: Service role key should NEVER be exposed to the client. Only use it in server-side API routes.

## Current Behavior

- **With delete policies**: Images are automatically deleted from storage when questions/options are deleted
- **Without delete policies**: 
  - Images remain in storage (orphaned files)
  - Question/option deletion still succeeds
  - Warning messages are logged but don't block deletion

## Cleaning Up Orphaned Images

If you have orphaned images in storage (from deletions before policies were set up), you can:

1. Manually delete them from the Supabase Dashboard
2. Or create a cleanup script to identify and delete unused images

## Testing

After setting up delete policies, test by:
1. Creating a question with an image
2. Deleting the question
3. Check that the image is removed from storage

