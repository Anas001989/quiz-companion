# Google Cloud Setup Guide for Image Generation

This guide will walk you through setting up Google Cloud service account with the necessary permissions and keys for image generation.

## Prerequisites

- ✅ Google Cloud project created
- ✅ Vertex AI API enabled
- ✅ Service account created

## Step-by-Step Setup

### Step 1: Grant Required Permissions to Service Account

1. Go to [Google Cloud Console](https://console.cloud.google.com/)
2. Select your project
3. Navigate to **IAM & Admin** > **Service Accounts**
4. Click on your service account (or the one you want to use)
5. Click on the **"Permissions"** tab
6. Click **"Grant Access"** (or **"Add Principal"** if no permissions exist)
7. In the **"New principals"** field, enter your service account email (it should auto-fill)
8. In the **"Select a role"** dropdown, search for and select:
   - **"Vertex AI User"** (recommended) - This role provides access to Vertex AI services including Imagen
   - OR **"AI Platform User"** (alternative) - Older name for the same permissions
9. Click **"Save"**

**Note**: If you don't see "Vertex AI User" role, you may need to enable the Vertex AI API first:
- Go to **APIs & Services** > **Library**
- Search for "Vertex AI API"
- Click on it and click **"Enable"**

### Step 2: Create and Download Service Account Key

1. While still viewing your service account, click on the **"Keys"** tab
2. Click **"Add Key"** > **"Create new key"**
3. Select **"JSON"** as the key type
4. Click **"Create"**
5. A JSON file will be downloaded to your computer - **keep this file secure!**

### Step 3: Extract Credentials from JSON File

Open the downloaded JSON file. It will look something like this:

```json
{
  "type": "service_account",
  "project_id": "your-project-id-123456",
  "private_key_id": "abc123...",
  "private_key": "-----BEGIN PRIVATE KEY-----\nMIIEvQIBADANBgkqhkiG9w0BAQEFAASCBKcwggSjAgEAAoIBAQC...\n-----END PRIVATE KEY-----\n",
  "client_email": "your-service-account@your-project-id-123456.iam.gserviceaccount.com",
  "client_id": "123456789",
  "auth_uri": "https://accounts.google.com/o/oauth2/auth",
  "token_uri": "https://oauth2.googleapis.com/token",
  "auth_provider_x509_cert_url": "https://www.googleapis.com/oauth2/v1/certs",
  "client_x509_cert_url": "https://www.googleapis.com/robot/v1/metadata/x509/..."
}
```

### Step 4: Update .env.local File

Open your `.env.local` file and replace the placeholder values with the actual values from your JSON file:

1. **GOOGLE_CLOUD_PROJECT_ID**: Copy the `project_id` value
   ```
   GOOGLE_CLOUD_PROJECT_ID=your-project-id-123456
   ```

2. **GOOGLE_CLOUD_SERVICE_ACCOUNT_EMAIL**: Copy the `client_email` value
   ```
   GOOGLE_CLOUD_SERVICE_ACCOUNT_EMAIL=your-service-account@your-project-id-123456.iam.gserviceaccount.com
   ```

3. **GOOGLE_CLOUD_PRIVATE_KEY**: Copy the entire `private_key` value, including the `-----BEGIN PRIVATE KEY-----` and `-----END PRIVATE KEY-----` lines. Keep the `\n` characters as they are.
   ```
   GOOGLE_CLOUD_PRIVATE_KEY="-----BEGIN PRIVATE KEY-----\nMIIEvQIBADANBgkqhkiG9w0BAQEFAASCBKcwggSjAgEAAoIBAQC...\n-----END PRIVATE KEY-----\n"
   ```

4. **GOOGLE_CLOUD_LOCATION**: Choose a region (default is `us-central1`)
   ```
   GOOGLE_CLOUD_LOCATION=us-central1
   ```
   
   Common regions:
   - `us-central1` (Iowa, USA)
   - `us-east1` (South Carolina, USA)
   - `us-west1` (Oregon, USA)
   - `europe-west1` (Belgium)
   - `europe-west4` (Netherlands)
   - `asia-east1` (Taiwan)

5. **ENABLE_IMAGE_GENERATION**: Set to `true` when ready to use
   ```
   ENABLE_IMAGE_GENERATION=true
   ```

### Step 5: Verify Setup

After updating your `.env.local` file:

1. Restart your Next.js development server if it's running:
   ```bash
   # Stop the server (Ctrl+C) and restart
   npm run dev
   ```

2. Test the image generation endpoint by making a request or using the UI

## Security Best Practices

⚠️ **Important Security Notes:**

1. **Never commit the JSON key file or `.env.local` to version control**
   - The `.env.local` file is already in `.gitignore` (which is correct)
   - Delete the downloaded JSON file after extracting the credentials, or store it securely

2. **For Production Deployments** (Vercel, etc.):
   - Add environment variables through your hosting platform's dashboard
   - Never hardcode credentials in your code
   - Use environment variable encryption if available

3. **Rotate Keys Periodically**:
   - Create new keys and update your environment variables
   - Delete old keys from Google Cloud Console

4. **Limit Permissions**:
   - Only grant the minimum required permissions (Vertex AI User role)
   - Don't grant admin or owner roles unless absolutely necessary

## Troubleshooting

### Error: "Authentication failed"
- Verify `GOOGLE_CLOUD_SERVICE_ACCOUNT_EMAIL` and `GOOGLE_CLOUD_PRIVATE_KEY` are correct
- Ensure the private key includes the `\n` characters and is wrapped in quotes
- Check that the service account hasn't been deleted

### Error: "Permission denied"
- Verify the service account has the "Vertex AI User" role
- Check that Vertex AI API is enabled in your project
- Ensure you're using the correct project ID

### Error: "Rate limit exceeded"
- You've hit the API quota limit
- Wait a few minutes and try again
- Check your Google Cloud billing and quotas

### Error: "Invalid project ID"
- Verify `GOOGLE_CLOUD_PROJECT_ID` matches your actual project ID
- Check that the project exists and is active

## Additional Resources

- [Google Cloud Service Accounts Documentation](https://cloud.google.com/iam/docs/service-accounts)
- [Vertex AI Documentation](https://cloud.google.com/vertex-ai/docs)
- [Imagen API Documentation](https://cloud.google.com/vertex-ai/docs/generative-ai/image/overview)

