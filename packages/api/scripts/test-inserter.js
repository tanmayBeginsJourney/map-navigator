const dataParser = require('./data-parser');
const dataInserter = require('./data-inserter');
const database = require('./database');

/**
 * Test script for database insertion logic
 * Tests the data-inserter module functions
 */

async function runInsertionTests() {
  console.log('🧪 Running Database Insertion Tests');
  console.log('=====================================');

  try {
    // Test 1: Database connection
    console.log('1️⃣ Testing database connection...');
    const connectionOk = await database.testConnection();
    if (!connectionOk) {
      throw new Error('Database connection failed');
    }
    console.log('   ✅ Database connection successful\n');

    // Test 2: PostGIS availability
    console.log('2️⃣ Testing PostGIS extension...');
    const postgisOk = await database.checkPostGIS();
    if (!postgisOk) {
      throw new Error('PostGIS extension not available');
    }
    console.log('   ✅ PostGIS extension available\n');

    // Test 3: Parse sample data
    console.log('3️⃣ Parsing sample data...');
    const allData = await dataParser.parseAllData('../sample-data');
    console.log(`   ✅ Sample data parsed successfully`);
    console.log(`   📊 ${allData.buildings.length} buildings, ${allData.floorPlans.length} floor plans, ${allData.nodes.length} nodes, ${allData.edges.length} edges\n`);

    // Test 4: Clear existing data (for clean test)
    console.log('4️⃣ Clearing existing data...');
    await dataInserter.clearAllData();
    console.log('   ✅ Existing data cleared\n');

    // Test 5: Test individual insertion functions
    console.log('5️⃣ Testing individual insertion functions...');
    
    // Test buildings insertion
    console.log('   🏢 Testing buildings insertion...');
    const buildingResults = await dataInserter.insertBuildings(allData.buildings);
    if (buildingResults.length !== allData.buildings.length) {
      throw new Error(`Expected ${allData.buildings.length} buildings, got ${buildingResults.length}`);
    }
    console.log('   ✅ Buildings insertion successful');
    
    // Test floor plans insertion
    console.log('   🗺️  Testing floor plans insertion...');
    const floorPlanResults = await dataInserter.insertFloorPlans(allData.floorPlans);
    if (floorPlanResults.length !== allData.floorPlans.length) {
      throw new Error(`Expected ${allData.floorPlans.length} floor plans, got ${floorPlanResults.length}`);
    }
    console.log('   ✅ Floor plans insertion successful');
    
    // Test nodes insertion
    console.log('   📍 Testing nodes insertion...');
    const nodeResults = await dataInserter.insertNodes(allData.nodes);
    if (nodeResults.length !== allData.nodes.length) {
      throw new Error(`Expected ${allData.nodes.length} nodes, got ${nodeResults.length}`);
    }
    console.log('   ✅ Nodes insertion successful');
    
    // Test edges insertion
    console.log('   🔗 Testing edges insertion...');
    const edgeResults = await dataInserter.insertEdges(allData.edges);
    if (edgeResults.length !== allData.edges.length) {
      throw new Error(`Expected ${allData.edges.length} edges, got ${edgeResults.length}`);
    }
    console.log('   ✅ Edges insertion successful\n');

    // Test 6: Data validation
    console.log('6️⃣ Validating inserted data...');
    const validation = await dataInserter.validateInsertedData();
    
    // Check counts match expected
    if (validation.counts.buildings !== allData.buildings.length) {
      throw new Error(`Building count mismatch: expected ${allData.buildings.length}, got ${validation.counts.buildings}`);
    }
    if (validation.counts.floorPlans !== allData.floorPlans.length) {
      throw new Error(`Floor plan count mismatch: expected ${allData.floorPlans.length}, got ${validation.counts.floorPlans}`);
    }
    if (validation.counts.nodes !== allData.nodes.length) {
      throw new Error(`Node count mismatch: expected ${allData.nodes.length}, got ${validation.counts.nodes}`);
    }
    if (validation.counts.edges !== allData.edges.length) {
      throw new Error(`Edge count mismatch: expected ${allData.edges.length}, got ${validation.counts.edges}`);
    }
    
    // Check integrity
    const hasIntegrityIssues = Object.values(validation.integrity).some(count => count > 0);
    if (hasIntegrityIssues) {
      throw new Error('Data integrity issues found');
    }
    
    console.log('   ✅ Data validation successful\n');

    // Test 7: Clear and test transaction insertion
    console.log('7️⃣ Testing transaction-based insertion...');
    await dataInserter.clearAllData();
    
    const transactionResults = await dataInserter.insertAllDataTransaction(allData);
    if (transactionResults.buildings !== allData.buildings.length) {
      throw new Error(`Transaction buildings count mismatch: expected ${allData.buildings.length}, got ${transactionResults.buildings}`);
    }
    if (transactionResults.nodes !== allData.nodes.length) {
      throw new Error(`Transaction nodes count mismatch: expected ${allData.nodes.length}, got ${transactionResults.nodes}`);
    }
    console.log('   ✅ Transaction insertion successful\n');

    // Test 8: Re-validate after transaction
    console.log('8️⃣ Re-validating after transaction...');
    const finalValidation = await dataInserter.validateInsertedData();
    if (finalValidation.counts.buildings !== allData.buildings.length) {
      throw new Error('Final validation failed');
    }
    console.log('   ✅ Final validation successful\n');

    // Test 9: Test duplicate insertion (ON CONFLICT handling)
    console.log('9️⃣ Testing duplicate insertion handling...');
    const duplicateResults = await dataInserter.insertAllData(allData);
    if (duplicateResults.buildings.length !== allData.buildings.length) {
      throw new Error('Duplicate insertion failed');
    }
    console.log('   ✅ Duplicate insertion handling successful\n');

    // Test 10: Sample specific data queries
    console.log('🔟 Testing specific data queries...');
    
    // Test node lookup
    const nodeQuery = 'SELECT COUNT(*) as count FROM nodes WHERE type = $1';
    const roomNodes = await database.query(nodeQuery, ['ROOM']);
    console.log(`   📊 Found ${roomNodes.rows[0].count} room nodes`);
    
    // Test edge lookup
    const edgeQuery = 'SELECT COUNT(*) as count FROM edges WHERE type = $1';
    const hallwayEdges = await database.query(edgeQuery, ['HALLWAY']);
    console.log(`   📊 Found ${hallwayEdges.rows[0].count} hallway edges`);
    
    // Test spatial data
    const spatialQuery = 'SELECT COUNT(*) as count FROM nodes WHERE ST_IsValid(geom) = true';
    const validGeometry = await database.query(spatialQuery);
    console.log(`   📊 Found ${validGeometry.rows[0].count} nodes with valid geometry`);
    
    // Test relationships
    const relationshipQuery = `
      SELECT COUNT(*) as count 
      FROM edges e 
      JOIN nodes n1 ON e.from_node_id = n1.id 
      JOIN nodes n2 ON e.to_node_id = n2.id
    `;
    const validRelationships = await database.query(relationshipQuery);
    console.log(`   📊 Found ${validRelationships.rows[0].count} edges with valid node relationships`);
    
    console.log('   ✅ Specific data queries successful\n');

    console.log('🎉 All insertion tests passed!');
    console.log('=====================================');
    
    return true;

  } catch (error) {
    console.error('❌ Insertion test failed:', error.message);
    console.error('Full error:', error);
    return false;
  } finally {
    // Clean up database connection
    await database.close();
  }
}

