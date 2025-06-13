const fs = require('fs').promises;
const path = require('path');

// Valid node and edge types - extracted as constants for maintainability
const VALID_NODE_TYPES = ['ENTRANCE', 'ROOM', 'POINT_OF_INTEREST', 'SERVICE_POINT'];
const VALID_EDGE_TYPES = ['HALLWAY', 'STAIRCASE', 'ELEVATOR'];

/**
 * Data parsing module for Campus Navigation sample data
 * Handles JSON file parsing with comprehensive error handling
 */

/**
 * Read and parse a JSON file
 * @param {string} filePath - Path to the JSON file
 * @returns {Promise<any>} Parsed JSON data
 */
async function parseJSONFile(filePath) {
  try {
    console.log(`📖 Reading file: ${filePath}`);
    const fileContent = await fs.readFile(filePath, 'utf8');
    
    if (!fileContent.trim()) {
      throw new Error(`File is empty: ${filePath}`);
    }
    
    const parsedData = JSON.parse(fileContent);
    console.log(`✅ Successfully parsed JSON file: ${filePath}`);
    return parsedData;
  } catch (error) {
    if (error.code === 'ENOENT') {
      throw new Error(`File not found: ${filePath}`);
    } else if (error instanceof SyntaxError) {
      throw new Error(`Invalid JSON syntax in file: ${filePath} - ${error.message}`);
    } else {
      throw new Error(`Failed to read/parse file ${filePath}: ${error.message}`);
    }
  }
}

/**
 * Parse buildings data from JSON file
 * @param {string} filePath - Path to buildings.json file
 * @returns {Promise<Array>} Array of building objects
 */
async function parseBuildings(filePath) {
  const data = await parseJSONFile(filePath);
  
  if (!Array.isArray(data)) {
    throw new Error('Buildings data must be an array');
  }
  
  const buildings = data.map((building, index) => {
    validateBuilding(building, index);
    return {
      id: building.id,
      name: building.name
    };
  });
  
  console.log(`✅ Parsed ${buildings.length} buildings`);
  return buildings;
}

/**
 * Parse floor plans data from JSON file
 * @param {string} filePath - Path to floor_plans.json file
 * @returns {Promise<Array>} Array of floor plan objects
 */
async function parseFloorPlans(filePath) {
  const data = await parseJSONFile(filePath);
  
  if (!Array.isArray(data)) {
    throw new Error('Floor plans data must be an array');
  }
  
  const floorPlans = data.map((floorPlan, index) => {
    validateFloorPlan(floorPlan, index);
    return {
      id: floorPlan.id,
      building_id: floorPlan.building_id,
      floor_number: floorPlan.floor_number,
      name: floorPlan.name,
      svg_url: floorPlan.svg_url,
      width_px: floorPlan.width_px,
      height_px: floorPlan.height_px,
      scale_m_per_px: floorPlan.scale_m_per_px
    };
  });
  
  console.log(`✅ Parsed ${floorPlans.length} floor plans`);
  return floorPlans;
}

/**
 * Parse nodes data from JSON file
 * @param {string} filePath - Path to nodes.json file
 * @returns {Promise<Array>} Array of node objects
 */
async function parseNodes(filePath) {
  const data = await parseJSONFile(filePath);
  
  if (!Array.isArray(data)) {
    throw new Error('Nodes data must be an array');
  }
  
  const nodes = data.map((node, index) => {
    validateNode(node, index);
    return {
      id: node.id,
      name: node.name,
      type: node.type,
      floor_plan_id: node.floor_plan_id,
      building_id: node.building_id,
      coordinates_x_px: node.coordinates_x_px,
      coordinates_y_px: node.coordinates_y_px,
      geom: node.geom,
      is_accessible: node.is_accessible !== false, // Default to true
      qr_code_payload: node.qr_code_payload,
      attributes: node.attributes || {}
    };
  });
  
  console.log(`✅ Parsed ${nodes.length} nodes`);
  return nodes;
}

/**
 * Parse edges data from JSON file
 * @param {string} filePath - Path to edges.json file
 * @returns {Promise<Array>} Array of edge objects
 */
