# Structured Logging Implementation

This document describes the structured logging implementation for the Campus Navigation API using Pino.

## Overview

The application uses [Pino](https://github.com/pinojs/pino) for structured logging, providing machine-readable JSON logs that are optimized for production environments, monitoring, and alerting systems.

## Configuration

### Logger Setup (`src/logger.ts`)

```typescript
import pino from 'pino';

const logger = pino({
  level: process.env.LOG_LEVEL || 'info',
  transport: isDevelopment ? {
    target: 'pino-pretty',
    options: {
      colorize: true,
      translateTime: 'SYS:standard',
      ignore: 'pid,hostname',
    },
  } : undefined,
  base: {
    service: 'campus-navigation-api',
    version: process.env.npm_package_version || '1.0.0',
    environment: process.env.NODE_ENV || 'development',
  },
});
```

### Environment Variables

- `LOG_LEVEL`: Controls logging verbosity (`error`, `warn`, `info`, `debug`)
- `NODE_ENV`: Determines output format (pretty-printed in development, JSON in production)

## Log Levels

| Level | Usage | Example |
|-------|-------|---------|
| `fatal` | Application crashes, unrecoverable errors | Configuration validation failures |
| `error` | Error conditions that don't crash the app | Database connection failures, API errors |
| `warn` | Warning conditions | Route not found, deprecated API usage |
| `info` | General information | Server startup, successful operations |
| `debug` | Detailed debugging information | Database queries, algorithm steps |

## Usage Patterns

### Basic Logging

```typescript
import logger from './logger';

// Simple message
logger.info('Server started successfully');

// With structured data
logger.info({
  port: 3001,
  environment: 'development'
}, 'Server configuration loaded');
```

### Error Logging

```typescript
try {
  // risky operation
} catch (error) {
  logger.error({ err: error }, 'Operation failed');
}
```

### Request/Response Logging

```typescript
logger.info({
  startNodeId,
  endNodeId,
  accessibilityRequired
}, 'Route calculation request received');
```

### Database Operations

```typescript
logger.info('🔌 Attempting database connection (attempt 1/5)');
logger.info('✅ Database connected successfully');
```

## Production vs Development

### Development Mode
- Uses `pino-pretty` for human-readable, colorized output
- Includes emojis and formatting for better developer experience
- Logs to stdout with pretty formatting

### Production Mode
- Outputs structured JSON logs
- Optimized for log aggregation systems (ELK, Splunk, etc.)
- Includes service metadata for distributed tracing

## Log Structure

### Base Fields (Always Present)
```json
{
  "level": 30,
  "time": 1749923093028,
  "service": "campus-navigation-api",
  "version": "1.0.0",
  "environment": "production",
  "msg": "Log message"
}
```

### Extended Fields (Context-Specific)
```json
{
  "level": 30,
  "time": 1749923093028,
  "service": "campus-navigation-api",
  "version": "1.0.0",
  "environment": "production",
  "startNodeId": "123",
  "endNodeId": "456",
  "accessibilityRequired": false,
  "msg": "Route calculation request received"
}
```

## Integration Points

### Configuration Loading
- Logs configuration validation errors with structured error details
- Logs successful configuration loading with sanitized values (passwords excluded)

### Database Operations
- Connection attempts and results
- Query execution context
- Error conditions with full error objects

### API Endpoints
- Request processing start/end
- Route calculation steps
- Error conditions and responses

### Graceful Shutdown
- Signal handling (SIGINT, SIGTERM)
- Cleanup operations
- Shutdown completion status

## Monitoring and Alerting

### Key Log Patterns for Monitoring

1. **Fatal Errors**: `level: 60` - Immediate attention required
2. **Database Connectivity**: Search for `"Database connected"` or `"Database connection failed"`
3. **Route Calculation Errors**: Search for `"ROUTE CALCULATION CRASH"`
4. **Server Health**: Monitor startup/shutdown messages

### Recommended Queries

```bash
# Find all errors in the last hour
level >= 50 AND time > now() - 1h

# Monitor route calculation performance
msg:"Route calculation request received" OR msg:"pathfindingService.findPath finished"

# Database connectivity issues
msg:*"Database connection"* AND level >= 40
```

## Best Practices

### DO
- Use structured data objects for context
- Include relevant IDs and parameters
- Use appropriate log levels
- Include error objects with `{ err: error }`
- Log both start and completion of operations

### DON'T
- Log sensitive data (passwords, tokens)
- Use console.log/console.error in production code
- Log at debug level in production without good reason
- Include large objects that could impact performance

## Migration from console.log

All `console.log` and `console.error` statements have been replaced with structured logging:

```typescript
// Before
console.log('Server started on port', port);
console.error('Database error:', error);

// After
logger.info({ port }, 'Server started successfully');
logger.error({ err: error }, 'Database operation failed');
```

## Scripts and Utilities

For scripts in the `scripts/` directory, a simplified logger is available:

```javascript
const logger = require('./logger');
logger.info('Script operation completed');
```

## Performance Considerations

- Pino is designed for high-performance logging
- JSON serialization is optimized
- In production, avoid debug-level logging for performance
- Large objects in log context may impact performance

## Troubleshooting

### Common Issues

1. **Logs not appearing**: Check `LOG_LEVEL` environment variable
2. **JSON format in development**: Ensure `NODE_ENV=development` for pretty printing
3. **Missing context**: Verify structured data is passed as first parameter

### Debug Mode

Set `LOG_LEVEL=debug` to see detailed operation logs:

```bash
LOG_LEVEL=debug npm run dev
```

This will show database queries, algorithm steps, and detailed request processing. 