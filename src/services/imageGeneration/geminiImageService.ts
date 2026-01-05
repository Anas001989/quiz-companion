/**
 * Gemini (Vertex AI / Imagen) Image Generation Service
 * 
 * Uses Google Cloud Vertex AI Imagen 3 API for image generation.
 * Currently sequential by default due to quota limits.
 * Configuration-driven delays and concurrency limits.
 */

import jwt from 'jsonwebtoken'
import { ImageResult, ImageGenerationService } from './types'
import { getProviderConfig } from '@/config/imageGeneration'

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
  throw new Error(
    'Google Cloud credentials not configured. ' +
    'Please set GOOGLE_CLOUD_SERVICE_ACCOUNT_EMAIL and GOOGLE_CLOUD_PRIVATE_KEY, ' +
    'or configure GOOGLE_APPLICATION_CREDENTIALS.'
  )
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

export class GeminiImageService implements ImageGenerationService {
  async generateImage(prompt: string, type: 'question' | 'answer'): Promise<ImageResult> {
    try {
      const projectId = process.env.GOOGLE_CLOUD_PROJECT_ID
      const location = process.env.GOOGLE_CLOUD_LOCATION || 'us-central1'

      if (!projectId) {
        return {
          buffer: Buffer.alloc(0),
          success: false,
          error: 'GOOGLE_CLOUD_PROJECT_ID environment variable is required',
        }
      }

      const accessToken = await getAccessToken()

      // Vertex AI Imagen 3 API endpoint
      let apiUrl = `https://${location}-aiplatform.googleapis.com/v1/projects/${projectId}/locations/${location}/publishers/google/models/imagen-3.0-generate-001:predict`

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
          sampleCount: 1,
          aspectRatio: '1:1',
          safetyFilterLevel: 'block_some',
          personGeneration: 'allow_all'
        }
      }

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
        
        // Try alternative endpoint on 404
        if (response.status === 404) {
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
            const imageBuffer = extractSingleImageFromResponse(retryData)
            return {
              buffer: imageBuffer,
              success: true,
            }
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

        return {
          buffer: Buffer.alloc(0),
          success: false,
          error: errorMessage,
        }
      }

      const data = await response.json()
      const imageBuffer = extractSingleImageFromResponse(data)

      return {
        buffer: imageBuffer,
        success: true,
      }
    } catch (error: any) {
      console.error('Gemini image generation error:', error)
      return {
        buffer: Buffer.alloc(0),
        success: false,
        error: error?.message || 'Unknown error from Gemini',
      }
    }
  }
}

