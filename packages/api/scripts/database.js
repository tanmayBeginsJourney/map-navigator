const { Pool } = require('pg');

/**
 * Database connection configuration
 * Uses environment variables with sensible defaults for development
 */
const dbConfig = {
  host: process.env.DB_HOST || 'localhost',
  port: parseInt(process.env.DB_PORT || '5432', 10),
  database: process.env.DB_NAME || 'campus_navigation',
  user: process.env.DB_USER || 'postgres',
  password: process.env.DB_PASSWORD, // No default for security
  // Connection pool settings
  max: 10,
  idleTimeoutMillis: 30000,
  connectionTimeoutMillis: 2000,
};

// Create the connection pool
const pool = new Pool(dbConfig);

// Add global pool error handler to prevent process crashes
pool.on('error', (err) => {
  console.error('❌ Unexpected database pool error:', err.message);
  console.error('Connection details:', {
    host: dbConfig.host,
    port: dbConfig.port,
    database: dbConfig.database,
    user: dbConfig.user
  });
});

/**
 * Get a database client from the pool
 * @returns {Promise<Object>} Database client
 */
async function getClient() {
  try {
    const client = await pool.connect();
    console.log('✅ Database connection established');
    return client;
  } catch (error) {
    console.error('❌ Failed to connect to database:', error.message);
    throw error;
  }
}

/**
 * Execute a query with optional parameters
 * @param {string} text - SQL query text
 * @param {Array} params - Query parameters
 * @returns {Promise<Object>} Query result
 */
async function query(text, params) {
  const client = await getClient();
  try {
    const result = await client.query(text, params);
    return result;
  } catch (error) {
    console.error('❌ Query failed:', error.message);
    throw error;
  } finally {
    client.release();
  }
}

/**
 * Execute multiple queries in a transaction
 * @param {Array<{text: string, params?: Array}>} queries - Array of query objects
 * @returns {Promise<Array>} Array of query results
 */
async function transaction(queries) {
  const client = await getClient();
  try {
    await client.query('BEGIN');
    console.log('🔄 Transaction started');
    
    const results = [];
    for (const queryObj of queries) {
      const result = await client.query(queryObj.text, queryObj.params);
      results.push(result);
    }
    
    await client.query('COMMIT');
    console.log('✅ Transaction committed');
    return results;
  } catch (error) {
    await client.query('ROLLBACK');
    console.error('❌ Transaction rolled back:', error.message);
    throw error;
  } finally {
    client.release();
  }
}

/**
 * Test the database connection
 * @returns {Promise<void>}
 */
async function testConnection() {
  try {
    const result = await query('SELECT NOW() as current_time, version() as pg_version');
    console.log('✅ Database connection test successful');
    console.log('   Current time:', result.rows[0].current_time);
    console.log('   PostgreSQL version:', result.rows[0].pg_version.split(' ')[0] + ' ' + result.rows[0].pg_version.split(' ')[1]);
    return true;
  } catch (error) {
    console.error('❌ Database connection test failed:', error.message);
    return false;
  }
}

/**
 * Close all database connections
 * @returns {Promise<void>}
 */
async function close() {
  try {
    await pool.end();
    console.log('✅ Database connection pool closed');
  } catch (error) {
    console.error('❌ Error closing database pool:', error.message);
  }
}

/**
 * Check if PostGIS extension is available
 * @returns {Promise<boolean>}
 */
async function checkPostGIS() {
  try {
    const result = await query('SELECT PostGIS_Full_Version() as postgis_version');
    console.log('✅ PostGIS available:', result.rows[0].postgis_version.split(' ')[0]);
    return true;
  } catch (error) {
    console.error('❌ PostGIS not available:', error.message);
    return false;
  }
}

module.exports = {
  getClient,
  query,
  transaction,
  testConnection,
  checkPostGIS,
  close,
  dbConfig
}; 