#!/usr/bin/env node

/**
 * Test script to verify data parsing functionality
 * Run with: node scripts/test-parser.js
 */

const parser = require('./data-parser');
const path = require('path');

async function runParsingTests() {
  console.log('🧪 Testing Data Parsing Module...\n');
  
  try {
    const dataDir = path.resolve(__dirname, '../sample-data');
    console.log(`📂 Using data directory: ${dataDir}\n`);
    
    // Test 1: Individual file parsing
    console.log('1️⃣ Testing individual file parsing...');
    
    const buildings = await parser.parseBuildings(path.join(dataDir, 'buildings.json'));
    console.log(`   ✅ Buildings: ${buildings.length} items`);
    
    const floorPlans = await parser.parseFloorPlans(path.join(dataDir, 'floor_plans.json'));
    console.log(`   ✅ Floor Plans: ${floorPlans.length} items`);
    
    const nodes = await parser.parseNodes(path.join(dataDir, 'nodes.json'));
    console.log(`   ✅ Nodes: ${nodes.length} items`);
    
    const edges = await parser.parseEdges(path.join(dataDir, 'edges.json'));
    console.log(`   ✅ Edges: ${edges.length} items`);
    
    console.log('');
    
    // Test 2: Parse all data at once
    console.log('2️⃣ Testing batch parsing of all files...');
    const allData = await parser.parseAllData('../sample-data');
    console.log('   ✅ All files parsed successfully');
    console.log('');
    
    // Test 3: Data structure validation
    console.log('3️⃣ Validating parsed data structures...');
    
    // Check buildings
    if (allData.buildings.length > 0) {
      const building = allData.buildings[0];
      if (building.id && building.name) {
        console.log('   ✅ Building structure valid');
      } else {
        throw new Error('Invalid building structure');
      }
    }
    
    // Check floor plans
    if (allData.floorPlans.length > 0) {
      const floorPlan = allData.floorPlans[0];
      if (floorPlan.id && floorPlan.building_id && floorPlan.name) {
        console.log('   ✅ Floor plan structure valid');
      } else {
        throw new Error('Invalid floor plan structure');
      }
    }
    
    // Check nodes
    if (allData.nodes.length > 0) {
      const node = allData.nodes[0];
      if (node.id && node.type && node.geom) {
        console.log('   ✅ Node structure valid');
      } else {
        throw new Error('Invalid node structure');
      }
    }
    
    // Check edges
    if (allData.edges.length > 0) {
      const edge = allData.edges[0];
      if (edge.id && edge.from_node_id && edge.to_node_id && edge.type) {
        console.log('   ✅ Edge structure valid');
      } else {
        throw new Error('Invalid edge structure');
      }
    }
    
    console.log('');
    
    // Test 4: Data integrity checks
    console.log('4️⃣ Testing data integrity...');
    
    // Check that all building IDs are unique
    const buildingIds = allData.buildings.map(b => b.id);
    const uniqueBuildingIds = new Set(buildingIds);
    if (buildingIds.length === uniqueBuildingIds.size) {
      console.log('   ✅ Building IDs are unique');
    } else {
      throw new Error('Duplicate building IDs found');
    }
    
    // Check that all node IDs are unique
    const nodeIds = allData.nodes.map(n => n.id);
    const uniqueNodeIds = new Set(nodeIds);
    if (nodeIds.length === uniqueNodeIds.size) {
      console.log('   ✅ Node IDs are unique');
    } else {
      throw new Error('Duplicate node IDs found');
    }
    
    // Check that all edge IDs are unique
    const edgeIds = allData.edges.map(e => e.id);
    const uniqueEdgeIds = new Set(edgeIds);
    if (edgeIds.length === uniqueEdgeIds.size) {
      console.log('   ✅ Edge IDs are unique');
    } else {
      throw new Error('Duplicate edge IDs found');
    }
    
    console.log('');
    
    // Test 5: ENUM value validation
    console.log('5️⃣ Testing ENUM value compliance...');
    
    const validNodeTypes = ['ROOM', 'POINT_OF_INTEREST', 'ENTRANCE', 'SERVICE_POINT'];
    const validEdgeTypes = ['HALLWAY', 'STAIRCASE', 'ELEVATOR', 'OUTDOOR_PATH'];
    
    const nodeTypes = allData.nodes.map(n => n.type);
    const invalidNodeTypes = nodeTypes.filter(type => !validNodeTypes.includes(type));
    if (invalidNodeTypes.length === 0) {
      console.log('   ✅ All node types are valid ENUM values');
    } else {
      throw new Error(`Invalid node types found: ${invalidNodeTypes.join(', ')}`);
    }
    
    const edgeTypes = allData.edges.map(e => e.type);
    const invalidEdgeTypes = edgeTypes.filter(type => !validEdgeTypes.includes(type));
    if (invalidEdgeTypes.length === 0) {
      console.log('   ✅ All edge types are valid ENUM values');
    } else {
      throw new Error(`Invalid edge types found: ${invalidEdgeTypes.join(', ')}`);
    }
    
    console.log('');
    
    // Test 6: Show sample data
    console.log('6️⃣ Sample data preview...');
    console.log('   Sample Building:', JSON.stringify(allData.buildings[0], null, 2));
    console.log('   Sample Node:', JSON.stringify(allData.nodes[0], null, 2));
    console.log('   Sample Edge:', JSON.stringify(allData.edges[0], null, 2));
    console.log('');
    
    // Summary
    console.log('🎉 All data parsing tests passed!');
    console.log('📋 Summary:');
    console.log(`   ✅ ${allData.buildings.length} buildings parsed and validated`);
    console.log(`   ✅ ${allData.floorPlans.length} floor plans parsed and validated`);
    console.log(`   ✅ ${allData.nodes.length} nodes parsed and validated`);
    console.log(`   ✅ ${allData.edges.length} edges parsed and validated`);
    console.log('   ✅ Data structure validation passed');
    console.log('   ✅ Data integrity checks passed');
    console.log('   ✅ ENUM value compliance verified');
    console.log('\n🚀 Ready for database insertion operations!');

  } catch (error) {
    console.error('\n❌ Parsing test failed:', error.message);
    console.error('🔧 Please check:');
    console.error('   - All sample data files exist in the sample-data directory');
    console.error('   - JSON files have valid syntax');
    console.error('   - Data follows the expected structure');
    console.error('   - All required fields are present');
    process.exit(1);
  }
}

// Test malformed data handling
async function testErrorHandling() {
  console.log('\n🧪 Testing error handling...\n');
  
  try {
    // Test non-existent file
    console.log('Testing non-existent file handling...');
    try {
      await parser.parseJSONFile('non-existent-file.json');
      throw new Error('Should have failed for non-existent file');
    } catch (error) {
      if (error.message.includes('File not found')) {
        console.log('   ✅ Non-existent file error handled correctly');
      } else {
        throw error;
      }
    }
    
    console.log('✅ Error handling tests passed');
  } catch (error) {
    console.error('❌ Error handling test failed:', error.message);
    process.exit(1);
  }
}

// Run the tests
if (require.main === module) {
  runParsingTests()
    .then(() => testErrorHandling())
    .catch(error => {
      console.error('❌ Unexpected error:', error);
      process.exit(1);
    });
}

module.exports = { runParsingTests, testErrorHandling }; 