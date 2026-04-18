// App configuration for different Zovia apps
// This maps app IDs to their specific configurations

const APP_CONFIGS = {
  // displayName, primaryColor, store URLs, description come from the
  // ZoviaAppVersions Parse class at request time — see functions/join/
  // [token].js. Only platform-level wiring (URL scheme, Android package
  // name) is hardcoded here since those aren't in the DB.
  'zistil': {
    id: 'zistil',
    scheme: 'zovia-zistil',
    androidPackage: 'studio.zovia.zentry.android',  // historical, locked to Play Console
  },

  'zots': {
    id: 'zots',
    scheme: 'zovia-zots',
    androidPackage: 'studio.zovia.zots',
  },

  'zyve': {
    id: 'zyve',
    scheme: 'zovia-zyve',
    androidPackage: 'studio.zovia.zyve',
  },

  'zupply': {
    id: 'zupply',
    scheme: 'zovia-zupply',
    androidPackage: 'studio.zovia.zupply',
  },

  'zynq': {
    id: 'zynq',
    scheme: 'zovia-zynq',
    androidPackage: 'studio.zovia.zynq',
  },

  'zarden': {
    id: 'zarden',
    scheme: 'zovia-zarden',
    androidPackage: 'studio.zovia.zarden',
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
    if (userAgent.includes('Zots')) return 'zots';
    if (userAgent.includes('Zyve')) return 'zyve';
    if (userAgent.includes('Zupply')) return 'zupply';
    if (userAgent.includes('Zynq')) return 'zynq';
    if (userAgent.includes('Zarden')) return 'zarden';
    if (userAgent.includes('Zatch')) return 'zatch';
  }

  // 4. Referer URL detection
  if (referer) {
    if (referer.includes('zistil')) return 'zistil';
    if (referer.includes('zots')) return 'zots';
    if (referer.includes('zyve')) return 'zyve';
    if (referer.includes('zupply')) return 'zupply';
    if (referer.includes('zynq')) return 'zynq';
    if (referer.includes('zarden')) return 'zarden';
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