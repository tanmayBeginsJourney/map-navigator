const database = require('./database');

/**
 * Database insertion module for Campus Navigation sample data
 * Provides functions to insert parsed data into PostgreSQL tables
 */

/**
 * Insert buildings data into the database
 * @param {Array<Object>} buildings - Array of building objects
 * @returns {Promise<Array>} Array of inserted building records
 */
async function insertBuildings(buildings) {
  console.log(`📤 Inserting ${buildings.length} buildings...`);
  
  if (!buildings || buildings.length === 0) {
    console.log('⚠️  No buildings to insert');
    return [];
  }
  
  const insertedBuildings = [];
  
  for (const building of buildings) {
    try {
      const query = `
        INSERT INTO buildings (id, name) 
        VALUES ($1, $2) 
        ON CONFLICT (id) DO UPDATE SET 
          name = EXCLUDED.name
        RETURNING *
      `;
      
      const params = [building.id, building.name];
      const result = await database.query(query, params);
      
      insertedBuildings.push(result.rows[0]);
      console.log(`   ✅ Building: ${building.name} (ID: ${building.id})`);
      
    } catch (error) {
      console.error(`   ❌ Failed to insert building ${building.id}:`, error.message);
      throw error;
    }
  }
  
  console.log(`✅ Successfully inserted ${insertedBuildings.length} buildings`);
  return insertedBuildings;
}

/**
 * Insert floor plans data into the database
 * @param {Array<Object>} floorPlans - Array of floor plan objects
 * @returns {Promise<Array>} Array of inserted floor plan records
 */
async function insertFloorPlans(floorPlans) {
  console.log(`📤 Inserting ${floorPlans.length} floor plans...`);
  
  if (!floorPlans || floorPlans.length === 0) {
    console.log('⚠️  No floor plans to insert');
    return [];
  }
  
  const insertedFloorPlans = [];
  
  for (const floorPlan of floorPlans) {
    try {
      const query = `
        INSERT INTO floor_plans (
          id, building_id, floor_number, name, svg_url, 
          width_px, height_px, scale_m_per_px
        ) 
        VALUES ($1, $2, $3, $4, $5, $6, $7, $8) 
        ON CONFLICT (id) DO UPDATE SET 
          building_id = EXCLUDED.building_id,
          floor_number = EXCLUDED.floor_number,
          name = EXCLUDED.name,
          svg_url = EXCLUDED.svg_url,
          width_px = EXCLUDED.width_px,
          height_px = EXCLUDED.height_px,
          scale_m_per_px = EXCLUDED.scale_m_per_px
        RETURNING *
      `;
      
      const params = [
        floorPlan.id,
        floorPlan.building_id,
        floorPlan.floor_number,
        floorPlan.name,
        floorPlan.svg_url,
        floorPlan.width_px,
        floorPlan.height_px,
        floorPlan.scale_m_per_px
      ];
      
      const result = await database.query(query, params);
      
      insertedFloorPlans.push(result.rows[0]);
      console.log(`   ✅ Floor Plan: ${floorPlan.name} (ID: ${floorPlan.id})`);
      
    } catch (error) {
      console.error(`   ❌ Failed to insert floor plan ${floorPlan.id}:`, error.message);
      throw error;
    }
  }
  
  console.log(`✅ Successfully inserted ${insertedFloorPlans.length} floor plans`);
  return insertedFloorPlans;
}

/**
 * Insert nodes data into the database
 * @param {Array<Object>} nodes - Array of node objects
 * @returns {Promise<Array>} Array of inserted node records
 */
