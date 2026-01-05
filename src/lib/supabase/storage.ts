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

  // Upload the file with retry logic for network errors
  const maxRetries = 3
  let lastError: any = null
  
  for (let attempt = 0; attempt < maxRetries; attempt++) {
    if (attempt > 0) {
      // Wait before retry (exponential backoff: 500ms, 1000ms, 2000ms)
      const delayMs = 500 * Math.pow(2, attempt - 1)
      console.log(`Retrying upload (attempt ${attempt + 1}/${maxRetries}) after ${delayMs}ms...`)
      await new Promise(resolve => setTimeout(resolve, delayMs))
    }

    const { data, error } = await supabase.storage
      .from(bucket)
      .upload(path, file, {
        cacheControl: '3600',
        upsert: false
      })

    if (!error) {
      // Success - use this data
      lastError = null
      
      // Get the public URL
      const { data: urlData } = supabase.storage
        .from(bucket)
        .getPublicUrl(data.path)

      if (!urlData?.publicUrl) {
        throw new Error('Failed to get public URL for uploaded image')
      }

      return urlData.publicUrl
    }

    lastError = error
    
    // Don't retry on certain errors
    if (error.message.includes('Bucket not found') || error.message.includes('does not exist')) {
      throw new Error(`Bucket "${bucket}" not found. Please create it in Supabase Storage. See docs/SETUP_IMAGE_STORAGE.md`)
    }
    if (error.message.includes('new row violates row-level security') || error.message.includes('permission')) {
      throw new Error(`Permission denied. Check storage bucket policies in Supabase. Bucket "${bucket}" may need public read/write access.`)
    }
    
    // Retry on network errors (fetch failed, timeout, etc.)
    const isNetworkError = error.message.includes('fetch failed') || 
                          error.message.includes('network') ||
                          error.message.includes('timeout') ||
                          error.message.includes('ECONNREFUSED') ||
                          error.message.includes('ENOTFOUND')
    
    if (!isNetworkError && !error.message.includes('The resource already exists') && !error.message.includes('already exists')) {
      // Non-retryable error
      break
    }
    
    // For "already exists" errors, try with a new unique path
    if (error.message.includes('The resource already exists') || error.message.includes('already exists')) {
      const timestamp = Date.now()
      const random = Math.random().toString(36).substring(2, 9)
      const extension = path.split('.').pop() || 'jpg'
      path = `${bucket === STORAGE_BUCKETS.QUESTION_IMAGES ? 'question' : 'answer'}-${timestamp}-${random}.${extension}`
      // Continue to next iteration with new path
      continue
    }
  }

  // All retries failed
  if (lastError) {
    throw new Error(`Failed to upload image after ${maxRetries} attempts: ${lastError.message}`)
  }
  
  throw new Error('Failed to upload image: Unknown error')

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

