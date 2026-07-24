# API Documentation

REST API for Aviation Weather Data

**Base URL**: `https://[REGION]-[PROJECT_ID].cloudfunctions.net`

---

## Endpoints

### 1. Get TAF (Terminal Aerodrome Forecast)

Retrieve the latest TAF report for a specific airport.

**Endpoint**: `/getTAF`

**Method**: `GET`

**Parameters**:
| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| `icao` | string | Yes | 4-letter ICAO airport code (e.g., EBAW) |

**Request Example**:

```
GET /getTAF?icao=EBAW
```

**cURL Example**:

```bash
curl "https://us-central1-your-project.cloudfunctions.net/getTAF?icao=EBAW"
```

**Success Response**:

- **Status Code**: 200 OK
- **Content-Type**: text/plain
- **Body**: Raw TAF report text

```
TAF EBAW 100211Z 1003/1012 12007KT CAVOK
    BECMG 1006/1008 SCT010 BKN014
    TEMPO 1008/1012 3500 -RADZ SCT004 BKN007=
```

**Error Responses**:

| Status Code | Description            | Response Body                                     |
| ----------- | ---------------------- | ------------------------------------------------- |
| 400         | Missing ICAO parameter | `{"error": "Airport ICAO code is required"}`      |
| 404         | No data found          | `{"error": "No TAF data found for airport EBAW"}` |
| 500         | Server error           | `{"error": "Internal server error"}`              |

---

### 2. Get METAR (Meteorological Aerodrome Report)

Retrieve the latest METAR or SPECI report for a specific airport.

**Endpoint**: `/getMETAR`

**Method**: `GET`

**Parameters**:
| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| `icao` | string | Yes | 4-letter ICAO airport code (e.g., EBAW) |

**Request Example**:

```
GET /getMETAR?icao=EBAW
```

**cURL Example**:

```bash
curl "https://us-central1-your-project.cloudfunctions.net/getMETAR?icao=EBAW"
```

**Success Response**:

- **Status Code**: 200 OK
- **Content-Type**: text/plain
- **Body**: Raw METAR or SPECI report text

```
METAR EBAW 100250Z 12008KT 9999 FEW020 SCT030 08/06 Q1015=
```

**Note**: This endpoint returns either METAR or SPECI data, whichever is most recent for the airport.

**Error Responses**:

| Status Code | Description            | Response Body                                       |
| ----------- | ---------------------- | --------------------------------------------------- |
| 400         | Missing ICAO parameter | `{"error": "Airport ICAO code is required"}`        |
| 404         | No data found          | `{"error": "No METAR data found for airport EBAW"}` |
| 500         | Server error           | `{"error": "Internal server error"}`                |

---

### 3. Health Check

Check if the API service is running.

**Endpoint**: `/healthCheck`

**Method**: `GET`

**Parameters**: None

**Request Example**:

```
GET /healthCheck
```

**Success Response**:

- **Status Code**: 200 OK
- **Content-Type**: application/json

```json
{
  "status": "OK",
  "service": "Aviation Weather Pipeline",
  "timestamp": "2026-02-16T10:30:00.000Z"
}
```

---

### 4. Manual Weather Fetch (Admin)

Manually trigger a weather data fetch. Requires authentication.

**Endpoint**: `/manualWeatherFetch`

**Method**: `POST`

**Headers**:
| Header | Value |
|--------|-------|
| `X-API-Key` | Your API authentication key |

**Request Example**:

```
POST /manualWeatherFetch
X-API-Key: your_api_key_here
```

**cURL Example**:

```bash
curl -X POST \
  -H "X-API-Key: your_api_key_here" \
  "https://us-central1-your-project.cloudfunctions.net/manualWeatherFetch"
```

**Success Response**:

- **Status Code**: 200 OK
- **Content-Type**: application/json

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

**Error Responses**:

| Status Code | Description             | Response Body                                  |
| ----------- | ----------------------- | ---------------------------------------------- |
| 401         | Invalid/missing API key | `{"error": "Unauthorized"}`                    |
| 500         | Fetch failed            | `{"success": false, "error": "Error message"}` |

