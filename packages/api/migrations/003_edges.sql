-- Migration: 003_edges.sql
-- Description: Define `edges` table connecting nodes with attributes and supporting indexes.
-- Generated on 2025-06-12

-- --------------------------------------------------------------------
-- TABLE: edges
-- --------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS edges (
    id            SERIAL PRIMARY KEY,
    from_node_id  INTEGER NOT NULL REFERENCES nodes(id) ON DELETE CASCADE,
    to_node_id    INTEGER NOT NULL REFERENCES nodes(id) ON DELETE CASCADE,
    weight        DOUBLE PRECISION,
    type          edge_type_enum NOT NULL,
    instructions  TEXT,
    attributes    JSONB
);

-- Indexes to accelerate graph traversal queries
CREATE INDEX IF NOT EXISTS idx_edges_from_node_id ON edges(from_node_id);
CREATE INDEX IF NOT EXISTS idx_edges_to_node_id   ON edges(to_node_id);

-- Optional check: prevent self-loops unless intentionally allowed
ALTER TABLE edges
    ADD CONSTRAINT chk_edges_no_self_loop CHECK (from_node_id <> to_node_id); 