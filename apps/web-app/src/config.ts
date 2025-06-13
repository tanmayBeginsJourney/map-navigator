// Frontend Environment Configuration for Vite
// Environment variables must be prefixed with VITE_ to be exposed to the client

export interface AppConfig {
  apiUrl: string;
  apiVersion: string;
  environment: 'development' | 'test' | 'production';
  features: {
    enableOfflineMode: boolean;
    enableDebugMode: boolean;
    enableAnalytics: boolean;
  };
  mapbox?: {
    token: string;
  };
}

// Get environment variables with proper fallbacks
const getEnvVar = (key: string, defaultValue?: string): string => {
  const value = import.meta.env[key];
  if (value === undefined) {
    if (defaultValue !== undefined) {
      return defaultValue;
    }
    console.warn(`⚠️ Environment variable ${key} is not set`);
    return '';
  }
  return value;
};

// Parse boolean environment variables
const getEnvBoolean = (key: string, defaultValue: boolean): boolean => {
  const value = import.meta.env[key];
  if (value === undefined) return defaultValue;
  return value.toLowerCase() === 'true';
};

// Validate and create configuration
function createConfig(): AppConfig {
  const environment = getEnvVar('VITE_NODE_ENV', 'development') as AppConfig['environment'];
  
  // API Configuration
  const apiUrl = getEnvVar('VITE_API_URL', 'http://localhost:3001');
  const apiVersion = getEnvVar('VITE_API_VERSION', 'v1');
  
  // Feature Flags
  const enableOfflineMode = getEnvBoolean('VITE_ENABLE_OFFLINE_MODE', false);
  const enableDebugMode = getEnvBoolean('VITE_ENABLE_DEBUG_MODE', environment === 'development');
  const enableAnalytics = getEnvBoolean('VITE_ENABLE_ANALYTICS', environment === 'production');
  
  // Optional Mapbox configuration
  const mapboxToken = getEnvVar('VITE_MAPBOX_TOKEN');
  
  const config: AppConfig = {
    apiUrl,
    apiVersion,
    environment,
    features: {
      enableOfflineMode,
      enableDebugMode,
      enableAnalytics,
    },
  };
  
  // Add mapbox configuration if token is provided
  if (mapboxToken) {
    config.mapbox = {
      token: mapboxToken,
    };
  }
  
  // Validate critical configuration
  if (!apiUrl) {
    throw new Error('VITE_API_URL is required but not set');
  }
  
  return config;
}

// Export the configuration
export const config = createConfig();

// Development-only logging
if (config.features.enableDebugMode) {
  console.log('🔧 Frontend Configuration:', {
    environment: config.environment,
    apiUrl: config.apiUrl,
    apiVersion: config.apiVersion,
    features: config.features,
    hasMapboxToken: !!config.mapbox?.token,
  });
}

// Configuration validation utility
export const validateConfig = (): boolean => {
  try {
    const requiredVars = ['VITE_API_URL'];
    const missing = requiredVars.filter(key => !import.meta.env[key]);
    
    if (missing.length > 0) {
      console.error('❌ Missing required environment variables:', missing);
      console.error('💡 Create a .env file in the web-app directory with:');
      missing.forEach(key => console.error(`  ${key}=your_value_here`));
      return false;
    }
    
    return true;
  } catch (error) {
    console.error('❌ Configuration validation failed:', error);
    return false;
  }
};

// API URL helper functions
export const getApiUrl = (endpoint = ''): string => {
  // Normalize base URL and endpoint to prevent double/missing slashes
  const baseUrl = config.apiUrl.replace(/\/+$/, ''); // Remove trailing slashes
  const normalizedEndpoint = endpoint.replace(/^\/+/, ''); // Remove leading slashes
  
  if (!normalizedEndpoint) {
    return baseUrl;
  }
  
  return `${baseUrl}/${normalizedEndpoint}`;
};

export const getHealthCheckUrl = (): string => {
  return getApiUrl('/api/health');
};

export const getPathfindingUrl = (): string => {
  return getApiUrl('/api/pathfind');
};

export const getRouteCalculationUrl = (): string => {
  return getApiUrl('/api/route');
}; 