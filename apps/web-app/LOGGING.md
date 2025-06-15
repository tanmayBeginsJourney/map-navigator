# Frontend Logging Implementation

This document describes the structured logging implementation for the Campus Navigation Web App using a custom frontend logger.

## Overview

The frontend application uses a custom logger that follows the same structured logging patterns as the backend API, providing machine-readable logs optimized for development debugging and production monitoring.

## Configuration

### Logger Setup (`src/utils/logger.ts`)

```typescript
class FrontendLogger {
  private readonly service = 'campus-navigation-web';
  private readonly version = '1.0.0';
  private readonly environment = import.meta.env.MODE || 'development';
  private readonly logLevel = this.getLogLevel();
}
```

### Environment Variables

- `VITE_LOG_LEVEL`: Controls logging verbosity (`fatal`, `error`, `warn`, `info`, `debug`, `trace`)
- `MODE`: Determines output format (pretty-printed in development, JSON in production)

## Log Levels

| Level | Usage | Example |
|-------|-------|---------|
| `fatal` | Application crashes, unrecoverable errors | Store initialization failures |
| `error` | Error conditions that don't crash the app | API call failures, navigation errors |
| `warn` | Warning conditions | Emergency mode activation, error states |
| `info` | General information | Navigation events, route calculations, QR scanning |
| `debug` | Detailed debugging information | State changes, UI interactions |
| `trace` | Very detailed debugging | Mouse hover events, frequent updates |

## Usage Patterns

### Basic Logging

```typescript
import logger from '../utils/logger';

// Simple message
logger.info('Navigation started');

// With structured data
logger.info({
  startNodeId: 123,
  endNodeId: 456,
  accessibilityRequired: false
}, 'Route calculation requested');
```

### Error Logging

```typescript
try {
  // risky operation
} catch (error) {
  logger.error({ err: error }, 'Operation failed');
}
```

### State Change Logging

```typescript
logger.debug({ isLoading }, 'UI loading state changed');
logger.info({ currentBuildingId }, 'Map building changed');
```

## Production vs Development

### Development Mode
- Uses emoji prefixes and colorized output for better developer experience
- Includes timestamps and structured context display
- Logs to browser console with pretty formatting

### Production Mode
- Outputs structured JSON logs
- Optimized for log aggregation systems
- Includes service metadata for distributed tracing

## Log Structure

### Base Fields (Always Present)
```json
{
  "level": 30,
  "time": 1749923093028,
  "service": "campus-navigation-web",
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
  "service": "campus-navigation-web",
  "version": "1.0.0",
  "environment": "production",
  "startNodeId": 123,
  "endNodeId": 456,
  "accessibilityRequired": false,
  "msg": "Route calculation requested"
}
```

## Store Integration

### UI Store Logging
- Loading state changes (debug level)
- Error state changes (warn level for errors, debug for clears)
- Toast notifications (info level)
- UI resets (info level)

### Map Store Logging
- Building/floor changes (info level)
- Zoom level changes (debug level)
- Node selection changes (debug level)
- Node hover events (trace level)
- Path highlighting (debug level)

### Navigation Store Logging
- Location changes (info level)
- Route calculations (info level with detailed context)
- Navigation start/stop (info level)
- QR code scanning (info level)
- Emergency mode (warn level for activation, info for deactivation)
- Route preferences (debug level)

## Integration Points

### Store State Changes
- All significant state changes are logged with appropriate context
- Error states include error messages and context
- User interactions are tracked for debugging

### Route Calculation
- Request initiation with parameters
- Response processing with metrics
- Segment navigation progress

### Emergency Features
- Emergency mode activation/deactivation
- Evacuation route calculations
- Safety-related state changes

## Monitoring and Alerting

### Key Log Patterns for Monitoring

1. **Fatal Errors**: `level: 60` - Immediate attention required
2. **Navigation Issues**: Search for `"Navigation"` or `"Route calculation"`
3. **Emergency Events**: Search for `"Emergency mode"`
4. **User Experience**: Monitor toast notifications and error states

### Recommended Queries

```bash
# Find all errors in the last hour
level >= 50 AND time > now() - 1h

# Monitor navigation events
msg:*"Navigation"* OR msg:*"Route calculation"*

# Emergency mode activations
msg:"Emergency mode activated"

# User interaction patterns
msg:*"node selection"* OR msg:*"building changed"*
```

## Best Practices

### DO
- Use structured data objects for context
- Include relevant IDs and parameters
- Use appropriate log levels
- Log both start and completion of operations
- Include user-relevant context (node IDs, building IDs)

### DON'T
- Log sensitive user data
- Use console.log/console.error directly
- Log at trace level for production
- Include large objects that could impact performance
- Log every state change at high levels

## Performance Considerations

- Logger checks log level before processing to avoid unnecessary work
- Structured data is only serialized when actually logging
- Development mode includes additional formatting overhead
- Production mode is optimized for minimal performance impact

## Development Usage

### Debug Mode

Set `VITE_LOG_LEVEL=debug` in your `.env.local` file:

```bash
VITE_LOG_LEVEL=debug
```

This will show detailed state changes and user interactions.

### Trace Mode

For very detailed debugging:

```bash
VITE_LOG_LEVEL=trace
```

This includes mouse hover events and frequent state updates.

## Store Initialization

The logger is integrated into store initialization:

```typescript
import { initializeStores } from './store';

// Initialize stores with logging
await initializeStores();
```

## Troubleshooting

### Common Issues

1. **Logs not appearing**: Check `VITE_LOG_LEVEL` environment variable
2. **JSON format in development**: Ensure `MODE=development` in Vite
3. **Missing context**: Verify structured data is passed as first parameter

### Debug Store State

Use the store reset utility for testing:

```typescript
import { resetAllStores } from './store';

// Reset all stores (logs the action)
await resetAllStores();
```

This will log the reset action and return all stores to initial state. 