async function insertNodes(nodes) {
  console.log(`📤 Inserting ${nodes.length} nodes...`);
  
  if (!nodes || nodes.length === 0) {
    console.log('⚠️  No nodes to insert');
    return [];
  }
  
  const insertedNodes = [];
  
  for (const node of nodes) {
    try {
      const query = `
        INSERT INTO nodes (
          id, name, type, floor_plan_id, building_id,
          coordinates_x_px, coordinates_y_px, geom,
          is_accessible, qr_code_payload, attributes
        ) 
        VALUES ($1, $2, $3, $4, $5, $6, $7, ST_MakePoint($8, $9), $10, $11, $12) 
        ON CONFLICT (id) DO UPDATE SET 
          name = EXCLUDED.name,
          type = EXCLUDED.type,
          floor_plan_id = EXCLUDED.floor_plan_id,
          building_id = EXCLUDED.building_id,
          coordinates_x_px = EXCLUDED.coordinates_x_px,
          coordinates_y_px = EXCLUDED.coordinates_y_px,
          geom = EXCLUDED.geom,
          is_accessible = EXCLUDED.is_accessible,
          qr_code_payload = EXCLUDED.qr_code_payload,
          attributes = EXCLUDED.attributes
        RETURNING *
      `;
      
      const params = [
        node.id,
        node.name,
        node.type,
        node.floor_plan_id,
        node.building_id,
        node.coordinates_x_px,
        node.coordinates_y_px,
        node.geom.x, // For ST_MakePoint
        node.geom.y, // For ST_MakePoint
        node.is_accessible,
        node.qr_code_payload,
        JSON.stringify(node.attributes)
      ];
      
      const result = await database.query(query, params);
      
      insertedNodes.push(result.rows[0]);
      console.log(`   ✅ Node: ${node.name || `Node ${node.id}`} (ID: ${node.id}, Type: ${node.type})`);
      
    } catch (error) {
      console.error(`   ❌ Failed to insert node ${node.id}:`, error.message);
      throw error;
    }
  }
  
  console.log(`✅ Successfully inserted ${insertedNodes.length} nodes`);
  return insertedNodes;
}

/**
 * Insert edges data into the database
 * @param {Array<Object>} edges - Array of edge objects
 * @returns {Promise<Array>} Array of inserted edge records
 */
async function insertEdges(edges) {
  console.log(`📤 Inserting ${edges.length} edges...`);
  
  if (!edges || edges.length === 0) {
    console.log('⚠️  No edges to insert');
    return [];
  }
  
  const insertedEdges = [];
  
  for (const edge of edges) {
    try {
      const query = `
        INSERT INTO edges (
          id, from_node_id, to_node_id, weight, type, instructions, attributes
        ) 
        VALUES ($1, $2, $3, $4, $5, $6, $7) 
        ON CONFLICT (id) DO UPDATE SET 
          from_node_id = EXCLUDED.from_node_id,
          to_node_id = EXCLUDED.to_node_id,
          weight = EXCLUDED.weight,
          type = EXCLUDED.type,
          instructions = EXCLUDED.instructions,
          attributes = EXCLUDED.attributes
        RETURNING *
      `;
      
      const params = [
        edge.id,
        edge.from_node_id,
        edge.to_node_id,
        edge.weight,
        edge.type,
        edge.instructions,
        JSON.stringify(edge.attributes)
      ];
      
      const result = await database.query(query, params);
      
      insertedEdges.push(result.rows[0]);
      console.log(`   ✅ Edge: ${edge.from_node_id} → ${edge.to_node_id} (ID: ${edge.id}, Type: ${edge.type})`);
      
    } catch (error) {
      console.error(`   ❌ Failed to insert edge ${edge.id}:`, error.message);
      throw error;
    }
  }
  
  console.log(`✅ Successfully inserted ${insertedEdges.length} edges`);
  return insertedEdges;
}

/**
 * Insert all data in the correct order (respecting foreign key constraints)
 * @param {Object} allData - Object containing all parsed data
 * @param {Array} allData.buildings - Buildings data
 * @param {Array} allData.floorPlans - Floor plans data  
 * @param {Array} allData.nodes - Nodes data
 * @param {Array} allData.edges - Edges data
 * @returns {Promise<Object>} Object containing all insertion results
 */
async function insertAllData(allData) {
  console.log('🚀 Starting database insertion process...');
  console.log(`📊 Data summary: ${allData.buildings.length} buildings, ${allData.floorPlans.length} floor plans, ${allData.nodes.length} nodes, ${allData.edges.length} edges`);
  
  try {
    // Insert in order of dependencies to avoid foreign key constraint violations
    const results = {};
    
    // 1. Buildings first (no dependencies)
    results.buildings = await insertBuildings(allData.buildings);
    
    // 2. Floor plans (depend on buildings)
    results.floorPlans = await insertFloorPlans(allData.floorPlans);
    
    // 3. Nodes (depend on buildings and floor plans)
    results.nodes = await insertNodes(allData.nodes);
    
    // 4. Edges last (depend on nodes)
    results.edges = await insertEdges(allData.edges);
    
    console.log('✅ All data inserted successfully!');
    console.log(`📈 Final counts: ${results.buildings.length} buildings, ${results.floorPlans.length} floor plans, ${results.nodes.length} nodes, ${results.edges.length} edges`);
    
    return results;
    
  } catch (error) {
    console.error('❌ Failed to insert data:', error.message);
    throw error;
  }
}

/**
 * Insert all data using a transaction for atomicity
 * @param {Object} allData - Object containing all parsed data
 * @returns {Promise<Object>} Object containing all insertion results
 */