async function parseEdges(filePath) {
  const data = await parseJSONFile(filePath);
  
  if (!Array.isArray(data)) {
    throw new Error('Edges data must be an array');
  }
  
  const edges = data.map((edge, index) => {
    validateEdge(edge, index);
    return {
      id: edge.id,
      from_node_id: edge.from_node_id,
      to_node_id: edge.to_node_id,
      weight: edge.weight,
      type: edge.type,
      instructions: edge.instructions,
      attributes: edge.attributes || {}
    };
  });
  
  console.log(`✅ Parsed ${edges.length} edges`);
  return edges;
}

/**
 * Validate building object structure
 * @param {Object} building - Building object to validate
 * @param {number} index - Array index for error reporting
 */
function validateBuilding(building, index) {
  if (!building.id || typeof building.id !== 'number') {
    throw new Error(`Building at index ${index}: 'id' must be a number`);
  }
  if (!building.name || typeof building.name !== 'string') {
    throw new Error(`Building at index ${index}: 'name' must be a non-empty string`);
  }
}

/**
 * Validate floor plan object structure
 * @param {Object} floorPlan - Floor plan object to validate
 * @param {number} index - Array index for error reporting
 */
function validateFloorPlan(floorPlan, index) {
  if (!floorPlan.id || typeof floorPlan.id !== 'number') {
    throw new Error(`Floor plan at index ${index}: 'id' must be a number`);
  }
  if (!floorPlan.building_id || typeof floorPlan.building_id !== 'number') {
    throw new Error(`Floor plan at index ${index}: 'building_id' must be a number`);
  }
  if (typeof floorPlan.floor_number !== 'number') {
    throw new Error(`Floor plan at index ${index}: 'floor_number' must be a number`);
  }
  if (!floorPlan.name || typeof floorPlan.name !== 'string') {
    throw new Error(`Floor plan at index ${index}: 'name' must be a non-empty string`);
  }
  if (typeof floorPlan.width_px !== 'number' || floorPlan.width_px <= 0) {
    throw new Error(`Floor plan at index ${index}: 'width_px' must be a positive number`);
  }
  if (typeof floorPlan.height_px !== 'number' || floorPlan.height_px <= 0) {
    throw new Error(`Floor plan at index ${index}: 'height_px' must be a positive number`);
  }
}

/**
 * Validate node object structure
 * @param {Object} node - Node object to validate
 * @param {number} index - Array index for error reporting
 */
function validateNode(node, index) {
  if (!node.id || typeof node.id !== 'number') {
    throw new Error(`Node at index ${index}: 'id' must be a number`);
  }
  if (!node.type || typeof node.type !== 'string') {
    throw new Error(`Node at index ${index}: 'type' must be a non-empty string`);
  }
  if (!VALID_NODE_TYPES.includes(node.type)) {
    throw new Error(`Node at index ${index}: 'type' must be one of: ${VALID_NODE_TYPES.join(', ')}`);
  }
  if (typeof node.coordinates_x_px !== 'number' || node.coordinates_x_px < 0) {
    throw new Error(`Node at index ${index}: 'coordinates_x_px' must be a non-negative number`);
  }
  if (typeof node.coordinates_y_px !== 'number' || node.coordinates_y_px < 0) {
    throw new Error(`Node at index ${index}: 'coordinates_y_px' must be a non-negative number`);
  }
  if (!node.geom || typeof node.geom.x !== 'number' || typeof node.geom.y !== 'number') {
    throw new Error(`Node at index ${index}: 'geom' must have valid x and y coordinates`);
  }
}

/**
 * Validate edge object structure
 * @param {Object} edge - Edge object to validate
 * @param {number} index - Array index for error reporting
 */
