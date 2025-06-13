import express, { Express, Request, Response, NextFunction } from 'express';
import { HealthStatus, ApiResponse, API_ENDPOINTS, PathRequest, RouteResponse, RouteCalculationResponse, RoutePathNode, RouteSegment } from '@campus-nav/shared/types';
import { PathfindingService } from './pathfinding';
import { config, isDevelopment } from './config';
import { createDatabaseService } from './db/connection';
import createHealthRouter from './routes/health';

const app: Express = express();

// Initialize database service and pathfinding service
let dbService: ReturnType<typeof createDatabaseService> | null = null;
let pathfindingService: PathfindingService | null = null;

// Middleware
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// CORS middleware with configurable origins
app.use((req, res, next) => {
  const allowedOrigins = config.corsOrigins;
  const origin = req.headers.origin;
  
  if (!origin || allowedOrigins.includes(origin) || isDevelopment) {
    res.header('Access-Control-Allow-Origin', origin || '*');
  }
  
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

// Mount health check routes (will be updated in startServer function)
// app.use(API_ENDPOINTS.HEALTH, healthRouter);

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

    // Ensure pathfinding service is initialized
    if (!pathfindingService) {
      const errorResponse: ApiResponse = {
        success: false,
        error: 'Pathfinding service not initialized',
        timestamp: new Date().toISOString(),
      };
      res.status(503).json(errorResponse);
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

// Route calculation endpoint (Task 8) - converts RouteResponse to frontend-optimized format
app.post(API_ENDPOINTS.ROUTE, async (req: Request, res: Response) => {
  try {
    const { startNodeId, endNodeId } = req.body;
    
    // Validate request
    if (startNodeId == null || endNodeId == null) {
      const errorResponse: ApiResponse = {
        success: false,
        error: 'startNodeId and endNodeId are required',
        timestamp: new Date().toISOString(),
      };
      res.status(400).json(errorResponse);
      return;
    }

    // Validate node IDs are strings (as per Task 8 spec) but convert to numbers for pathfinding
    if (typeof startNodeId !== 'string' || typeof endNodeId !== 'string') {
      const errorResponse: ApiResponse = {
        success: false,
        error: 'startNodeId and endNodeId must be strings',
        timestamp: new Date().toISOString(),
      };
      res.status(400).json(errorResponse);
      return;
    }

    // Convert string IDs to numbers for existing pathfinding service
    // Use strict validation to ensure entire string is numeric (not just prefix)
    const numericRegex = /^\d+$/;
    if (!numericRegex.test(startNodeId) || !numericRegex.test(endNodeId)) {
      const errorResponse: ApiResponse = {
        success: false,
        error: 'startNodeId and endNodeId must be valid numeric strings',
        timestamp: new Date().toISOString(),
      };
      res.status(400).json(errorResponse);
      return;
    }

    const startNodeIdNum = parseInt(startNodeId, 10);
    const endNodeIdNum = parseInt(endNodeId, 10);

    // Check if start and end are the same
    if (startNodeIdNum === endNodeIdNum) {
      const errorResponse: ApiResponse = {
        success: false,
        error: 'startNodeId and endNodeId cannot be the same',
        timestamp: new Date().toISOString(),
      };
      res.status(400).json(errorResponse);
      return;
    }

    // Ensure pathfinding service is initialized
    if (!pathfindingService) {
      const errorResponse: ApiResponse = {
        success: false,
        error: 'Pathfinding service not initialized',
        timestamp: new Date().toISOString(),
      };
      res.status(503).json(errorResponse);
      return;
    }

    // Find the path using existing pathfinding service
    const route = await pathfindingService.findPath(
      startNodeIdNum,
      endNodeIdNum,
      false // Default to non-accessibility mode for Task 8
    );

    if (!route) {
      const errorResponse: ApiResponse = {
        success: false,
        error: 'Path not found between the specified nodes',
        timestamp: new Date().toISOString(),
      };
      res.status(404).json(errorResponse);
      return;
    }

    // Convert RouteResponse to RouteCalculationResponse format
    const routeCalculationResponse = convertToRouteCalculationResponse(route);

    const response: ApiResponse<RouteCalculationResponse> = {
      success: true,
      data: routeCalculationResponse,
      timestamp: new Date().toISOString(),
    };

    res.json(response);
  } catch (error) {
    console.error('Route calculation error:', error);
    
    const errorResponse: ApiResponse = {
      success: false,
      error: 'Error retrieving graph data',
      timestamp: new Date().toISOString(),
    };
    
    res.status(500).json(errorResponse);
  }
});

/**
 * Convert RouteResponse to RouteCalculationResponse format (Task 8)
 */
function convertToRouteCalculationResponse(route: RouteResponse): RouteCalculationResponse {
  const path: RoutePathNode[] = route.path.map((step: any) => ({
    nodeId: step.node.id.toString(),
    coordinates_x_px: step.node.coordinates_x_px ?? step.node.geom.x,
    coordinates_y_px: step.node.coordinates_y_px ?? step.node.geom.y,
    floor_plan_id: step.node.floor_plan_id?.toString() ?? '1',
    instructions: step.instruction ?? 'Continue straight',
    type: step.node.type ?? 'junction'
  }));

  // Group path by floor plans to create segments
  const segmentMap = new Map<string, RoutePathNode[]>();
  
  path.forEach(node => {
    const floorId = node.floor_plan_id;
    if (!segmentMap.has(floorId)) {
      segmentMap.set(floorId, []);
    }
    segmentMap.get(floorId)!.push(node);
  });

  const segments: RouteSegment[] = Array.from(segmentMap.entries()).map(([floorId, nodes]) => {
    const pathOnFloor = nodes.map(node => ({
      x: node.coordinates_x_px,
      y: node.coordinates_y_px
    }));

    // Create floor-specific instructions
    const instructionsSegment = nodes.length > 1 
      ? `Navigate through ${nodes.length} points on floor ${floorId}`
      : `Arrive at destination on floor ${floorId}`;

    return {
      floor_plan_id: floorId,
      path_on_floor: pathOnFloor,
      instructions_segment: instructionsSegment
    };
  });

  return {
    path,
    segments
  };
}

// Basic route
app.get('/', (req: Request, res: Response) => {
  const response: ApiResponse = {
    success: true,
    data: {
      message: 'Welcome to Campus Navigation API',
      version: '1.0.0',
      endpoints: {
        health: API_ENDPOINTS.HEALTH + ' (GET - Basic API health)',
        health_db: API_ENDPOINTS.HEALTH + '/db (GET - Database connectivity & diagnostics)',
        health_db_test: API_ENDPOINTS.HEALTH + '/db/test (GET - Database test queries)',
        health_db_pool: API_ENDPOINTS.HEALTH + '/db/pool (GET - Connection pool status)',
        pathfind: API_ENDPOINTS.PATHFIND + ' (POST - Core A* pathfinding)',
        pathfind_test: API_ENDPOINTS.PATHFIND + '/test (GET - Service health check)',
        route: API_ENDPOINTS.ROUTE + ' (POST - Route calculation with frontend-optimized response)',
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

// Initialize database and start server
async function startServer() {
  try {
    // Initialize database service
    console.log('🔌 Initializing database service...');
    dbService = createDatabaseService();
    await dbService.connect();
    console.log('✅ Database service initialized successfully');

    // Initialize pathfinding service with shared database service
    console.log('🧭 Initializing pathfinding service...');
    pathfindingService = new PathfindingService(dbService);
    console.log('✅ Pathfinding service initialized successfully');

    // Mount health check routes with shared database service
    const healthRouter = createHealthRouter(dbService);
    app.use(API_ENDPOINTS.HEALTH, healthRouter);

    // Start the server
app.listen(config.port, () => {
  console.log(`🚀 Campus Navigation API server is running on port ${config.port}`);
  console.log(`📋 Health check available at: http://localhost:${config.port}${API_ENDPOINTS.HEALTH}`);
      console.log(`📊 Database health check: http://localhost:${config.port}${API_ENDPOINTS.HEALTH}/db`);
      console.log(`🧪 Database test queries: http://localhost:${config.port}${API_ENDPOINTS.HEALTH}/db/test`);
      console.log(`📈 Connection pool status: http://localhost:${config.port}${API_ENDPOINTS.HEALTH}/db/pool`);
  console.log(`🗺️ Pathfinding available at: http://localhost:${config.port}${API_ENDPOINTS.PATHFIND}`);
  console.log(`🧪 Pathfinding test at: http://localhost:${config.port}${API_ENDPOINTS.PATHFIND}/test`);
});
  } catch (error) {
    console.error('❌ Failed to start server:', error);
    process.exit(1);
  }
}

// Graceful shutdown
process.on('SIGINT', async () => {
  console.log('\n🛑 Received SIGINT. Graceful shutdown...');
  if (dbService) {
    await dbService.disconnect();
  }
  process.exit(0);
});

process.on('SIGTERM', async () => {
  console.log('\n🛑 Received SIGTERM. Graceful shutdown...');
  if (dbService) {
    await dbService.disconnect();
  }
  process.exit(0);
});

// Start the server
startServer();