---

## Integration Examples

### JavaScript/TypeScript

```javascript
// Get TAF data
async function getTAF(icao) {
  const url = `https://YOUR-PROJECT.cloudfunctions.net/getTAF?icao=${icao}`;
  const response = await fetch(url);

  if (!response.ok) {
    throw new Error(`HTTP ${response.status}: ${await response.text()}`);
  }

  return await response.text();
}

// Get METAR data
async function getMETAR(icao) {
  const url = `https://YOUR-PROJECT.cloudfunctions.net/getMETAR?icao=${icao}`;
  const response = await fetch(url);

  if (!response.ok) {
    throw new Error(`HTTP ${response.status}: ${await response.text()}`);
  }

  return await response.text();
}

// Usage
try {
  const taf = await getTAF("EBAW");
  console.log("TAF:", taf);

  const metar = await getMETAR("EBAW");
  console.log("METAR:", metar);
} catch (error) {
  console.error("Error fetching weather:", error);
}
```

### React Hook

```javascript
import { useState, useEffect } from "react";

function useWeather(icao, type = "METAR") {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const endpoint = type === "TAF" ? "getTAF" : "getMETAR";
    const url = `https://YOUR-PROJECT.cloudfunctions.net/${endpoint}?icao=${icao}`;

    fetch(url)
      .then((res) => {
        if (!res.ok) throw new Error(`HTTP ${res.status}`);
        return res.text();
      })
      .then((data) => {
        setData(data);
        setLoading(false);
      })
      .catch((err) => {
        setError(err.message);
        setLoading(false);
      });
  }, [icao, type]);

  return { data, loading, error };
}

// Usage in component
function WeatherDisplay({ airport }) {
  const { data, loading, error } = useWeather(airport, "METAR");

  if (loading) return <div>Loading...</div>;
  if (error) return <div>Error: {error}</div>;
  return <pre>{data}</pre>;
}
```

### Python

```python
import requests

def get_taf(icao: str) -> str:
    """Get TAF data for an airport."""
    url = f"https://YOUR-PROJECT.cloudfunctions.net/getTAF"
    params = {"icao": icao}

    response = requests.get(url, params=params)
    response.raise_for_status()

    return response.text

def get_metar(icao: str) -> str:
    """Get METAR data for an airport."""
    url = f"https://YOUR-PROJECT.cloudfunctions.net/getMETAR"
    params = {"icao": icao}

    response = requests.get(url, params=params)
    response.raise_for_status()

    return response.text

# Usage
try:
    taf = get_taf("EBAW")
    print(f"TAF: {taf}")

    metar = get_metar("EBAW")
    print(f"METAR: {metar}")
except requests.exceptions.HTTPError as e:
    print(f"Error: {e}")
```

### Swift (iOS)

```swift
import Foundation

func getWeather(icao: String, type: String, completion: @escaping (Result<String, Error>) -> Void) {
    let endpoint = type == "TAF" ? "getTAF" : "getMETAR"
    let urlString = "https://YOUR-PROJECT.cloudfunctions.net/\(endpoint)?icao=\(icao)"

    guard let url = URL(string: urlString) else {
        completion(.failure(NSError(domain: "Invalid URL", code: 0)))
        return
    }

    URLSession.shared.dataTask(with: url) { data, response, error in
        if let error = error {
            completion(.failure(error))
            return
        }

        guard let data = data,
              let weatherText = String(data: data, encoding: .utf8) else {
            completion(.failure(NSError(domain: "Invalid data", code: 0)))
            return
        }

        completion(.success(weatherText))
    }.resume()
}

// Usage
getWeather(icao: "EBAW", type: "METAR") { result in
    switch result {
    case .success(let weather):
        print("METAR: \(weather)")
    case .failure(let error):
        print("Error: \(error)")
    }
}
```

### Kotlin (Android)

```kotlin
import kotlinx.coroutines.*
import java.net.URL

