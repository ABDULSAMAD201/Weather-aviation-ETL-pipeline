/**
 * SADIS OPMET Data Fetcher
 * Handles downloading weather data from SADIS OPMET API
 */

const axios = require('axios');
const AdmZip = require('adm-zip');
const functions = require('firebase-functions');
const { getAccessToken } = require('./auth');
const { storeWeatherData } = require('./storageManager');

/**
 * Get SADIS API base URL from configuration
 */
function getBaseUrl() {
  return functions.config().sadis?.base_url || 
         process.env.SADIS_BASE_URL || 
         'https://gateway.api-management.metoffice.cloud/sadis-opmet/1';
}

/**
 * Generate timestamp string for API request
 * Format: YYYY-MM-DDTHH:MMZ/PT5M (5-minute snapshot)
 * @param {Date} date - Optional date, defaults to current time (rounded to nearest 5 minutes)
 * @returns {string} Formatted datetime string
 */
function generateTimestamp(date = null) {
  const now = date || new Date();
  
  // Round to nearest 5 minutes
  const minutes = now.getUTCMinutes();
  const roundedMinutes = Math.floor(minutes / 5) * 5;
  now.setUTCMinutes(roundedMinutes, 0, 0); // Set seconds and ms to 0
  
  const year = now.getUTCFullYear();
  const month = String(now.getUTCMonth() + 1).padStart(2, '0');
  const day = String(now.getUTCDate()).padStart(2, '0');
  const hour = String(now.getUTCHours()).padStart(2, '0');
  const minute = String(now.getUTCMinutes()).padStart(2, '0');
  
  return `${year}-${month}-${day}T${hour}:${minute}Z/PT5M`;
}

/**
 * Extract airport ICAO code from filename
 * Examples:
 *   FCBX31_EBAW_100200_2b801a6e9519d70e9e8095ebfb954892 -> FCBX
 *   SABX99_EBAW_100220_5c37bd8bb2b9e7fc3d38d44ae85f2a14 -> SABX (but we'll use first 4 chars)
 * 
 * The actual ICAO code is in the file content, so we'll extract from there instead
 */
function extractIcaoFromContent(content, reportType) {
  if (!content) return null;
  
  // TAF format: "TAF EBAW 100211Z ..."
  // METAR format: "METAR EBAW 100250Z ..."
  // SPECI format: "SPECI EBAW 100250Z ..."
  
  const lines = content.trim().split('\n');
  const firstLine = lines[0].trim();
  const parts = firstLine.split(/\s+/);
  
  // Check if first word is the report type
  if (parts.length >= 2 && (parts[0] === reportType || parts[0] === 'SPECI')) {
    // Second word should be the ICAO code (4 letters)
    const icao = parts[1];
    if (icao && /^[A-Z]{4}$/.test(icao)) {
      return icao;
    }
  }
  
  // Fallback: try to find 4-letter uppercase code
  for (const part of parts) {
    if (/^[A-Z]{4}$/.test(part)) {
      return part;
    }
  }
  
  return null;
}

/**
 * Download weather data from SADIS OPMET API
 * @param {string} datetime - Datetime string in format YYYY-MM-DDTHH:MMZ/PT5M
 * @returns {Promise<Object>} Response data containing links to files
 */
async function downloadWeatherSnapshot(datetime) {
  const baseUrl = getBaseUrl();
  const accessToken = await getAccessToken();
  
  const url = `${baseUrl}/collections/tac_opmet_reports/locations/GLOBAL`;
  
  console.log(`Fetching weather data for ${datetime}`);
  
  try {
    const response = await axios.get(url, {
      params: {
        datetime: datetime
      },
      headers: {
        'Authorization': `Bearer ${accessToken}`,
        'Accept': 'application/json'
      },
      timeout: 30000 // 30 second timeout
    });
    
    return response.data;
  } catch (error) {
    console.error('Error downloading weather snapshot:', error.response?.data || error.message);
    throw new Error(`Failed to download weather data: ${error.message}`);
  }
}

/**
 * Download and extract ZIP file from SADIS OPMET
 * @param {string} fileUrl - URL of the ZIP file to download
 * @returns {Promise<Array>} Array of {filename, content} objects
 */
