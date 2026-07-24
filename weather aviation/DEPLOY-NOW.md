# Firebase Deployment Instructions

## ✅ Firebase CLI Installed Successfully!

Now follow these steps to deploy your aviation weather system:

---

## STEP 1: Login to Firebase

Run this command and follow the prompts:

```powershell
firebase login
```

This will:
- Open a browser window
- Ask you to login with the Google account that has Firebase access
- Grant permissions to Firebase CLI

---

## STEP 2: Initialize Firebase Project

```powershell
firebase init
```

**Answer the prompts:**

1. **"Which Firebase features?"** 
   - Select: `Functions` and `Firestore` (use Space to select, Enter to confirm)

2. **"Please select an option:"**
   - Choose: `Use an existing project`

3. **"Select a default Firebase project:"**
   - Choose the project your client gave you access to

4. **"What language would you like to use?"**
   - Select: `JavaScript`

5. **"Do you want to use ESLint?"**
   - Answer: `Yes`

6. **"Overwrite files?"**
   - If asked about overwriting, answer: `No` (keep existing files)

7. **"Install dependencies now?"**
   - Answer: `No` (already installed)

---

## STEP 3: Configure SADIS Credentials

Set your SADIS OPMET API credentials:

```powershell
# Set Client ID
firebase functions:config:set sadis.client_id="9ufkhw4jVPz12_Wil2OKKYrUGiEa"

# Set Client Secret (GET THIS FROM YOUR CLIENT!)
firebase functions:config:set sadis.client_secret="YOUR_SECRET_HERE"

# Optional: Set API key for manual fetch endpoint
firebase functions:config:set api.key="your-random-api-key-123"
```

**⚠️ Important:** Replace `YOUR_SECRET_HERE` with your actual SADIS client secret!

---

## STEP 4: Deploy to Firebase

Deploy your functions:

```powershell
firebase deploy --only functions
```

This will:
- Upload all your code
- Create 5 Cloud Functions
- Set up Firestore
- Take about 3-5 minutes

**Expected output:**
```
✔  functions: Finished running deploy script
✔  functions[scheduledWeatherFetch]: Successful create operation
✔  functions[getTAF]: Successful create operation
✔  functions[getMETAR]: Successful create operation
✔  functions[healthCheck]: Successful create operation
✔  functions[manualWeatherFetch]: Successful create operation

Function URLs:
  getTAF: https://us-central1-YOUR-PROJECT.cloudfunctions.net/getTAF
  getMETAR: https://us-central1-YOUR-PROJECT.cloudfunctions.net/getMETAR
  healthCheck: https://us-central1-YOUR-PROJECT.cloudfunctions.net/healthCheck
  manualWeatherFetch: https://us-central1-YOUR-PROJECT.cloudfunctions.net/manualWeatherFetch
```

**📝 SAVE THESE URLs!** Your mobile app will use them.

---

## STEP 5: Enable Cloud Scheduler

After deployment, enable the automatic scheduler:

1. Go to: https://console.cloud.google.com/
2. Select your Firebase project
3. Search for "Cloud Scheduler" in the search bar
4. Click on your `scheduledWeatherFetch` job
5. Click "Enable" or "Force Run" button

The system will now fetch weather data every 5 minutes automatically!

---

## STEP 6: Test Your Deployment

### Test 1: Health Check
```powershell
curl "https://YOUR-PROJECT.cloudfunctions.net/healthCheck"
```

Expected: `{"status":"OK","service":"Aviation Weather Pipeline","timestamp":"..."}`

### Test 2: Trigger Manual Fetch
```powershell
curl "https://YOUR-PROJECT.cloudfunctions.net/manualWeatherFetch?apiKey=YOUR_API_KEY"
```

This downloads weather data immediately (instead of waiting for scheduler).

### Test 3: Query Weather Data
Wait 5-10 minutes after manual fetch, then test:

```powershell
# Get TAF for an airport
curl "https://YOUR-PROJECT.cloudfunctions.net/getTAF?icao=KJFK"

# Get METAR for an airport
curl "https://YOUR-PROJECT.cloudfunctions.net/getMETAR?icao=KJFK"
```

If you get data back (weather text), it's working! ✅

---

## STEP 7: Monitor Your System

### View Logs:
```powershell
firebase functions:log
```

### Or in Firebase Console:
1. Go to: https://console.firebase.google.com/
2. Select your project
3. Go to **Functions** → See execution logs
4. Go to **Firestore Database** → See stored weather data

---

## Common Issues & Solutions

### Issue: "Permission denied"
**Solution:** Make sure you logged in with the correct Google account that has access to the Firebase project.

### Issue: "Client secret error" during data fetch
**Solution:** Double-check your SADIS client secret is correct:
```powershell
firebase functions:config:get
```

### Issue: "No data found" when querying airports
**Solution:** Wait 5-10 minutes for the first data fetch, or trigger manual fetch.

### Issue: Deployment fails
**Solution:** 
1. Check you're in the correct directory: `cd "C:\Users\ABC\Desktop\weather aviation"`
2. Verify functions folder exists: `dir functions`
3. Try: `firebase deploy --only functions --debug`

---

## 🎉 Success Checklist

After completing all steps:

- [ ] Firebase CLI installed
- [ ] Logged in with `firebase login`
- [ ] Project initialized with `firebase init`
- [ ] SADIS credentials configured
- [ ] Functions deployed successfully
- [ ] Cloud Scheduler enabled
- [ ] Function URLs saved
- [ ] Health check returns OK
- [ ] Weather data queryable
- [ ] Logs show successful fetches

---

## Next: Update Your Mobile App

Replace your FAA weather API endpoints with your new Firebase URLs:

```
Old: https://aviationweather.gov/api/data/taf?ids=KJFK
New: https://YOUR-PROJECT.cloudfunctions.net/getTAF?icao=KJFK

Old: https://aviationweather.gov/api/data/metar?ids=KJFK
New: https://YOUR-PROJECT.cloudfunctions.net/getMETAR?icao=KJFK
```

Your system will now provide weather from SADIS OPMET (larger airport database) updating every 5 minutes!

---

## Need Help?

Check the logs:
```powershell
firebase functions:log
```

Or contact support with the error message.
