# Quick Start Guide

Get up and running in 15 minutes!

## What This System Does

- ✅ Downloads aviation weather (TAF/METAR) every 5 minutes
- ✅ Stores data in Firebase cloud database
- ✅ Provides API for your app to retrieve weather by airport code

## Prerequisites (5 minutes)

1. **Install Node.js 18+**: https://nodejs.org
2. **Install Firebase CLI**:
   ```powershell
   npm install -g firebase-tools
   ```
3. **Have ready**: Your SADIS OPMET Client ID and Secret

## Setup (10 minutes)

### 1. Login to Firebase

```powershell
firebase login
```

### 2. Go to Project Folder

```powershell
cd "c:\Users\ABC\Desktop\weather aviation"
```

### 3. Initialize Project

```powershell
firebase init
```

Select: **Firestore** and **Functions** (JavaScript)

### 4. Install Dependencies

```powershell
npm install
cd functions
npm install
cd ..
```

### 5. Configure Credentials

```powershell
firebase functions:config:set sadis.client_id="YOUR_CLIENT_ID"
firebase functions:config:set sadis.client_secret="YOUR_CLIENT_SECRET"
firebase functions:config:set api.key="choose-a-secure-password"
```

### 6. Deploy

```powershell
firebase deploy
```

## Usage

### Get TAF Data

```
GET https://YOUR-REGION-PROJECT-ID.cloudfunctions.net/getTAF?icao=EBAW
```

Returns raw TAF text:

```
TAF EBAW 100211Z 1003/1012 12007KT CAVOK...
```

### Get METAR Data

```
GET https://YOUR-REGION-PROJECT-ID.cloudfunctions.net/getMETAR?icao=EBAW
```

Returns raw METAR text:

```
METAR EBAW 100250Z 12008KT 9999 FEW020...
```

## Testing

### Test with PowerShell

```powershell
# Get TAF
Invoke-RestMethod -Uri "YOUR_URL/getTAF?icao=EBAW"

# Get METAR
Invoke-RestMethod -Uri "YOUR_URL/getMETAR?icao=EBAW"
```

### Test with Browser

Simply open:

```
https://YOUR-REGION-PROJECT-ID.cloudfunctions.net/getTAF?icao=EBAW
```

### Manual Data Fetch

```powershell
$headers = @{ "X-API-Key" = "YOUR_API_KEY" }
Invoke-RestMethod -Uri "YOUR_URL/manualWeatherFetch" -Method POST -Headers $headers
```

## Verify It's Working

1. **Check Scheduler**:
   - Go to [Google Cloud Console](https://console.cloud.google.com) > Cloud Scheduler
   - Should see job running every 5 minutes

2. **Check Data**:
   - Go to [Firebase Console](https://console.firebase.google.com) > Firestore
   - Should see `TAF` and `METAR` collections with airport codes

3. **Check Logs**:
   ```powershell
   firebase functions:log
   ```

## Common Issues

### "No data found"

- Wait 5 minutes after deployment for first data fetch
- Or manually trigger: `/manualWeatherFetch`

### "Unauthorized" error

- Verify config: `firebase functions:config:get`
- Check Client ID/Secret are correct

### Scheduled function not running

- Enable Cloud Scheduler API in GCP Console
- Verify billing is enabled

## What's Next?

1. **Integrate with your app**: Use the API URLs in your mobile app
2. **Monitor**: Check logs regularly for errors
3. **Customize**: Edit schedule in `functions/index.js` if needed

## API Summary

| Endpoint              | Method | Parameter           | Returns        |
| --------------------- | ------ | ------------------- | -------------- |
| `/getTAF`             | GET    | `icao` (4 letters)  | TAF text       |
| `/getMETAR`           | GET    | `icao` (4 letters)  | METAR text     |
| `/manualWeatherFetch` | POST   | Header: `X-API-Key` | Fetch status   |
| `/healthCheck`        | GET    | None                | Service status |

## Need Help?

1. See full [README.md](README.md) for detailed documentation
2. See [DEPLOYMENT.md](DEPLOYMENT.md) for troubleshooting
3. Check function logs: `firebase functions:log`

## Example Integration (JavaScript)

```javascript
// In your app
async function getWeather(airportCode) {
  const url = `https://YOUR-PROJECT.cloudfunctions.net/getMETAR?icao=${airportCode}`;
  const response = await fetch(url);
  const weatherText = await response.text();
  return weatherText;
}

// Usage
const weather = await getWeather("EBAW");
console.log(weather); // "METAR EBAW 100250Z 12008KT..."
```

## Cost

Within Firebase free tier:

- **Cloud Functions**: FREE (under 2M invocations/month)
- **Firestore**: FREE (under 50K reads/day)
- **Scheduler**: FREE (first 3 jobs)

**Estimated monthly cost**: $0 (for typical usage)

---

**You're all set!** 🚀 Your weather pipeline is running automatically.
