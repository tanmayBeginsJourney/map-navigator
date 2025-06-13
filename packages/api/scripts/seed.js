

const path = require('path');
const fs = require('fs').promises;
const database = require('./database');
const dataParser = require('./data-parser');
const dataInserter = require('./data-inserter');

/**
 * Main Database Seeding Script for Campus Navigation System
 * 
 * This script orchestrates the complete process of:
 * 1. Parsing sample data files
 * 2. Establishing database connection
 * 3. Inserting data in correct order
 * 4. Validating data integrity
 * 5. Generating summary reports
 */

/**
 * Configuration options
 */
const DEFAULT_CONFIG = {
  dataDirectory: path.resolve(__dirname, '../sample-data'),
  useTransaction: true,
  clearExisting: false,
  validateAfter: true,
  logLevel: 'info', // info, debug, error
  skipValidation: false,
  generateReport: true
};

/**
 * Parse command line arguments
 * @returns {Object} Parsed configuration
 */
function parseCommandLineArgs() {
  const args = process.argv.slice(2);
  const config = { ...DEFAULT_CONFIG };
  
  for (let i = 0; i < args.length; i++) {
    const arg = args[i];
    const nextArg = args[i + 1];
    
    switch (arg) {
      case '--data-dir':
        if (nextArg) {
          config.dataDirectory = path.resolve(nextArg);
          i++;
        }
        break;
      case '--no-transaction':
        config.useTransaction = false;
        break;
      case '--clear':
        config.clearExisting = true;
        break;
      case '--no-validate':
        config.validateAfter = false;
        break;
      case '--no-report':
        config.generateReport = false;
        break;
      case '--log-level':
        if (nextArg && ['debug', 'info', 'error'].includes(nextArg)) {
          config.logLevel = nextArg;
          i++;
        } else {
          console.error(`❌ Invalid or missing log level. Expected: debug, info, error`);
          process.exit(1);
        }
        break;
      case '--help':
      case '-h':
        printHelp();
        process.exit(0);
        break;
      default:
        if (arg.startsWith('--')) {
          console.error(`❌ Unknown option: ${arg}`);
          printHelp();
          process.exit(1);
        }
    }
  }
  
  return config;
}

/**
 * Print help information
 */
function printHelp() {
  console.log(`
🌱 Campus Navigation Database Seeding Script

Usage: node seed.js [options]

Options:
  --data-dir <path>     Directory containing sample data files (default: ../sample-data)
  --no-transaction      Use sequential insertion instead of transaction
  --clear              Clear existing data before seeding
  --no-validate        Skip data validation after insertion
  --no-report          Skip generating summary report
  --log-level <level>   Set log level: debug, info, error (default: info)
  --help, -h           Show this help message

Examples:
  node seed.js                                    # Use default settings
  node seed.js --clear --log-level debug          # Clear data and show debug logs
  node seed.js --data-dir /path/to/data           # Use custom data directory
  node seed.js --no-transaction --no-validate     # Sequential insertion, skip validation

Environment Variables:
  DB_HOST              Database host (default: localhost)
  DB_PORT              Database port (default: 5432)
  DB_NAME              Database name (default: campus_navigation)
  DB_USER              Database user (default: postgres)
  DB_PASSWORD          Database password (default: password123)
`);
}

/**
 * Log message based on configured log level
 * @param {string} level - Log level (debug, info, error)
 * @param {string} message - Message to log
 * @param {Object} config - Configuration object
 */
function log(level, message, config) {
  const levels = { debug: 0, info: 1, error: 2 };
  const configLevel = levels[config.logLevel] || 1;
  
  if (levels[level] >= configLevel) {
    console.log(message);
  }
}

/**
 * Validate data directory and files exist
 * @param {string} dataDirectory - Path to data directory
 * @returns {Promise<boolean>} True if all files exist
 */
