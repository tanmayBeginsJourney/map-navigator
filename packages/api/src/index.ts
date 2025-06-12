import express, { Express, Request, Response, NextFunction } from 'express';
import { HealthStatus, ApiResponse, API_ENDPOINTS } from '@campus-nav/shared/types';

const app: Express = express();
const port = process.env.PORT || 3001;

// Middleware
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// CORS middleware (basic setup for development)
app.use((req, res, next) => {
  res.header('Access-Control-Allow-Origin', '*');
  res.header('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
  res.header(
    'Access-Control-Allow-Headers',
    'Origin, X-Requested-With, Content-Type, Accept, Authorization'
  );

  if (req.method === 'OPTIONS') {
    res.sendStatus(200);
  } else {
    next();
  }
});

// Health check endpoint using shared types
app.get(API_ENDPOINTS.HEALTH, (req: Request, res: Response) => {
  const healthResponse: ApiResponse<HealthStatus> = {
    success: true,
    data: {
      status: 'OK',
      message: 'Campus Navigation API is running',
      service: 'campus-navigation-api',
      timestamp: new Date().toISOString(),
    },
    timestamp: new Date().toISOString(),
  };
  
  res.status(200).json(healthResponse);
});

// Basic route
app.get('/', (req: Request, res: Response) => {
  const response: ApiResponse = {
    success: true,
    data: {
      message: 'Welcome to Campus Navigation API',
      version: '1.0.0',
      endpoints: {
        health: API_ENDPOINTS.HEALTH,
        buildings: API_ENDPOINTS.BUILDINGS + ' (coming soon)',
        locations: API_ENDPOINTS.LOCATIONS + ' (coming soon)',
        routes: API_ENDPOINTS.ROUTES + ' (coming soon)'
      }
    },
    timestamp: new Date().toISOString(),
  };
  
  res.json(response);
});

// Error handling middleware
app.use((err: Error, req: Request, res: Response, _next: NextFunction) => {
  console.error('Error:', err.message);
  
  const errorResponse: ApiResponse = {
    success: false,
    error: process.env.NODE_ENV === 'development' ? err.message : 'Something went wrong',
    timestamp: new Date().toISOString(),
  };
  
  res.status(500).json(errorResponse);
});

// 404 handler
app.use((req: Request, res: Response) => {
  const notFoundResponse: ApiResponse = {
    success: false,
    error: `Route ${req.originalUrl} not found`,
    timestamp: new Date().toISOString(),
  };
  
  res.status(404).json(notFoundResponse);
});

app.listen(port, () => {
  console.log(`🚀 Campus Navigation API server is running on port ${port}`);
  console.log(`📋 Health check available at: http://localhost:${port}${API_ENDPOINTS.HEALTH}`);
});
