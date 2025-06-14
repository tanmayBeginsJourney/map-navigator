import { describe, it, expect, beforeAll, afterAll } from '@jest/globals';
import request from 'supertest';
import { app, dbService } from '../src/index'; // Import the configured app and dbService
import * as schema from '../src/db/schema';
import { sql } from 'drizzle-orm';

describe('API Endpoints', () => {

  // Connect to the database before all tests in this suite
  beforeAll(async () => {
    await dbService.connect();
    // Clean and seed the database for a predictable state
    const db = dbService.getDb();
    await db.delete(schema.edges);
    await db.delete(schema.nodes);

    // Seed data for a known route: Node 1 -> Node 2
    const node1 = (await db.insert(schema.nodes).values({
      name: 'API Test Start',
      type: 'ENTRANCE',
      isAccessible: true,
      geom: sql`ST_SetSRID(ST_MakePoint(10, 10), 4326)` as any,
    }).returning())[0];
    
    const node2 = (await db.insert(schema.nodes).values({
        name: 'API Test End',
        type: 'ROOM',
        isAccessible: true,
        geom: sql`ST_SetSRID(ST_MakePoint(20, 20), 4326)` as any,
    }).returning())[0];

    await db.insert(schema.edges).values({
        fromNodeId: node1.id,
        toNodeId: node2.id,
        type: 'HALLWAY',
        weight: 15,
    });

  }, 60000);

  // Disconnect after all tests are done
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
  
  // Test the Route Calculation endpoint
  describe('POST /api/route', () => {
    it('should return a 404 if no route is found', async () => {
      const res = await request(app)
        .post('/api/route')
        .send({ startNodeId: '998', endNodeId: '999' }); // Non-existent nodes
      
      expect(res.status).toBe(404);
      expect(res.body.success).toBe(false);
      expect(res.body.error).toBe('Route not found');
    });

    it('should return a 400 for invalid input schema', async () => {
        const res = await request(app)
            .post('/api/route')
            .send({ startNodeId: 'not-a-number', endNodeId: 2 });
            
        expect(res.status).toBe(400);
        expect(res.body.success).toBe(false);
        expect(res.body.error).toBe('Validation failed');
    });

    it('should calculate and return a valid route', async () => {
      const db = dbService.getDb();
      const startNode = await db.query.nodes.findFirst({ where: (nodes, { eq }) => eq(nodes.name, 'API Test Start') });
      const endNode = await db.query.nodes.findFirst({ where: (nodes, { eq }) => eq(nodes.name, 'API Test End') });

      const res = await request(app)
        .post('/api/route')
        .send({ startNodeId: startNode!.id.toString(), endNodeId: endNode!.id.toString() });

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.data.path).toBeInstanceOf(Array);
      expect(res.body.data.path.length).toBe(2);
      expect(res.body.data.path[0].nodeId).toBe(startNode!.id.toString());
      expect(res.body.data.path[1].nodeId).toBe(endNode!.id.toString());
    });
  });
}); 