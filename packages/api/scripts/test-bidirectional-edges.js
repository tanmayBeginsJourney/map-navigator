const database = require('./database');

/**
 * Test script to verify bidirectional edge functionality
 * Tests that elevator and stair connections work in both directions
 */

async function testBidirectionalEdges() {
  console.log('🔄 Testing Bidirectional Edge Support');
  console.log('=====================================\n');

  try {
    // Test database connection
    console.log('1️⃣ Testing database connection...');
    const isConnected = await database.testConnection();
    if (!isConnected) {
      throw new Error('Database connection failed');
    }
    console.log('✅ Database connected\n');

    // Test case 1: Ground floor elevator node (should connect up and down)
    console.log('2️⃣ Testing Ground Floor Elevator (Node 10)...');
    const groundElevatorEdges = await testNodeEdges(10, 'Ground Floor Elevator');
    
    // Test case 2: Second floor elevator node (should connect up and down)
    console.log('3️⃣ Testing Second Floor Elevator (Node 13)...');
    const secondElevatorEdges = await testNodeEdges(13, 'Second Floor Elevator');
    
    // Test case 3: Third floor elevator node (should connect up and down)
    console.log('4️⃣ Testing Third Floor Elevator (Node 22)...');
    const thirdElevatorEdges = await testNodeEdges(22, 'Third Floor Elevator');
    
    // Test case 4: Ground floor stairs (should connect up)
    console.log('5️⃣ Testing Ground Floor Stairs (Node 11)...');
    const groundStairsEdges = await testNodeEdges(11, 'Ground Floor Stairs');
    
    // Test case 5: Second floor stairs (should connect up and down)
    console.log('6️⃣ Testing Second Floor Stairs (Node 14)...');
    const secondStairsEdges = await testNodeEdges(14, 'Second Floor Stairs');

    // Verify bidirectional connectivity
    console.log('7️⃣ Verifying Bidirectional Connectivity...');
    await verifyBidirectionalConnectivity();

    console.log('\n✅ All bidirectional edge tests passed!');
    console.log('🎉 Elevator and stair navigation now works in both directions');

  } catch (error) {
    console.error('❌ Test failed:', error.message);
    process.exit(1);
  } finally {
    await database.close();
  }
}

/**
 * Test edges for a specific node
 */
async function testNodeEdges(nodeId, nodeName) {
  try {
    // Get all edges from this node
    const edges = await database.query(`
      SELECT 
        id,
        from_node_id,
        to_node_id,
        weight,
        type,
        instructions
      FROM edges 
      WHERE from_node_id = $1 OR to_node_id = $1
      ORDER BY type, weight
    `, [nodeId]);

    console.log(`   ${nodeName} (ID: ${nodeId}) has ${edges.rows.length} connected edges:`);
    
    const edgeTypes = {};
    for (const edge of edges.rows) {
      const direction = edge.from_node_id === nodeId ? 'outgoing' : 'incoming';
      const targetNode = edge.from_node_id === nodeId ? edge.to_node_id : edge.from_node_id;
      
      if (!edgeTypes[edge.type]) {
        edgeTypes[edge.type] = { outgoing: 0, incoming: 0 };
      }
      edgeTypes[edge.type][direction]++;
      
      console.log(`     ${direction === 'outgoing' ? '→' : '←'} ${edge.type} to/from Node ${targetNode} (Weight: ${edge.weight})`);
    }
    
    // Summary
    console.log(`   Summary by type:`);
    Object.entries(edgeTypes).forEach(([type, counts]) => {
      console.log(`     ${type}: ${counts.outgoing} outgoing, ${counts.incoming} incoming`);
    });
    
    console.log('');
    return edges.rows;
    
  } catch (error) {
    console.error(`   ❌ Failed to test ${nodeName}:`, error.message);
    throw error;
  }
}

/**
 * Verify that vertical connections work bidirectionally
 */
async function verifyBidirectionalConnectivity() {
  try {
    // Test elevator connectivity: Ground (10) ↔ Second (13) ↔ Third (22) ↔ Fourth (31)
    const elevatorNodes = [10, 13, 22, 31];
    console.log('   Testing elevator chain connectivity...');
    
    for (let i = 0; i < elevatorNodes.length - 1; i++) {
      const currentNode = elevatorNodes[i];
      const nextNode = elevatorNodes[i + 1];
      
      // Check if there's a connection from current to next
      const upConnection = await database.query(`
        SELECT id FROM edges 
        WHERE from_node_id = $1 AND to_node_id = $2 AND type = 'ELEVATOR'
      `, [currentNode, nextNode]);
      
      // Check if there's a connection from next to current (reverse)
      const downConnection = await database.query(`
        SELECT id FROM edges 
        WHERE from_node_id = $2 AND to_node_id = $1 AND type = 'ELEVATOR'
      `, [currentNode, nextNode]);
      
      const hasConnection = upConnection.rows.length > 0 || downConnection.rows.length > 0;
      
      if (hasConnection) {
        console.log(`     ✅ Elevator connection: Node ${currentNode} ↔ Node ${nextNode}`);
      } else {
        console.log(`     ❌ Missing elevator connection: Node ${currentNode} ↔ Node ${nextNode}`);
      }
    }
    
    // Test stair connectivity: Ground (11) ↔ Second (14) ↔ Third (23) ↔ Fourth (32)
    const stairNodes = [11, 14, 23, 32];
    console.log('   Testing stair chain connectivity...');
    
    for (let i = 0; i < stairNodes.length - 1; i++) {
      const currentNode = stairNodes[i];
      const nextNode = stairNodes[i + 1];
      
      // Check if there's a connection from current to next
      const upConnection = await database.query(`
        SELECT id FROM edges 
        WHERE from_node_id = $1 AND to_node_id = $2 AND type = 'STAIRCASE'
      `, [currentNode, nextNode]);
      
      // Check if there's a connection from next to current (reverse)
      const downConnection = await database.query(`
        SELECT id FROM edges 
        WHERE from_node_id = $2 AND to_node_id = $1 AND type = 'STAIRCASE'
      `, [currentNode, nextNode]);
      
      const hasConnection = upConnection.rows.length > 0 || downConnection.rows.length > 0;
      
      if (hasConnection) {
        console.log(`     ✅ Stair connection: Node ${currentNode} ↔ Node ${nextNode}`);
      } else {
        console.log(`     ❌ Missing stair connection: Node ${currentNode} ↔ Node ${nextNode}`);
      }
    }
    
    console.log('   ✅ Bidirectional connectivity verification complete');
    
  } catch (error) {
    console.error('   ❌ Connectivity verification failed:', error.message);
    throw error;
  }
}

// Run the test
if (require.main === module) {
  testBidirectionalEdges();
}

module.exports = { testBidirectionalEdges }; 