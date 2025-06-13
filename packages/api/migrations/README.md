# Database Migration Set – Campus Navigation

This directory contains ordered SQL migration scripts for initializing the PostgreSQL + PostGIS schema used by the Campus Indoor-Outdoor Navigation backend.

| Order | File | Purpose |
|-------|------|---------|
| 001   | `001_enums_buildings_floor_plans.sql` | Creates required ENUM types (`node_type_enum`, `edge_type_enum`) and foundational tables `buildings` and `floor_plans`. Also ensures `postgis` extension is available. |
| 002   | `002_nodes.sql` | Defines `nodes` table with spatial `geom` column (SRID 0), JSONB `attributes` column, and supporting indexes. |
| 003   | `003_edges.sql` | Defines `edges` table linking nodes, including weight, type, JSONB `attributes`, and traversal-friendly indexes. |

## How to Apply

Run each migration in the numeric order using `psql` or your preferred migration tool (e.g., `node-pg-migrate`, `Flyway`). Example with `psql`:

```bash
psql "$DATABASE_URL" -f 001_enums_buildings_floor_plans.sql
psql "$DATABASE_URL" -f 002_nodes.sql
psql "$DATABASE_URL" -f 003_edges.sql
```

## Post-migration Verification Checklist

1. Verify PostGIS extension is installed:
   ```sql
   SELECT PostGIS_Full_Version();
   ```
2. Check that all tables exist and contain expected columns:
   ```sql
   \dt
   \d+ buildings
   \d+ floor_plans
   \d+ nodes
   \d+ edges
   ```
3. Ensure `geom` column in `nodes` has SRID 0 and spatial index:
   ```sql
   SELECT Find_SRID('public', 'nodes', 'geom');
   \di+ idx_nodes_geom
   ```
4. Insert minimal sample data to test FK relationships and JSONB attributes.

## Extending the Schema

- Add new `node_type_enum` or `edge_type_enum` values using `ALTER TYPE ... ADD VALUE`.
- Additional feature-specific tables (e.g., schedules, real-time occupancy) should be created in subsequent migrations with incremental numbering (004, 005, …). 