async function insertAllDataTransaction(allData) {
  console.log('🚀 Starting transactional database insertion...');
  console.log(`📊 Data summary: ${allData.buildings.length} buildings, ${allData.floorPlans.length} floor plans, ${allData.nodes.length} nodes, ${allData.edges.length} edges`);
  
  // Prepare all queries for transaction
  const queries = [];
  
  // Buildings queries
  for (const building of allData.buildings) {
    queries.push({
      text: `
        INSERT INTO buildings (id, name) 
        VALUES ($1, $2) 
        ON CONFLICT (id) DO UPDATE SET name = EXCLUDED.name
      `,
      params: [building.id, building.name]
    });
  }
  
  // Floor plans queries
  for (const floorPlan of allData.floorPlans) {
    queries.push({
      text: `
        INSERT INTO floor_plans (
          id, building_id, floor_number, name, svg_url, 
          width_px, height_px, scale_m_per_px
        ) 
        VALUES ($1, $2, $3, $4, $5, $6, $7, $8) 
        ON CONFLICT (id) DO UPDATE SET 
          building_id = EXCLUDED.building_id,
          floor_number = EXCLUDED.floor_number,
          name = EXCLUDED.name,
          svg_url = EXCLUDED.svg_url,
          width_px = EXCLUDED.width_px,
          height_px = EXCLUDED.height_px,
          scale_m_per_px = EXCLUDED.scale_m_per_px
      `,
      params: [
        floorPlan.id, floorPlan.building_id, floorPlan.floor_number,
        floorPlan.name, floorPlan.svg_url, floorPlan.width_px,
        floorPlan.height_px, floorPlan.scale_m_per_px
      ]
    });
  }
  
  // Nodes queries
  for (const node of allData.nodes) {
    queries.push({
      text: `
        INSERT INTO nodes (
          id, name, type, floor_plan_id, building_id,
          coordinates_x_px, coordinates_y_px, geom,
          is_accessible, qr_code_payload, attributes
        ) 
        VALUES ($1, $2, $3, $4, $5, $6, $7, ST_MakePoint($8, $9), $10, $11, $12) 
        ON CONFLICT (id) DO UPDATE SET 
          name = EXCLUDED.name,
          type = EXCLUDED.type,
          floor_plan_id = EXCLUDED.floor_plan_id,
          building_id = EXCLUDED.building_id,
          coordinates_x_px = EXCLUDED.coordinates_x_px,
          coordinates_y_px = EXCLUDED.coordinates_y_px,
          geom = EXCLUDED.geom,
          is_accessible = EXCLUDED.is_accessible,
          qr_code_payload = EXCLUDED.qr_code_payload,
          attributes = EXCLUDED.attributes
      `,
      params: [
        node.id, node.name, node.type, node.floor_plan_id, node.building_id,
        node.coordinates_x_px, node.coordinates_y_px, node.geom.x, node.geom.y,
        node.is_accessible, node.qr_code_payload, JSON.stringify(node.attributes)
      ]
    });
  }
  
  // Edges queries
  for (const edge of allData.edges) {
    queries.push({
      text: `
        INSERT INTO edges (
          id, from_node_id, to_node_id, weight, type, instructions, attributes
        ) 
        VALUES ($1, $2, $3, $4, $5, $6, $7) 
        ON CONFLICT (id) DO UPDATE SET 
          from_node_id = EXCLUDED.from_node_id,
          to_node_id = EXCLUDED.to_node_id,
          weight = EXCLUDED.weight,
          type = EXCLUDED.type,
          instructions = EXCLUDED.instructions,
          attributes = EXCLUDED.attributes
      `,
      params: [
        edge.id, edge.from_node_id, edge.to_node_id, edge.weight,
        edge.type, edge.instructions, JSON.stringify(edge.attributes)
      ]
    });
  }
  
  try {
    // Execute all queries in a single transaction
    const results = await database.transaction(queries);
    
    console.log('✅ All data inserted successfully in transaction!');
    console.log(`📈 Executed ${results.length} queries total`);
    
    return {
      totalQueries: results.length,
      buildings: allData.buildings.length,
      floorPlans: allData.floorPlans.length,
      nodes: allData.nodes.length,
      edges: allData.edges.length
    };
    
  } catch (error) {
    console.error('❌ Transaction failed:', error.message);
    throw error;
  }
}

/**
 * Clear all data from the database (for testing purposes)
 * @returns {Promise<void>}
 */