async function validateDataFiles(dataDirectory) {
  const requiredFiles = [
    'buildings.json',
    'floor_plans.json',
    'nodes.json',
    'edges.json'
  ];
  
  try {
    // Check if directory exists
    await fs.access(dataDirectory);
    
    // Check if all required files exist
    for (const file of requiredFiles) {
      const filePath = path.join(dataDirectory, file);
      await fs.access(filePath);
    }
    
    return true;
  } catch (error) {
    console.error(`❌ Data file validation failed: ${error.message}`);
    console.error(`   Expected files in ${dataDirectory}:`);
    requiredFiles.forEach(file => console.error(`   - ${file}`));
    return false;
  }
}

/**
 * Generate a summary report of the seeding operation
 * @param {Object} results - Insertion results
 * @param {Object} validation - Validation results
 * @param {Object} config - Configuration
 * @param {number} startTime - Start time in milliseconds
 */
async function generateSummaryReport(results, validation, config, startTime) {
  const duration = Date.now() - startTime;
  const durationSeconds = (duration / 1000).toFixed(2);
  
  console.log('\n📊 SEEDING SUMMARY REPORT');
  console.log('========================');
  
  // Basic information
  console.log(`🕒 Execution Time: ${durationSeconds} seconds`);
  console.log(`📁 Data Directory: ${config.dataDirectory}`);
  console.log(`🔄 Method: ${config.useTransaction ? 'Transaction' : 'Sequential'}`);
  console.log(`🧹 Cleared Existing: ${config.clearExisting ? 'Yes' : 'No'}`);
  
  // Data counts
  console.log('\n📈 Data Inserted:');
  if (config.useTransaction) {
    console.log(`   Buildings: ${results.buildings}`);
    console.log(`   Floor Plans: ${results.floorPlans}`);
    console.log(`   Nodes: ${results.nodes}`);
    console.log(`   Edges: ${results.edges}`);
    console.log(`   Total Queries: ${results.totalQueries}`);
  } else {
    console.log(`   Buildings: ${results.buildings.length}`);
    console.log(`   Floor Plans: ${results.floorPlans.length}`);
    console.log(`   Nodes: ${results.nodes.length}`);
    console.log(`   Edges: ${results.edges.length}`);
  }
  
  // Validation results
  if (validation) {
    console.log('\n🔍 Validation Results:');
    console.log(`   Database Buildings: ${validation.counts.buildings}`);
    console.log(`   Database Floor Plans: ${validation.counts.floorPlans}`);
    console.log(`   Database Nodes: ${validation.counts.nodes}`);
    console.log(`   Database Edges: ${validation.counts.edges}`);
    
    const hasIssues = Object.values(validation.integrity).some(count => count > 0);
    if (hasIssues) {
      console.log('\n⚠️  Integrity Issues:');
      Object.entries(validation.integrity).forEach(([key, count]) => {
        if (count > 0) {
          console.log(`   ${key}: ${count}`);
        }
      });
    } else {
      console.log('\n✅ All integrity checks passed');
    }
  }
  
  // Sample queries for verification
  console.log('\n🔍 Sample Verification Queries:');
  console.log('   -- Check nodes by type --');
  console.log('   SELECT type, COUNT(*) FROM nodes GROUP BY type;');
  console.log('   ');
  console.log('   -- Check edges by type --');
  console.log('   SELECT type, COUNT(*) FROM edges GROUP BY type;');
  console.log('   ');
  console.log('   -- Check floor distribution --');
  console.log('   SELECT fp.name, COUNT(n.id) as node_count FROM floor_plans fp');
  console.log('   LEFT JOIN nodes n ON fp.id = n.floor_plan_id GROUP BY fp.id, fp.name;');
  console.log('   ');
  console.log('   -- Check spatial data validity --');
  console.log('   SELECT COUNT(*) FROM nodes WHERE ST_IsValid(geom) = true;');
  
  // Next steps
  console.log('\n🚀 Next Steps:');
  console.log('   1. Test pathfinding with: SELECT * FROM nodes WHERE id IN (1, 39);');
  console.log('   2. Verify connectivity: Check if all nodes are reachable via edges');
  console.log('   3. Test API endpoints with the seeded data');
  console.log('   4. Validate coordinates against floor plan SVGs');
  
  console.log('\n✅ Database seeding completed successfully!');
}

