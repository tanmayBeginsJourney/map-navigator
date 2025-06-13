import express, { Express, Request, Response, NextFunction } from 'express';
import { HealthStatus, ApiResponse, API_ENDPOINTS, PathRequest } from '@campus-nav/shared/types';
import { pathfindingService } from './pathfinding';

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

// Pathfinding endpoint
app.post(API_ENDPOINTS.PATHFIND, async (req: Request, res: Response) => {
  try {
    const pathRequest: PathRequest = req.body;
    
    // Validate request
    if (pathRequest.start_node_id == null || pathRequest.end_node_id == null) {
      const errorResponse: ApiResponse = {
        success: false,
        error: 'start_node_id and end_node_id are required',
        timestamp: new Date().toISOString(),
      };
      res.status(400).json(errorResponse);
      return;
    }

    // Validate node IDs are numbers
    if (!Number.isInteger(pathRequest.start_node_id) || !Number.isInteger(pathRequest.end_node_id)) {
      const errorResponse: ApiResponse = {
        success: false,
        error: 'start_node_id and end_node_id must be integers',
        timestamp: new Date().toISOString(),
      };
      res.status(400).json(errorResponse);
      return;
    }

    // Check if start and end are the same
    if (pathRequest.start_node_id === pathRequest.end_node_id) {
      const errorResponse: ApiResponse = {
        success: false,
        error: 'start_node_id and end_node_id cannot be the same',
        timestamp: new Date().toISOString(),
      };
      res.status(400).json(errorResponse);
      return;
    }

    // Find the path
    const route = await pathfindingService.findPath(
      pathRequest.start_node_id,
      pathRequest.end_node_id,
      pathRequest.accessibility_required || false
    );

    if (!route) {
      const errorResponse: ApiResponse = {
        success: false,
        error: 'No path found between the specified nodes',
        timestamp: new Date().toISOString(),
      };
      res.status(404).json(errorResponse);
      return;
    }

    const response: ApiResponse = {
      success: true,
      data: route,
      timestamp: new Date().toISOString(),
    };

    res.json(response);
  } catch (error) {
    console.error('Pathfinding error:', error);
    
    const errorResponse: ApiResponse = {
      success: false,
      error: 'Internal server error during pathfinding',
      timestamp: new Date().toISOString(),
    };
    
    res.status(500).json(errorResponse);
  }
});

// Pathfinding test endpoint
app.get(`${API_ENDPOINTS.PATHFIND}/test`, (req: Request, res: Response) => {
  const response: ApiResponse = {
    success: true,
    data: {
      message: 'Pathfinding service is operational',
      algorithms: ['A*'],
      features: [
        'Multi-floor navigation',
        'Accessibility support',
        'Real-time instructions',
        'Dynamic cost calculation',
        'Building transitions'
      ]
    },
    timestamp: new Date().toISOString(),
  };
  
  res.json(response);
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
        pathfind: API_ENDPOINTS.PATHFIND + ' (POST - Core A* pathfinding)',
        pathfind_test: API_ENDPOINTS.PATHFIND + '/test (GET - Service health check)',
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
  
  // Preserve existing status code or default to 500
  const statusCode = res.statusCode !== 200 ? res.statusCode : 500;
  res.status(statusCode).json(errorResponse);
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
  console.log(`🗺️ Pathfinding available at: http://localhost:${port}${API_ENDPOINTS.PATHFIND}`);
  console.log(`🧪 Pathfinding test at: http://localhost:${port}${API_ENDPOINTS.PATHFIND}/test`);
});
