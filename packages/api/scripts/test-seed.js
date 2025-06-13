const path = require('path');
const seed = require('./seed');
const database = require('./database');

/**
 * Comprehensive test suite for the database seeding process
 * Tests the complete end-to-end seeding workflow
 */

/**
 * Test the command line argument parsing
 */
function testCommandLineArguments() {
  console.log('1️⃣ Testing command line argument parsing...');
  
  // Mock process.argv for testing
  const originalArgv = process.argv;
  
  try {
    // Test default configuration
    process.argv = ['node', 'seed.js'];
    const defaultConfig = seed.parseCommandLineArgs();
    
    if (!defaultConfig.useTransaction) {
      throw new Error('Default useTransaction should be true');
    }
    if (defaultConfig.clearExisting) {
      throw new Error('Default clearExisting should be false');
    }
    if (defaultConfig.logLevel !== 'info') {
      throw new Error('Default logLevel should be info');
    }
    
    // Test custom arguments
    process.argv = ['node', 'seed.js', '--clear', '--no-transaction', '--log-level', 'debug'];
    const customConfig = seed.parseCommandLineArgs();
    
    if (customConfig.useTransaction) {
      throw new Error('Custom useTransaction should be false');
    }
    if (!customConfig.clearExisting) {
      throw new Error('Custom clearExisting should be true');
    }
    if (customConfig.logLevel !== 'debug') {
      throw new Error('Custom logLevel should be debug');
    }
    
    console.log('   ✅ Command line argument parsing successful');
    return true;
    
  } catch (error) {
    console.error('   ❌ Command line argument parsing failed:', error.message);
    return false;
  } finally {
    // Restore original argv
    process.argv = originalArgv;
  }
}

/**
 * Test data file validation
 */
async function testDataFileValidation() {
  console.log('2️⃣ Testing data file validation...');
  
  try {
    // Test with valid data directory
    const validDataDir = path.resolve(__dirname, '../sample-data');
    const validResult = await seed.validateDataFiles(validDataDir);
    
    if (!validResult) {
      throw new Error('Valid data directory should pass validation');
    }
    
    // Test with invalid data directory
    const invalidDataDir = path.resolve(__dirname, '../nonexistent-data');
    const invalidResult = await seed.validateDataFiles(invalidDataDir);
    
    if (invalidResult) {
      throw new Error('Invalid data directory should fail validation');
    }
    
    console.log('   ✅ Data file validation successful');
    return true;
    
  } catch (error) {
    console.error('   ❌ Data file validation failed:', error.message);
    return false;
  }
}

/**
 * Test the complete seeding process with various configurations
 */
async function testSeedingProcess() {
  console.log('3️⃣ Testing complete seeding process...');
  
  try {
    // Test 1: Default configuration (transaction-based)
    console.log('   📤 Testing transaction-based seeding...');
    const transactionConfig = {
      ...seed.DEFAULT_CONFIG,
      clearExisting: true,
      logLevel: 'error', // Reduce noise during testing
      generateReport: false
    };
    
    const transactionResult = await seed.seedDatabase(transactionConfig);
    
    if (!transactionResult.success) {
      throw new Error(`Transaction seeding failed: ${transactionResult.error}`);
    }
    
    console.log('   ✅ Transaction-based seeding successful');
    
    // Test 2: Sequential configuration
    console.log('   📤 Testing sequential seeding...');
    const sequentialConfig = {
      ...seed.DEFAULT_CONFIG,
      useTransaction: false,
      clearExisting: true,
      logLevel: 'error',
      generateReport: false
    };
    
    const sequentialResult = await seed.seedDatabase(sequentialConfig);
    
    if (!sequentialResult.success) {
      throw new Error(`Sequential seeding failed: ${sequentialResult.error}`);
    }
    
    console.log('   ✅ Sequential seeding successful');
    
    // Test 3: Validation disabled
    console.log('   📤 Testing seeding without validation...');
    const noValidationConfig = {
      ...seed.DEFAULT_CONFIG,
      clearExisting: true,
      validateAfter: false,
      logLevel: 'error',
      generateReport: false
    };
    
    const noValidationResult = await seed.seedDatabase(noValidationConfig);
    
    if (!noValidationResult.success) {
      throw new Error(`No validation seeding failed: ${noValidationResult.error}`);
    }
    
    console.log('   ✅ Seeding without validation successful');
    
    return true;
    
  } catch (error) {
    console.error('   ❌ Seeding process test failed:', error.message);
    return false;
  }
}

/**
 * Test data integrity after seeding
 */
