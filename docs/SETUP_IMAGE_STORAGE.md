# Image Storage Setup Guide

This guide explains how to set up Supabase Storage buckets for quiz images.

## Prerequisites

- Supabase project with storage enabled
- Access to Supabase dashboard

## Steps

### 1. Create Storage Buckets

In your Supabase dashboard, navigate to **Storage** and create two buckets:

#### Bucket 1: `question-images`
- **Name**: `question-images`
- **Public**: Yes (so images can be accessed via public URLs)
- **File size limit**: 5MB (recommended)
- **Allowed MIME types**: `image/jpeg`, `image/png`, `image/webp`, `image/gif`

#### Bucket 2: `answer-images`
- **Name**: `answer-images`
- **Public**: Yes
- **File size limit**: 5MB (recommended)
- **Allowed MIME types**: `image/jpeg`, `image/png`, `image/webp`, `image/gif`

### 2. Set Up Storage Policies

For each bucket, create a policy that allows authenticated users to upload:

**Policy Name**: `Allow authenticated uploads`
**Policy Definition**:
```sql
CREATE POLICY "Allow authenticated uploads" ON storage.objects
FOR INSERT
TO authenticated
WITH CHECK (bucket_id = 'question-images' OR bucket_id = 'answer-images');
```

**Policy for public read access**:
```sql
CREATE POLICY "Public read access" ON storage.objects
FOR SELECT
TO public
USING (bucket_id = 'question-images' OR bucket_id = 'answer-images');
```

### 3. Environment Variables

Ensure your `.env.local` file includes:

```env
NEXT_PUBLIC_SUPABASE_URL=your-supabase-url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key
```

### 4. Verify Setup

After creating the buckets, test the image upload functionality in the quiz creation interface.

## Notes

- Images are stored with unique paths: `{type}-{timestamp}-{random}.{extension}`
- Maximum file size is enforced at 5MB in the API
- Only image types (JPEG, PNG, WebP, GIF) are allowed
- Images are publicly accessible via their URLs

