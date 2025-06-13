import { Router, type Request, type Response } from 'express';
import { createDatabaseService } from '../db/connection';
import { config } from '../config';

const router: Router = Router();

// Initialize database service
let dbService: ReturnType<typeof createDatabaseService> | null = null;

const getDbService = () => {
  if (!dbService) {
    dbService = createDatabaseService();
  }
  return dbService;
};

/**
 * Basic API health check
 */
router.get('/', (req, res) => {
  res.json({
    status: 'healthy',
    timestamp: new Date().toISOString(),
    version: '1.0.0',
    environment: config.nodeEnv,
  });
});

/**
 * Database health check with detailed diagnostics
 */
router.get('/db', async (req, res) => {
  const startTime = Date.now();
  
  try {
    const db = getDbService();
    
    // Ensure connection is established
    await db.connect();
    
    // Perform health check
    const healthResult = await db.healthCheck();
    const postgisResult = await db.checkPostGIS();
    const connectionStatus = db.getStatus();
    
    const response = {
      status: healthResult.status,
      timestamp: new Date().toISOString(),
      latency: healthResult.latency,
      connection: {
        connected: connectionStatus.connected,
        attempts: connectionStatus.attempts,
        hasDb: connectionStatus.hasDb,
        hasSql: connectionStatus.hasSql,
      },
      database: {
        name: config.database.name,
        host: config.database.host,
        port: config.database.port,
      },
      postgis: {
        available: postgisResult.available,
        version: postgisResult.version,
        error: postgisResult.error,
      },
      totalResponseTime: Date.now() - startTime,
    };

    if (healthResult.status === 'healthy') {
      res.json(response);
    } else {
      res.status(503).json({
        ...response,
        error: healthResult.error,
      });
    }
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    
    res.status(503).json({
      status: 'unhealthy',
      timestamp: new Date().toISOString(),
      error: errorMessage,
      connection: dbService ? dbService.getStatus() : { connected: false },
      totalResponseTime: Date.now() - startTime,
    });
  }
});

/**
 * Database connection test with sample query
 */
router.get('/db/test', async (req, res) => {
  const startTime = Date.now();
  
  try {
    const db = getDbService();
    await db.connect();
    
    // Test with a sample query that exercises PostGIS
    const sql = db.getSql();
    const result = await sql`
      SELECT 
        COUNT(*) as node_count,
        COUNT(DISTINCT building_id) as building_count,
        COUNT(DISTINCT floor_plan_id) as floor_plan_count,
        COUNT(DISTINCT type) as node_types
      FROM nodes
    `;
    
    const postgisTest = await sql`
      SELECT 
        ST_AsText(ST_Point(0, 0)) as sample_point,
        PostGIS_Version() as postgis_version
    `;
    
    res.json({
      status: 'healthy',
      timestamp: new Date().toISOString(),
      test_results: {
        node_statistics: result[0],
        postgis_sample: postgisTest[0],
      },
      latency: Date.now() - startTime,
    });
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    
    res.status(503).json({
      status: 'unhealthy',
      timestamp: new Date().toISOString(),
      error: errorMessage,
      latency: Date.now() - startTime,
    });
  }
});

/**
 * Database connection pool status
 */
router.get('/db/pool', async (req, res) => {
  try {
    const db = getDbService();
    await db.connect();
    
    // Get connection status
    const status = db.getStatus();
    
    res.json({
      status: status.connected ? 'healthy' : 'unhealthy',
      timestamp: new Date().toISOString(),
      pool: status,
    });
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    
    res.status(503).json({
      status: 'unhealthy',
      timestamp: new Date().toISOString(),
      error: errorMessage,
    });
  }
});

export default router; 