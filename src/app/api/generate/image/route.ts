import { NextRequest, NextResponse } from 'next/server'
import { uploadImage, STORAGE_BUCKETS, generateImagePath } from '@/lib/supabase/storage'
import { generateImages, ImageProvider } from '@/services/imageGeneration'

// Feature flag to enable/disable image generation
const IMAGE_GENERATION_ENABLED = process.env.ENABLE_IMAGE_GENERATION === 'true'

// Batch endpoint for generating multiple images in one request
export async function PUT(request: NextRequest) {
  if (!IMAGE_GENERATION_ENABLED) {
    return NextResponse.json({ 
      error: 'Image generation is currently disabled',
      enabled: false
    }, { status: 503 })
  }

  try {
    const body = await request.json()
    const { prompts, types, provider = 'openai' } = body // Default to OpenAI

    if (!prompts || !Array.isArray(prompts) || prompts.length === 0) {
      return NextResponse.json({ error: 'Prompts array is required' }, { status: 400 })
    }

    if (!types || !Array.isArray(types) || types.length !== prompts.length) {
      return NextResponse.json({ error: 'Types array must match prompts array length' }, { status: 400 })
    }

    // Validate provider
    if (provider !== 'openai' && provider !== 'gemini') {
      return NextResponse.json({ error: 'Invalid provider. Must be "openai" or "gemini"' }, { status: 400 })
    }

    // Validate all types
    for (const type of types) {
      if (type !== 'question' && type !== 'answer') {
        return NextResponse.json({ error: 'Invalid type. Must be "question" or "answer"' }, { status: 400 })
      }
    }

    // Validate provider-specific requirements
    if (provider === 'gemini' && !process.env.GOOGLE_CLOUD_PROJECT_ID) {
      return NextResponse.json({ 
        error: 'Google Cloud configuration missing. GOOGLE_CLOUD_PROJECT_ID is required for Gemini provider.' 
      }, { status: 500 })
    }

    if (provider === 'openai' && !process.env.OPENAI_API_KEY) {
      return NextResponse.json({ 
        error: 'OpenAI API key missing. OPENAI_API_KEY is required for OpenAI provider.' 
      }, { status: 500 })
    }

    console.log(`Generating ${prompts.length} images using ${provider} provider...`)

    // Generate images using the unified service
    const generationResult = await generateImages(
      provider as ImageProvider,
      prompts,
      types as ('question' | 'answer')[],
      (completed, total) => {
        console.log(`Progress: ${completed}/${total} images generated`)
      }
    )

    // Upload all successful images to Supabase Storage
    const results: Array<{ url: string | null; type: string; index: number }> = []
    
    for (let i = 0; i < generationResult.results.length; i++) {
      const result = generationResult.results[i]
      const type = types[i]
      
      if (!result.success || result.buffer.length === 0) {
        console.warn(`Image ${i + 1} generation failed: ${result.error || 'Unknown error'}`)
        results.push({ url: null, type, index: i })
        continue
      }

      try {
        // Convert buffer to File object
        const imageArray = new Uint8Array(result.buffer)
        const imageFile = new File(
          [imageArray],
          generateImagePath(type === 'question' ? 'question' : 'answer', 'png'),
          { type: 'image/png' }
        )

        // Determine the appropriate bucket
        const bucket = type === 'question' 
          ? STORAGE_BUCKETS.QUESTION_IMAGES 
          : STORAGE_BUCKETS.ANSWER_IMAGES

        // Upload to Supabase Storage
        const publicUrl = await uploadImage(imageFile, bucket, imageFile.name)

        // Validate the URL
        if (publicUrl && (publicUrl.startsWith('http://') || publicUrl.startsWith('https://'))) {
          results.push({ url: publicUrl, type, index: i })
          console.log(`✓ Image ${i + 1}/${generationResult.results.length} uploaded successfully`)
        } else {
          console.error(`Invalid public URL generated for image ${i + 1}:`, publicUrl)
          results.push({ url: null, type, index: i })
        }
        
        // Small delay between uploads to avoid rate limiting (except for the last one)
        if (i < generationResult.results.length - 1) {
          await new Promise(resolve => setTimeout(resolve, 100))
        }
      } catch (error: any) {
        console.error(`Error uploading image ${i + 1}/${generationResult.results.length} to Supabase:`, error?.message || error)
        results.push({ url: null, type, index: i })
      }
    }

    const successCount = results.filter(r => r.url).length
    console.log(`Batch image generation complete: ${successCount}/${prompts.length} successful (${generationResult.successCount} generated, ${generationResult.failureCount} failed)`)

    return NextResponse.json({ 
      urls: results.map(r => r.url),
      results: results,
      success: true,
      provider,
      stats: {
        generated: generationResult.successCount,
        uploaded: successCount,
        failed: generationResult.failureCount + (prompts.length - successCount)
      }
    })
    
  } catch (error) {
    console.error('Error generating images (batch):', error)
    return NextResponse.json({ 
      error: 'Failed to generate images',
      details: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 })
  }
}

