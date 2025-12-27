import { NextRequest, NextResponse } from 'next/server'
import { uploadImage, STORAGE_BUCKETS, generateImagePath } from '@/lib/supabase/storage'

export async function POST(request: NextRequest) {
  try {
    const formData = await request.formData()
    const file = formData.get('file') as File
    const type = formData.get('type') as string // 'question' or 'answer'

    if (!file) {
      return NextResponse.json({ error: 'No file provided' }, { status: 400 })
    }

    if (!type || (type !== 'question' && type !== 'answer')) {
      return NextResponse.json({ error: 'Invalid type. Must be "question" or "answer"' }, { status: 400 })
    }

    // Validate file type
    const validTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/webp']
    if (!validTypes.includes(file.type)) {
      return NextResponse.json({ 
        error: 'Invalid file type. Only JPEG, PNG, and WebP are allowed' 
      }, { status: 400 })
    }

    // Validate file size (max 5MB)
    const maxSize = 5 * 1024 * 1024 // 5MB
    if (file.size > maxSize) {
      return NextResponse.json({ 
        error: 'File size exceeds 5MB limit' 
      }, { status: 400 })
    }

    // Determine bucket and generate path
    const bucket = type === 'question' 
      ? STORAGE_BUCKETS.QUESTION_IMAGES 
      : STORAGE_BUCKETS.ANSWER_IMAGES

    const extension = file.name.split('.').pop() || 'jpg'
    const path = generateImagePath(type, extension)

    // Upload to Supabase Storage
    const publicUrl = await uploadImage(file, bucket, path)

    return NextResponse.json({ 
      url: publicUrl,
      path,
      bucket
    })
  } catch (error) {
    console.error('Error uploading image:', error)
    const errorMessage = error instanceof Error ? error.message : 'Unknown error'
    
    // Provide helpful error messages
    let status = 500
    if (errorMessage.includes('Bucket') && errorMessage.includes('not found')) {
      status = 404
    } else if (errorMessage.includes('Permission denied') || errorMessage.includes('row-level security')) {
      status = 403
    }
    
    return NextResponse.json({ 
      error: 'Failed to upload image',
      details: errorMessage,
      hint: errorMessage.includes('Bucket') 
        ? 'Make sure storage buckets are created in Supabase. See docs/SETUP_IMAGE_STORAGE.md'
        : errorMessage.includes('Permission')
        ? 'Check storage bucket policies in Supabase dashboard'
        : 'Check server logs for more details'
    }, { status })
  }
}

