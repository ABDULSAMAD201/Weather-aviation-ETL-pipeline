/**
 * API Module
 * Functions for retrieving weather data through the API
 */

const { getWeatherData: getFromFirestore } = require('./storageManager');

/**
 * Get weather data for an airport
 * This is a simple wrapper around the storage manager
 * 
 * @param {string} type - Either 'TAF' or 'METAR'
 * @param {string} icao - 4-letter airport code
 * @returns {Promise<string|null>} Raw weather report text, or null if not found
 */
async function getWeatherData(type, icao) {
  if (!type || !icao) {
    throw new Error('Type and ICAO code are required');
  }

  // Normalize inputs
  const normalizedType = type.toUpperCase();
  const normalizedIcao = icao.toUpperCase();

  // Validate type
  if (!['TAF', 'METAR'].includes(normalizedType)) {
    throw new Error('Type must be either TAF or METAR');
  }

  // Validate ICAO code format (4 letters)
  if (!/^[A-Z]{4}$/.test(normalizedIcao)) {
    throw new Error('ICAO code must be 4 letters');
  }

  try {
    const data = await getFromFirestore(normalizedType, normalizedIcao);
    return data;
  } catch (error) {
    console.error(`Error in getWeatherData for ${normalizedType}/${normalizedIcao}:`, error);
    throw error;
  }
}

module.exports = {
  getWeatherData
};
