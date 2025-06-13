import { z } from 'zod';
import dotenv from 'dotenv';

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
  corsOrigins: z.string().transform((str) => str.split(',').map(origin => origin.trim())),
  
  // Logging Configuration
  logLevel: z.enum(['error', 'warn', 'info', 'debug']).default('info'),
  
  // API Configuration
  apiVersion: z.string().default('v1'),
});

// Parse and validate environment variables
function parseConfig() {
  try {
    const rawConfig = {
      port: process.env.PORT,
      nodeEnv: process.env.NODE_ENV,
      database: {
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
      },
      corsOrigins: process.env.CORS_ORIGINS || 'http://localhost:5173,http://localhost:3000',
      logLevel: process.env.LOG_LEVEL,
      apiVersion: process.env.API_VERSION,
    };

    return ConfigSchema.parse(rawConfig);
  } catch (error) {
    if (error instanceof z.ZodError) {
      console.error('❌ Invalid environment configuration:');
      error.errors.forEach((err) => {
        console.error(`  • ${err.path.join('.')}: ${err.message}`);
      });
      console.error('\n📋 Required environment variables:');
      console.error('  • DB_HOST: Database host (default: localhost)');
      console.error('  • DB_PORT: Database port (default: 5432)');
      console.error('  • DB_NAME: Database name (default: campus_navigation)');
      console.error('  • DB_USER: Database user (default: postgres)');
      console.error('  • DB_PASSWORD: Database password (required for production)');
      console.error('  • PORT: Server port (default: 3001)');
      console.error('  • NODE_ENV: Environment (development|test|production)');
      console.error('  • CORS_ORIGINS: Allowed CORS origins (comma-separated)');
      console.error('  • LOG_LEVEL: Logging level (error|warn|info|debug)');
      console.error('\n💡 Copy .env.example to .env and configure your values');
    } else {
      console.error('❌ Failed to load configuration:', error);
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
  console.log('🔧 Configuration loaded:');
  console.log(`  • Environment: ${config.nodeEnv}`);
  console.log(`  • Port: ${config.port}`);
  console.log(`  • Database: ${config.database.host}:${config.database.port}/${config.database.name}`);
  console.log(`  • CORS Origins: ${config.corsOrigins.join(', ')}`);
  console.log(`  • Log Level: ${config.logLevel}`);
} 