suspend fun getWeather(icao: String, type: String): String {
    return withContext(Dispatchers.IO) {
        val endpoint = if (type == "TAF") "getTAF" else "getMETAR"
        val url = "https://YOUR-PROJECT.cloudfunctions.net/$endpoint?icao=$icao"
        URL(url).readText()
    }
}

// Usage
lifecycleScope.launch {
    try {
        val metar = getWeather("EBAW", "METAR")
        println("METAR: $metar")
    } catch (e: Exception) {
        println("Error: ${e.message}")
    }
}
```

---

## Response Format

All weather data is returned as **plain text** in standard ICAO format.

### TAF Format

```
TAF <ICAO> <ISSUE_TIME> <VALID_PERIOD> <FORECAST>
```

Example:

```
TAF EBAW 100211Z 1003/1012 12007KT CAVOK
    BECMG 1006/1008 SCT010 BKN014
    TEMPO 1008/1012 3500 -RADZ SCT004 BKN007=
```

### METAR Format

```
METAR <ICAO> <TIME> <WIND> <VISIBILITY> <CLOUDS> <TEMP>/<DEWPOINT> <PRESSURE>
```

Example:

```
METAR EBAW 100250Z 12008KT 9999 FEW020 SCT030 08/06 Q1015=
```

### SPECI Format

Same as METAR, but starts with "SPECI":

```
SPECI EBAW 100255Z 15012KT 8000 RA SCT015 BKN025 07/05 Q1014=
```

---

## Rate Limits

- **No enforced rate limits** currently
- Data updates every 5 minutes
- Recommended: Cache responses for 5 minutes on client side
- For high-volume usage, please contact administrator

---

## CORS

CORS is enabled for all origins by default. To restrict:

1. Contact administrator
2. Provide your domain name
3. CORS headers will be updated

---

## Data Freshness

- **TAF**: Updated approximately every 6 hours per airport
- **METAR**: Updated approximately every 30 minutes per airport
- **SPECI**: Published when significant weather changes occur
- **Pipeline**: Checks for new data every 5 minutes

If no recent data exists for an airport, a 404 error is returned.

---

## Airport Codes

This API uses **ICAO airport codes** (not IATA codes).

Examples:

- ✅ EBAW (Brussels, Belgium)
- ✅ KJFK (New York JFK, USA)
- ✅ LFPG (Paris CDG, France)
- ❌ BRU (IATA code - won't work)
- ❌ JFK (IATA code - won't work)

Find ICAO codes at: https://www.airport-data.com

---

## Error Handling

### Best Practices

1. **Always check response status**

   ```javascript
   if (!response.ok) {
     // Handle error
   }
   ```

2. **Implement retry logic** for network errors

   ```javascript
   async function fetchWithRetry(url, retries = 3) {
     for (let i = 0; i < retries; i++) {
       try {
         return await fetch(url);
       } catch (error) {
         if (i === retries - 1) throw error;
         await new Promise((r) => setTimeout(r, 1000 * (i + 1)));
       }
     }
   }
   ```

3. **Handle 404 gracefully**

   ```javascript
   if (response.status === 404) {
     // Show user-friendly message: "No weather data available for this airport"
   }
   ```

4. **Cache responses**

   ```javascript
   const cache = new Map();

   async function getCachedWeather(icao) {
     const cacheKey = `METAR_${icao}`;
     const cached = cache.get(cacheKey);

     if (cached && Date.now() - cached.timestamp < 5 * 60 * 1000) {
       return cached.data;
     }

     const data = await getMETAR(icao);
     cache.set(cacheKey, { data, timestamp: Date.now() });
     return data;
   }
   ```

---

## Support

For API issues or questions:

- **Technical issues**: Check Cloud Functions logs
- **Feature requests**: Contact project administrator
- **Service status**: Use `/healthCheck` endpoint

---

## Changelog

### v1.0.0 (2026-02-16)

- Initial API release
- TAF and METAR endpoints
- Automatic 5-minute updates
- CORS enabled

---

**Last Updated**: February 16, 2026
