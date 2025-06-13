const fs = require('fs');
const path = require('path');
const { query, testConnection, close } = require('./database');

async function runMigrations() {
  console.log('🚀 Starting database migrations...');
  
  // Test connection first
  const connected = await testConnection();
  if (!connected) {
    console.error('❌ Cannot proceed with migrations - database connection failed');
    process.exit(1);
  }

  const migrationFiles = [
    '001_enums_buildings_floor_plans.sql',
    '002_nodes.sql', 
    '003_edges.sql'
  ];

  for (const file of migrationFiles) {
    try {
      console.log(`📄 Running migration: ${file}`);
      const migrationPath = path.join(__dirname, '..', 'migrations', file);
      const sql = fs.readFileSync(migrationPath, 'utf8');
      
      await query(sql);
      console.log(`✅ Migration ${file} completed successfully`);
    } catch (error) {
      console.error(`❌ Migration ${file} failed:`, error.message);
      // Continue with other migrations
    }
  }

  console.log('🎉 All migrations completed');
  await close();
}

// Run migrations if called directly
if (require.main === module) {
  runMigrations().catch(error => {
    console.error('❌ Migration process failed:', error);
    process.exit(1);
  });
}

module.exports = { runMigrations }; 