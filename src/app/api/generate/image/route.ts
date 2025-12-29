import { NextRequest, NextResponse } from 'next/server'
import { uploadImage, STORAGE_BUCKETS, generateImagePath } from '@/lib/supabase/storage'
import jwt from 'jsonwebtoken'

// Feature flag to enable/disable image generation
const IMAGE_GENERATION_ENABLED = process.env.ENABLE_IMAGE_GENERATION === 'true'

/**
 * Get Google Cloud access token for authentication
 * Supports both service account JSON and individual credentials
 */
async function getAccessToken(): Promise<string> {
  // Check if we have individual credentials
  if (process.env.GOOGLE_CLOUD_SERVICE_ACCOUNT_EMAIL && process.env.GOOGLE_CLOUD_PRIVATE_KEY) {
    // Use JWT-based authentication
    const privateKey = process.env.GOOGLE_CLOUD_PRIVATE_KEY.replace(/\\n/g, '\n')
    
    const now = Math.floor(Date.now() / 1000)
    const token = jwt.sign(
      {
        iss: process.env.GOOGLE_CLOUD_SERVICE_ACCOUNT_EMAIL,
        sub: process.env.GOOGLE_CLOUD_SERVICE_ACCOUNT_EMAIL,
        aud: 'https://oauth2.googleapis.com/token',
        exp: now + 3600,
        iat: now,
        scope: 'https://www.googleapis.com/auth/cloud-platform'
      },
      privateKey,
      { algorithm: 'RS256' }
    )

    const response = await fetch('https://oauth2.googleapis.com/token', {
      method: 'POST',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      body: new URLSearchParams({
        grant_type: 'urn:ietf:params:oauth:grant-type:jwt-bearer',
        assertion: token
      })
    })

    if (!response.ok) {
      const error = await response.text()
      throw new Error(`Failed to get access token: ${error}`)
    }

    const data = await response.json()
    return data.access_token
  }

  // Fallback: try using GOOGLE_APPLICATION_CREDENTIALS (service account file)
  // This requires the file to be accessible, which may not work in serverless
  throw new Error(
    'Google Cloud credentials not configured. ' +
    'Please set GOOGLE_CLOUD_SERVICE_ACCOUNT_EMAIL and GOOGLE_CLOUD_PRIVATE_KEY, ' +
    'or configure GOOGLE_APPLICATION_CREDENTIALS.'
  )
}

/**
 * Generate multiple images in batch using Google Imagen 3 via Vertex AI
 * Combines all prompts into one descriptive prompt and uses sampleCount to generate multiple images
 * This uses a single API request to generate multiple images, which counts as one request against the quota
 */
