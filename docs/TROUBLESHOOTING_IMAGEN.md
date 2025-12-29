# Troubleshooting Imagen API Permission Errors

If you're getting a 403 "Permission denied" error when trying to generate images, follow these steps:

## Common Causes

### 1. Service Account Missing Required Role

The service account needs the **"Vertex AI User"** role (or "AI Platform User").

**To fix:**
1. Go to [Google Cloud Console](https://console.cloud.google.com/)
2. Navigate to **IAM & Admin** > **Service Accounts**
3. Click on your service account
4. Go to the **"Permissions"** tab
5. Click **"Grant Access"** (or **"Add Principal"**)
6. Add the role: **"Vertex AI User"**
7. Click **"Save"**

### 2. Vertex AI API Not Enabled

The Vertex AI API must be enabled in your project.

**To fix:**
1. Go to [APIs & Services](https://console.cloud.google.com/apis/library)
2. Search for **"Vertex AI API"**
3. Click on it and click **"Enable"**
4. Wait a few minutes for it to activate

### 3. Billing Not Enabled

Imagen API requires billing to be enabled on your Google Cloud project.

**To fix:**
1. Go to [Billing](https://console.cloud.google.com/billing)
2. Link a billing account to your project
3. Note: Imagen has a free tier, but billing must still be enabled

### 4. Wrong Region

Imagen may not be available in all regions. Try using a supported region.

**To fix:**
1. Check your `GOOGLE_CLOUD_LOCATION` in `.env.local`
2. Try changing it to `us-central1` or `us-east1`
3. Common supported regions:
   - `us-central1` (Iowa, USA) ✅
   - `us-east1` (South Carolina, USA) ✅
   - `us-west1` (Oregon, USA) ✅
   - `europe-west1` (Belgium) ✅

### 5. Incorrect Credentials

Double-check your environment variables.

**To verify:**
1. Open `.env.local`
2. Check that all values are correct:
   ```env
   GOOGLE_CLOUD_PROJECT_ID=your-actual-project-id
   GOOGLE_CLOUD_LOCATION=us-central1
   GOOGLE_CLOUD_SERVICE_ACCOUNT_EMAIL=your-service-account@project-id.iam.gserviceaccount.com
   GOOGLE_CLOUD_PRIVATE_KEY="-----BEGIN PRIVATE KEY-----\n...\n-----END PRIVATE KEY-----\n"
   ```
3. Make sure:
   - Project ID matches your actual Google Cloud project
   - Service account email is correct
   - Private key includes the `\n` characters and is wrapped in quotes
   - No extra spaces or line breaks

### 6. Service Account Key Expired or Invalid

If you regenerated the service account key, make sure you updated `.env.local`.

**To fix:**
1. Go to your service account in Google Cloud Console
2. Go to **"Keys"** tab
3. If you see old keys, you can delete them
4. Create a new key and update `.env.local` with the new credentials

## Verification Steps

### Step 1: Verify API is Enabled

Run this command (replace with your project ID):
```bash
gcloud services list --enabled --project=YOUR_PROJECT_ID | grep aiplatform
```

Or check in the console: [APIs & Services](https://console.cloud.google.com/apis/library/aiplatform.googleapis.com)

### Step 2: Verify Service Account Permissions

1. Go to [IAM & Admin](https://console.cloud.google.com/iam-admin/iam)
2. Find your service account
3. Check that it has **"Vertex AI User"** role

### Step 3: Test Credentials

You can test if your credentials work by checking the access token:

```bash
# This should return an access token (if credentials are correct)
# The token will be in the response
```

### Step 4: Check Project Billing

1. Go to [Billing](https://console.cloud.google.com/billing)
2. Verify your project has a billing account linked
3. Even if you're using the free tier, billing must be enabled

## Still Not Working?

If you've checked all the above:

1. **Check server logs** - The error message now includes detailed troubleshooting info
2. **Verify the exact error** - Look at the full error response in the server console
3. **Try a different region** - Some regions may not support Imagen yet
4. **Check Google Cloud status** - Make sure there are no service outages
5. **Wait a few minutes** - Sometimes API enablement takes time to propagate

## Getting More Help

If none of the above works, check:
- The full error message in your server console (it now includes more details)
- Google Cloud Console logs for any additional errors
- The [Vertex AI documentation](https://cloud.google.com/vertex-ai/docs) for the latest requirements

## Quick Checklist

- [ ] Service account has "Vertex AI User" role
- [ ] Vertex AI API is enabled
- [ ] Billing is enabled for the project
- [ ] Project ID is correct in `.env.local`
- [ ] Service account email is correct
- [ ] Private key is correctly formatted (with `\n` characters)
- [ ] Location is set to a supported region (e.g., `us-central1`)
- [ ] Restarted the dev server after updating `.env.local`

