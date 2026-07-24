# Aviation Weather Data Pipeline

Automated system for downloading aviation weather data from SADIS OPMET API and serving it through a REST API.

## Overview

This project provides:

- **Automated data collection**: Downloads TAF, METAR, and SPECI reports every 5 minutes
- **Cloud storage**: Stores data in Google Firebase Firestore
- **REST API**: Exposes endpoints for retrieving weather data by airport code
- **OAuth 2.0**: Secure authentication with SADIS OPMET API

## Architecture

```
┌─────────────────────┐
│   SADIS OPMET API   │  (UK Met Office)
└──────────┬──────────┘
           │ OAuth 2.0
           │ Every 5 min
┌──────────▼──────────┐
│  Cloud Functions    │
│  - Data Fetcher     │
│  - Storage Manager  │
└──────────┬──────────┘
           │
┌──────────▼──────────┐
│    Firestore DB     │
│   Collections:      │
│   - TAF            │
│   - METAR/SPECI    │
└──────────┬──────────┘
           │
┌──────────▼──────────┐
│    REST API         │
│  - GET /getTAF      │
│  - GET /getMETAR    │
└─────────────────────┘
```

## Data Storage Logic

### Collections

- **TAF**: Terminal Aerodrome Forecasts (updated ~every 6 hours per airport)
- **METAR**: Meteorological Aerodrome Reports (updated ~every 30 minutes per airport)

### Key Rules

1. Each airport (ICAO code) has ONE document per collection
2. METAR and SPECI reports share the same collection (METAR)
3. Newer reports automatically overwrite older ones for the same airport
4. Only raw text content is stored (not file metadata)

### Example Document Structure

```json
{
  "icao": "EBAW",
  "content": "TAF EBAW 100211Z 1003/1012 12007KT CAVOK...",
  "reportType": "TAF",
  "updatedAt": "2026-02-16T10:30:00Z",
  "fetchedAt": "2026-02-16T10:30:15Z"
}
```

## Prerequisites

Before deployment, ensure you have:

1. **Node.js 18+** installed
2. **Firebase CLI** installed: `npm install -g firebase-tools`
3. **Google Cloud Project** with Firebase enabled
4. **SADIS OPMET API credentials**:
   - Client ID
   - Client Secret
   - API access approval from UK Met Office

## Installation & Setup

### 1. Clone/Download Project

```powershell
cd "c:\Users\ABC\Desktop\weather aviation"
```

### 2. Install Dependencies

```powershell
# Install root dependencies
npm install

# Install functions dependencies
cd functions
npm install
cd ..
```

### 3. Initialize Firebase

```powershell
# Login to Firebase
firebase login

# Initialize project (if not already done)
firebase init

# Select:
# - Functions (Cloud Functions)
# - Firestore (Cloud Firestore)
# - Use existing project or create new one
```

### 4. Configure Environment Variables

#### Option A: Using Firebase CLI (Recommended)

```powershell
# Set SADIS OPMET credentials
firebase functions:config:set sadis.client_id="YOUR_CLIENT_ID"
firebase functions:config:set sadis.client_secret="YOUR_CLIENT_SECRET"
firebase functions:config:set sadis.token_url="https://api-manager.api-management.metoffice.cloud/oauth2/token"
firebase functions:config:set sadis.base_url="https://gateway.api-management.metoffice.cloud/sadis-opmet/1"

# Set API authentication key (for manual trigger endpoint)
firebase functions:config:set api.key="YOUR_SECURE_API_KEY"

# View current config
firebase functions:config:get
```

#### Option B: Using .env file (Local Testing Only)

```powershell
# Copy example file
cp .env.example .env

# Edit .env file with your credentials
# NOTE: This only works for local emulator testing
```

### 5. Deploy to Firebase

```powershell
# Deploy all functions
firebase deploy --only functions

# Or deploy specific function
firebase deploy --only functions:scheduledWeatherFetch
```

### 6. Set Up Cloud Scheduler (First Time Only)

After first deployment, enable Cloud Scheduler in Google Cloud Console:

1. Go to [Google Cloud Console](https://console.cloud.google.com)
2. Select your project
3. Navigate to **Cloud Scheduler**
4. Enable the API if prompted
5. The scheduled function will appear automatically

## API Endpoints

Once deployed, your functions will be available at:

```
https://REGION-PROJECT_ID.cloudfunctions.net/FUNCTION_NAME
```

### Get TAF Data

**Endpoint**: `GET /getTAF`

**Parameters**:

- `icao` (required): 4-letter airport code

**Example Request**:

```bash
curl "https://us-central1-your-project.cloudfunctions.net/getTAF?icao=EBAW"
```

**Success Response** (200):

```
TAF EBAW 100211Z 1003/1012 12007KT CAVOK
    BECMG 1006/1008 SCT010 BKN014
    TEMPO 1008/1012 3500 -RADZ SCT004 BKN007=
```

**Error Response** (404):

```json
{
  "error": "No TAF data found for airport EBAW"
}
```

### Get METAR Data

**Endpoint**: `GET /getMETAR`

**Parameters**:

- `icao` (required): 4-letter airport code

**Example Request**:

```bash
curl "https://us-central1-your-project.cloudfunctions.net/getMETAR?icao=EBAW"
```

**Success Response** (200):

```
METAR EBAW 100250Z 12008KT 9999 FEW020 SCT030 08/06 Q1015=
```

**Note**: This endpoint returns either METAR or SPECI data (whichever is most recent).

### Manual Trigger

**Endpoint**: `POST /manualWeatherFetch`

**Headers**:

- `X-API-Key`: Your API authentication key

**Example Request**:

```bash
curl -X POST \
  -H "X-API-Key: YOUR_API_KEY" \
  "https://us-central1-your-project.cloudfunctions.net/manualWeatherFetch"
```

**Success Response** (200):

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

### Health Check

**Endpoint**: `GET /healthCheck`

**Example Request**:

```bash
curl "https://us-central1-your-project.cloudfunctions.net/healthCheck"
```

**Response**:

```json
{
  "status": "OK",
  "service": "Aviation Weather Pipeline",
  "timestamp": "2026-02-16T10:30:00.000Z"
}
```

## Monitoring & Logs

### View Logs

```powershell
# View all function logs
firebase functions:log

# View logs for specific function
firebase functions:log --only scheduledWeatherFetch

# Follow logs in real-time
firebase functions:log --only scheduledWeatherFetch --tail
```

### Check Scheduled Runs

1. Go to [Google Cloud Console](https://console.cloud.google.com)
2. Navigate to **Cloud Scheduler**
3. View job history and success/failure rates

### Monitor Storage

```powershell
# Open Firebase Console
firebase open
# Navigate to Firestore Database to view stored data
```

## Testing

### Local Testing with Emulators

```powershell
# Start Firebase emulators
cd functions
npm run serve

# The emulator will provide local URLs:
# - Functions: http://localhost:5001
# - Firestore: http://localhost:8080
```

### Test Manual Fetch

```powershell
# Using PowerShell
$headers = @{
    "X-API-Key" = "YOUR_API_KEY"
}
Invoke-RestMethod -Uri "http://localhost:5001/PROJECT_ID/us-central1/manualWeatherFetch" `
                  -Method POST `
                  -Headers $headers
```

### Test API Endpoints

```powershell
# Test TAF endpoint
Invoke-RestMethod -Uri "http://localhost:5001/PROJECT_ID/us-central1/getTAF?icao=EBAW"

# Test METAR endpoint
Invoke-RestMethod -Uri "http://localhost:5001/PROJECT_ID/us-central1/getMETAR?icao=EBAW"
```

## Troubleshooting

### Issue: OAuth Token Errors

**Symptom**: "Failed to obtain OAuth token" or "401 Unauthorized"

**Solutions**:

1. Verify credentials are set correctly:
   ```powershell
   firebase functions:config:get
   ```
2. Ensure Client ID and Secret are valid in SADIS portal
3. Check token URL is correct
4. Clear token cache by redeploying function

### Issue: No Data Being Fetched

**Symptom**: Scheduled function runs but no data appears in Firestore

**Solutions**:

1. Check function logs for errors:
   ```powershell
   firebase functions:log --only scheduledWeatherFetch
   ```
2. Verify SADIS API is accessible (network/firewall)
3. Test manual fetch to isolate issue
4. Verify Firestore rules allow function writes

### Issue: API Returns 404

**Symptom**: "No TAF/METAR data found for airport XXXX"

**Possible Causes**:

1. Airport code not in SADIS OPMET database
2. Data hasn't been fetched yet (wait 5 minutes after deployment)
3. Airport code misspelled (must be 4 uppercase letters)

**Solutions**:

1. Manually trigger a fetch
2. Check Firestore console to see available airports
3. Verify ICAO code is correct

### Issue: Scheduled Function Not Running

**Symptom**: No automatic updates every 5 minutes

**Solutions**:

1. Enable Cloud Scheduler API in Google Cloud Console
2. Check Cloud Scheduler jobs are active
3. Verify billing is enabled on GCP project
4. Check function deployment was successful

## Cost Estimation

### Google Cloud/Firebase Costs

**Cloud Functions** (Free tier includes):

- 2M invocations/month
- 400K GB-seconds/month
- Expected: ~8,640 invocations/month (every 5 min) = **FREE**

**Firestore** (Free tier includes):

- 50K document reads/day
- 20K document writes/day
- Expected: ~15K writes/day = **FREE**

**Cloud Scheduler**:

- 3 jobs free
- Expected: 1 job = **FREE**

**Total estimated cost**: $0/month (within free tier)

_Note: Costs may increase with high API traffic or large data volumes_

## Security Best Practices

1. ✅ **Never commit credentials** to version control
2. ✅ **Use environment variables** for sensitive data
3. ✅ **Restrict Firestore access** (rules set to deny direct access)
4. ✅ **Enable CORS** only for trusted domains (update in index.js)
5. ✅ **Use HTTPS only** (enforced by Cloud Functions)
6. ✅ **Rotate API keys** periodically
7. ✅ **Monitor logs** for suspicious activity

## Maintenance

### Update Credentials

```powershell
# Update client ID
firebase functions:config:set sadis.client_id="NEW_CLIENT_ID"

# Update client secret
firebase functions:config:set sadis.client_secret="NEW_CLIENT_SECRET"

# Redeploy functions
firebase deploy --only functions
```

### Update Schedule Frequency

Edit [functions/index.js](functions/index.js):

```javascript
// Change from every 5 minutes to every 10 minutes
.schedule('*/10 * * * *')

// Change from every 5 minutes to every minute
.schedule('* * * * *')
```

Then redeploy:

```powershell
firebase deploy --only functions:scheduledWeatherFetch
```

### Backup Data

```powershell
# Export Firestore data
gcloud firestore export gs://YOUR_BUCKET/backups/$(date +%Y%m%d)
```

## Project Structure

```
weather aviation/
├── functions/                  # Cloud Functions code
│   ├── src/
│   │   ├── auth.js            # OAuth 2.0 token management
│   │   ├── dataFetcher.js     # SADIS OPMET API integration
│   │   ├── storageManager.js  # Firestore operations
│   │   └── api.js             # API endpoint logic
│   ├── index.js               # Main function exports
│   └── package.json           # Dependencies
├── firebase.json              # Firebase configuration
├── firestore.rules            # Security rules
├── firestore.indexes.json     # Database indexes
├── .env.example               # Environment template
├── .gitignore                # Git ignore rules
├── package.json              # Root dependencies
└── README.md                 # This file
```

## Support & Contact

For issues or questions:

1. Check the troubleshooting section above
2. Review Cloud Function logs
3. Check SADIS OPMET API documentation
4. Contact your Firebase project administrator

## License

This project is proprietary and confidential. Unauthorized copying or distribution is prohibited.

## Changelog

### Version 1.0.0 (2026-02-16)

- Initial release
- Automated data fetching every 5 minutes
- TAF and METAR/SPECI support
- REST API endpoints
- OAuth 2.0 authentication
- Firestore storage
- Cloud Functions deployment

---

**Last Updated**: February 16, 2026
**Author**: Developed for Aviation Weather Data Pipeline Project
