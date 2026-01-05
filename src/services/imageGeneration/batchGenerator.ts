/**
 * Batch Image Generation Utility
 * 
 * Handles concurrent image generation with configurable limits,
 * delays between batches, and retry logic.
 */

import { ImageResult, BatchImageGenerationOptions, BatchImageGenerationResult } from './types'
import type { ImageProvider } from '@/config/imageGeneration'
import { getProviderConfig } from '@/config/imageGeneration'
import { OpenAIImageService } from './openaiImageService'
import { GeminiImageService } from './geminiImageService'
import { ImageGenerationService } from './types'

/**
 * Create an image generation service instance for a provider
 */
function createService(provider: ImageProvider): ImageGenerationService {
  switch (provider) {
    case 'openai':
      return new OpenAIImageService()
    case 'gemini':
      return new GeminiImageService()
    default:
      throw new Error(`Unknown provider: ${provider}`)
  }
}

/**
 * Delay helper
 */
function delay(ms: number): Promise<void> {
  return new Promise(resolve => setTimeout(resolve, ms))
}

/**
 * Check if an error is a rate limit / quota error (should retry)
 */
function isRateLimitError(error: string): boolean {
  const lowerError = error.toLowerCase()
  return lowerError.includes('429') ||
         lowerError.includes('rate limit') ||
         lowerError.includes('quota') ||
         lowerError.includes('exceeded')
}

/**
 * Generate images in batches with concurrency control
 */
export async function generateImagesBatch(
  options: BatchImageGenerationOptions
): Promise<BatchImageGenerationResult> {
  const { provider, prompts, types, onProgress } = options
  const config = getProviderConfig(provider)
  const service = createService(provider)

  const results: ImageResult[] = []
  const total = prompts.length

  // Process in batches based on maxConcurrentRequests
  for (let batchStart = 0; batchStart < total; batchStart += config.maxConcurrentRequests) {
    const batchEnd = Math.min(batchStart + config.maxConcurrentRequests, total)
    const batchPrompts = prompts.slice(batchStart, batchEnd)
    const batchTypes = types.slice(batchStart, batchEnd)

    // Generate batch concurrently
    const batchPromises = batchPrompts.map(async (prompt, batchIndex): Promise<ImageResult> => {
      const type = batchTypes[batchIndex]
      let lastError: string | undefined

      // Retry logic
      for (let attempt = 0; attempt <= config.maxRetries; attempt++) {
        if (attempt > 0) {
          console.log(`Retrying image ${batchStart + batchIndex + 1} (attempt ${attempt + 1}/${config.maxRetries + 1})...`)
          await delay(config.retryDelayMs)
        }

        const result = await service.generateImage(prompt, type)

        if (result.success) {
          return result
        }

        lastError = result.error

        // Only retry on rate limit errors
        if (lastError && !isRateLimitError(lastError)) {
          break
        }
      }

      // All retries failed
      return {
        buffer: Buffer.alloc(0),
        success: false,
        error: lastError || 'Generation failed',
      }
    })

    const batchResults = await Promise.all(batchPromises)
    results.push(...batchResults)

    // Report progress
    if (onProgress) {
      onProgress(results.length, total)
    }

    // Delay before next batch (except after the last batch)
    if (batchEnd < total) {
      await delay(config.delayBetweenBatchesMs)
    }
  }

  const successCount = results.filter(r => r.success).length
  const failureCount = results.filter(r => !r.success).length

  return {
    results,
    successCount,
    failureCount,
  }
}

