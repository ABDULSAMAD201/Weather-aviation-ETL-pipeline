# Deployment Guide

Complete step-by-step guide for deploying the Aviation Weather Data Pipeline.

## Prerequisites Checklist

Before starting deployment, ensure you have:

- [ ] Node.js 18+ installed
- [ ] Firebase CLI installed (`npm install -g firebase-tools`)
- [ ] Google Cloud Project created
- [ ] Firebase enabled on your GCP project
- [ ] Billing enabled on GCP (required for Cloud Scheduler)
- [ ] SADIS OPMET API credentials (Client ID & Secret)
- [ ] Text editor (VS Code recommended)

## Step-by-Step Deployment

### Step 1: Verify Node.js Installation

```powershell
node --version
# Should show v18.x.x or higher
```

If not installed, download from [nodejs.org](https://nodejs.org/)

### Step 2: Install Firebase CLI

```powershell
npm install -g firebase-tools

# Verify installation
firebase --version
```

### Step 3: Login to Firebase

```powershell
firebase login
```

This will open a browser window for authentication.

### Step 4: Navigate to Project Directory

```powershell
cd "c:\Users\ABC\Desktop\weather aviation"
```

### Step 5: Initialize Firebase Project

```powershell
firebase init
```

**Select the following options:**

1. **Which Firebase features?**
   - [x] Firestore
   - [x] Functions

2. **Please select an option:**
   - Use an existing project (if already created)
   - Create a new project (if new)

3. **What do you want to use as your public directory?**
   - Press Enter (use default)

4. **Firestore Rules?**
   - Use existing firestore.rules

5. **Firestore Indexes?**
   - Use existing firestore.indexes.json

6. **What language would you like to use?**
   - JavaScript

7. **Do you want to use ESLint?**
   - No (or Yes, if you prefer)

8. **Do you want to install dependencies?**
   - Yes

### Step 6: Install Dependencies

```powershell
# Root dependencies
npm install

# Functions dependencies
cd functions
npm install
cd ..
```

### Step 7: Configure Environment Variables

**IMPORTANT: Replace placeholder values with your actual credentials**

```powershell
# Set SADIS OPMET credentials
firebase functions:config:set sadis.client_id="YOUR_ACTUAL_CLIENT_ID"
firebase functions:config:set sadis.client_secret="YOUR_ACTUAL_CLIENT_SECRET"
firebase functions:config:set sadis.token_url="https://api-manager.api-management.metoffice.cloud/oauth2/token"
firebase functions:config:set sadis.base_url="https://gateway.api-management.metoffice.cloud/sadis-opmet/1"

# Set API key for manual triggers (choose a secure random string)
firebase functions:config:set api.key="YOUR_SECURE_RANDOM_KEY_HERE"

# Verify configuration
firebase functions:config:get
```

**Example Output:**

```json
{
  "sadis": {
    "client_id": "9ufkhw4jVPz12_Wil2OKKYrUGiEa",
    "client_secret": "xxxxxxxxxxxxxxxxxxxx",
    "token_url": "https://api-manager.api-management.metoffice.cloud/oauth2/token",
    "base_url": "https://gateway.api-management.metoffice.cloud/sadis-opmet/1"
  },
  "api": {
    "key": "my-secure-api-key-12345"
  }
}
```

### Step 8: Enable Required APIs

```powershell
# Set your project
firebase use YOUR_PROJECT_ID

# Enable Cloud Scheduler API (required for scheduled functions)
gcloud services enable cloudscheduler.googleapis.com

# Enable Cloud Build API
gcloud services enable cloudbuild.googleapis.com
```

**If you don't have gcloud CLI, enable via Console:**

1. Go to https://console.cloud.google.com
2. Select your project
3. Navigate to "APIs & Services" > "Library"
4. Search and enable:
   - Cloud Scheduler API
   - Cloud Build API
   - Cloud Functions API

### Step 9: Deploy Firestore Rules & Indexes

```powershell
firebase deploy --only firestore:rules,firestore:indexes
```

### Step 10: Deploy Cloud Functions

```powershell
# Deploy all functions
firebase deploy --only functions
```

**This will deploy:**

- `scheduledWeatherFetch` - Runs every 5 minutes
- `manualWeatherFetch` - Manual trigger endpoint
- `getTAF` - API endpoint for TAF data
- `getMETAR` - API endpoint for METAR data
- `healthCheck` - Health check endpoint

**Deployment will take 2-5 minutes.**

### Step 11: Note Your Function URLs

After deployment, you'll see URLs like:

```
✔  functions[getTAF(us-central1)]: Successful create operation.
Function URL: https://us-central1-your-project-id.cloudfunctions.net/getTAF

✔  functions[getMETAR(us-central1)]: Successful create operation.
Function URL: https://us-central1-your-project-id.cloudfunctions.net/getMETAR

✔  functions[manualWeatherFetch(us-central1)]: Successful create operation.
Function URL: https://us-central1-your-project-id.cloudfunctions.net/manualWeatherFetch
```

**Save these URLs! You'll need them for your app.**

### Step 12: Verify Cloud Scheduler

1. Go to [Google Cloud Console](https://console.cloud.google.com)
2. Navigate to **Cloud Scheduler**
3. You should see a job named something like:
   - `firebase-schedule-scheduledWeatherFetch-us-central1`
4. Status should be "Enabled"
5. Schedule should be "_/5 _ \* \* \*" (every 5 minutes)

### Step 13: Test Manual Trigger

```powershell
# Test manual data fetch
$headers = @{ "X-API-Key" = "YOUR_API_KEY" }
Invoke-RestMethod -Uri "YOUR_MANUAL_FETCH_URL" -Method POST -Headers $headers
```

**Expected Response:**

```json
{
  "success": true,
  "message": "Weather data fetched and stored successfully",
  "data": {
    "timestamp": "2026-02-16T10:30Z/PT5M",
    "duration": "12.34s",
    "statistics": {
      "tafCount": 77,
      "metarCount": 245,
      "speciCount": 42,
      "errors": 0
    }
  }
}
```

### Step 14: Verify Data in Firestore

1. Go to [Firebase Console](https://console.firebase.google.com)
2. Select your project
3. Navigate to **Firestore Database**
4. You should see two collections:
   - `TAF` - Contains TAF reports by airport code
   - `METAR` - Contains METAR/SPECI reports by airport code

### Step 15: Test API Endpoints

```powershell
# Test TAF endpoint
Invoke-RestMethod -Uri "YOUR_GET_TAF_URL?icao=EBAW"

# Test METAR endpoint
Invoke-RestMethod -Uri "YOUR_GET_METAR_URL?icao=EBAW"
```

**Expected Response (raw text):**

```
TAF EBAW 100211Z 1003/1012 12007KT CAVOK
    BECMG 1006/1008 SCT010 BKN014
    TEMPO 1008/1012 3500 -RADZ SCT004 BKN007=
```

## Post-Deployment Configuration

### Update CORS for Your App

Edit `functions/index.js` to allow your app's domain:

```javascript
// Replace in getTAF and getMETAR functions:
res.set("Access-Control-Allow-Origin", "https://yourdomain.com");
```

Then redeploy:

```powershell
firebase deploy --only functions:getTAF,functions:getMETAR
```

### Set Up Monitoring Alerts

1. Go to [Google Cloud Console](https://console.cloud.google.com)
2. Navigate to **Monitoring** > **Alerting**
3. Create alerts for:
   - Function execution failures
   - High error rates
   - Long execution times

## Verification Checklist

After deployment, verify:

- [ ] Cloud Functions deployed successfully
- [ ] Cloud Scheduler job is active
- [ ] Manual fetch returns success
- [ ] Data appears in Firestore
- [ ] TAF API endpoint works
- [ ] METAR API endpoint works
- [ ] Health check returns OK
- [ ] Function logs show no errors

## Common Deployment Issues

### Issue: "Permission Denied" during deployment

**Solution:**

```powershell
# Re-authenticate
firebase login --reauth

# Or use a service account
firebase deploy --token YOUR_CI_TOKEN
```

### Issue: Cloud Scheduler job not created

**Solution:**

```powershell
# Enable Cloud Scheduler API
gcloud services enable cloudscheduler.googleapis.com

# Redeploy
firebase deploy --only functions:scheduledWeatherFetch
```

### Issue: Functions deployed but not working

**Solution:**

1. Check environment variables:
   ```powershell
   firebase functions:config:get
   ```
2. View logs:
   ```powershell
   firebase functions:log
   ```
3. Verify billing is enabled on GCP project

### Issue: "Resource exhausted" error

**Solution:** Enable billing on your Google Cloud Project

1. Go to [Google Cloud Console](https://console.cloud.google.com)
2. Navigate to **Billing**
3. Link a billing account

## Updating After Deployment

### Update Code

```powershell
# Make your code changes
# Then deploy
firebase deploy --only functions
```

### Update Config

```powershell
# Update environment variable
firebase functions:config:set sadis.client_id="NEW_VALUE"

# Redeploy to apply changes
firebase deploy --only functions
```

### Update Single Function

```powershell
# Deploy only one function
firebase deploy --only functions:scheduledWeatherFetch
```

## Rollback

If deployment causes issues:

```powershell
# List previous versions
firebase functions:log

# Rollback through Google Cloud Console:
# 1. Go to Cloud Functions
# 2. Select function
# 3. Click "Rollback" in versions tab
```

## Next Steps

1. Integrate API endpoints into your mobile app
2. Set up monitoring and alerts
3. Test with various airport codes
4. Monitor costs and usage
5. Set up backup procedures

## Support

If you encounter issues during deployment:

1. Check [Firebase Status](https://status.firebase.google.com/)
2. Review function logs: `firebase functions:log`
3. Check Google Cloud Console for detailed errors
4. Verify all prerequisites are met

---

**Deployment Complete!** 🎉

Your aviation weather pipeline is now live and will automatically fetch data every 5 minutes.
