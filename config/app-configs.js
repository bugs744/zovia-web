// App configuration for different Zovia apps
// This maps app IDs to their specific configurations

const APP_CONFIGS = {
  // displayName, primaryColor, store URLs, description come from the
  // ZoviaAppVersions Parse class at request time — see functions/join/
  // [token].js. Only platform-level wiring (URL scheme, Android package
  // name) is hardcoded here since those aren't in the DB.
  'zistil': {
    id: 'zistil',
    scheme: 'zistil',
    androidPackage: 'studio.zovia.zentry.android',
  },

  'zupply': {
    id: 'zupply',
    scheme: 'zovia-zupply',
    androidPackage: 'studio.zovia.zupply',
  },

  'zatch': {
    id: 'zatch',
    scheme: 'zatch',
    androidPackage: 'studio.zovia.zatch.android',
  },

  // Fallback for unknown apps. ZoviaAppVersions still provides display data
  // when the app is detected; this only kicks in when detectAppId fails.
  'default': {
    id: 'zovia',
    scheme: 'zovia',
    androidPackage: 'studio.zovia.app.android',
  }
};

/**
 * Get app configuration by app ID
 * @param {string} appId - The app identifier (e.g., 'zistil', 'zatch')
 * @returns {object} App configuration object
 */
function getAppConfig(appId) {
  const normalizedId = (appId || '').toLowerCase().trim();
  return APP_CONFIGS[normalizedId] || APP_CONFIGS['default'];
}

/**
 * Get app configuration with space context
 * This allows for space-specific overrides if needed in the future
 * @param {string} appId - The app identifier
 * @param {string} spaceId - The space identifier (for future use)
 * @returns {object} App configuration object
 */
function getAppConfigForSpace(appId, spaceId) {
  const config = getAppConfig(appId);
  
  // Future: Add space-specific overrides here if needed
  // For example, certain spaces might want custom branding
  
  return config;
}

/**
 * Detect app ID from various sources
 * Priority: explicit appId > space metadata > user agent > default
 * @param {object} options - Detection options
 * @returns {string} Detected app ID
 */
function detectAppId(options = {}) {
  const { 
    explicitAppId, 
    spaceMetadata, 
    userAgent,
    referer,
    defaultAppId = 'zistil' 
  } = options;
  
  // 1. Explicit app ID (highest priority)
  if (explicitAppId && APP_CONFIGS[explicitAppId.toLowerCase()]) {
    return explicitAppId.toLowerCase();
  }
  
  // 2. Space metadata (if space was created by specific app)
  if (spaceMetadata && spaceMetadata.createdByApp && APP_CONFIGS[spaceMetadata.createdByApp.toLowerCase()]) {
    return spaceMetadata.createdByApp.toLowerCase();
  }
  
  // 3. User agent detection (for mobile apps)
  if (userAgent) {
    if (userAgent.includes('Zistil')) return 'zistil';
    if (userAgent.includes('Zatch')) return 'zatch';
    if (userAgent.includes('Zupply')) return 'zupply';
  }

  // 4. Referer URL detection
  if (referer) {
    if (referer.includes('zistil')) return 'zistil';
    if (referer.includes('zatch')) return 'zatch';
    if (referer.includes('zupply')) return 'zupply';
  }
  
  // 5. Default fallback
  return defaultAppId;
}

/**
 * Check if an app has Android support
 * @param {string} appId - The app identifier
 * @returns {boolean} True if Android app is available
 */
function hasAndroidSupport(appId) {
  const config = getAppConfig(appId);
  return config.androidUrl && config.androidUrl.trim() !== '';
}

/**
 * Check if an app has iOS support
 * @param {string} appId - The app identifier
 * @returns {boolean} True if iOS app is available
 */
function hasIOSSupport(appId) {
  const config = getAppConfig(appId);
  return config.iosUrl && config.iosUrl.trim() !== '';
}

module.exports = {
  APP_CONFIGS,
  getAppConfig,
  getAppConfigForSpace,
  detectAppId,
  hasAndroidSupport,
  hasIOSSupport
};