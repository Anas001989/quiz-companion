/**
 * Centralized configuration for AI image generation providers
 * 
 * All concurrency limits, delays, and retry behavior should be configured here.
 * Changing these values requires NO code changes elsewhere.
 */

export type ImageProvider = 'openai' | 'gemini'

export interface ProviderConfig {
  maxConcurrentRequests: number
  delayBetweenBatchesMs: number
  retryDelayMs: number
  maxRetries: number
}

export const IMAGE_GENERATION_CONFIG: Record<ImageProvider, ProviderConfig> = {
  openai: {
    maxConcurrentRequests: 4,
    delayBetweenBatchesMs: 700,
    retryDelayMs: 2000,
    maxRetries: 1,
  },
  gemini: {
    maxConcurrentRequests: 1,
    delayBetweenBatchesMs: 65000,
    retryDelayMs: 65000,
    maxRetries: 1,
  },
}

/**
 * Get configuration for a specific provider
 */
export function getProviderConfig(provider: ImageProvider): ProviderConfig {
  return IMAGE_GENERATION_CONFIG[provider]
}

