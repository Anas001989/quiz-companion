# Debugging Image Generation Issues

If you're seeing placeholder images or the prompt text instead of generated images, follow these debugging steps:

## Common Issues

### 1. Check Server Logs

When you try to generate an image, check your terminal/console where `npm run dev` is running. You should see logs like:
- `Calling Imagen API: ...`
- `Imagen API Response structure: ...`
- `Image generated and uploaded successfully: ...`

If you see errors, note them down.

### 2. Check Browser Console

Open your browser's Developer Tools (F12) and check the Console tab. Look for:
- Any errors from the `/api/generate/image` endpoint
- Network requests to `/api/generate/image` - check the response

### 3. Verify Environment Variables

Make sure all required environment variables are set in `.env.local`:
```bash
GOOGLE_CLOUD_PROJECT_ID=your-project-id
GOOGLE_CLOUD_LOCATION=us-central1
GOOGLE_CLOUD_SERVICE_ACCOUNT_EMAIL=your-service-account@...
GOOGLE_CLOUD_PRIVATE_KEY="-----BEGIN PRIVATE KEY-----\n..."
ENABLE_IMAGE_GENERATION=true
```

### 4. Test API Directly

You can test the API endpoint directly using curl or Postman:

```bash
curl -X POST http://localhost:3000/api/generate/image \
  -H "Content-Type: application/json" \
  -d '{
    "prompt": "A simple geometric shape",
    "type": "question"
  }'
```

Check the response - it should return:
```json
{
  "url": "https://...",
  "success": true
}
```

If you get an error, the error message will tell you what's wrong.

## Common Error Messages

### "Authentication failed"
- Check that `GOOGLE_CLOUD_SERVICE_ACCOUNT_EMAIL` and `GOOGLE_CLOUD_PRIVATE_KEY` are correct
- Verify the private key includes `\n` characters and is wrapped in quotes
- Make sure the service account hasn't been deleted

### "Permission denied"
- Verify the service account has the "Vertex AI User" role
- Check that Vertex AI API is enabled in your Google Cloud project
- Ensure you're using the correct project ID

### "Model not found" or 404 errors
- The API will automatically try alternative model endpoints
- Check server logs to see which endpoint worked (if any)

### "Invalid response from Imagen API: no predictions found"
- The API response format might be different than expected
- Check server logs for the full response structure
- The model might not be available in your region

### "No image data found in prediction"
- The response structure is different
- Check server logs for the actual response structure
- We might need to update the code to handle a different response format

## Getting Detailed Logs

The current implementation logs:
1. The API endpoint being called
2. The request body
3. The response structure (first 500 characters)
4. Any errors with full details

If you're still having issues, share:
1. The server console logs
2. The browser console errors
3. The API response (from Network tab in DevTools)

## Testing the API Response Format

If the API is returning a different format, you can check by:

1. Looking at server logs - they show the response structure
2. Using the Network tab in browser DevTools to see the raw response
3. Adding temporary console.log statements in the route handler

The expected response format is:
```json
{
  "predictions": [
    {
      "bytesBase64Encoded": "iVBORw0KGgoAAAANSUhEUgAA..."
    }
  ]
}
```

But it might also be:
```json
{
  "predictions": [
    {
      "imageBytes": "...",
      "bytes": "...",
      "base64Bytes": "..."
    }
  ]
}
```

## Next Steps

If you're still seeing issues:

1. **Check the server logs** - they contain detailed information about what's happening
2. **Verify the API is actually being called** - check Network tab in DevTools
3. **Test with a simple prompt** - try "A red circle" to see if it works
4. **Check Google Cloud Console** - verify the API is enabled and quotas aren't exceeded
5. **Share the error details** - the logs will show exactly what's wrong

