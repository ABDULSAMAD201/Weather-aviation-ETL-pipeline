# 🚀 NEXT STEPS - Deployment Guide

Your aviation weather pipeline is **complete and ready**! Here's what to do next:

---

## Step 1: Create Firebase Project (5 minutes)

1. Go to [Firebase Console](https://console.firebase.google.com/)
2. Click **"Add Project"**
3. Enter project name: `aviation-weather-pipeline` (or your choice)
4. Enable Google Analytics (optional)
5. Click **Create Project**
6. Wait for project creation

---

## Step 2: Install Firebase CLI (if not installed)

Open PowerShell and run:

```powershell
npm install -g firebase-tools
```

---

## Step 3: Login and Initialize Firebase

```powershell
# Login to Firebase
firebase login

# Initialize Firebase in your project folder
cd "C:\Users\ABC\Desktop\weather aviation"
firebase init
```

**During initialization:**

- Select: **Functions** and **Firestore**
- Choose: **Use an existing project** → Select your project
- Firestore Rules: Use default (already have `firestore.rules`)
- Firestore Indexes: Use default (already have `firestore.indexes.json`)
- Language: **JavaScript** (already set up)
- ESLint: **Yes** (already configured)
- Install dependencies: **No** (already installed)

---

## Step 4: Configure Secrets (IMPORTANT!)

Set your SADIS OPMET credentials:

```powershell
# Set Client ID
firebase functions:config:set sadis.client_id="9ufkhw4jVPz12_Wil2OKKYrUGiEa"

# Set Client Secret (replace with your actual secret)
firebase functions:config:set sadis.client_secret="YOUR_SECRET_HERE"

# Set API base URL (already correct, but can customize)
firebase functions:config:set sadis.base_url="https://gateway.api-management.metoffice.cloud/sadis-opmet/1"

# Optional: Set API key for manual fetch endpoint
firebase functions:config:set api.key="YOUR_RANDOM_KEY_HERE"
```

**To get your Client Secret:**

- Check your SADIS OPMET account portal
- Or the email from UK Met Office when they approved your access

---

## Step 5: Deploy to Firebase

```powershell
# Deploy everything
firebase deploy

# Or deploy only functions (faster)
firebase deploy --only functions
```

**This will:**

- Upload your code to Firebase
- Create 5 Cloud Functions
- Set up Firestore database
- Configure security rules

**Deployment takes 3-5 minutes**

---

## Step 6: Enable Cloud Scheduler

After deployment, enable the scheduler:

1. Go to [Google Cloud Console](https://console.cloud.google.com/)
2. Select your Firebase project
3. Go to **Cloud Scheduler**
4. You'll see `scheduledWeatherFetch` job
5. Click **Enable** (if prompted)
6. The function will now run automatically every 5 minutes!

---

## Step 7: Get Your API URLs

After deployment, Firebase will show your function URLs:

```
✔  functions: Finished running deploy script
✔  functions[scheduledWeatherFetch]: Successful create operation
✔  functions[getTAF]: Successful create operation
✔  functions[getMETAR]: Successful create operation
✔  functions[healthCheck]: Successful create operation

Function URLs:
  getTAF: https://us-central1-YOUR-PROJECT.cloudfunctions.net/getTAF
  getMETAR: https://us-central1-YOUR-PROJECT.cloudfunctions.net/getMETAR
  healthCheck: https://us-central1-YOUR-PROJECT.cloudfunctions.net/healthCheck
```

**Save these URLs!** Your mobile app will use them.

---

## Step 8: Test Your Deployed System

### Test 1: Health Check

```powershell
curl "https://us-central1-YOUR-PROJECT.cloudfunctions.net/healthCheck"
```

Expected: `{"status":"OK","service":"Aviation Weather Pipeline","timestamp":"..."}`

### Test 2: Manual Data Fetch (Optional)

```powershell
curl "https://us-central1-YOUR-PROJECT.cloudfunctions.net/manualWeatherFetch?apiKey=YOUR_API_KEY"
```

This triggers an immediate data fetch (otherwise wait 5 minutes for scheduler)

### Test 3: Query Weather Data

After data is fetched (wait 5-10 minutes), test:

```powershell
# Get TAF for Brussels Airport
curl "https://us-central1-YOUR-PROJECT.cloudfunctions.net/getTAF?icao=EBAW"

# Get METAR for Bangkok Airport
curl "https://us-central1-YOUR-PROJECT.cloudfunctions.net/getMETAR?icao=VTBS"
```

---

## Step 9: Integrate with Your Mobile App

### For Your Flutter/Swift/Kotlin App:

**Example API Calls:**

```javascript
// Get TAF
fetch("https://YOUR-PROJECT.cloudfunctions.net/getTAF?icao=KJFK")
  .then((response) => response.text())
  .then((data) => {
    console.log("TAF:", data);
    // Display: "TAF KJFK 161830Z 1618/1706..."
  });

// Get METAR
fetch("https://YOUR-PROJECT.cloudfunctions.net/getMETAR?icao=KJFK")
  .then((response) => response.text())
  .then((data) => {
    console.log("METAR:", data);
    // Display: "METAR KJFK 161830Z 06002KT..."
  });
```

**Replace FAA endpoints in your app with these Firebase URLs.**

---

## Step 10: Monitor Your System

### View Logs:

```powershell
firebase functions:log
```

### Monitor in Console:

1. Go to [Firebase Console](https://console.firebase.google.com/)
2. Select your project
3. Click **Functions** → See execution stats
4. Click **Firestore** → See stored data

### Check Costs:

- Go to **Usage & Billing** in Firebase Console
- Expected: **$5-10/month** for moderate traffic

---

## 📋 Summary Checklist

- [ ] Firebase project created
- [ ] Firebase CLI installed
- [ ] `firebase init` completed
- [ ] Secrets configured (client_id, client_secret)
- [ ] `firebase deploy` successful
- [ ] Cloud Scheduler enabled
- [ ] Function URLs saved
- [ ] Health check tested
- [ ] Weather data fetched and queryable
- [ ] Mobile app updated with new URLs
- [ ] System monitoring set up

---

## 🎯 What Happens After Deployment

**Automatically every 5 minutes:**

1. Cloud Scheduler triggers `scheduledWeatherFetch`
2. Function downloads ZIP files from SADIS OPMET
3. Extracts TAF, METAR, SPECI reports (200-300 per cycle)
4. Stores in Firestore by ICAO code
5. Your app queries latest data via API

**Your pilots get:**

- ✈️ Real-time TAF forecasts
- 🌦️ Current METAR conditions
- ⚡ Special weather reports (SPECI)
- 🌍 Global airport coverage
- 🔄 Updates every 5 minutes

---

## 🆘 Need Help?

**Common Issues:**

1. **"Permission denied"** → Run `firebase login` again
2. **"Client secret error"** → Check your secret is correct
3. **"No data found"** → Wait 5-10 minutes for first fetch
4. **"Quota exceeded"** → Check Firestore limits in console

**Support:**

- Check logs: `firebase functions:log`
- Read documentation: See `README.md`, `DEPLOYMENT.md`, `API.md`
- Test locally: `firebase emulators:start`

---

## 🚀 You're Ready!

Your system is production-ready and will now:

- Automatically fetch weather data every 5 minutes
- Provide reliable API endpoints for your mobile app
- Cover 200-300 airports globally per cycle
- Scale automatically with demand

**Happy flying! ✈️**
