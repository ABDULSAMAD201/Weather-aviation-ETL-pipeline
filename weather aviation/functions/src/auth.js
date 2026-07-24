/**
 * OAuth 2.0 Token Management for SADIS OPMET API
 */

const axios = require('axios');
const functions = require('firebase-functions');

// Cached token to avoid unnecessary API calls
let cachedToken = null;
let tokenExpiry = null;

/**
 * Get OAuth2 configuration from environment
 */
function getOAuthConfig() {
  // Try Firebase Functions config first, then fall back to process.env
  const clientId = functions.config().sadis?.client_id || process.env.SADIS_CLIENT_ID;
  const clientSecret = functions.config().sadis?.client_secret || process.env.SADIS_CLIENT_SECRET;
  const tokenUrl = functions.config().sadis?.token_url || 
                   process.env.SADIS_TOKEN_URL || 
                   'https://api-manager.api-management.metoffice.cloud/oauth2/token';

  if (!clientId || !clientSecret) {
    throw new Error('SADIS OAuth credentials not configured. Please set sadis.client_id and sadis.client_secret');
  }

  return { clientId, clientSecret, tokenUrl };
}

/**
 * Get a valid access token (either from cache or by requesting a new one)
 * @returns {Promise<string>} Valid access token
 */
async function getAccessToken() {
  // Return cached token if still valid (with 60 second buffer)
  if (cachedToken && tokenExpiry && Date.now() < tokenExpiry - 60000) {
    console.log('Using cached access token');
    return cachedToken;
  }

  console.log('Requesting new access token...');
  const { clientId, clientSecret, tokenUrl } = getOAuthConfig();

  try {
    const response = await axios.post(
      tokenUrl,
      new URLSearchParams({
        grant_type: 'client_credentials',
        scope: 'default'
      }),
      {
        auth: {
          username: clientId,
          password: clientSecret
        },
        headers: {
          'Content-Type': 'application/x-www-form-urlencoded'
        }
      }
    );

    if (!response.data || !response.data.access_token) {
      throw new Error('Invalid response from OAuth token endpoint');
    }

    cachedToken = response.data.access_token;
    
    // Set expiry time (usually 3600 seconds)
    const expiresIn = response.data.expires_in || 3600;
    tokenExpiry = Date.now() + (expiresIn * 1000);

    console.log(`New access token obtained, expires in ${expiresIn} seconds`);
    return cachedToken;

  } catch (error) {
    console.error('Error obtaining access token:', error.response?.data || error.message);
    
    // Clear cached token on error
    cachedToken = null;
    tokenExpiry = null;
    
    throw new Error(`Failed to obtain OAuth token: ${error.message}`);
  }
}

/**
 * Clear the cached token (useful for testing or error recovery)
 */
function clearTokenCache() {
  cachedToken = null;
  tokenExpiry = null;
  console.log('Token cache cleared');
}

module.exports = {
  getAccessToken,
  clearTokenCache
};
