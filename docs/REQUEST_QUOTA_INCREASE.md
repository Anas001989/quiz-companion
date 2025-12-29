# Requesting Google Cloud Quota Increase for Imagen API

## Current Situation

Your current quota is **1 request per minute** for Imagen API, which means:
- Generating 6 images takes ~6-7 minutes
- Generating 12 images takes ~12-13 minutes

This is the default free tier quota. You can request an increase to speed up image generation.

## How to Request a Quota Increase

### Step 1: Access Quotas Page

1. Go to [Google Cloud Console Quotas](https://console.cloud.google.com/apis/api/aiplatform.googleapis.com/quotas?project=quiz-companion)
2. Or navigate: **APIs & Services** → **Quotas** → Search for "aiplatform"

### Step 2: Find the Imagen Quota

Look for this quota:
- **Name**: `Regional online prediction requests per base model per minute per region per base_model`
- **Service**: Vertex AI API
- **Dimensions**: 
  - `region`: us-central1
  - `base_model`: imagen-3.0-generate

### Step 3: Request Increase

1. Click on the quota row
2. Click **"EDIT QUOTAS"** button at the top
3. Enter your requested limit:
   - **Recommended for development**: 10 requests per minute
   - **Recommended for production**: 20-50 requests per minute
4. Fill out the form:
   - **Requested value**: Enter your desired limit (e.g., 10)
   - **Justification**: Explain your use case:
     ```
     I'm developing an educational quiz application that generates images 
     for quiz questions and answers. I need to generate multiple images 
     (typically 6-12) when creating quizzes. The current quota of 1 
     request per minute is too restrictive for this use case.
     ```
5. Click **"Submit Request"**

### Step 4: Wait for Approval

- Quota increase requests are typically reviewed within 24-48 hours
- You'll receive an email when approved or if more information is needed
- Free tier projects may have longer review times

## After Quota Increase is Approved

Once your quota is increased, update the code in `src/app/api/teacher/quiz/[quizId]/generate-questions/route.ts`:

```typescript
// For 10 req/min quota:
const CONCURRENT_REQUESTS = 2 // Process 2 images at a time
const REQUEST_DELAY = 7000 // 7 seconds between batches (~8-9 req/min)

// For 20 req/min quota:
const CONCURRENT_REQUESTS = 3 // Process 3 images at a time
const REQUEST_DELAY = 10000 // 10 seconds between batches (~18 req/min)

// For 50 req/min quota:
const CONCURRENT_REQUESTS = 5 // Process 5 images at a time
const REQUEST_DELAY = 7000 // 7 seconds between batches (~42 req/min)
```

**Formula**: `(60 seconds / REQUEST_DELAY) * CONCURRENT_REQUESTS` should be less than your quota

## Current Code Settings (1 req/min quota)

The code is currently configured for your 1 req/min quota:
- `CONCURRENT_REQUESTS = 1` (one at a time)
- `REQUEST_DELAY = 65000` (65 seconds between requests)

This ensures you won't hit rate limits, but it's slow for multiple images.

## Alternative: Use Different Regions

You could also try using different regions, as each region has its own quota:
- `us-east1` (South Carolina)
- `us-west1` (Oregon)
- `europe-west1` (Belgium)

However, you'd need to manage multiple regions, which adds complexity.

## Cost Considerations

- **Free tier**: Usually includes a small quota (1-2 req/min)
- **Paid tier**: Higher quotas available, but may incur costs
- Check [Google Cloud Pricing](https://cloud.google.com/vertex-ai/pricing) for Imagen costs

## Monitoring Quota Usage

After getting a quota increase:
1. Monitor usage in the [Quotas dashboard](https://console.cloud.google.com/apis/api/aiplatform.googleapis.com/quotas)
2. Watch for "Peak usage" approaching 100%
3. Adjust `CONCURRENT_REQUESTS` and `REQUEST_DELAY` if needed

## Quick Reference

- **Current quota**: 1 req/min
- **Current code**: Sequential processing with 65s delays
- **Recommended quota**: 10-20 req/min for development
- **Request link**: [Request Quota Increase](https://console.cloud.google.com/apis/api/aiplatform.googleapis.com/quotas?project=quiz-companion)

