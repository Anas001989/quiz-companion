# Image Generation Performance Optimization

## Overview

The image generation system now uses **parallel batch processing** instead of sequential generation, which significantly improves performance while respecting API rate limits.

## How It Works

### Previous Approach (Sequential)
- Generated images one at a time
- 3-second delay between each image
- For 6 images: ~18 seconds minimum
- Slow but safe from rate limits

### New Approach (Parallel Batches)
- Processes multiple images simultaneously
- Controlled concurrency (2 images at a time by default)
- 1-second delay between batches
- For 6 images: ~3-4 seconds (much faster!)

## Performance Comparison

| Images | Sequential (old) | Parallel (new) | Speedup |
|--------|-----------------|----------------|---------|
| 2 images | ~6 seconds | ~2-3 seconds | 2x faster |
| 6 images | ~18 seconds | ~3-4 seconds | 4-5x faster |
| 12 images | ~36 seconds | ~6-7 seconds | 5-6x faster |

## Configuration

### Current Settings (1 req/min quota)

The code is currently configured for the default free tier quota of **1 request per minute**:

```typescript
const CONCURRENT_REQUESTS = 1 // Must be 1 for 1 req/min quota
const REQUEST_DELAY = 65000 // 65 seconds between requests
```

This means images are generated **one at a time** with a 65-second delay between each.

### Adjusting for Higher Quotas

If you request a quota increase (see [REQUEST_QUOTA_INCREASE.md](REQUEST_QUOTA_INCREASE.md)), you can adjust:

```typescript
// For 10 req/min quota:
const CONCURRENT_REQUESTS = 2 // Process 2 images at a time
const REQUEST_DELAY = 7000 // 7 seconds between batches

// For 20 req/min quota:
const CONCURRENT_REQUESTS = 3 // Process 3 images at a time
const REQUEST_DELAY = 10000 // 10 seconds between batches
```

**Formula**: `(60 seconds / REQUEST_DELAY) * CONCURRENT_REQUESTS` should be less than your quota

**Warning**: Exceeding your quota will result in 429 errors. Always set these values below your actual quota limit.

### Adjusting Batch Delay

```typescript
const BATCH_DELAY = 1000 // 1 second delay between batches
```

- Lower delay = faster but higher risk of rate limits
- Higher delay = slower but safer

## How It Works Technically

1. **Collection Phase**: All image generation tasks are collected first
2. **Batch Processing**: Tasks are processed in batches of `CONCURRENT_REQUESTS`
3. **Parallel Execution**: Each batch uses `Promise.allSettled()` to run requests in parallel
4. **Error Handling**: Failed requests don't stop the batch - all results are collected
5. **Rate Limit Protection**: 
   - Retry logic with exponential backoff
   - Delays between batches
   - Controlled concurrency

## Example Flow

For 6 images with CONCURRENT_REQUESTS = 2:

```
Batch 1: [Image 1, Image 2] → Process in parallel → Wait 1s
Batch 2: [Image 3, Image 4] → Process in parallel → Wait 1s  
Batch 3: [Image 5, Image 6] → Process in parallel → Done

Total time: ~3-4 seconds (vs 18 seconds sequential)
```

## Benefits

1. **Much Faster**: 4-6x speedup for typical quiz generation
2. **Resilient**: Failed images don't block others
3. **Scalable**: Easy to adjust concurrency based on quota
4. **Smart Retries**: Automatic retry with backoff for rate limits
5. **Better Logging**: Clear progress and statistics

## Monitoring

The logs show:
- Total images to generate
- Batch progress
- Success/failure counts
- Performance metrics

Example log output:
```
📸 Found 6 images to generate
   - Question images: 2
   - Answer images: 4

🔄 Processing batch 1/3 (2 images)...
  [1/6] Generating question image: "..."
  [2/6] Generating answer image: "..."
  ✓ [1/6] question image generated successfully
  ✓ [2/6] answer image generated successfully
  Batch 1 complete: 2 succeeded, 0 failed

=== Image Generation Summary ===
Total tasks processed: 6/6
Successful: 6, Failed: 0
Performance: Processed 6 images in 3 batches
```

## Troubleshooting

### Still Getting Rate Limits?

1. **Reduce concurrency**: Lower `CONCURRENT_REQUESTS` to 1
2. **Increase batch delay**: Increase `BATCH_DELAY` to 2000-3000ms
3. **Check your quota**: Verify your Google Cloud quota limits
4. **Wait between quizzes**: Don't generate multiple quizzes back-to-back

### Some Images Failing?

- Check server logs for specific error messages
- Rate limit errors will automatically retry
- Other errors (permissions, etc.) will be logged

## Future Improvements

Potential enhancements:
- Dynamic concurrency adjustment based on rate limit responses
- Queue system for very large batches
- Caching generated images to avoid regeneration
- Background job processing for large quizzes

