import express, { Express, Request, Response, NextFunction } from 'express';
import { ApiResponse, API_ENDPOINTS, RouteResponse, RouteCalculationResponse, RoutePathNode, RouteSegment } from '@campus-nav/shared/types';
import { PathfindingService } from './pathfinding';
import { config, isDevelopment, isProduction } from './config';
import { createDatabaseService, DatabaseConfig } from './db/connection';
import createHealthRouter from './routes/health';
import { routeValidationRules, checkValidationErrors } from './middleware/route-validation';
import logger from './logger';

const app: Express = express();

// --- Database and Service Initialization ---

// 1. Validate DB configuration
const requiredDbConfig: Array<keyof typeof config.database> = ['host', 'port', 'name', 'user', 'password'];
for (const key of requiredDbConfig) {
  if (!config.database[key]) {
    throw new Error(`FATAL: Missing required database configuration: ${key}`);
  }
}

// 2. Create DB configuration object
const dbConfig: DatabaseConfig = {
  host: config.database.host,
  port: config.database.port,
  name: config.database.name,
  user: config.database.user,
  password: config.database.password,
  ssl: isProduction,
};

// 3. Initialize services as singletons
const dbService = createDatabaseService(dbConfig);
const pathfindingService = new PathfindingService(dbService);


// --- Middleware ---
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
app.use(API_ENDPOINTS.HEALTH, createHealthRouter(dbService));

// Route calculation endpoint
app.post(API_ENDPOINTS.ROUTE, routeValidationRules, checkValidationErrors, async (req: Request, res: Response) => {
  logger.info('--- ROUTE CALCULATION START ---');
  try {
    const { startNodeId, endNodeId, accessibilityRequired } = req.body;
    
    logger.info({ startNodeId, endNodeId, accessibilityRequired }, 'Route calculation request received');

    // 1. Get the raw path from the pathfinding service
    logger.info('Calling pathfindingService.findPath...');
    const rawRoute = await pathfindingService.findPath(startNodeId, endNodeId, accessibilityRequired);
    logger.info({ rawRouteExists: !!rawRoute }, 'pathfindingService.findPath finished.');
    
    if (rawRoute) {
      // 2. Convert the raw path to the frontend-optimized format
      logger.info('Calling convertToRouteCalculationResponse...');
      const finalRoute = convertToRouteCalculationResponse(rawRoute);
      logger.info('convertToRouteCalculationResponse finished.');
      
      const response: ApiResponse<RouteCalculationResponse> = {
        success: true,
        data: finalRoute,
        timestamp: new Date().toISOString(),
      };
      res.json(response);
    } else {
      logger.warn('No route found. Sending 404 response.');
      const response: ApiResponse = {
        success: false,
        error: 'Route not found',
        timestamp: new Date().toISOString(),
      };
      res.status(404).json(response);
    }
  } catch (error) {
    logger.error({ err: error }, '--- ROUTE CALCULATION CRASH ---');
    const response: ApiResponse = {
      success: false,
      error: 'An unexpected error occurred during route calculation.',
      timestamp: new Date().toISOString(),
    };
    res.status(500).json(response);
  }
});

/**
 * Convert RouteResponse to RouteCalculationResponse format (Task 8)
 */
function convertToRouteCalculationResponse(route: RouteResponse): RouteCalculationResponse {
  if (!route || !route.path) {
    // This case should ideally be handled before calling, but as a safeguard:
    return { path: [], segments: [] };
  }

  const path: RoutePathNode[] = route.path
    .filter(step => !!step && !!step.node) // Filter out any invalid steps
    .map((step: any) => ({
      nodeId: step.node.id.toString(),
      coordinates_x_px: step.node.coordinates_x_px ?? step.node.geom?.x ?? 0,
      coordinates_y_px: step.node.coordinates_y_px ?? step.node.geom?.y ?? 0,
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
        health: API_ENDPOINTS.HEALTH + ' (GET - Full system health, including DB)',
        route: API_ENDPOINTS.ROUTE + ' (POST - Core route calculation for the frontend)',
        buildings: API_ENDPOINTS.BUILDINGS + ' (GET - Coming soon)',
        locations: API_ENDPOINTS.LOCATIONS + ' (GET - Coming soon)',
      }
    },
    timestamp: new Date().toISOString(),
  };
  
  res.json(response);
});

// --- Global Error Handler ---
// This should be the last middleware
app.use((err: Error, req: Request, res: Response, next: NextFunction) => {
  logger.error({ err }, 'Unhandled error caught by global error handler');
  
  const response: ApiResponse = {
    success: false,
    error: 'An internal server error occurred',
    timestamp: new Date().toISOString(),
  };
  
  res.status(500).json(response);
});

// Initialize database and start server
async function startServer(): Promise<void> {
  try {
    await dbService.connect();
    
    app.listen(config.port, () => {
      logger.info(`✅ Server is running at http://localhost:${config.port}`);
    });
  } catch (error) {
    logger.error({ err: error }, '❌ Failed to start server');
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

// Start the server only if the file is executed directly
if (require.main === module) {
  startServer().catch(error => {
    logger.fatal({ err: error }, 'Unhandled error during server startup');
    process.exit(1);
  });
}

export { app, dbService };
