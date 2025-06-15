# Campus Navigation Web App

Frontend React application for the Campus Indoor-Outdoor Navigation System.

## Overview

This is a modern React application built with TypeScript, Vite, and Zustand for state management. It provides an intuitive interface for campus navigation with support for indoor floor plans, outdoor pathfinding, and accessibility features.

## Features

### ✅ Completed (Task 10)
- **State Management**: Comprehensive Zustand stores for UI, Map, and Navigation state
- **TypeScript Integration**: Strict type safety throughout the application
- **Structured Logging**: Production-ready logging system following backend patterns
- **Mobile-First Design**: Touch interactions and responsive UI components
- **Development Tools**: ESLint, TypeScript checking, and build optimization

### 🚧 In Development
- SVG Floor Plan Display Component (Task 11)
- Interactive Map Navigation
- QR Code Scanning Integration
- Real-time Location Tracking

## Tech Stack

- **Framework**: React 19.1.0 with TypeScript 5.8.3
- **Build Tool**: Vite 6.3.5 for fast development and optimized builds
- **State Management**: Zustand 4.5.5 for lightweight, scalable state management
- **Routing**: React Router DOM 7.6.2 for client-side navigation
- **Code Quality**: ESLint 9.29.0 with TypeScript-aware rules
- **Logging**: Custom structured logging system compatible with backend

## Project Structure

```
src/
├── components/          # React components
│   └── StoreTestComponent.tsx  # Store functionality testing
├── pages/              # Page-level components
│   └── HomePage.tsx    # Main landing page
├── store/              # Zustand state management
│   ├── useUiStore.ts   # UI state (loading, errors, mobile UI)
│   ├── useMapStore.ts  # Map state (viewport, interactions, floors)
│   ├── useNavigationStore.ts  # Navigation state (routes, QR, emergency)
│   └── index.ts        # Store exports and utilities
├── utils/              # Utility functions
│   └── logger.ts       # Structured logging implementation
├── hooks/              # Custom React hooks (placeholder)
├── services/           # API services (placeholder)
├── App.tsx             # Main application component
├── main.tsx            # Application entry point
└── config.ts           # Application configuration
```

## Getting Started

### Prerequisites

- Node.js 18.0.0 or higher
- npm or pnpm package manager

### Installation

```bash
# Install dependencies
npm install

# Start development server
npm run dev

# Open http://localhost:5173
```

### Development Commands

```bash
# Development server with hot reload
npm run dev

# Type checking
npm run type-check

# Linting
npm run lint

# Production build
npm run build

# Preview production build
npm run preview
```

## State Management

The application uses Zustand for state management with three main stores:

### UI Store (`useUiStore`)
- Loading states (general, navigation, route calculation)
- Error handling (UI errors, navigation errors)
- Mobile UI controls (sidebar, fullscreen, QR scanner)
- Toast notifications with auto-hide functionality

### Map Store (`useMapStore`)
- Building and floor plan selection
- Viewport management (center, zoom, rotation)
- Interactive elements (selected nodes, highlighted paths)
- Touch gesture support for mobile devices

### Navigation Store (`useNavigationStore`)
- Current location and destination tracking
- Route calculation and segment management
- User location with accuracy tracking
- QR code scanning context
- Navigation history and favorites
- Emergency mode and evacuation routes

## Logging

The application implements structured logging following backend patterns:

```typescript
import logger from '../utils/logger';

// Basic logging
logger.info('Navigation started');

// With context
logger.info({ startNodeId: 123, endNodeId: 456 }, 'Route calculation requested');
```

### Log Levels
- `fatal`: Application crashes
- `error`: Error conditions
- `warn`: Warning conditions (emergency mode, errors)
- `info`: General information (navigation events)
- `debug`: Detailed debugging (state changes)
- `trace`: Very detailed debugging (hover events)

See [LOGGING.md](./LOGGING.md) for complete documentation.

## Configuration

### Environment Variables

Create `.env.local` for local development:

```bash
# Logging level (fatal, error, warn, info, debug, trace)
VITE_LOG_LEVEL=debug

# API endpoint (when backend integration is added)
VITE_API_URL=http://localhost:3001
```

### TypeScript Configuration

The project uses strict TypeScript configuration with:
- Strict type checking enabled
- No unused locals/parameters
- No fallthrough cases in switch statements
- Explicit type annotations required

## Testing

### Store Testing

Use the built-in `StoreTestComponent` to test store functionality:

1. Navigate to the home page
2. The test component demonstrates all store operations
3. Interactive buttons test state changes
4. Console logs show structured logging output

### Manual Testing

```bash
# Reset all stores to initial state
import { resetAllStores } from './store';
await resetAllStores();

# Initialize stores with logging
import { initializeStores } from './store';
await initializeStores();
```

## Build and Deployment

### Production Build

```bash
npm run build
```

Generates optimized production build in `dist/`:
- Minified JavaScript (~222KB gzipped)
- Optimized CSS (~1.4KB gzipped)
- Static assets with cache-friendly names

### Deployment

The application is configured for deployment on Vercel with `vercel.json`:

```json
{
  "rewrites": [
    { "source": "/(.*)", "destination": "/index.html" }
  ]
}
```

## Development Guidelines

### Code Quality

- All code must pass TypeScript type checking
- ESLint rules must be followed
- Structured logging should be used instead of console.log
- State changes should include appropriate logging context

### State Management Patterns

- Use selectors for optimized re-renders
- Include structured logging for debugging
- Follow the established store patterns
- Maintain type safety throughout

### Performance Considerations

- Zustand stores are optimized for minimal re-renders
- Logging checks levels before processing
- Production builds exclude debug-level logs
- Touch interactions are optimized for mobile

## Contributing

1. Follow the established TypeScript and ESLint configurations
2. Add appropriate logging for new features
3. Update documentation for significant changes
4. Test store functionality with the test component
5. Ensure all builds pass before committing

## Related Documentation

- [Backend API Documentation](../../packages/api/README.md)
- [Shared Types](../../packages/shared/README.md)
- [Frontend Logging](./LOGGING.md)
- [Project Overview](../../README.md)
