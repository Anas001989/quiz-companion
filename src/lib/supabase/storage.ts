import { supabase } from './supabaseClient'

// For server-side usage, we might need a different client
// But for now, using the same client should work if env vars are set

export const STORAGE_BUCKETS = {
  QUESTION_IMAGES: 'question-images',
  ANSWER_IMAGES: 'answer-images'
} as const

/**
 * Upload an image to Supabase Storage
 * @param file - The file to upload
 * @param bucket - The storage bucket name
 * @param path - The path within the bucket (e.g., 'question-123.jpg')
 * @returns The public URL of the uploaded file
 */
export async function uploadImage(
  file: File,
  bucket: string,
  path: string
): Promise<string> {
  // Check if bucket exists and is accessible
  // Note: listBuckets() might fail due to RLS policies, so we'll try upload anyway
  const { data: buckets, error: bucketsError } = await supabase.storage.listBuckets()
  
  if (bucketsError) {
    console.warn('Could not list buckets (RLS policy may prevent listing):', bucketsError.message)
    console.log('Attempting upload anyway - if bucket exists, upload will work')
  } else {
    // Log available buckets for debugging
    const bucketNames = buckets?.map(b => b.name) || []
    console.log('Available buckets:', bucketNames.length > 0 ? bucketNames.join(', ') : 'none (might be RLS policy)')
    
    // Only throw if we successfully listed buckets and the bucket is missing
    // If buckets array is empty, it might be RLS preventing listing, so try upload anyway
    if (bucketNames.length > 0 && !bucketNames.includes(bucket)) {
      throw new Error(
        `Storage bucket "${bucket}" does not exist. ` +
        `Available buckets: ${bucketNames.join(', ')}. ` +
        `Please create "${bucket}" in Supabase dashboard. ` +
        `Visit http://localhost:3000/api/test-storage to see what buckets are available.`
      )
    }
    // If bucketNames is empty, don't throw - RLS might be preventing listing
    // The upload attempt will provide a better error message
  }

  // Upload the file
  const { data, error } = await supabase.storage
    .from(bucket)
    .upload(path, file, {
      cacheControl: '3600',
      upsert: false
    })

  if (error) {
    // Provide more helpful error messages
    if (error.message.includes('Bucket not found') || error.message.includes('does not exist')) {
      throw new Error(`Bucket "${bucket}" not found. Please create it in Supabase Storage. See docs/SETUP_IMAGE_STORAGE.md`)
    }
    if (error.message.includes('new row violates row-level security') || error.message.includes('permission')) {
      throw new Error(`Permission denied. Check storage bucket policies in Supabase. Bucket "${bucket}" may need public read/write access.`)
    }
    if (error.message.includes('The resource already exists') || error.message.includes('already exists')) {
      // Try with a new unique path
      const timestamp = Date.now()
      const random = Math.random().toString(36).substring(2, 9)
      const extension = path.split('.').pop() || 'jpg'
      const newPath = `${bucket === STORAGE_BUCKETS.QUESTION_IMAGES ? 'question' : 'answer'}-${timestamp}-${random}.${extension}`
      
      const { data: retryData, error: retryError } = await supabase.storage
        .from(bucket)
        .upload(newPath, file, {
          cacheControl: '3600',
          upsert: false
        })
      
      if (retryError) {
        throw new Error(`Failed to upload image: ${retryError.message}`)
      }
      
      const { data: urlData } = supabase.storage
        .from(bucket)
        .getPublicUrl(retryData.path)
      
      return urlData.publicUrl
    }
    throw new Error(`Failed to upload image: ${error.message}`)
  }

  if (!data) {
    throw new Error('Upload succeeded but no data returned')
  }

  // Get the public URL
  const { data: urlData } = supabase.storage
    .from(bucket)
    .getPublicUrl(data.path)

  if (!urlData?.publicUrl) {
    throw new Error('Failed to get public URL for uploaded image')
  }

  return urlData.publicUrl
}

/**
 * Delete an image from Supabase Storage
 * @param bucket - The storage bucket name
 * @param path - The path to the file to delete
 */
export async function deleteImage(bucket: string, path: string): Promise<void> {
  // Extract path from full URL if needed
  const filePath = path.includes('/') && path.includes(bucket)
    ? path.split(`${bucket}/`)[1]
    : path

  const { error } = await supabase.storage
    .from(bucket)
    .remove([filePath])

  if (error) {
    throw new Error(`Failed to delete image: ${error.message}`)
  }
}

/**
 * Generate a unique file path for an image
 * @param prefix - Prefix for the file (e.g., 'question', 'answer')
 * @param extension - File extension (e.g., 'jpg', 'png')
 */
export function generateImagePath(prefix: string, extension: string): string {
  const timestamp = Date.now()
  const random = Math.random().toString(36).substring(2, 9)
  return `${prefix}-${timestamp}-${random}.${extension}`
}

