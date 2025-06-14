import { z } from 'zod';
import dotenv from 'dotenv';
import logger from './logger';

// Load environment variables from .env file
dotenv.config();

// Define the configuration schema using zod
const ConfigSchema = z.object({
  // Server Configuration
  port: z.coerce.number().min(1).max(65535).default(3001),
  nodeEnv: z.enum(['development', 'test', 'production']).default('development'),
  
  // Database Configuration
  database: z.object({
    host: z.string().min(1),
    port: z.coerce.number().min(1).max(65535),
    name: z.string().min(1),
    user: z.string().min(1),
    password: z.string().min(1),
  }),
  
  // CORS Configuration
  corsOrigins: z.string().transform((str) => 
    str.split(',').map(origin => origin.trim()).filter(origin => origin.length > 0)
  ).pipe(z.array(z.string().min(1))),
  
  // Logging Configuration
  logLevel: z.enum(['error', 'warn', 'info', 'debug']).default('info'),
  
  // API Configuration
  apiVersion: z.string().default('v1'),
});

// Parse DATABASE_URL if provided (Railway format)
function parseDatabaseUrl(databaseUrl: string) {
  try {
    const url = new URL(databaseUrl);
    return {
      host: url.hostname,
      port: url.port || '5432',
      name: url.pathname.slice(1), // Remove leading slash
      user: url.username,
      password: url.password
    };
  } catch (error) {
    throw new Error(`Invalid DATABASE_URL format: ${error}`);
  }
}

// Parse and validate environment variables
function parseConfig() {
  try {
    // Handle both individual DB vars and DATABASE_URL
    let databaseConfig;
    if (process.env.DATABASE_URL) {
      // Railway/Heroku style DATABASE_URL
      databaseConfig = parseDatabaseUrl(process.env.DATABASE_URL);
    } else {
      // Individual environment variables
      databaseConfig = {
        host: process.env.DB_HOST || 'localhost',
        port: process.env.DB_PORT || '5432',
        name: process.env.DB_NAME || 'campus_navigation',
        user: process.env.DB_USER || 'postgres',
        password: process.env.DB_PASSWORD || (() => {
          if (process.env.NODE_ENV === 'production') {
            throw new Error('DB_PASSWORD environment variable is required in production');
          }
          return 'secure_default_password'; // development only fallback
        })()
      };
    }

    const rawConfig = {
      port: process.env.PORT,
      nodeEnv: process.env.NODE_ENV,
      database: databaseConfig,
      corsOrigins: process.env.CORS_ORIGINS || 'http://localhost:5173,http://localhost:3000',
      logLevel: process.env.LOG_LEVEL,
      apiVersion: process.env.API_VERSION,
    };

    return ConfigSchema.parse(rawConfig);
  } catch (error) {
    if (error instanceof z.ZodError) {
      logger.fatal({
        errors: error.errors.map(err => ({
          path: err.path.join('.'),
          message: err.message,
          code: err.code
        }))
      }, 'Invalid environment configuration');
      
      logger.fatal({
        requiredVariables: {
          DB_HOST: 'Database host (default: localhost)',
          DB_PORT: 'Database port (default: 5432)',
          DB_NAME: 'Database name (default: campus_navigation)',
          DB_USER: 'Database user (default: postgres)',
          DB_PASSWORD: 'Database password (required for production)',
          PORT: 'Server port (default: 3001)',
          NODE_ENV: 'Environment (development|test|production)',
          CORS_ORIGINS: 'Allowed CORS origins (comma-separated)',
          LOG_LEVEL: 'Logging level (error|warn|info|debug)'
        }
      }, 'Required environment variables');
      
      logger.fatal('Copy .env.example to .env and configure your values');
    } else {
      logger.fatal({ err: error }, 'Failed to load configuration');
    }
    process.exit(1);
  }
}

// Export the validated configuration
export const config = parseConfig();

// Export types for TypeScript
export type Config = z.infer<typeof ConfigSchema>;
export type DatabaseConfig = Config['database'];

// Configuration utilities
export const isDevelopment = config.nodeEnv === 'development';
export const isProduction = config.nodeEnv === 'production';
export const isTest = config.nodeEnv === 'test';

// Log configuration on startup (excluding sensitive data)
if (isDevelopment) {
  logger.info({
    environment: config.nodeEnv,
    port: config.port,
    database: {
      host: config.database.host,
      port: config.database.port,
      name: config.database.name,
      user: config.database.user
      // password intentionally excluded for security
    },
    corsOrigins: config.corsOrigins,
    logLevel: config.logLevel,
    apiVersion: config.apiVersion
  }, 'Configuration loaded successfully');
} 