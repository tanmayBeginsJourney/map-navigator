/**
 * Test script to verify database connection and setup
 * Run with: node scripts/test-connection.js
 */

const db = require('./database');

async function runTests() {
  console.log('🔧 Testing Database Connection Module...\n');
  
  try {
    // Test 1: Basic connection test
    console.log('1️⃣ Testing basic database connection...');
    const connectionSuccess = await db.testConnection();
    if (!connectionSuccess) {
      console.error('❌ Basic connection test failed');
      process.exit(1);
    }
    console.log('');

    // Test 2: PostGIS availability
    console.log('2️⃣ Testing PostGIS extension...');
    const postgisAvailable = await db.checkPostGIS();
    if (!postgisAvailable) {
      console.error('❌ PostGIS extension test failed');
      process.exit(1);
    }
    console.log('');

    // Test 3: Check existing tables (from migrations)
    console.log('3️⃣ Checking database schema...');
    const requiredTables = ['buildings', 'floor_plans', 'nodes', 'edges'];
    const tablesResult = await db.query(`
      SELECT table_name FROM information_schema.tables 
      WHERE table_schema = 'public' AND table_type = 'BASE TABLE'
    `);
    
    const existingTables = tablesResult.rows.map(row => row.table_name);
    console.log('   Existing tables:', existingTables.join(', '));
    
    let missingTables = [];
    for (const table of requiredTables) {
      if (existingTables.includes(table)) {
        console.log(`   ✅ Table '${table}' exists`);
      } else {
        console.log(`   ❌ Table '${table}' missing`);
        missingTables.push(table);
      }
    }
    
    // Fail fast if any required tables are missing
    if (missingTables.length > 0) {
      throw new Error(`Missing required tables: ${missingTables.join(', ')}. Please run database migrations first.`);
    }
    
    console.log('');

    // Test 4: Check ENUM types
    console.log('4️⃣ Checking ENUM types...');
    const enumsResult = await db.query(`
      SELECT t.typname as enum_name,
             array_agg(e.enumlabel ORDER BY e.enumsortorder) as enum_values
      FROM pg_type t 
      JOIN pg_enum e ON t.oid = e.enumtypid  
      WHERE t.typname IN ('node_type_enum', 'edge_type_enum')
      GROUP BY t.typname
    `);
    
    // Fail fast if no ENUM types are found
    if (enumsResult.rows.length === 0) {
      throw new Error('No ENUM types found. Please run database migrations first.');
    }
    
    const requiredEnums = ['node_type_enum', 'edge_type_enum'];
    const existingEnums = enumsResult.rows.map(row => row.enum_name);
    const missingEnums = requiredEnums.filter(enumName => !existingEnums.includes(enumName));
    
    if (missingEnums.length > 0) {
      throw new Error(`Missing required ENUM types: ${missingEnums.join(', ')}. Please run database migrations first.`);
    }
    
    for (const enumRow of enumsResult.rows) {
      console.log(`   ✅ ${enumRow.enum_name}: ${enumRow.enum_values}`);
    }
    console.log('');

    // Test 5: Test transaction capability
    console.log('5️⃣ Testing transaction functionality...');
    await db.transaction([
      { text: 'SELECT 1 as test_value' },
      { text: 'SELECT NOW() as test_time' }
    ]);
    console.log('   ✅ Transaction test successful');
    console.log('');

    // Summary
    console.log('🎉 All database connection tests passed!');
    console.log('📋 Summary:');
    console.log('   ✅ Database connection working');
    console.log('   ✅ PostGIS extension available');
    console.log('   ✅ Database schema present');
    console.log('   ✅ ENUM types configured');
    console.log('   ✅ Transaction support working');
    console.log('\n🚀 Ready for data seeding operations!');

  } catch (error) {
    console.error('\n❌ Test failed:', error.message);
    console.error('🔧 Please check your database configuration and ensure:');
    console.error('   - PostgreSQL is running');
    console.error('   - Database exists and is accessible');
    console.error('   - Migrations have been applied');
    console.error('   - Environment variables are set correctly');
    process.exit(1);
  } finally {
    // Close database connections
    await db.close();
  }
}

// Run the tests
if (require.main === module) {
  runTests().catch(error => {
    console.error('❌ Unexpected error:', error);
    process.exit(1);
  });
}

module.exports = { runTests }; 