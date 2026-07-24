# Example Usage & Testing

Quick examples for testing the aviation weather pipeline.

## PowerShell Examples

### 1. Test Health Check

```powershell
Invoke-RestMethod -Uri "https://YOUR-REGION-PROJECT.cloudfunctions.net/healthCheck"
```

**Expected Output:**

```json
{
  "status": "OK",
  "service": "Aviation Weather Pipeline",
  "timestamp": "2026-02-16T10:30:00.000Z"
}
```

---

### 2. Manual Trigger (Testing)

```powershell
$headers = @{
    "X-API-Key" = "your_api_key_here"
}

Invoke-RestMethod -Uri "https://YOUR-REGION-PROJECT.cloudfunctions.net/manualWeatherFetch" `
                  -Method POST `
                  -Headers $headers
```

**Expected Output:**

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

---

### 3. Get TAF Data

```powershell
# Single airport
Invoke-RestMethod -Uri "https://YOUR-REGION-PROJECT.cloudfunctions.net/getTAF?icao=EBAW"

# Multiple airports (in loop)
$airports = @("EBAW", "LFPG", "EHAM", "EGLL", "KJFK")
foreach ($airport in $airports) {
    Write-Host "`n--- $airport TAF ---"
    Invoke-RestMethod -Uri "https://YOUR-REGION-PROJECT.cloudfunctions.net/getTAF?icao=$airport"
}
```

**Expected Output:**

```
TAF EBAW 100211Z 1003/1012 12007KT CAVOK
    BECMG 1006/1008 SCT010 BKN014
    TEMPO 1008/1012 3500 -RADZ SCT004 BKN007=
```

---

### 4. Get METAR Data

```powershell
Invoke-RestMethod -Uri "https://YOUR-REGION-PROJECT.cloudfunctions.net/getMETAR?icao=EBAW"
```

**Expected Output:**

```
METAR EBAW 100250Z 12008KT 9999 FEW020 SCT030 08/06 Q1015=
```

---

### 5. Error Handling Example

```powershell
# Test invalid airport code
try {
    Invoke-RestMethod -Uri "https://YOUR-REGION-PROJECT.cloudfunctions.net/getTAF?icao=XXXX"
} catch {
    Write-Host "Error: $($_.Exception.Message)"
    Write-Host "Status: $($_.Exception.Response.StatusCode)"
}
```

---

### 6. Batch Query Multiple Airports

```powershell
function Get-WeatherBatch {
    param(
        [string[]]$Airports,
        [string]$Type = "METAR"
    )

    $endpoint = if ($Type -eq "TAF") { "getTAF" } else { "getMETAR" }
    $baseUrl = "https://YOUR-REGION-PROJECT.cloudfunctions.net"

    $results = @{}

    foreach ($airport in $Airports) {
        try {
            $weather = Invoke-RestMethod -Uri "$baseUrl/$endpoint?icao=$airport"
            $results[$airport] = @{
                success = $true
                data = $weather
            }
        } catch {
            $results[$airport] = @{
                success = $false
                error = $_.Exception.Message
            }
        }
    }

    return $results
}

# Usage
$airports = @("EBAW", "LFPG", "EHAM", "EGLL")
$weather = Get-WeatherBatch -Airports $airports -Type "METAR"

# Display results
foreach ($airport in $airports) {
    Write-Host "`n=== $airport ==="
    if ($weather[$airport].success) {
        Write-Host $weather[$airport].data
    } else {
        Write-Host "Error: $($weather[$airport].error)" -ForegroundColor Red
    }
}
```

---

### 7. Monitor Script (Check Status Every Minute)

```powershell
while ($true) {
    $timestamp = Get-Date -Format "yyyy-MM-dd HH:mm:ss"

    try {
        $health = Invoke-RestMethod -Uri "https://YOUR-REGION-PROJECT.cloudfunctions.net/healthCheck"
        Write-Host "[$timestamp] Status: $($health.status)" -ForegroundColor Green
    } catch {
        Write-Host "[$timestamp] Error: $($_.Exception.Message)" -ForegroundColor Red
    }

    Start-Sleep -Seconds 60
}
```

---

## JavaScript/Node.js Examples

### Basic Usage

```javascript
const axios = require("axios");

const BASE_URL = "https://YOUR-REGION-PROJECT.cloudfunctions.net";

async function getWeather(icao, type = "METAR") {
  const endpoint = type === "TAF" ? "getTAF" : "getMETAR";
  const url = `${BASE_URL}/${endpoint}?icao=${icao}`;

  try {
    const response = await axios.get(url);
    return {
      success: true,
      data: response.data,
    };
  } catch (error) {
    return {
      success: false,
      error: error.response?.data || error.message,
    };
  }
}

