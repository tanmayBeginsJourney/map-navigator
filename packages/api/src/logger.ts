import pino from 'pino';

// Get environment variables directly to avoid circular dependency with config
const nodeEnv = process.env.NODE_ENV || 'development';
const logLevel = process.env.LOG_LEVEL || 'info';
const isDevelopment = nodeEnv === 'development';

const logger = pino({
  level: logLevel,
  transport: isDevelopment
    ? {
        target: 'pino-pretty',
        options: {
          colorize: true,
          translateTime: 'SYS:standard',
          ignore: 'pid,hostname',
        },
      }
    : undefined,
  // Add structured logging fields for production
  base: {
    service: 'campus-navigation-api',
    version: process.env.npm_package_version || '1.0.0',
    environment: nodeEnv,
  },
});

export default logger; 