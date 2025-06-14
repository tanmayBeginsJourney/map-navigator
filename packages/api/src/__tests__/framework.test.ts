import { drizzle, PostgresJsDatabase } from 'drizzle-orm/postgres-js';
import { eq } from 'drizzle-orm';
import { DatabaseService, createDatabaseService } from '../db/connection';
import { config } from '../config';
import * as schema from '../db/schema';

// Helper function to reset the database between tests
const resetDatabase = async (db: PostgresJsDatabase<typeof schema>) => {
  // This will delete all rows from the tables, resetting them
  console.log('Resetting database...');
  await db.delete(schema.edges);
  await db.delete(schema.nodes);
  // Add other tables as needed, in the correct order to respect foreign keys
  console.log('Database reset complete.');
};


describe('Integration Test Framework', () => {
  let dbService: DatabaseService;
  let db: PostgresJsDatabase<typeof schema>;

  beforeAll(async () => {
    // Map the app config to the database config
    const dbConfig = {
      host: config.database.host,
      port: config.database.port,
      name: config.database.name,
      user: config.database.user,
      password: config.database.password,
      ssl: false, // Explicitly false for local test environment
    };
    dbService = createDatabaseService(dbConfig);
    await dbService.connect();
    // Create a new, fully-typed Drizzle instance for tests
    db = drizzle(dbService.getSql(), { schema });
  });

  afterAll(async () => {
    if (dbService) {
      await dbService.disconnect();
    }
  });
  
  beforeEach(async () => {
    // Reset the database before each test
    await resetDatabase(db);
  });

  it('should connect to the database and perform a query', async () => {
    // This is a simple test to ensure the connection is live
    const sql = dbService.getSql();
    const result = await sql`SELECT 1 as value`;
    expect(result[0].value).toBe(1);
  });
  
  it('should be able to insert and retrieve data', async () => {
    // Insert a sample node
    await db.insert(schema.nodes).values({
      id: 9999,
      name: 'Test Room',
      type: 'ROOM',
      geom: 'POINT(0 0)',
      isAccessible: true,
    });
    
    // Retrieve the node using Drizzle's query builder
    const nodes = await db.select().from(schema.nodes).where(eq(schema.nodes.id, 9999));
    
    expect(nodes).toHaveLength(1);
    expect(nodes[0].id).toBe(9999);
    expect(nodes[0].name).toBe('Test Room');
  });
}); 