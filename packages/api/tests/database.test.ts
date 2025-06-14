import { createDatabaseService } from '../src/db/connection';
import type { DatabaseService } from '../src/db/connection';

describe('Database Service', () => {
  let dbService: DatabaseService;

  beforeAll(async () => {
    dbService = createDatabaseService();
    await dbService.connect();
  }, 30000); // Increase timeout for initial connection

  afterAll(async () => {
    await dbService.disconnect();
  });

  it('should connect to the database and execute a simple query', async () => {
    expect(dbService).toBeDefined();
    const db = dbService.getDb();
    expect(db).toBeDefined();

    const sql = dbService.getSql();
    const result = await sql`SELECT 1 + 1 as result`;

    expect(result[0].result).toBe(2);
  });
}); 