/**
 * Aviation Weather Data Pipeline
 * Main entry point for Firebase Cloud Functions
 */

const functions = require('firebase-functions');
const admin = require('firebase-admin');
const { fetchAndStoreWeatherData } = require('./src/dataFetcher');
const { getWeatherData } = require('./src/api');

// Initialize Firebase Admin
admin.initializeApp();

/**
 * Scheduled function that runs every 5 minutes
 * Downloads SADIS OPMET data and stores in Firestore
 */
exports.scheduledWeatherFetch = functions
  .runWith({
    timeoutSeconds: 540,
    memory: '512MB'
  })
  .pubsub
  .schedule('*/5 * * * *') // Run every 5 minutes
  .timeZone('UTC')
  .onRun(async (context) => {
    try {
      console.log('Starting scheduled weather data fetch...');
      const result = await fetchAndStoreWeatherData();
      console.log('Weather data fetch completed:', result);
      return result;
    } catch (error) {
      console.error('Error in scheduled fetch:', error);
      throw error;
    }
  });

/**
 * HTTP endpoint to manually trigger data fetch
 * Useful for testing and manual updates
 */
exports.manualWeatherFetch = functions
  .runWith({
    timeoutSeconds: 540,
    memory: '512MB'
  })
  .https
  .onRequest(async (req, res) => {
    // Simple API key authentication
    const apiKey = req.headers['x-api-key'] || req.query.apiKey;
    const expectedKey = functions.config().api?.key || process.env.API_AUTH_KEY;

    if (!apiKey || apiKey !== expectedKey) {
      res.status(401).json({ error: 'Unauthorized' });
      return;
    }

    try {
      console.log('Manual weather fetch triggered');
      const result = await fetchAndStoreWeatherData();
      res.status(200).json({
        success: true,
        message: 'Weather data fetched and stored successfully',
        data: result
      });
    } catch (error) {
      console.error('Error in manual fetch:', error);
      res.status(500).json({
        success: false,
        error: error.message
      });
    }
  });

/**
 * API endpoint to get TAF data for an airport
 * GET /getTAF?icao=EBAW
 */
exports.getTAF = functions
  .https
  .onRequest(async (req, res) => {
    // Set CORS headers
    res.set('Access-Control-Allow-Origin', '*');
    res.set('Access-Control-Allow-Methods', 'GET, POST');
    res.set('Access-Control-Allow-Headers', 'Content-Type, X-API-Key');

    if (req.method === 'OPTIONS') {
      res.status(204).send('');
      return;
    }

    try {
      const icao = req.query.icao || req.body?.icao;
      
      if (!icao) {
        res.status(400).json({ error: 'Airport ICAO code is required' });
        return;
      }

      const data = await getWeatherData('TAF', icao.toUpperCase());
      
      if (!data) {
        res.status(404).json({ 
          error: `No TAF data found for airport ${icao.toUpperCase()}` 
        });
        return;
      }

      // Return raw text response
      res.set('Content-Type', 'text/plain');
      res.status(200).send(data);
      
    } catch (error) {
      console.error('Error fetching TAF:', error);
      res.status(500).json({ error: 'Internal server error' });
    }
  });

/**
 * API endpoint to get METAR data for an airport
 * GET /getMETAR?icao=EBAW
 * Note: This returns either METAR or SPECI data (whichever is most recent)
 */
exports.getMETAR = functions
  .https
  .onRequest(async (req, res) => {
    // Set CORS headers
    res.set('Access-Control-Allow-Origin', '*');
    res.set('Access-Control-Allow-Methods', 'GET, POST');
    res.set('Access-Control-Allow-Headers', 'Content-Type, X-API-Key');

    if (req.method === 'OPTIONS') {
      res.status(204).send('');
      return;
    }

    try {
      const icao = req.query.icao || req.body?.icao;
      
      if (!icao) {
        res.status(400).json({ error: 'Airport ICAO code is required' });
        return;
      }

      const data = await getWeatherData('METAR', icao.toUpperCase());
      
      if (!data) {
        res.status(404).json({ 
          error: `No METAR data found for airport ${icao.toUpperCase()}` 
        });
        return;
      }

      // Return raw text response
      res.set('Content-Type', 'text/plain');
      res.status(200).send(data);
      
    } catch (error) {
      console.error('Error fetching METAR:', error);
      res.status(500).json({ error: 'Internal server error' });
    }
  });

/**
 * Health check endpoint
 */
exports.healthCheck = functions
  .https
  .onRequest((req, res) => {
    res.status(200).json({ 
      status: 'OK', 
      service: 'Aviation Weather Pipeline',
      timestamp: new Date().toISOString()
    });
  });