async function testDataIntegrity() {
  console.log('4️⃣ Testing data integrity...');
  
  try {
    // Query specific data to verify correctness
    
    // Test building count
    const buildingCount = await database.query('SELECT COUNT(*) as count FROM buildings');
    const expectedBuildings = 1;
    if (parseInt(buildingCount.rows[0].count) !== expectedBuildings) {
      throw new Error(`Expected ${expectedBuildings} buildings, got ${buildingCount.rows[0].count}`);
    }
    
    // Test floor plan count
    const floorPlanCount = await database.query('SELECT COUNT(*) as count FROM floor_plans');
    const expectedFloorPlans = 4;
    if (parseInt(floorPlanCount.rows[0].count) !== expectedFloorPlans) {
      throw new Error(`Expected ${expectedFloorPlans} floor plans, got ${floorPlanCount.rows[0].count}`);
    }
    
    // Test node count
    const nodeCount = await database.query('SELECT COUNT(*) as count FROM nodes');
    const expectedNodes = 39;
    if (parseInt(nodeCount.rows[0].count) !== expectedNodes) {
      throw new Error(`Expected ${expectedNodes} nodes, got ${nodeCount.rows[0].count}`);
    }
    
    // Test edge count
    const edgeCount = await database.query('SELECT COUNT(*) as count FROM edges');
    const expectedEdges = 50;
    if (parseInt(edgeCount.rows[0].count) !== expectedEdges) {
      throw new Error(`Expected ${expectedEdges} edges, got ${edgeCount.rows[0].count}`);
    }
    
    // Test node types distribution
    const nodeTypes = await database.query(`
      SELECT type, COUNT(*) as count 
      FROM nodes 
      GROUP BY type 
      ORDER BY type
    `);
    
    const expectedNodeTypes = {
      'ENTRANCE': 1,
      'POINT_OF_INTEREST': 12,
      'ROOM': 20,
      'SERVICE_POINT': 6
    };
    
    for (const row of nodeTypes.rows) {
      const expectedCount = expectedNodeTypes[row.type];
      if (parseInt(row.count) !== expectedCount) {
        throw new Error(`Expected ${expectedCount} ${row.type} nodes, got ${row.count}`);
      }
    }
    
    // Test edge types distribution
    const edgeTypes = await database.query(`
      SELECT type, COUNT(*) as count 
      FROM edges 
      GROUP BY type 
      ORDER BY type
    `);
    
    const expectedEdgeTypes = {
      'ELEVATOR': 6,
      'HALLWAY': 38,
      'STAIRCASE': 6
    };
    
    for (const row of edgeTypes.rows) {
      const expectedCount = expectedEdgeTypes[row.type];
      if (parseInt(row.count) !== expectedCount) {
        throw new Error(`Expected ${expectedCount} ${row.type} edges, got ${row.count}`);
      }
    }
    
    // Test spatial data validity
    const validGeometry = await database.query(`
      SELECT COUNT(*) as count 
      FROM nodes 
      WHERE ST_IsValid(geom) = true
    `);
    
    if (parseInt(validGeometry.rows[0].count) !== expectedNodes) {
      throw new Error(`All ${expectedNodes} nodes should have valid geometry`);
    }
    
    // Test foreign key relationships
    const orphanedEdges = await database.query(`
      SELECT COUNT(*) as count 
      FROM edges e 
      WHERE e.from_node_id NOT IN (SELECT id FROM nodes) 
         OR e.to_node_id NOT IN (SELECT id FROM nodes)
    `);
    
    if (parseInt(orphanedEdges.rows[0].count) > 0) {
      throw new Error('Found orphaned edges with invalid node references');
    }
    
    console.log('   ✅ Data integrity validation successful');
    return true;
    
  } catch (error) {
    console.error('   ❌ Data integrity test failed:', error.message);
    return false;
  }
}

/**
 * Main test runner
 */
async function runSeedingTests() {
  console.log('🧪 Running Complete Database Seeding Tests');
  console.log('============================================');
  
  try {
    const tests = [
      testCommandLineArguments,
      testDataFileValidation,
      testSeedingProcess,
      testDataIntegrity
    ];
    
    let passedTests = 0;
    
    for (const test of tests) {
      const result = await test();
      if (result) {
        passedTests++;
      }
    }
    
    console.log('\n📊 TEST SUMMARY');
    console.log('===============');
    console.log(`Passed: ${passedTests}/${tests.length}`);
    
    if (passedTests === tests.length) {
      console.log('🎉 All seeding tests passed!');
      return true;
    } else {
      console.log('❌ Some seeding tests failed.');
      return false;
    }
    
  } catch (error) {
    console.error('💥 Test suite crashed:', error.message);
    return false;
  } finally {
    // Clean up database connection
    await database.close();
  }
}

/**
 * Main entry point
 */
async function main() {
  console.log('🚀 Starting Database Seeding Test Suite\n');
  
  try {
    const success = await runSeedingTests();
    
    if (success) {
      console.log('\n✅ All tests passed! Database seeding is working correctly.');
      process.exit(0);
    } else {
      console.log('\n❌ Some tests failed. Please review the errors above.');
      process.exit(1);
    }
    
  } catch (error) {
    console.error('\n💥 Test suite failed:', error.message);
    process.exit(1);
  }
}

// Export for testing
module.exports = {
  runSeedingTests,
  testCommandLineArguments,
  testDataFileValidation,
  testSeedingProcess,
  testDataIntegrity
};

// Run tests if this file is executed directly
if (require.main === module) {
  main();
} 