async function downloadAndExtractZip(fileUrl) {
  const accessToken = await getAccessToken();
  
  try {
    // Download as binary data
    const response = await axios.get(fileUrl, {
      headers: {
        'Authorization': `Bearer ${accessToken}`
      },
      responseType: 'arraybuffer', // Important: get binary data
      timeout: 20000 // 20 second timeout
    });
    
    // Extract ZIP contents
    const zip = new AdmZip(Buffer.from(response.data));
    const zipEntries = zip.getEntries();
    
    const files = [];
    
    for (const entry of zipEntries) {
      // Skip directories
      if (entry.isDirectory) {
        continue;
      }
      
      const content = entry.getData().toString('utf8');
      const filename = entry.entryName; // Full path like "METAR/SAAE99_VDSA_161830_..."
      
      files.push({ filename, content });
    }
    
    return files;
  } catch (error) {
    console.error(`Error downloading/extracting ZIP ${fileUrl}:`, error.message);
    throw error;
  }
}

/**
 * Process downloaded data and extract TAF and METAR/SPECI files
 * @param {Object} data - Response data from SADIS API
 * @returns {Promise<Object>} Statistics about processed data
 */
async function processWeatherData(data) {
  const stats = {
    tafCount: 0,
    metarCount: 0,
    speciCount: 0,
    errors: 0
  };

  if (!data || !data.features || !Array.isArray(data.features)) {
    console.warn('No features found in response data');
    return stats;
  }

  console.log(`Processing ${data.features.length} weather reports...`);

  // Process each feature (each feature is a ZIP file containing multiple reports)
  for (const feature of data.features) {
    try {
      const properties = feature.properties;
      
      if (!properties || !properties.data_download_url) {
        continue;
      }

      const reportType = properties.opmet_type; // TAF, METAR, SPECI, etc.
      const downloadUrl = properties.data_download_url;

      // We only want TAF, METAR, and SPECI
      if (!['TAF', 'METAR', 'SPECI'].includes(reportType)) {
        continue;
      }

      console.log(`Downloading and extracting ${reportType} ZIP file...`);
      
      // Download and extract ZIP file
      const files = await downloadAndExtractZip(downloadUrl);
      
      console.log(`Extracted ${files.length} ${reportType} reports from ZIP`);
      
      // Process each file in the ZIP
      for (const file of files) {
        const { filename, content } = file;
        
        if (!content || content.trim().length === 0) {
          continue;
        }

        // Extract ICAO code from content
        const icao = extractIcaoFromContent(content, reportType);
        
        if (!icao) {
          console.warn(`Could not extract ICAO code from ${filename}:`, content.substring(0, 100));
          stats.errors++;
          continue;
        }

        // Store in Firestore
        // METAR and SPECI are stored together (SPECI overwrites METAR and vice versa)
        const collection = (reportType === 'TAF') ? 'TAF' : 'METAR';
        await storeWeatherData(collection, icao, content, reportType);

        // Update stats
        if (reportType === 'TAF') {
          stats.tafCount++;
        } else if (reportType === 'METAR') {
          stats.metarCount++;
        } else if (reportType === 'SPECI') {
          stats.speciCount++;
        }
      }

    } catch (error) {
      console.error('Error processing feature:', error.message);
      stats.errors++;
    }
  }

  return stats;
}

/**
 * Main function to fetch and store weather data
 * @param {Date} customDate - Optional custom date for fetching (default: current time)
 * @returns {Promise<Object>} Result statistics
 */
async function fetchAndStoreWeatherData(customDate = null) {
  const startTime = Date.now();
  console.log('=== Starting weather data fetch ===');
  
  try {
    // Generate timestamp for current 5-minute window
    const timestamp = generateTimestamp(customDate);
    console.log(`Fetching data for timestamp: ${timestamp}`);
    
    // Download snapshot from SADIS OPMET
    const data = await downloadWeatherSnapshot(timestamp);
    
    // Process and store the data
    const stats = await processWeatherData(data);
    
    const duration = ((Date.now() - startTime) / 1000).toFixed(2);
    
    const result = {
      success: true,
      timestamp: timestamp,
      duration: `${duration}s`,
      statistics: stats
    };
    
    console.log('=== Weather data fetch completed ===');
    console.log(JSON.stringify(result, null, 2));
    
    return result;
    
  } catch (error) {
    const duration = ((Date.now() - startTime) / 1000).toFixed(2);
    console.error('=== Weather data fetch failed ===');
    console.error(error);
    
    throw {
      success: false,
      error: error.message,
      duration: `${duration}s`
    };
  }
}

module.exports = {
  fetchAndStoreWeatherData,
  generateTimestamp,
  downloadWeatherSnapshot,
  processWeatherData
};
