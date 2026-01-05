/**
 * Common types and interfaces for image generation services
 */

import type { ImageProvider } from '@/config/imageGeneration'

export interface ImageResult {
  buffer: Buffer
  success: boolean
  error?: string
}

export interface ImageGenerationService {
  /**
   * Generate a single image from a prompt
   */
  generateImage(prompt: string, type: 'question' | 'answer'): Promise<ImageResult>
}

export interface BatchImageGenerationOptions {
  provider: ImageProvider
  prompts: string[]
  types: ('question' | 'answer')[]
  onProgress?: (completed: number, total: number) => void
}

export interface BatchImageGenerationResult {
  results: ImageResult[]
  successCount: number
  failureCount: number
}
