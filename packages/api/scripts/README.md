# Database Seeding Infrastructure

This directory contains the complete database seeding infrastructure for the Campus Navigation System, providing production-ready tools for populating the database with sample campus data.

## 📁 Overview

The seeding system consists of modular components that handle data parsing, validation, database insertion, and comprehensive testing:

```
scripts/
├── database.js          # PostgreSQL connection module with pooling
├── data-parser.js       # JSON parsing with validation and consistency checking
├── data-inserter.js     # Database insertion with PostGIS spatial data support
├── seed.js              # Main seeding script with CLI interface
├── test-connection.js   # Database connection testing
├── test-parser.js       # Data parsing test suite
├── test-inserter.js     # Database insertion testing
├── test-seed.js         # End-to-end seeding process testing
└── README.md           # This documentation
```

## 🏗️ Sample Data Structure

The Engineering Building sample data provides comprehensive test scenarios:

- **Building**: 1 building (Engineering Building)
- **Floor Plans**: 4 floors (Ground through Fourth Floor)
- **Nodes**: 39 total nodes across all floors
  - 1 ENTRANCE (main building entrance)
  - 20 ROOM (labs, offices, lecture halls, study rooms)
  - 12 POINT_OF_INTEREST (hallway junctions, navigation points)
  - 6 SERVICE_POINT (elevators, stairs, bathrooms)
- **Edges**: 50 bidirectional connections
  - 38 HALLWAY connections
  - 6 ELEVATOR connections (multi-floor)
  - 6 STAIRCASE connections (multi-floor)

## 🚀 Quick Start

### Prerequisites

- PostgreSQL + PostGIS database running (see `DOCKER_SETUP.md`)
- Node.js dependencies installed (`npm install`)

### Basic Usage

```powershell
# Navigate to API directory
cd packages/api

# Run database seeding with sample data
npm run seed

# Test database connection
npm run test-db

# Run all seeding tests
npm run test-parser
npm run test-inserter
npm run test-seed
```

## 🔧 Seeding Script Options

The main seeding script (`seed.js`) provides a flexible CLI interface:

```powershell
# Basic seeding (uses sample-data/ directory)
node scripts/seed.js

# Custom data directory
node scripts/seed.js --data-dir /path/to/custom/data

# Clear existing data before seeding
node scripts/seed.js --clear

# Use sequential insertion instead of atomic transaction
node scripts/seed.js --no-transaction

# Skip post-insertion validation
node scripts/seed.js --no-validate

# Set logging level (debug, info, error)
node scripts/seed.js --log-level debug

# Show help
node scripts/seed.js --help
```

## 📊 Data Validation

The system includes comprehensive validation at multiple levels:

### 1. JSON Syntax Validation
- Valid JSON format checking
- File existence verification
- Empty file detection

### 2. Data Structure Validation
- Required fields verification
- Data type checking
- Array structure validation

### 3. ENUM Compliance
- Node types: `ENTRANCE`, `ROOM`, `POINT_OF_INTEREST`, `SERVICE_POINT`
- Edge types: `HALLWAY`, `STAIRCASE`, `ELEVATOR`, `OUTDOOR_PATH`

### 4. Referential Integrity
- Foreign key relationships
- Cross-reference validation
- Orphaned record detection

## 🗃️ Database Operations

### Connection Management
- PostgreSQL connection pooling (max 10 connections)
- Automatic connection retry and timeout handling
- Proper resource cleanup and connection release

### Insertion Methods
1. **Atomic Transactions** (default): All-or-nothing insertion with rollback
2. **Sequential Insertion**: Individual operations with progress reporting

### Spatial Data Support
- PostGIS `ST_MakePoint` for geometry creation
- SRID 0 (Cartesian) coordinate system for floor plans
- Spatial indexing for performance optimization

## 🧪 Testing Infrastructure

### Test Suites Available

1. **Database Connection Tests** (`test-connection.js`)
   - Basic connectivity verification
   - PostGIS extension availability
   - Schema validation (tables, ENUMs)
   - Transaction functionality

2. **Data Parsing Tests** (`test-parser.js`)
   - JSON file parsing validation
   - Data structure integrity
   - ENUM compliance checking
   - Error handling scenarios

3. **Database Insertion Tests** (`test-inserter.js`)
   - Individual insertion function testing
   - Transaction vs sequential methods
   - Spatial data validation
   - Foreign key constraint testing

4. **End-to-End Seeding Tests** (`test-seed.js`)
   - Complete workflow testing
   - Command-line argument parsing
   - Data integrity verification
   - Error recovery testing

### Running Tests

