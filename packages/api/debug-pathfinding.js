// Simple debug script to test pathfinding without the API layer
const { Pool } = require('pg');

async function debugPathfinding() {
  console.log('🔍 Debugging Pathfinding...');
  
  // Test database connection first
  const pool = new Pool({
    host: process.env.DB_HOST || 'localhost',
    port: parseInt(process.env.DB_PORT || '5432', 10),
    database: process.env.DB_NAME || 'campus_navigation',
    user: process.env.DB_USER || 'postgres',
    password: process.env.DB_PASSWORD,
    max: 10,
    idleTimeoutMillis: 30000,
    connectionTimeoutMillis: 2000,
  });

  try {
    console.log('1️⃣ Testing database connection...');
    const client = await pool.connect();
    const result = await client.query('SELECT NOW()');
    console.log('✅ Database connected:', result.rows[0].now);
    client.release();

    console.log('2️⃣ Testing node retrieval...');
    const nodeClient = await pool.connect();
    const nodeResult = await nodeClient.query('SELECT id, name, type FROM nodes WHERE id IN (1, 39)');
    console.log('✅ Found nodes:', nodeResult.rows);
    nodeClient.release();

    console.log('3️⃣ Testing edge retrieval...');
    const edgeClient = await pool.connect();
    const edgeResult = await edgeClient.query('SELECT id, from_node_id, to_node_id, type FROM edges WHERE from_node_id = 1 OR to_node_id = 1 LIMIT 5');
    console.log('✅ Found edges from node 1:', edgeResult.rows);
    edgeClient.release();

    console.log('4️⃣ Testing spatial data...');
    const spatialClient = await pool.connect();
    const spatialResult = await spatialClient.query('SELECT id, ST_X(geom) as x, ST_Y(geom) as y FROM nodes WHERE id IN (1, 39)');
    console.log('✅ Spatial data:', spatialResult.rows);
    spatialClient.release();

  } catch (error) {
    console.error('❌ Debug failed:', error.message);
    console.error('Stack:', error.stack);
  } finally {
    await pool.end();
  }
}

// Run if called directly
if (require.main === module) {
  debugPathfinding().catch(console.error);
} 