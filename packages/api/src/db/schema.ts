import { pgTable, serial, text, integer, doublePrecision, boolean, jsonb, pgEnum, index } from 'drizzle-orm/pg-core';
import { relations } from 'drizzle-orm';

// Define enums matching the database schema
export const nodeTypeEnum = pgEnum('node_type_enum', [
  'ROOM', // Generic room/space
  'POINT_OF_INTEREST', // Maps to checkpoint nodes in actual data
  'ENTRANCE', // Building/room entrance points
  'SERVICE_POINT', // Maps to food_court and similar service nodes
]);

export const edgeTypeEnum = pgEnum('edge_type_enum', [
  'HALLWAY', // Standard walking path/corridor
  'STAIRCASE', // Vertical connection via stairs
  'ELEVATOR', // Vertical connection via elevator
  'OUTDOOR_PATH', // Outdoor walking path
]);

// Buildings table
export const buildings = pgTable('buildings', {
  id: serial('id').primaryKey(),
  name: text('name').notNull(),
});

// Floor plans table
export const floorPlans = pgTable('floor_plans', {
  id: serial('id').primaryKey(),
  buildingId: integer('building_id').notNull().references(() => buildings.id, { onDelete: 'cascade' }),
  floorNumber: integer('floor_number'),
  name: text('name'),
  svgUrl: text('svg_url'),
  widthPx: doublePrecision('width_px'),
  heightPx: doublePrecision('height_px'),
  scaleMPerPx: doublePrecision('scale_m_per_px'),
}, (table) => ({
  buildingIdIdx: index('idx_floor_plans_building_id').on(table.buildingId),
}));

// Nodes table
export const nodes = pgTable('nodes', {
  id: serial('id').primaryKey(),
  name: text('name'),
  type: nodeTypeEnum('type').notNull(),
  floorPlanId: integer('floor_plan_id').references(() => floorPlans.id, { onDelete: 'set null' }),
  buildingId: integer('building_id').references(() => buildings.id, { onDelete: 'cascade' }),
  coordinatesXPx: doublePrecision('coordinates_x_px'),
  coordinatesYPx: doublePrecision('coordinates_y_px'),
  // Note: geometry field will be handled separately as Drizzle doesn't have native PostGIS support
  geom: text('geom'), // We'll use raw SQL for geometry operations
  isAccessible: boolean('is_accessible').default(true),
  qrCodePayload: text('qr_code_payload').unique(),
  attributes: jsonb('attributes'),
}, (table) => ({
  floorPlanIdIdx: index('idx_nodes_floor_plan_id').on(table.floorPlanId),
  buildingIdIdx: index('idx_nodes_building_id').on(table.buildingId),
}));

// Edges table
export const edges = pgTable('edges', {
  id: serial('id').primaryKey(),
  fromNodeId: integer('from_node_id').notNull().references(() => nodes.id, { onDelete: 'cascade' }),
  toNodeId: integer('to_node_id').notNull().references(() => nodes.id, { onDelete: 'cascade' }),
  weight: doublePrecision('weight').notNull().default(1.0),
  type: edgeTypeEnum('type').notNull(),
  instructions: text('instructions'),
  attributes: jsonb('attributes'),
}, (table) => ({
  fromNodeIdIdx: index('idx_edges_from_node_id').on(table.fromNodeId),
  toNodeIdIdx: index('idx_edges_to_node_id').on(table.toNodeId),
}));

// Define relationships
export const buildingsRelations = relations(buildings, ({ many }) => ({
  floorPlans: many(floorPlans),
  nodes: many(nodes),
}));

export const floorPlansRelations = relations(floorPlans, ({ one, many }) => ({
  building: one(buildings, {
    fields: [floorPlans.buildingId],
    references: [buildings.id],
  }),
  nodes: many(nodes),
}));

export const nodesRelations = relations(nodes, ({ one, many }) => ({
  building: one(buildings, {
    fields: [nodes.buildingId],
    references: [buildings.id],
  }),
  floorPlan: one(floorPlans, {
    fields: [nodes.floorPlanId],
    references: [floorPlans.id],
  }),
  outgoingEdges: many(edges, { relationName: 'fromNode' }),
  incomingEdges: many(edges, { relationName: 'toNode' }),
}));

export const edgesRelations = relations(edges, ({ one }) => ({
  fromNode: one(nodes, {
    fields: [edges.fromNodeId],
    references: [nodes.id],
    relationName: 'fromNode',
  }),
  toNode: one(nodes, {
    fields: [edges.toNodeId],
    references: [nodes.id],
    relationName: 'toNode',
  }),
}));

// Type definitions for TypeScript
export type Building = typeof buildings.$inferSelect;
export type NewBuilding = typeof buildings.$inferInsert;

export type FloorPlan = typeof floorPlans.$inferSelect;
export type NewFloorPlan = typeof floorPlans.$inferInsert;

export type Node = typeof nodes.$inferSelect;
export type NewNode = typeof nodes.$inferInsert;

export type Edge = typeof edges.$inferSelect;
export type NewEdge = typeof edges.$inferInsert;

export type NodeType = typeof nodeTypeEnum.enumValues[number];
export type EdgeType = typeof edgeTypeEnum.enumValues[number]; 