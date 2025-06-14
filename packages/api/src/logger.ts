import pino from 'pino';
import { readFileSync } from 'fs';
import { join } from 'path';

// Get environment variables directly to avoid circular dependency with config
const nodeEnv = process.env.NODE_ENV || 'development';
const logLevel = process.env.LOG_LEVEL || 'info';
const isDevelopment = nodeEnv === 'development';

// Read version from package.json at build-time for reliability
function getPackageVersion(): string {
  try {
    const packageJsonPath = join(__dirname, '..', 'package.json');
    const packageJson = JSON.parse(readFileSync(packageJsonPath, 'utf8'));
    return packageJson.version || '1.0.0';
  } catch {
    // Fallback to environment variable or default if package.json read fails
    return process.env.npm_package_version || '1.0.0';
  }
}

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
    version: getPackageVersion(),
    environment: nodeEnv,
  },
});

export default logger; 