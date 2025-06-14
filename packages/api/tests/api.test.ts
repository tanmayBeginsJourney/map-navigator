import { describe, it, expect, beforeAll, afterAll } from '@jest/globals';
import request from 'supertest';
import { app, dbService } from '../src/index'; // Import the configured app and dbService
import * as schema from '../src/db/schema';
import { sql } from 'drizzle-orm';

describe('API Endpoints - Complete Test Suite', () => {
  let testNodeIds: { startId: number; endId: number } = { startId: 0, endId: 0 };

  beforeAll(async () => {
    await dbService.connect();
    
    // Ensure clean test environment
    const db = dbService.getDb();
    
    // Clean existing data 
    await db.delete(schema.edges);
    await db.delete(schema.nodes);
    await db.delete(schema.floorPlans);
    await db.delete(schema.buildings);

    // Create building and floor plan
    const building = (await db.insert(schema.buildings).values({
      name: 'API Test Building',
    }).returning())[0];

    const floorPlan = (await db.insert(schema.floorPlans).values({
      buildingId: building.id,
      floorNumber: 1,
      name: 'Ground Floor',
      widthPx: 800,
      heightPx: 600,
    }).returning())[0];

    // Create two connected nodes
    const node1 = (await db.insert(schema.nodes).values({
      name: 'API Test Start',
      type: 'ENTRANCE',
      buildingId: building.id,
      floorPlanId: floorPlan.id,
      coordinatesXPx: 100,
      coordinatesYPx: 100,
      isAccessible: true,
      geom: sql`ST_SetSRID(ST_MakePoint(100, 100), 0)` as any,
    }).returning())[0];
    
    const node2 = (await db.insert(schema.nodes).values({
        name: 'API Test End',
        type: 'ROOM',
        buildingId: building.id,
        floorPlanId: floorPlan.id,
        coordinatesXPx: 200,
        coordinatesYPx: 200,
        isAccessible: true,
        geom: sql`ST_SetSRID(ST_MakePoint(200, 200), 0)` as any,
    }).returning())[0];

    // Create bidirectional edges for proper pathfinding
    await db.insert(schema.edges).values([
      {
        fromNodeId: node1.id,
        toNodeId: node2.id,
        type: 'HALLWAY',
        weight: 141.42, // Euclidean distance from (100,100) to (200,200)
        instructions: 'Walk to the destination',
      },
      {
        fromNodeId: node2.id,
        toNodeId: node1.id,
        type: 'HALLWAY',
        weight: 141.42, // Bidirectional connection
        instructions: 'Walk back to the start',
      }
    ]);

    testNodeIds = { startId: node1.id, endId: node2.id };
  }, 60000);

  afterAll(async () => {
    await dbService.disconnect();
  });

  // Test the Health Check endpoint
  describe('GET /health/db', () => {
    it('should return a 200 OK with healthy status', async () => {
      const res = await request(app).get('/health/db');
      expect(res.status).toBe(200);
      expect(res.body.status).toBe('healthy');
      expect(res.body.database.connected).toBe(true);
    });
  });
  
  // Test input validation
  describe('POST /api/route - Validation Tests', () => {
    it('should return 400 for invalid startNodeId (not a string)', async () => {
      const res = await request(app)
        .post('/api/route')
        .send({ startNodeId: 123, endNodeId: '456' });
      
      expect(res.status).toBe(400);
      expect(res.body.success).toBe(false);
      expect(res.body.error).toBe('Validation failed');
      expect(res.body.details).toBeDefined();
    });

    it('should return 400 for invalid startNodeId (not digits)', async () => {
      const res = await request(app)
        .post('/api/route')
        .send({ startNodeId: 'not-a-number', endNodeId: '456' });
      
      expect(res.status).toBe(400);
      expect(res.body.success).toBe(false);
      expect(res.body.error).toBe('Validation failed');
      expect(res.body.details).toBeDefined();
    });

    it('should return 400 for same start and end nodes', async () => {
      const res = await request(app)
        .post('/api/route')
        .send({ startNodeId: '123', endNodeId: '123' });
      
      expect(res.status).toBe(400);
      expect(res.body.success).toBe(false);
      expect(res.body.error).toBe('Validation failed');
      expect(res.body.details).toBeDefined();
    });

    it('should return 400 for missing required fields', async () => {
      const res = await request(app)
        .post('/api/route')
        .send({ endNodeId: '456' }); // missing startNodeId
      
      expect(res.status).toBe(400);
      expect(res.body.success).toBe(false);
      expect(res.body.error).toBe('Validation failed');
      expect(res.body.details).toBeDefined();
    });
  });

  // Test route calculation
  describe('POST /api/route - Route Calculation', () => {
    it('should return a 404 if no route is found', async () => {
      const res = await request(app)
        .post('/api/route')
        .send({ startNodeId: '998', endNodeId: '999' }); // Non-existent nodes
      
      expect(res.status).toBe(404);
      expect(res.body.success).toBe(false);
      expect(res.body.error).toBe('Route not found');
    });

    it('should calculate and return a valid route for connected nodes', async () => {
      const res = await request(app)
        .post('/api/route')
        .send({ 
          startNodeId: testNodeIds.startId.toString(), 
          endNodeId: testNodeIds.endId.toString() 
        });

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.data).toBeDefined();
      expect(res.body.data.path).toBeInstanceOf(Array);
      expect(res.body.data.path.length).toBe(2);
      expect(res.body.data.path[0].nodeId).toBe(testNodeIds.startId.toString());
      expect(res.body.data.path[1].nodeId).toBe(testNodeIds.endId.toString());
      expect(res.body.data.segments).toBeInstanceOf(Array);
      expect(res.body.data.segments.length).toBeGreaterThan(0);
    });

    it('should handle accessibility requirements', async () => {
      const res = await request(app)
        .post('/api/route')
        .send({ 
          startNodeId: testNodeIds.startId.toString(), 
          endNodeId: testNodeIds.endId.toString(),
          accessibilityRequired: true
        });

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.data.path).toBeInstanceOf(Array);
      expect(res.body.data.path.length).toBe(2);
    });
  });
}); 