// Single image endpoint (for backward compatibility)
export async function POST(request: NextRequest) {
  if (!IMAGE_GENERATION_ENABLED) {
    return NextResponse.json({ 
      error: 'Image generation is currently disabled',
      enabled: false
    }, { status: 503 })
  }

  try {
    const body = await request.json()
    const { prompt, type, provider = 'openai' } = body

    if (!prompt) {
      return NextResponse.json({ error: 'Prompt is required' }, { status: 400 })
    }

    if (!type || (type !== 'question' && type !== 'answer')) {
      return NextResponse.json({ error: 'Invalid type. Must be "question" or "answer"' }, { status: 400 })
    }

    // Validate provider
    if (provider !== 'openai' && provider !== 'gemini') {
      return NextResponse.json({ error: 'Invalid provider. Must be "openai" or "gemini"' }, { status: 400 })
    }

    // Validate provider-specific requirements
    if (provider === 'gemini' && !process.env.GOOGLE_CLOUD_PROJECT_ID) {
      return NextResponse.json({ 
        error: 'Google Cloud configuration missing. GOOGLE_CLOUD_PROJECT_ID is required for Gemini provider.' 
      }, { status: 500 })
    }

    if (provider === 'openai' && !process.env.OPENAI_API_KEY) {
      return NextResponse.json({ 
        error: 'OpenAI API key missing. OPENAI_API_KEY is required for OpenAI provider.' 
      }, { status: 500 })
    }

    console.log(`Generating single image using ${provider} provider...`)

    // Generate image using the unified service
    const generationResult = await generateImages(
      provider as ImageProvider,
      [prompt],
      [type as 'question' | 'answer']
    )

    if (generationResult.results.length === 0 || !generationResult.results[0].success) {
      const error = generationResult.results[0]?.error || 'Unknown error'
      return NextResponse.json({ 
        error: 'Failed to generate image',
        details: error
      }, { status: 500 })
    }

    const imageBuffer = generationResult.results[0].buffer

    // Convert buffer to File object for upload
    const imageArray = new Uint8Array(imageBuffer)
    const imageFile = new File(
      [imageArray],
      generateImagePath(type === 'question' ? 'question' : 'answer', 'png'),
      { type: 'image/png' }
    )

    // Determine the appropriate bucket
    const bucket = type === 'question' 
      ? STORAGE_BUCKETS.QUESTION_IMAGES 
      : STORAGE_BUCKETS.ANSWER_IMAGES

    // Upload to Supabase Storage
    let publicUrl: string
    try {
      publicUrl = await uploadImage(imageFile, bucket, imageFile.name)
    } catch (error) {
      console.error('Error uploading image to Supabase:', error)
      return NextResponse.json({ 
        error: 'Failed to upload generated image',
        details: error instanceof Error ? error.message : 'Unknown error',
        hint: 'Check Supabase storage configuration and bucket permissions.'
      }, { status: 500 })
    }

    // Validate the URL before returning
    if (!publicUrl || (!publicUrl.startsWith('http://') && !publicUrl.startsWith('https://'))) {
      console.error('Invalid public URL generated:', publicUrl)
      return NextResponse.json({ 
        error: 'Failed to generate valid image URL',
        details: 'The uploaded image did not return a valid public URL'
      }, { status: 500 })
    }

    console.log('Image generated and uploaded successfully:', publicUrl)
    return NextResponse.json({ 
      url: publicUrl,
      success: true,
      provider
    })
    
  } catch (error) {
    console.error('Error generating image:', error)
    return NextResponse.json({ 
      error: 'Failed to generate image',
      details: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 })
  }
}