// Usage
(async () => {
  const metar = await getWeather("EBAW", "METAR");
  console.log("METAR:", metar);

  const taf = await getWeather("EBAW", "TAF");
  console.log("TAF:", taf);
})();
```

### With Retry Logic

```javascript
async function getWeatherWithRetry(icao, type = "METAR", maxRetries = 3) {
  const endpoint = type === "TAF" ? "getTAF" : "getMETAR";
  const url = `${BASE_URL}/${endpoint}?icao=${icao}`;

  for (let i = 0; i < maxRetries; i++) {
    try {
      const response = await axios.get(url);
      return response.data;
    } catch (error) {
      if (i === maxRetries - 1) throw error;

      // Wait before retry (exponential backoff)
      await new Promise((resolve) => setTimeout(resolve, 1000 * (i + 1)));
    }
  }
}
```

---

## Python Examples

### Basic Usage

```python
import requests

BASE_URL = "https://YOUR-REGION-PROJECT.cloudfunctions.net"

def get_weather(icao: str, weather_type: str = "METAR") -> dict:
    endpoint = "getTAF" if weather_type == "TAF" else "getMETAR"
    url = f"{BASE_URL}/{endpoint}"

    try:
        response = requests.get(url, params={"icao": icao})
        response.raise_for_status()
        return {
            "success": True,
            "data": response.text
        }
    except requests.exceptions.RequestException as e:
        return {
            "success": False,
            "error": str(e)
        }

# Usage
metar = get_weather("EBAW", "METAR")
print(f"METAR: {metar}")

taf = get_weather("EBAW", "TAF")
print(f"TAF: {taf}")
```

### Batch Request

```python
def get_weather_batch(airports: list, weather_type: str = "METAR") -> dict:
    results = {}

    for airport in airports:
        result = get_weather(airport, weather_type)
        results[airport] = result

    return results

# Usage
airports = ["EBAW", "LFPG", "EHAM", "EGLL"]
weather_data = get_weather_batch(airports, "METAR")

for airport, data in weather_data.items():
    print(f"\n=== {airport} ===")
    if data["success"]:
        print(data["data"])
    else:
        print(f"Error: {data['error']}")
```

---

## cURL Examples

### Get METAR

```bash
curl "https://YOUR-REGION-PROJECT.cloudfunctions.net/getMETAR?icao=EBAW"
```

### Get TAF

```bash
curl "https://YOUR-REGION-PROJECT.cloudfunctions.net/getTAF?icao=EBAW"
```

### Manual Trigger

```bash
curl -X POST \
  -H "X-API-Key: your_api_key" \
  "https://YOUR-REGION-PROJECT.cloudfunctions.net/manualWeatherFetch"
```

### Health Check

```bash
curl "https://YOUR-REGION-PROJECT.cloudfunctions.net/healthCheck"
```

---

## Common Test Airports

Use these airports for testing (known to have reliable data):

| ICAO | Airport         | Country     |
| ---- | --------------- | ----------- |
| EBAW | Brussels        | Belgium     |
| LFPG | Paris CDG       | France      |
| EHAM | Amsterdam       | Netherlands |
| EGLL | London Heathrow | UK          |
| KJFK | New York JFK    | USA         |
| KLAX | Los Angeles     | USA         |
| EDDF | Frankfurt       | Germany     |
| LEMD | Madrid          | Spain       |
| LIRF | Rome            | Italy       |
| OMDB | Dubai           | UAE         |

---

## Troubleshooting Tests

### No Data Available

```powershell
# Manually trigger a fetch first
$headers = @{ "X-API-Key" = "your_api_key" }
Invoke-RestMethod -Uri "YOUR_URL/manualWeatherFetch" -Method POST -Headers $headers

# Wait 30 seconds
Start-Sleep -Seconds 30

# Try again
Invoke-RestMethod -Uri "YOUR_URL/getMETAR?icao=EBAW"
```

### Check Function Logs

```powershell
# View recent logs
firebase functions:log

# Follow logs in real-time
firebase functions:log --tail

# Filter by function
firebase functions:log --only getMETAR
```

---

## Performance Testing

### Response Time Test

```powershell
Measure-Command {
    Invoke-RestMethod -Uri "YOUR_URL/getMETAR?icao=EBAW"
}
```

Should be under 1 second typically.

---

## Integration Testing Checklist

- [ ] Health check returns OK
- [ ] Manual fetch works with API key
- [ ] Manual fetch fails without API key
- [ ] TAF endpoint returns data for valid airport
- [ ] TAF endpoint returns 404 for invalid airport
- [ ] METAR endpoint returns data for valid airport
- [ ] METAR endpoint returns 400 for missing ICAO
- [ ] Response times under 2 seconds
- [ ] Data updates after scheduled run
- [ ] Multiple airports work correctly

---

**Ready to test!** Run these examples to verify your deployment is working correctly.
