/**
 * Firestore Storage Manager
 * Handles storing and retrieving weather data from Firestore
 */

const admin = require('firebase-admin');

/**
 * Get Firestore instance
 */
function getFirestore() {
  return admin.firestore();
}

/**
 * Store weather data in Firestore
 * 
 * Storage structure:
 * - Collection: TAF or METAR
 * - Document ID: ICAO code (e.g., "EBAW")
 * - Fields:
 *   - content: raw text content
 *   - reportType: TAF, METAR, or SPECI
 *   - icao: airport code
 *   - updatedAt: timestamp
 *   - fetchedAt: when data was downloaded
 * 
 * @param {string} collection - Either 'TAF' or 'METAR'
 * @param {string} icao - 4-letter airport code
 * @param {string} content - Raw weather report text
 * @param {string} reportType - TAF, METAR, or SPECI
 * @returns {Promise<void>}
 */
async function storeWeatherData(collection, icao, content, reportType) {
  if (!['TAF', 'METAR'].includes(collection)) {
    throw new Error(`Invalid collection: ${collection}. Must be TAF or METAR`);
  }

  if (!icao || !content) {
    throw new Error('ICAO code and content are required');
  }

  const db = getFirestore();
  const docRef = db.collection(collection).doc(icao);

  const data = {
    content: content.trim(),
    reportType: reportType,
    icao: icao,
    updatedAt: admin.firestore.FieldValue.serverTimestamp(),
    fetchedAt: new Date().toISOString()
  };

  try {
    await docRef.set(data, { merge: false }); // Overwrite completely
    console.log(`Stored ${reportType} for ${icao} in ${collection} collection`);
  } catch (error) {
    console.error(`Error storing ${reportType} for ${icao}:`, error.message);
    throw error;
  }
}

/**
 * Retrieve weather data from Firestore
 * 
 * @param {string} collection - Either 'TAF' or 'METAR'
 * @param {string} icao - 4-letter airport code
 * @returns {Promise<string|null>} Raw weather report text, or null if not found
 */
async function getWeatherData(collection, icao) {
  if (!['TAF', 'METAR'].includes(collection)) {
    throw new Error(`Invalid collection: ${collection}. Must be TAF or METAR`);
  }

  if (!icao) {
    throw new Error('ICAO code is required');
  }

  const db = getFirestore();
  const docRef = db.collection(collection).doc(icao);

  try {
    const doc = await docRef.get();
    
    if (!doc.exists) {
      console.log(`No ${collection} data found for ${icao}`);
      return null;
    }

    const data = doc.data();
    return data.content || null;
    
  } catch (error) {
    console.error(`Error retrieving ${collection} for ${icao}:`, error.message);
    throw error;
  }
}

/**
 * Get all stored airport codes for a collection
 * Useful for debugging and statistics
 * 
 * @param {string} collection - Either 'TAF' or 'METAR'
 * @returns {Promise<Array<string>>} Array of ICAO codes
 */
async function getAllAirports(collection) {
  if (!['TAF', 'METAR'].includes(collection)) {
    throw new Error(`Invalid collection: ${collection}. Must be TAF or METAR`);
  }

  const db = getFirestore();
  const snapshot = await db.collection(collection).get();
  
  const airports = [];
  snapshot.forEach(doc => {
    airports.push(doc.id);
  });
  
  return airports;
}

/**
 * Delete weather data for an airport
 * 
 * @param {string} collection - Either 'TAF' or 'METAR'
 * @param {string} icao - 4-letter airport code
 * @returns {Promise<void>}
 */
async function deleteWeatherData(collection, icao) {
  if (!['TAF', 'METAR'].includes(collection)) {
    throw new Error(`Invalid collection: ${collection}. Must be TAF or METAR`);
  }

  const db = getFirestore();
  await db.collection(collection).doc(icao).delete();
  console.log(`Deleted ${collection} data for ${icao}`);
}

/**
 * Get statistics about stored data
 * 
 * @returns {Promise<Object>} Statistics object
 */
async function getStatistics() {
  const db = getFirestore();
  
  const tafSnapshot = await db.collection('TAF').count().get();
  const metarSnapshot = await db.collection('METAR').count().get();
  
  return {
    tafCount: tafSnapshot.data().count,
    metarCount: metarSnapshot.data().count,
    totalAirports: tafSnapshot.data().count + metarSnapshot.data().count
  };
}

module.exports = {
  storeWeatherData,
  getWeatherData,
  getAllAirports,
  deleteWeatherData,
  getStatistics
};