```powershell
# Run individual test suites
npm run test-db        # Database connection tests
npm run test-parser    # Data parsing tests
npm run test-inserter  # Database insertion tests
npm run test-seed      # End-to-end seeding tests

# Tests provide detailed output with ✅/❌ indicators
```

## 📁 Sample Data Files

Located in `../sample-data/`:

```
sample-data/
├── buildings.json     # Building definitions
├── floor_plans.json   # Floor plan metadata
├── nodes.json         # Node positions and attributes
└── edges.json         # Edge connections and properties
```

### Data File Formats

**Buildings** (`buildings.json`):
```json
[
  {
    "id": 1,
    "name": "Engineering Building"
  }
]
```

**Floor Plans** (`floor_plans.json`):
```json
[
  {
    "id": 1,
    "name": "Ground Floor",
    "building_id": 1,
    "floor_number": 1,
    "svg_file_path": "/floor-plans/engineering-ground.svg"
  }
]
```

**Nodes** (`nodes.json`):
```json
[
  {
    "id": 1,
    "name": "Main Entrance",
    "type": "ENTRANCE",
    "floor_plan_id": 1,
    "building_id": 1,
    "coordinates_x_px": 400,
    "coordinates_y_px": 580,
    "geom": {"x": 400, "y": 580},
    "is_accessible": true,
    "qr_code_payload": "ENG_MAIN_ENTRANCE",
    "attributes": {
      "automatic_doors": true,
      "accessibility_ramp": true
    }
  }
]
```

**Edges** (`edges.json`):
```json
[
  {
    "id": 1,
    "from_node_id": 1,
    "to_node_id": 2,
    "weight": 60,
    "type": "HALLWAY",
    "instructions": "Walk north from entrance to reception desk",
    "attributes": {
      "distance_meters": 3
    }
  }
]
```

## 🔍 Troubleshooting

### Common Issues

1. **Database Connection Failed**
   ```powershell
   # Check if PostgreSQL container is running
   docker-compose ps
   
   # Start database if needed
   docker-compose up -d
   ```

2. **PostGIS Extension Not Available**
   ```powershell
   # Verify PostGIS in container
   docker-compose exec postgres psql -U postgres -d campus_navigation -c "SELECT PostGIS_Full_Version();"
   ```

3. **Migration Schema Missing**
   ```powershell
   # Run migrations first
   cd packages/api
   # Apply migrations manually or via migration tool
   ```

4. **Seeding Script Errors**
   ```powershell
   # Run with debug logging
   node scripts/seed.js --log-level debug
   
   # Test individual components
   npm run test-parser
   npm run test-inserter
   ```

### Debug Mode

Enable detailed logging for troubleshooting:

```powershell
# Debug level logging
node scripts/seed.js --log-level debug

# This will show:
# - Detailed SQL queries
# - Step-by-step process information
# - Validation details
# - Error stack traces
```

## 🎯 Production Deployment

### Environment Variables

Configure database connection via environment variables:

```bash
DB_HOST=localhost
DB_PORT=5432
DB_NAME=campus_navigation
DB_USER=postgres
DB_PASSWORD=your_password
```

### Production Seeding

```powershell
# Production seeding with transaction safety
node scripts/seed.js --clear --log-level info

# Validate after seeding
node scripts/seed.js --no-clear --log-level error
```

## 🔧 Extending the System

### Adding New Buildings

1. Create new JSON files following the existing format
2. Update building, floor_plan, node, and edge data
3. Ensure foreign key relationships are maintained
4. Run validation: `npm run test-parser`

### Custom Data Sources

1. Modify `data-parser.js` to support additional formats
2. Update validation rules as needed
3. Test with `npm run test-parser`

### Additional Node/Edge Types

1. Update database ENUMs in migration files
2. Update validation in `data-parser.js`
3. Add sample data using new types
4. Test complete workflow

## 📈 Performance Considerations

- **Connection Pooling**: Max 10 concurrent connections
- **Batch Operations**: Optimized insertion queries
- **Spatial Indexing**: PostGIS GIST indexes for geometry queries
- **Transaction Efficiency**: Atomic operations for data consistency

## ✅ Production Readiness Checklist

- [x] Comprehensive error handling and recovery
- [x] Database connection pooling and resource management
- [x] Transaction support with rollback capabilities
- [x] Input validation and sanitization
- [x] Spatial data support with PostGIS integration
- [x] Comprehensive test coverage (4 test suites)
- [x] Command-line interface with flexible options
- [x] Detailed logging and progress reporting
- [x] Foreign key integrity and referential consistency
- [x] ENUM compliance and type safety

The seeding infrastructure is production-ready and suitable for immediate deployment. 