async function clearAllData() {
  console.log('🧹 Clearing all data from database...');
  
  const queries = [
    { text: 'DELETE FROM edges', params: [] },
    { text: 'DELETE FROM nodes', params: [] },
    { text: 'DELETE FROM floor_plans', params: [] },
    { text: 'DELETE FROM buildings', params: [] }
  ];
  
  try {
    await database.transaction(queries);
    console.log('✅ All data cleared successfully');
  } catch (error) {
    console.error('❌ Failed to clear data:', error.message);
    throw error;
  }
}

/**
 * Validate inserted data integrity
 * @returns {Promise<Object>} Validation results
 */
async function validateInsertedData() {
  console.log('🔍 Validating inserted data integrity...');
  
  try {
    // Get counts from database
    const buildingsCount = await database.query('SELECT COUNT(*) as count FROM buildings');
    const floorPlansCount = await database.query('SELECT COUNT(*) as count FROM floor_plans');
    const nodesCount = await database.query('SELECT COUNT(*) as count FROM nodes');
    const edgesCount = await database.query('SELECT COUNT(*) as count FROM edges');
    
    // Check foreign key integrity
    const orphanedFloorPlans = await database.query(`
      SELECT COUNT(*) as count FROM floor_plans 
      WHERE building_id NOT IN (SELECT id FROM buildings)
    `);
    
    const orphanedNodes = await database.query(`
      SELECT COUNT(*) as count FROM nodes 
      WHERE floor_plan_id IS NOT NULL 
        AND floor_plan_id NOT IN (SELECT id FROM floor_plans)
    `);
    
    const orphanedEdgesFrom = await database.query(`
      SELECT COUNT(*) as count FROM edges 
      WHERE from_node_id NOT IN (SELECT id FROM nodes)
    `);
    
    const orphanedEdgesTo = await database.query(`
      SELECT COUNT(*) as count FROM edges 
      WHERE to_node_id NOT IN (SELECT id FROM nodes)
    `);
    
    // Check spatial data
    const invalidGeometry = await database.query(`
      SELECT COUNT(*) as count FROM nodes 
      WHERE geom IS NULL OR NOT ST_IsValid(geom)
    `);
    
    const validation = {
      counts: {
        buildings: parseInt(buildingsCount.rows[0].count),
        floorPlans: parseInt(floorPlansCount.rows[0].count),
        nodes: parseInt(nodesCount.rows[0].count),
        edges: parseInt(edgesCount.rows[0].count)
      },
      integrity: {
        orphanedFloorPlans: parseInt(orphanedFloorPlans.rows[0].count),
        orphanedNodes: parseInt(orphanedNodes.rows[0].count),
        orphanedEdgesFrom: parseInt(orphanedEdgesFrom.rows[0].count),
        orphanedEdgesTo: parseInt(orphanedEdgesTo.rows[0].count),
        invalidGeometry: parseInt(invalidGeometry.rows[0].count)
      }
    };
    
    // Report validation results
    console.log('📊 Data Counts:');
    console.log(`   Buildings: ${validation.counts.buildings}`);
    console.log(`   Floor Plans: ${validation.counts.floorPlans}`);
    console.log(`   Nodes: ${validation.counts.nodes}`);
    console.log(`   Edges: ${validation.counts.edges}`);
    
    console.log('🔍 Integrity Check:');
    const hasIssues = Object.values(validation.integrity).some(count => count > 0);
    
    if (hasIssues) {
      console.log('   ❌ Data integrity issues found:');
      if (validation.integrity.orphanedFloorPlans > 0) {
        console.log(`      - ${validation.integrity.orphanedFloorPlans} orphaned floor plans`);
      }
      if (validation.integrity.orphanedNodes > 0) {
        console.log(`      - ${validation.integrity.orphanedNodes} orphaned nodes`);
      }
      if (validation.integrity.orphanedEdgesFrom > 0) {
        console.log(`      - ${validation.integrity.orphanedEdgesFrom} edges with invalid from_node_id`);
      }
      if (validation.integrity.orphanedEdgesTo > 0) {
        console.log(`      - ${validation.integrity.orphanedEdgesTo} edges with invalid to_node_id`);
      }
      if (validation.integrity.invalidGeometry > 0) {
        console.log(`      - ${validation.integrity.invalidGeometry} nodes with invalid geometry`);
      }
    } else {
      console.log('   ✅ All integrity checks passed');
    }
    
    return validation;
    
  } catch (error) {
    console.error('❌ Validation failed:', error.message);
    throw error;
  }
}

module.exports = {
  insertBuildings,
  insertFloorPlans,
  insertNodes,
  insertEdges,
  insertAllData,
  insertAllDataTransaction,
  clearAllData,
  validateInsertedData
}; 