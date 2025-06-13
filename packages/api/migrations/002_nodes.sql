-- Migration: 002_nodes.sql
-- Description: Define `nodes` table with spatial column, JSONB attributes, and relevant indexes.
-- Generated on 2025-06-12

-- --------------------------------------------------------------------
-- TABLE: nodes
-- --------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS nodes (
    id               SERIAL PRIMARY KEY,
    name             TEXT,
    type             node_type_enum NOT NULL,
    floor_plan_id    INTEGER REFERENCES floor_plans(id) ON DELETE SET NULL,
    building_id      INTEGER REFERENCES buildings(id) ON DELETE CASCADE,
    coordinates_x_px DOUBLE PRECISION,
    coordinates_y_px DOUBLE PRECISION,
    geom             GEOMETRY(Point, 0) NOT NULL,
    is_accessible    BOOLEAN DEFAULT TRUE,
    qr_code_payload  TEXT UNIQUE,
    attributes       JSONB
);

-- Spatial index for efficient geospatial queries
CREATE INDEX IF NOT EXISTS idx_nodes_geom ON nodes USING GIST (geom);

-- Standard indexes to speed up graph queries / lookups
CREATE INDEX IF NOT EXISTS idx_nodes_floor_plan_id ON nodes(floor_plan_id);
CREATE INDEX IF NOT EXISTS idx_nodes_building_id   ON nodes(building_id);

-- Check constraint (optional): ensure coordinates are non-negative pixel values
ALTER TABLE nodes
    ADD CONSTRAINT chk_nodes_coordinates_non_negative
    CHECK (coordinates_x_px >= 0 AND coordinates_y_px >= 0); 