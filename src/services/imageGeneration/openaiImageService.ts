/**
 * OpenAI Image Generation Service
 * 
 * Uses OpenAI's DALL-E API for fast image generation.
 * Supports parallel requests and transparent background options.
 */

import OpenAI from 'openai'
import { ImageResult, ImageGenerationService } from './types'

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
})

export class OpenAIImageService implements ImageGenerationService {
  async generateImage(prompt: string, type: 'question' | 'answer'): Promise<ImageResult> {
    try {
      if (!process.env.OPENAI_API_KEY) {
        return {
          buffer: Buffer.alloc(0),
          success: false,
          error: 'OPENAI_API_KEY not configured',
        }
      }

      // Enhance prompt for educational context
      const enhancedPrompt = `Generate a clear, educational image for a quiz ${type === 'question' ? 'question' : 'answer option'}. 

Context: ${prompt}

Requirements:
- The image should be clear and educational
- Suitable for a quiz context
- Professional and appropriate for students
- High quality and visually appealing
- Simple and clear to understand
- Square aspect ratio (1:1)

Generate an image that represents: ${prompt}`

      const response = await openai.images.generate({
        model: 'dall-e-3',
        prompt: enhancedPrompt,
        n: 1,
        size: '1024x1024',
        quality: 'standard',
        response_format: 'url', // We'll convert URL to buffer
      })

      const imageUrl = response.data[0]?.url

      if (!imageUrl) {
        return {
          buffer: Buffer.alloc(0),
          success: false,
          error: 'No image URL returned from OpenAI',
        }
      }

      // Download the image and convert to buffer
      const imageResponse = await fetch(imageUrl)
      if (!imageResponse.ok) {
        return {
          buffer: Buffer.alloc(0),
          success: false,
          error: `Failed to download image: ${imageResponse.statusText}`,
        }
      }

      const arrayBuffer = await imageResponse.arrayBuffer()
      const buffer = Buffer.from(arrayBuffer)

      return {
        buffer,
        success: true,
      }
    } catch (error: any) {
      console.error('OpenAI image generation error:', error)
      return {
        buffer: Buffer.alloc(0),
        success: false,
        error: error?.message || 'Unknown error from OpenAI',
      }
    }
  }
}