async function generateImagesBatch(prompts: string[], types: ('question' | 'answer')[]): Promise<Buffer[]> {
  const projectId = process.env.GOOGLE_CLOUD_PROJECT_ID
  const location = process.env.GOOGLE_CLOUD_LOCATION || 'us-central1'

  if (!projectId) {
    throw new Error('GOOGLE_CLOUD_PROJECT_ID environment variable is required')
  }

  const accessToken = await getAccessToken()

  // Vertex AI Imagen 3 API endpoint
  let apiUrl = `https://${location}-aiplatform.googleapis.com/v1/projects/${projectId}/locations/${location}/publishers/google/models/imagen-3.0-generate-001:predict`

  // Combine all prompts into one descriptive prompt
  // Format: "Generate X images. Image 1: [description], Image 2: [description], ..."
  const combinedPrompt = `Generate ${prompts.length} distinct educational quiz images. Each image should be clear, professional, and suitable for students.

${prompts.map((prompt, index) => {
  const imageType = types[index] === 'question' ? 'question' : 'answer option'
  return `Image ${index + 1} (for a quiz ${imageType}): ${prompt}`
}).join('\n\n')}

Requirements for all images:
- Clear and educational
- Suitable for a quiz context
- Professional and appropriate for students
- High quality and visually appealing
- Simple and clear to understand
- Each image should be distinct and represent its specific description`

  // Note: sampleCount generates variations of the SAME prompt, not different images for different prompts
  // Since we need different images for different prompts, we must generate them sequentially
  // However, we can still optimize by processing them one at a time with proper rate limiting
  console.log(`Generating ${prompts.length} images sequentially (one per request to ensure distinct images)`)
  
  const allImages: Buffer[] = []
  const REQUEST_DELAY = 65000 // 65 seconds between requests to respect 1 req/min quota
  
  // Generate each image individually with its own prompt
  for (let i = 0; i < prompts.length; i++) {
    const prompt = prompts[i]
    const type = types[i]
    const imageType = type === 'question' ? 'question' : 'answer option'
    
    const enhancedPrompt = `Generate a clear, educational image for a quiz ${imageType}. 

Context: ${prompt}

Requirements:
- The image should be clear and educational
- Suitable for a quiz context
- Professional and appropriate for students
- High quality and visually appealing
- Simple and clear to understand

Generate an image that represents: ${prompt}`

    const requestBody = {
      instances: [
        {
          prompt: enhancedPrompt
        }
      ],
      parameters: {
        sampleCount: 1, // Generate 1 image per prompt
        aspectRatio: '1:1',
        safetyFilterLevel: 'block_some',
        personGeneration: 'allow_all'
      }
    }
    
    console.log(`[${i + 1}/${prompts.length}] Generating ${type} image...`)

    let batchApiUrl = apiUrl
    const response = await fetch(batchApiUrl, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${accessToken}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(requestBody)
    })

    if (!response.ok) {
      const errorText = await response.text()
      let errorMessage = `Imagen API error (${response.status}): ${errorText}`
      
      console.error('Imagen API Error Details:', {
        status: response.status,
        statusText: response.statusText,
        url: batchApiUrl,
        projectId,
        location,
        errorText: errorText.substring(0, 500)
      })
      
      if (response.status === 404) {
        console.log('Model not found, trying alternative endpoint...')
        batchApiUrl = `https://${location}-aiplatform.googleapis.com/v1/projects/${projectId}/locations/${location}/publishers/google/models/imagegeneration@006:predict`
        
        const retryResponse = await fetch(batchApiUrl, {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${accessToken}`,
            'Content-Type': 'application/json'
          },
          body: JSON.stringify(requestBody)
        })
        
        if (retryResponse.ok) {
          const retryData = await retryResponse.json()
          console.log('Alternative endpoint worked!')
          const imageBuffer = extractSingleImageFromResponse(retryData)
          allImages.push(imageBuffer)
          // Wait before next request
          if (i < prompts.length - 1) {
            console.log(`  ⏳ Waiting 65 seconds before next image (respecting 1 req/min quota)...`)
            await new Promise(resolve => setTimeout(resolve, REQUEST_DELAY))
          }
          continue
        }
        
        errorMessage = `Both model endpoints failed. Last error: ${await retryResponse.text()}`
      }
      
      if (response.status === 401) {
        errorMessage = 'Authentication failed. Check your Google Cloud credentials.'
      } else if (response.status === 403) {
        errorMessage = `Permission denied (403). Check service account permissions and API enablement.`
      } else if (response.status === 429) {
        errorMessage = `Rate limit exceeded (429). Please wait before trying again.`
      } else if (response.status === 400) {
        errorMessage = `Invalid request: ${errorText}`
      }

      // On error, push null to maintain array length, but continue processing
      console.error(`Failed to generate image ${i + 1}:`, errorMessage)
      allImages.push(Buffer.alloc(0)) // Empty buffer as placeholder
      // Still wait before next request
      if (i < prompts.length - 1) {
        console.log(`  ⏳ Waiting 65 seconds before next image...`)
        await new Promise(resolve => setTimeout(resolve, REQUEST_DELAY))
      }
      continue
    }

    const data = await response.json()
    const imageBuffer = extractSingleImageFromResponse(data)
    allImages.push(imageBuffer)
    console.log(`  ✓ [${i + 1}/${prompts.length}] ${type} image generated successfully`)
    
    // Wait 65 seconds before next request to respect 1 req/min quota (only if more images to process)
    if (i < prompts.length - 1) {
      console.log(`  ⏳ Waiting 65 seconds before next image (respecting 1 req/min quota)...`)
      await new Promise(resolve => setTimeout(resolve, REQUEST_DELAY))
    }
  }
  
  console.log(`All images complete: Generated ${allImages.filter(img => img.length > 0).length}/${prompts.length} images total`)
  return allImages.filter(img => img.length > 0) // Filter out failed images
}

/**
 * Extract a single image buffer from Imagen API response
 */
function extractSingleImageFromResponse(data: any): Buffer {
  if (!data.predictions || data.predictions.length === 0) {
    console.error('Invalid response from Imagen API:', JSON.stringify(data, null, 2))
    throw new Error(`Invalid response from Imagen API: no predictions found. Response: ${JSON.stringify(data)}`)
  }

  const prediction = data.predictions[0]
  
  // Try different possible field names for the base64 image data
  const imageBase64 = prediction.bytesBase64Encoded || 
                     prediction.imageBytes || 
                     prediction.bytes ||
                     prediction.base64Bytes ||
                     (prediction.generatedImages && prediction.generatedImages[0]?.bytesBase64Encoded)

  if (!imageBase64) {
    console.error('Response structure:', JSON.stringify(prediction, null, 2))
    throw new Error(`Invalid response from Imagen API: no image data found in prediction. Available fields: ${Object.keys(prediction).join(', ')}`)
  }

  // Convert base64 to buffer
  const base64Data = imageBase64.includes(',') ? imageBase64.split(',')[1] : imageBase64
  return Buffer.from(base64Data, 'base64')
}

/**
 * Extract image buffers from Imagen API batch response (legacy - for sampleCount variations)
 * When using sampleCount, the response contains multiple images in predictions[0]
 */
function extractImagesFromBatchResponse(data: any, expectedCount: number): Buffer[] {
  if (!data.predictions || data.predictions.length === 0) {
    console.error('Invalid response from Imagen API:', JSON.stringify(data, null, 2))
    throw new Error(`Invalid response from Imagen API: no predictions found. Response: ${JSON.stringify(data)}`)
  }

  const images: Buffer[] = []
  const prediction = data.predictions[0]
  
  // When using sampleCount, the images might be in different structures
  // Try to find all images in the prediction
  let imageArray: any[] = []
  
  // Check if prediction has an array of images
  if (Array.isArray(prediction.generatedImages)) {
    imageArray = prediction.generatedImages
  } else if (Array.isArray(prediction.images)) {
    imageArray = prediction.images
  } else if (prediction.bytesBase64Encoded) {
    // Single image, but we expected multiple - might be an array of base64 strings
    if (Array.isArray(prediction.bytesBase64Encoded)) {
      imageArray = prediction.bytesBase64Encoded.map((img: any) => ({ bytesBase64Encoded: img }))
    } else {
      // Only one image returned, but we expected multiple
      imageArray = [prediction]
    }
  } else {
    // Fallback: check if predictions array has multiple entries
    imageArray = data.predictions
  }
  
  for (let i = 0; i < imageArray.length && i < expectedCount; i++) {
    const imageData = imageArray[i]
    
    // Try different possible field names for the base64 image data
    const imageBase64 = imageData.bytesBase64Encoded || 
                       imageData.imageBytes || 
                       imageData.bytes ||
                       imageData.base64Bytes ||
                       (imageData.generatedImages && imageData.generatedImages[0]?.bytesBase64Encoded) ||
                       (typeof imageData === 'string' ? imageData : null)

    if (!imageBase64) {
      console.error(`No image data found in image ${i}:`, JSON.stringify(imageData, null, 2))
      throw new Error(`Invalid response from Imagen API: no image data found in image ${i}. Available fields: ${Object.keys(imageData).join(', ')}`)
    }

    // Convert base64 to buffer
    const base64Data = imageBase64.includes(',') ? imageBase64.split(',')[1] : imageBase64
    images.push(Buffer.from(base64Data, 'base64'))
  }

  if (images.length !== expectedCount) {
    console.warn(`Expected ${expectedCount} images but got ${images.length}`)
  }

  return images
}

/**
 * Generate single image using Google Imagen 3 via Vertex AI (legacy function for backward compatibility)
 */
async function generateImageWithImagen(prompt: string): Promise<Buffer> {
  const projectId = process.env.GOOGLE_CLOUD_PROJECT_ID
  const location = process.env.GOOGLE_CLOUD_LOCATION || 'us-central1'

  if (!projectId) {
    throw new Error('GOOGLE_CLOUD_PROJECT_ID environment variable is required')
  }

  const accessToken = await getAccessToken()

  // Vertex AI Imagen 3 API endpoint
  // Try different model endpoints - imagen-3.0-generate-001, imagen-3.0-fast-generate-001, or imagegeneration@006
  // We'll try the most common one first
  let apiUrl = `https://${location}-aiplatform.googleapis.com/v1/projects/${projectId}/locations/${location}/publishers/google/models/imagen-3.0-generate-001:predict`

  const requestBody = {
    instances: [
      {
        prompt: prompt
      }
    ],
    parameters: {
      sampleCount: 1,
      aspectRatio: '1:1',
      safetyFilterLevel: 'block_some',
      personGeneration: 'allow_all'
    }
  }
  
  console.log('Calling Imagen API:', apiUrl)
  console.log('Request body:', JSON.stringify(requestBody, null, 2))

  const response = await fetch(apiUrl, {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${accessToken}`,
      'Content-Type': 'application/json'
    },
    body: JSON.stringify(requestBody)
  })

  if (!response.ok) {
    const errorText = await response.text()
    let errorMessage = `Imagen API error (${response.status}): ${errorText}`
    
    // Log full error details for debugging
    console.error('Imagen API Error Details:', {
      status: response.status,
      statusText: response.statusText,
      url: apiUrl,
      projectId,
      location,
      errorText: errorText.substring(0, 500) // Limit log size
    })
    
    // If 404, try alternative model endpoint
    if (response.status === 404) {
      console.log('Model not found, trying alternative endpoint...')
      // Try the alternative model endpoint
      apiUrl = `https://${location}-aiplatform.googleapis.com/v1/projects/${projectId}/locations/${location}/publishers/google/models/imagegeneration@006:predict`
      
      const retryResponse = await fetch(apiUrl, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${accessToken}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(requestBody)
      })
      
      if (retryResponse.ok) {
        const retryData = await retryResponse.json()
        console.log('Alternative endpoint worked!')
        // Continue with retryData instead of data
        const prediction = retryData.predictions?.[0]
        const imageBase64 = prediction?.bytesBase64Encoded || 
                           prediction?.imageBytes || 
                           prediction?.bytes ||
                           prediction?.base64Bytes
        
        if (!imageBase64) {
          throw new Error(`Invalid response from alternative endpoint: ${JSON.stringify(prediction)}`)
        }
        
        const base64Data = imageBase64.includes(',') ? imageBase64.split(',')[1] : imageBase64
        return Buffer.from(base64Data, 'base64')
      }
      
      errorMessage = `Both model endpoints failed. Last error: ${await retryResponse.text()}`
    }
    
    if (response.status === 401) {
      errorMessage = 'Authentication failed. Check your Google Cloud credentials (GOOGLE_CLOUD_SERVICE_ACCOUNT_EMAIL and GOOGLE_CLOUD_PRIVATE_KEY).'
    } else if (response.status === 403) {
      // Parse the error response to get more details
      let detailedError = errorText
      try {
        const errorJson = JSON.parse(errorText)
        detailedError = errorJson.error?.message || errorText
      } catch (e) {
        // Not JSON, use as-is
      }
      
      errorMessage = `Permission denied (403). Detailed error: ${detailedError}\n\n` +
        `Troubleshooting steps:\n` +
        `1. Verify the service account has the "Vertex AI User" role:\n` +
        `   - Go to IAM & Admin > Service Accounts\n` +
        `   - Click on your service account\n` +
        `   - Ensure it has "Vertex AI User" role (or "AI Platform User")\n\n` +
        `2. Enable required APIs:\n` +
        `   - Vertex AI API (https://console.cloud.google.com/apis/library/aiplatform.googleapis.com)\n` +
        `   - Make sure billing is enabled for your project\n\n` +
        `3. Verify project ID and location:\n` +
        `   - Project ID: ${projectId}\n` +
        `   - Location: ${location}\n\n` +
        `4. Check if Imagen is available in your region:\n` +
        `   - Imagen may not be available in all regions\n` +
        `   - Try using 'us-central1' or 'us-east1'\n\n` +
        `5. Verify credentials in .env.local:\n` +
        `   - GOOGLE_CLOUD_PROJECT_ID=${projectId ? '✓ Set' : '✗ Missing'}\n` +
        `   - GOOGLE_CLOUD_SERVICE_ACCOUNT_EMAIL=${process.env.GOOGLE_CLOUD_SERVICE_ACCOUNT_EMAIL ? '✓ Set' : '✗ Missing'}\n` +
        `   - GOOGLE_CLOUD_PRIVATE_KEY=${process.env.GOOGLE_CLOUD_PRIVATE_KEY ? '✓ Set' : '✗ Missing'}`
    } else if (response.status === 429) {
      // Parse rate limit details if available
      let rateLimitInfo = ''
      try {
        const errorJson = JSON.parse(errorText)
        if (errorJson.error?.details) {
          rateLimitInfo = ` Details: ${JSON.stringify(errorJson.error.details)}`
        }
      } catch (e) {
        // Not JSON, ignore
      }
      
      errorMessage = `Rate limit exceeded (429).${rateLimitInfo}\n\n` +
        `Google Imagen API has rate limits. Please:\n` +
        `1. Wait a few minutes before trying again\n` +
        `2. Reduce the number of images being generated at once\n` +
        `3. Check your Google Cloud quotas: https://console.cloud.google.com/apis/api/aiplatform.googleapis.com/quotas\n` +
        `4. Consider upgrading your quota if needed`
    } else if (response.status === 400) {
      errorMessage = `Invalid request: ${errorText}`
    }

    throw new Error(errorMessage)
  }

  const data = await response.json()
  
  // Log the response structure for debugging
  console.log('Imagen API Response structure:', JSON.stringify(data, null, 2).substring(0, 500))
  
  // Extract base64 image from response
  // Imagen 3 response structure: predictions[0].bytesBase64Encoded
  // Or sometimes: predictions[0].imageBytes or predictions[0].bytes
  if (!data.predictions || data.predictions.length === 0) {
    console.error('Invalid response from Imagen API:', JSON.stringify(data, null, 2))
    throw new Error(`Invalid response from Imagen API: no predictions found. Response: ${JSON.stringify(data)}`)
  }

  const prediction = data.predictions[0]
  
  // Try different possible field names for the base64 image data
  const imageBase64 = prediction.bytesBase64Encoded || 
                     prediction.imageBytes || 
                     prediction.bytes ||
                     prediction.base64Bytes ||
                     (prediction.generatedImages && prediction.generatedImages[0]?.bytesBase64Encoded)

  if (!imageBase64) {
    console.error('Response structure:', JSON.stringify(prediction, null, 2))
    throw new Error(`Invalid response from Imagen API: no image data found in prediction. Available fields: ${Object.keys(prediction).join(', ')}`)
  }

  // Convert base64 to buffer
  // Remove data URL prefix if present (data:image/png;base64,...)
  const base64Data = imageBase64.includes(',') ? imageBase64.split(',')[1] : imageBase64
  return Buffer.from(base64Data, 'base64')
}

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
    const { prompts, types } = body // arrays of prompts and types

    if (!prompts || !Array.isArray(prompts) || prompts.length === 0) {
      return NextResponse.json({ error: 'Prompts array is required' }, { status: 400 })
    }

    if (!types || !Array.isArray(types) || types.length !== prompts.length) {
      return NextResponse.json({ error: 'Types array must match prompts array length' }, { status: 400 })
    }

    // Validate all types
    for (const type of types) {
      if (type !== 'question' && type !== 'answer') {
        return NextResponse.json({ error: 'Invalid type. Must be "question" or "answer"' }, { status: 400 })
      }
    }

    if (!process.env.GOOGLE_CLOUD_PROJECT_ID) {
      return NextResponse.json({ 
        error: 'Google Cloud configuration missing. GOOGLE_CLOUD_PROJECT_ID is required.' 
      }, { status: 500 })
    }

    // Enhance prompts
    const enhancedPrompts = prompts.map((prompt, index) => {
      const type = types[index]
      return `Generate a clear, educational image for a quiz ${type === 'question' ? 'question' : 'answer option'}. 

Context: ${prompt}

Requirements:
- The image should be clear and educational
- Suitable for a quiz context
- Professional and appropriate for students
- High quality and visually appealing
- Simple and clear to understand

Generate an image that represents: ${prompt}`
    })

    // Generate all images in one batch request using combined prompt
    let imageBuffers: Buffer[]
    try {
      imageBuffers = await generateImagesBatch(prompts, types)
    } catch (error) {
      console.error('Error calling Imagen API (batch):', error)
      return NextResponse.json({ 
        error: 'Failed to generate images',
        details: error instanceof Error ? error.message : 'Unknown error',
        hint: 'Check that Imagen API is enabled in your Google Cloud project and credentials are correct.'
      }, { status: 500 })
    }

    // Upload all images to Supabase Storage
    const results: Array<{ url: string | null; type: string; index: number }> = []
    
    for (let i = 0; i < imageBuffers.length; i++) {
      const type = types[i]
      const imageBuffer = imageBuffers[i]
      
      try {
        // Convert buffer to File object
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
        const publicUrl = await uploadImage(imageFile, bucket, imageFile.name)

        // Validate the URL
        if (publicUrl && (publicUrl.startsWith('http://') || publicUrl.startsWith('https://'))) {
          results.push({ url: publicUrl, type, index: i })
        } else {
          console.error(`Invalid public URL generated for image ${i}:`, publicUrl)
          results.push({ url: null, type, index: i })
        }
      } catch (error) {
        console.error(`Error uploading image ${i} to Supabase:`, error)
        results.push({ url: null, type, index: i })
      }
    }

    console.log(`Batch image generation complete: ${results.filter(r => r.url).length}/${prompts.length} successful`)

    return NextResponse.json({ 
      urls: results.map(r => r.url),
      results: results,
      success: true
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
    const { prompt, type } = body // type: 'question' or 'answer'

    if (!prompt) {
      return NextResponse.json({ error: 'Prompt is required' }, { status: 400 })
    }

    if (!type || (type !== 'question' && type !== 'answer')) {
      return NextResponse.json({ error: 'Invalid type. Must be "question" or "answer"' }, { status: 400 })
    }

    // Validate required environment variables
    if (!process.env.GOOGLE_CLOUD_PROJECT_ID) {
      return NextResponse.json({ 
        error: 'Google Cloud configuration missing. GOOGLE_CLOUD_PROJECT_ID is required.' 
      }, { status: 500 })
    }

    // Enhanced prompt for better image generation
    const enhancedPrompt = `Generate a clear, educational image for a quiz ${type === 'question' ? 'question' : 'answer option'}. 

Context: ${prompt}

Requirements:
- The image should be clear and educational
- Suitable for a quiz context
- Professional and appropriate for students
- High quality and visually appealing
- Simple and clear to understand

Generate an image that represents: ${prompt}`

    // Generate image using Imagen API
    let imageBuffer: Buffer
    try {
      imageBuffer = await generateImageWithImagen(enhancedPrompt)
    } catch (error) {
      console.error('Error calling Imagen API:', error)
      return NextResponse.json({ 
        error: 'Failed to generate image',
        details: error instanceof Error ? error.message : 'Unknown error',
        hint: 'Check that Imagen API is enabled in your Google Cloud project and credentials are correct.'
      }, { status: 500 })
    }

    // Convert buffer to File object for upload
    // Convert Buffer to Uint8Array for File constructor compatibility
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
      success: true
    })
    
  } catch (error) {
    console.error('Error generating image:', error)
    return NextResponse.json({ 
      error: 'Failed to generate image',
      details: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 })
  }
}

