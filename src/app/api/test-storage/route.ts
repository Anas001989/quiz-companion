import { NextResponse } from 'next/server'
import { supabase } from '@/lib/supabase/supabaseClient'
import { STORAGE_BUCKETS } from '@/lib/supabase/storage'

export async function GET() {
  try {
    // Test Supabase connection
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
    const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY

    if (!supabaseUrl || !supabaseKey) {
      return NextResponse.json({
        success: false,
        error: 'Supabase environment variables not set',
        details: {
          hasUrl: !!supabaseUrl,
          hasKey: !!supabaseKey
        }
      }, { status: 500 })
    }

    // Try to list buckets
    const { data: buckets, error: bucketsError } = await supabase.storage.listBuckets()

    if (bucketsError) {
      return NextResponse.json({
        success: false,
        error: 'Could not list buckets',
        details: bucketsError.message,
        hint: 'This is likely due to RLS (Row Level Security) policies preventing bucket listing. The buckets might exist but be hidden. Try uploading a file - if the bucket exists, the upload will work.',
        buckets: null,
        note: 'Even if listing fails, buckets can still exist. Try uploading a file to test.'
      }, { status: 200 }) // Return 200 so user can see the message
    }

    const bucketNames = buckets?.map(b => ({
      name: b.name,
      public: b.public,
      createdAt: b.created_at
    })) || []

    const requiredBuckets = [STORAGE_BUCKETS.QUESTION_IMAGES, STORAGE_BUCKETS.ANSWER_IMAGES]
    const missingBuckets = requiredBuckets.filter(
      required => !bucketNames.some(b => b.name === required)
    )

    return NextResponse.json({
      success: true,
      supabaseUrl: supabaseUrl.substring(0, 30) + '...', // Partial URL for security
      buckets: bucketNames,
      requiredBuckets,
      missingBuckets,
      allBucketsExist: missingBuckets.length === 0,
      message: missingBuckets.length > 0
        ? `Missing buckets: ${missingBuckets.join(', ')}. Create them in Supabase dashboard.`
        : 'All required buckets exist!'
    })
  } catch (error) {
    console.error('Error testing storage:', error)
    return NextResponse.json({
      success: false,
      error: 'Failed to test storage',
      details: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 })
  }
}