function validateEdge(edge, index) {
  if (!edge.id || typeof edge.id !== 'number') {
    throw new Error(`Edge at index ${index}: 'id' must be a number`);
  }
  if (!edge.from_node_id || typeof edge.from_node_id !== 'number') {
    throw new Error(`Edge at index ${index}: 'from_node_id' must be a number`);
  }
  if (!edge.to_node_id || typeof edge.to_node_id !== 'number') {
    throw new Error(`Edge at index ${index}: 'to_node_id' must be a number`);
  }
  if (edge.from_node_id === edge.to_node_id) {
    throw new Error(`Edge at index ${index}: 'from_node_id' and 'to_node_id' cannot be the same (self-loop)`);
  }
  if (!edge.type || typeof edge.type !== 'string') {
    throw new Error(`Edge at index ${index}: 'type' must be a non-empty string`);
  }
  if (!VALID_EDGE_TYPES.includes(edge.type)) {
    throw new Error(`Edge at index ${index}: 'type' must be one of: ${VALID_EDGE_TYPES.join(', ')}`);
  }
  if (edge.weight && (typeof edge.weight !== 'number' || edge.weight <= 0)) {
    throw new Error(`Edge at index ${index}: 'weight' must be a positive number`);
  }
}

/**
 * Parse all data files in the sample-data directory
 * @param {string} dataDir - Directory containing sample data files
 * @returns {Promise<Object>} Object containing all parsed data
 */
async function parseAllData(dataDir = '../sample-data') {
  const basePath = path.resolve(__dirname, dataDir);
  
  console.log(`📂 Parsing all data files from: ${basePath}`);
  
  try {
    const [buildings, floorPlans, nodes, edges] = await Promise.all([
      parseBuildings(path.join(basePath, 'buildings.json')),
      parseFloorPlans(path.join(basePath, 'floor_plans.json')),
      parseNodes(path.join(basePath, 'nodes.json')),
      parseEdges(path.join(basePath, 'edges.json'))
    ]);
    
    // Validate data consistency
    validateDataConsistency(buildings, floorPlans, nodes, edges);
    
    const result = {
      buildings,
      floorPlans,
      nodes,
      edges
    };
    
    console.log('✅ All data files parsed successfully!');
    console.log(`📊 Summary: ${buildings.length} buildings, ${floorPlans.length} floor plans, ${nodes.length} nodes, ${edges.length} edges`);
    
    return result;
  } catch (error) {
    console.error('❌ Failed to parse data files:', error.message);
    throw error;
  }
}

/**
 * Validate consistency across all data sets
 * @param {Array} buildings - Buildings data
 * @param {Array} floorPlans - Floor plans data
 * @param {Array} nodes - Nodes data
 * @param {Array} edges - Edges data
 */
function validateDataConsistency(buildings, floorPlans, nodes, edges) {
  console.log('🔍 Validating data consistency...');
  
  const buildingIds = new Set(buildings.map(b => b.id));
  const floorPlanIds = new Set(floorPlans.map(f => f.id));
  const nodeIds = new Set(nodes.map(n => n.id));
  
  // Check floor plan building references
  for (const floorPlan of floorPlans) {
    if (!buildingIds.has(floorPlan.building_id)) {
      throw new Error(`Floor plan ${floorPlan.id} references non-existent building ${floorPlan.building_id}`);
    }
  }
  
  // Check node floor plan references
  for (const node of nodes) {
    if (node.floor_plan_id && !floorPlanIds.has(node.floor_plan_id)) {
      throw new Error(`Node ${node.id} references non-existent floor plan ${node.floor_plan_id}`);
    }
    if (node.building_id && !buildingIds.has(node.building_id)) {
      throw new Error(`Node ${node.id} references non-existent building ${node.building_id}`);
    }
  }
  
  // Check edge node references
  for (const edge of edges) {
    if (!nodeIds.has(edge.from_node_id)) {
      throw new Error(`Edge ${edge.id} references non-existent from_node ${edge.from_node_id}`);
    }
    if (!nodeIds.has(edge.to_node_id)) {
      throw new Error(`Edge ${edge.id} references non-existent to_node ${edge.to_node_id}`);
    }
  }
  
  console.log('✅ Data consistency validation passed');
}

module.exports = {
  parseJSONFile,
  parseBuildings,
  parseFloorPlans,
  parseNodes,
  parseEdges,
  parseAllData,
  validateDataConsistency
}; 