/**
 * Main seeding function
 * @param {Object} config - Configuration options
 */
async function seedDatabase(config) {
  const startTime = Date.now();
  
  log('info', '🌱 Starting Campus Navigation Database Seeding', config);
  log('debug', `Configuration: ${JSON.stringify(config, null, 2)}`, config);
  
  try {
    // Step 1: Validate data files
    log('info', '1️⃣ Validating data files...', config);
    const filesValid = await validateDataFiles(config.dataDirectory);
    if (!filesValid) {
      throw new Error('Data file validation failed');
    }
    log('info', '   ✅ All required data files found', config);
    
    // Step 2: Test database connection
    log('info', '2️⃣ Testing database connection...', config);
    const connectionOk = await database.testConnection();
    if (!connectionOk) {
      throw new Error('Database connection failed');
    }
    log('info', '   ✅ Database connection successful', config);
    
    // Step 3: Check PostGIS extension
    log('info', '3️⃣ Checking PostGIS extension...', config);
    const postgisOk = await database.checkPostGIS();
    if (!postgisOk) {
      throw new Error('PostGIS extension not available');
    }
    log('info', '   ✅ PostGIS extension available', config);
    
    // Step 4: Parse sample data
    log('info', '4️⃣ Parsing sample data...', config);
    const allData = await dataParser.parseAllData(config.dataDirectory);
    log('info', `   ✅ Parsed ${allData.buildings.length} buildings, ${allData.floorPlans.length} floor plans, ${allData.nodes.length} nodes, ${allData.edges.length} edges`, config);
    
    // Step 5: Clear existing data if requested
    if (config.clearExisting) {
      log('info', '5️⃣ Clearing existing data...', config);
      await dataInserter.clearAllData();
      log('info', '   ✅ Existing data cleared', config);
    } else {
      log('debug', '5️⃣ Skipping data clearing (use --clear to enable)', config);
    }
    
    // Step 6: Insert data
    log('info', '6️⃣ Inserting data into database...', config);
    let insertionResults;
    
    if (config.useTransaction) {
      log('debug', '   Using transaction-based insertion', config);
      insertionResults = await dataInserter.insertAllDataTransaction(allData);
    } else {
      log('debug', '   Using sequential insertion', config);
      insertionResults = await dataInserter.insertAllData(allData);
    }
    
    log('info', '   ✅ Data insertion completed', config);
    
    // Step 7: Validate inserted data
    let validationResults = null;
    if (config.validateAfter) {
      log('info', '7️⃣ Validating inserted data...', config);
      validationResults = await dataInserter.validateInsertedData();
      log('info', '   ✅ Data validation completed', config);
    } else {
      log('debug', '7️⃣ Skipping data validation (use --validate to enable)', config);
    }
    
    // Step 8: Generate summary report
    if (config.generateReport) {
      await generateSummaryReport(insertionResults, validationResults, config, startTime);
    }
    
    return {
      success: true,
      insertionResults,
      validationResults,
      duration: Date.now() - startTime
    };
    
  } catch (error) {
    log('error', `❌ Seeding failed: ${error.message}`, config);
    log('debug', `Full error: ${error.stack}`, config);
    
    return {
      success: false,
      error: error.message,
      duration: Date.now() - startTime
    };
  } finally {
    // Always close database connection
    await database.close();
    log('debug', 'Database connection closed', config);
  }
}

/**
 * Main entry point
 */
async function main() {
  try {
    const config = parseCommandLineArgs();
    const result = await seedDatabase(config);
    
    if (result.success) {
      console.log('\n🎉 Database seeding completed successfully!');
      process.exit(0);
    } else {
      console.log('\n❌ Database seeding failed. Please check the errors above.');
      process.exit(1);
    }
    
  } catch (error) {
    console.error('\n💥 Fatal error:', error.message);
    process.exit(1);
  }
}

// Export functions for testing
module.exports = {
  seedDatabase,
  parseCommandLineArgs,
  validateDataFiles,
  generateSummaryReport,
  DEFAULT_CONFIG
};

// Run main function if this file is executed directly
if (require.main === module) {
  main();
} 