/**
 * Test error handling scenarios
 */
async function testErrorHandling() {
  console.log('\n🚨 Testing Error Handling Scenarios');
  console.log('====================================');

  try {
    // Test 1: Invalid building data
    console.log('1️⃣ Testing invalid building data...');
    try {
      await dataInserter.insertBuildings([{ id: null, name: 'Invalid Building' }]);
      throw new Error('Should have failed with invalid data');
    } catch (error) {
      if (error.message.includes('Should have failed')) {
        throw error;
      }
      console.log('   ✅ Invalid building data properly rejected');
    }

    // Test 2: Missing foreign key references
    console.log('2️⃣ Testing missing foreign key references...');
    try {
      await dataInserter.insertFloorPlans([{
        id: 999,
        building_id: 999, // Non-existent building
        floor_number: 1,
        name: 'Invalid Floor',
        svg_url: '/invalid.svg',
        width_px: 800,
        height_px: 600,
        scale_m_per_px: 0.05
      }]);
      throw new Error('Should have failed with invalid foreign key');
    } catch (error) {
      if (error.message.includes('Should have failed')) {
        throw error;
      }
      console.log('   ✅ Invalid foreign key properly rejected');
    }

    // Test 3: Empty data arrays
    console.log('3️⃣ Testing empty data arrays...');
    const emptyResults = await dataInserter.insertBuildings([]);
    if (emptyResults.length !== 0) {
      throw new Error('Empty array should return empty results');
    }
    console.log('   ✅ Empty data arrays handled correctly');

    console.log('✅ Error handling tests passed!');
    return true;

  } catch (error) {
    console.error('❌ Error handling test failed:', error.message);
    return false;
  }
}

/**
 * Main test runner
 */
async function main() {
  console.log('🚀 Starting Database Insertion Test Suite\n');

  try {
    const insertionTestsOk = await runInsertionTests();
    const errorTestsOk = await testErrorHandling();

    if (insertionTestsOk && errorTestsOk) {
      console.log('\n🎉 All tests passed! Database insertion logic is working correctly.');
      process.exit(0);
    } else {
      console.log('\n❌ Some tests failed. Please review the errors above.');
      process.exit(1);
    }

  } catch (error) {
    console.error('\n💥 Test suite crashed:', error.message);
    process.exit(1);
  }
}

// Run tests if this file is executed directly
if (require.main === module) {
  main();
}

module.exports = {
  runInsertionTests,
  testErrorHandling,
  main
}; 