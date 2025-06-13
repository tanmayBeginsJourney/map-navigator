-- Migration: 001_enums_buildings_floor_plans.sql
-- Description: Create ENUM types for node/edge classifications and foundational tables for buildings and floor plans.
-- Generated on 2025-06-12

-- Ensure PostGIS extension exists (safe to include early for later spatial features)
CREATE EXTENSION IF NOT EXISTS postgis;

-- --------------------------------------------------------------------
-- ENUM TYPES
-- --------------------------------------------------------------------

-- Node type classification
DO $$
BEGIN
    CREATE TYPE node_type_enum AS ENUM (
        'ROOM',
        'POINT_OF_INTEREST',
        'ENTRANCE',
        'SERVICE_POINT'
    );
EXCEPTION
    WHEN duplicate_object THEN NULL;  -- Skip if already created
END$$;

-- Edge type classification
DO $$
BEGIN
    CREATE TYPE edge_type_enum AS ENUM (
        'HALLWAY',
        'STAIRCASE',
        'ELEVATOR',
        'OUTDOOR_PATH'
    );
EXCEPTION
    WHEN duplicate_object THEN NULL;
END$$;

-- --------------------------------------------------------------------
-- TABLE: buildings
-- --------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS buildings (
    id   SERIAL PRIMARY KEY,
    name TEXT NOT NULL
);

-- --------------------------------------------------------------------
-- TABLE: floor_plans
-- --------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS floor_plans (
    id              SERIAL PRIMARY KEY,
    building_id     INTEGER NOT NULL REFERENCES buildings(id) ON DELETE CASCADE,
    floor_number    INTEGER,
    name            TEXT,
    svg_url         TEXT,
    width_px        DOUBLE PRECISION,
    height_px       DOUBLE PRECISION,
    scale_m_per_px  DOUBLE PRECISION
);

-- Indexes for relational integrity & performance
CREATE INDEX IF NOT EXISTS idx_floor_plans_building_id ON floor_plans(building_id); 