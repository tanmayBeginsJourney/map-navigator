const { pathfindingService } = require('../dist/pathfinding');

async function testPathfinding() {
  console.log('🧪 Testing Pathfinding Service...');
  
  try {
    console.log('1️⃣ Testing path from node 1 to node 39...');
    const result = await pathfindingService.findPath(1, 39, false);
    
    if (result) {
      console.log('✅ Path found!');
      console.log('📊 Route summary:');
      console.log(`   Total distance: ${result.total_distance}`);
      console.log(`   Total duration: ${result.total_duration_seconds}s`);
      console.log(`   Path steps: ${result.path.length}`);
      console.log(`   Floors involved: ${result.floors_involved.join(', ')}`);
      console.log(`   Buildings involved: ${result.buildings_involved.join(', ')}`);
      console.log(`   Accessibility compatible: ${result.accessibility_compatible}`);
      
      console.log('\n📍 First few path steps:');
      result.path.slice(0, 3).forEach((step, index) => {
        console.log(`   ${index + 1}. Node ${step.node.id} (${step.node.name || 'unnamed'}) - ${step.instruction || 'no instruction'}`);
      });
    } else {
      console.log('❌ No path found');
    }
  } catch (error) {
    console.error('❌ Pathfinding test failed:', error.message);
    console.error('Stack trace:', error.stack);
  }
}

// Run test if called directly
if (require.main === module) {
  testPathfinding().catch(error => {
    console.error('❌ Test failed:', error);
    process.exit(1);
  });
}

module.exports = { testPathfinding }; 