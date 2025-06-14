import { createDatabaseService, DatabaseService } from '../src/db/connection';
import { Node as SharedNode, Edge as SharedEdge, NodeType as SharedNodeType, EdgeType as SharedEdgeType } from '@campus-nav/shared/types';
import * as schema from '../src/db/schema';
import { sql } from 'drizzle-orm';

// Use the schema-defined types for insertion
type InsertNode = typeof schema.nodes.$inferInsert;
type SelectNode = typeof schema.nodes.$inferSelect;

describe('DatabaseService Integration Tests', () => {
  let dbService: DatabaseService;
  let testNode: SelectNode;

  // Establish a single connection for all tests in this suite
  beforeAll(async () => {
    dbService = createDatabaseService();
    await dbService.connect();
    // Ensure the database is clean before starting
    const db = dbService.getDb();
    await db.delete(schema.edges);
    await db.delete(schema.nodes);
  }, 45000);

  // Close the connection after all tests are done
  afterAll(async () => {
    await dbService.disconnect();
  });

  // Use a transaction for each test to ensure isolation
  beforeEach(async () => {
    const db = dbService.getDb();
    // Insert a test node before each test using schema properties
    const nodeToInsert: InsertNode = {
        name: 'Test Node A',
        type: 'POINT_OF_INTEREST', // Correct enum from schema
        isAccessible: true,
        geom: sql`ST_SetSRID(ST_MakePoint(1, 1), 4326)` as any,
    };
    const insertedNodes = await db.insert(schema.nodes).values(nodeToInsert).returning();
    testNode = insertedNodes[0];
  });

  afterEach(async () => {
    // Clean up created data
    const db = dbService.getDb();
    await db.delete(schema.edges);
    await db.delete(schema.nodes);
  });


  it('should retrieve a node by its ID', async () => {
    const node = await dbService.getNodeById(testNode.id);
    expect(node).toBeDefined();
    expect(node?.id).toBe(testNode.id);
    expect(node?.name).toBe('Test Node A');
  });

  it('should return null for a non-existent node ID', async () => {
    const node = await dbService.getNodeById(99999);
    expect(node).toBeNull();
  });

  it('should retrieve edges originating from a node', async () => {
    const db = dbService.getDb();
    // Create another node to connect to
    const otherNode = (await db.insert(schema.nodes).values({
        name: 'Test Node B',
        type: 'ROOM',
        isAccessible: true,
        geom: sql`ST_SetSRID(ST_MakePoint(2, 2), 4326)` as any,
    }).returning())[0];

    // Create an edge between them using schema properties
    await db.insert(schema.edges).values({
        fromNodeId: testNode.id,
        toNodeId: otherNode.id,
        type: 'HALLWAY', // Correct enum from schema
        weight: 10,
    });
    
    const edges = await dbService.getEdgesFromNode(testNode.id);
    expect(edges).toHaveLength(1);
    expect(edges[0].from_node_id).toBe(testNode.id);
    expect(edges[0].to_node_id).toBe(otherNode.id);
  });
  
  it('should retrieve only accessible edges when requested', async () => {
    const db = dbService.getDb();
    // Create target nodes
    const nodeB = (await db.insert(schema.nodes).values({ name: 'Node B (Accessible)', type: 'ROOM', isAccessible: true, geom: sql`ST_SetSRID(ST_MakePoint(2,2),4326)` as any }).returning())[0];
    const nodeC = (await db.insert(schema.nodes).values({ name: 'Node C (Stairs)', type: 'POINT_OF_INTEREST', isAccessible: false, geom: sql`ST_SetSRID(ST_MakePoint(3,3),4326)` as any }).returning())[0];

    // Create edges
    await db.insert(schema.edges).values([
        { fromNodeId: testNode.id, toNodeId: nodeB.id, type: 'HALLWAY', weight: 1 },
        { fromNodeId: testNode.id, toNodeId: nodeC.id, type: 'STAIRCASE', weight: 1 },
    ]);
    
    const allEdges = await dbService.getEdgesFromNode(testNode.id);
    const accessibleEdges = await dbService.getAccessibleEdgesFromNode(testNode.id);
    
    expect(allEdges).toHaveLength(2);
    expect(accessibleEdges).toHaveLength(1);
    expect(accessibleEdges[0].to_node_id).toBe(nodeB.id);
    // This check is tricky because the shared type is different. We rely on the DB function's logic.
    const accessibleEdgeTypes = accessibleEdges.map(e => e.type);
    expect(accessibleEdgeTypes.includes('STAIRCASE' as any)).toBe(false);
  });

}); 