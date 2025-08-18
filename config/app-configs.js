// App configuration for different Zovia apps
// This maps app IDs to their specific configurations

const APP_CONFIGS = {
  'zistil': {
    id: 'zistil',
    displayName: 'Zistil',
    scheme: 'zistil',
    androidPackage: 'studio.zovia.zentry.android',
    iosUrl: 'https://apps.apple.com/us/app/zistil-store-pack-protect/id6747452682',
    androidUrl: 'https://play.google.com/store/apps/details?id=studio.zovia.zentry.android',
    description: 'Store, pack & protect your items with spatial intelligence'
  },
  
  'zatch': {
    id: 'zatch',
    displayName: 'Zatch',
    scheme: 'zatch',
    androidPackage: 'studio.zovia.zatch.android',
    iosUrl: '', // Will be added when available
    androidUrl: '', // Will be added when available
    description: 'Social sports scheduling for friend groups'
  },
  
  // Default fallback config
  'default': {
    id: 'zovia',
    displayName: 'Zovia',
    scheme: 'zovia',
    androidPackage: 'studio.zovia.app.android',
    iosUrl: 'https://apps.apple.com/us/app/zistil-store-pack-protect/id6747452682', // Fallback to Zistil
    androidUrl: 'https://play.google.com/store/apps/details?id=studio.zovia.zentry.android', // Fallback to Zistil
    description: 'Collaborative productivity platform'
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
  }
  
  // 4. Referer URL detection
  if (referer) {
    if (referer.includes('zistil')) return 'zistil';
    if (referer.includes('zatch')) return 'zatch';
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