const { Pool } = require('pg');

async function checkAttributes() {
  const pool = new Pool({
    host: 'localhost',
    port: 5432,
    database: 'campus_navigation',
    user: 'postgres',
    password: process.env.DB_PASSWORD,
  });

  try {
    console.log('🔍 Checking attributes data...');
    
    const result = await pool.query('SELECT id, name, attributes FROM nodes WHERE id IN (1, 39)');
    console.log('Node attributes:');
    result.rows.forEach(row => {
      console.log(`  Node ${row.id} (${row.name}): attributes = ${JSON.stringify(row.attributes)}`);
      console.log(`    Type: ${typeof row.attributes}`);
      console.log(`    Is null: ${row.attributes === null}`);
      if (row.attributes && typeof row.attributes === 'string') {
        try {
          const parsed = JSON.parse(row.attributes);
          console.log(`    Parsed: ${JSON.stringify(parsed)}`);
        } catch (e) {
          console.log(`    Parse error: ${e.message}`);
        }
      }
    });

    const edgeResult = await pool.query('SELECT id, from_node_id, to_node_id, attributes FROM edges WHERE from_node_id = 1 OR to_node_id = 1 LIMIT 3');
    console.log('\nEdge attributes:');
    edgeResult.rows.forEach(row => {
      console.log(`  Edge ${row.id} (${row.from_node_id}->${row.to_node_id}): attributes = ${JSON.stringify(row.attributes)}`);
      console.log(`    Type: ${typeof row.attributes}`);
      console.log(`    Is null: ${row.attributes === null}`);
    });

  } catch (error) {
    console.error('❌ Error:', error.message);
  } finally {
    await pool.end();
  }
}

checkAttributes().catch(console.error); 