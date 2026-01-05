/**
 * Image Generation Service Router
 * 
 * Main entry point for image generation.
 * Routes requests to appropriate providers and handles batching.
 */

import { BatchImageGenerationOptions, BatchImageGenerationResult, ImageResult } from './types'
import type { ImageProvider } from '@/config/imageGeneration'
import { generateImagesBatch } from './batchGenerator'

export type { ImageProvider }
export { ImageResult, BatchImageGenerationOptions, BatchImageGenerationResult } from './types'
export { IMAGE_GENERATION_CONFIG, getProviderConfig } from '@/config/imageGeneration'

/**
 * Generate multiple images using the specified provider
 * 
 * @param provider - The image generation provider to use ('openai' or 'gemini')
 * @param prompts - Array of image prompts
 * @param types - Array of image types ('question' or 'answer'), must match prompts length
 * @param onProgress - Optional callback for progress updates (completed, total)
 * @returns Batch generation result with image buffers and success/failure counts
 */
export async function generateImages(
  provider: ImageProvider,
  prompts: string[],
  types: ('question' | 'answer')[],
  onProgress?: (completed: number, total: number) => void
): Promise<BatchImageGenerationResult> {
  if (prompts.length !== types.length) {
    throw new Error('Prompts and types arrays must have the same length')
  }

  if (prompts.length === 0) {
    return {
      results: [],
      successCount: 0,
      failureCount: 0,
    }
  }

  const options: BatchImageGenerationOptions = {
    provider,
    prompts,
    types,
    onProgress,
  }

  return generateImagesBatch(options)
}

