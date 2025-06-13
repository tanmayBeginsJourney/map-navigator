import { eq, sql, and, or, inArray } from 'drizzle-orm';
import { DatabaseService } from './connection';
import { nodes, edges, buildings, floorPlans, nodeTypeEnum, edgeTypeEnum } from './schema';
import type { Node as SharedNode, Edge as SharedEdge, NodeType as SharedNodeType, EdgeType as SharedEdgeType } from '@campus-nav/shared/types';

// Type conversion utilities to handle null/undefined differences between Drizzle and shared types
class TypeConverter {
  /**
   * Convert Drizzle NodeType to SharedNodeType
   */
  static convertNodeType(drizzleType: typeof nodeTypeEnum.enumValues[number]): SharedNodeType {
    const mapping: Record<typeof nodeTypeEnum.enumValues[number], SharedNodeType> = {
      'ROOM': 'room' as SharedNodeType,
      'POINT_OF_INTEREST': 'checkpoint' as SharedNodeType,
      'ENTRANCE': 'entrance' as SharedNodeType,
      'SERVICE_POINT': 'food_court' as SharedNodeType,
    };
    return mapping[drizzleType] || 'junction' as SharedNodeType;
  }

  /**
   * Convert Drizzle EdgeType to SharedEdgeType  
   */
  static convertEdgeType(drizzleType: typeof edgeTypeEnum.enumValues[number]): SharedEdgeType {
    const mapping: Record<typeof edgeTypeEnum.enumValues[number], SharedEdgeType> = {
      'HALLWAY': 'walkway' as SharedEdgeType,
      'STAIRCASE': 'stairs' as SharedEdgeType,
      'ELEVATOR': 'elevator' as SharedEdgeType,
      'OUTDOOR_PATH': 'outdoor_path' as SharedEdgeType,
    };
    return mapping[drizzleType] || 'walkway' as SharedEdgeType;
  }

  /**
   * Convert SharedNodeType to Drizzle NodeType
   */
  static convertSharedNodeType(sharedType: SharedNodeType): typeof nodeTypeEnum.enumValues[number] {
    const mapping: Record<SharedNodeType, typeof nodeTypeEnum.enumValues[number]> = {
      'room': 'ROOM',
      'checkpoint': 'POINT_OF_INTEREST',
      'entrance': 'ENTRANCE',
      'exit': 'ENTRANCE',
      'food_court': 'SERVICE_POINT',
      'bathroom': 'SERVICE_POINT',
      'staircase': 'POINT_OF_INTEREST',
      'elevator': 'POINT_OF_INTEREST',
      'emergency_exit': 'ENTRANCE',
      'junction': 'POINT_OF_INTEREST',
    };
    return mapping[sharedType] || 'POINT_OF_INTEREST';
  }

  /**
   * Convert SharedEdgeType to Drizzle EdgeType
   */
  static convertSharedEdgeType(sharedType: SharedEdgeType): typeof edgeTypeEnum.enumValues[number] {
    const mapping: Record<SharedEdgeType, typeof edgeTypeEnum.enumValues[number]> = {
      'walkway': 'HALLWAY',
      'stairs': 'STAIRCASE', 
      'elevator': 'ELEVATOR',
      'door': 'HALLWAY',
      'outdoor_path': 'OUTDOOR_PATH',
    };
    return mapping[sharedType] || 'HALLWAY';
  }

  /**
   * Convert Drizzle Node result to SharedNode
   */
  static convertToSharedNode(row: {
    id: number;
    name: string | null;
    type: typeof nodeTypeEnum.enumValues[number];
    floor_plan_id: number | null;
    building_id: number | null;
    coordinates_x_px: number | null;
    coordinates_y_px: number | null;
    is_accessible: boolean | null;
    qr_code_payload: string | null;
    attributes: unknown;
    geom_x?: number | null;
    geom_y?: number | null;
  }): SharedNode {
    return {
      id: row.id,
      name: row.name || undefined,
      type: TypeConverter.convertNodeType(row.type),
      floor_plan_id: row.floor_plan_id || undefined,
      building_id: row.building_id || undefined,
      coordinates_x_px: row.coordinates_x_px || undefined,
      coordinates_y_px: row.coordinates_y_px || undefined,
      geom: {
        x: row.geom_x ?? 0,
        y: row.geom_y ?? 0,
      },
      is_accessible: row.is_accessible ?? true,
      qr_code_payload: row.qr_code_payload || undefined,
      attributes: row.attributes as Record<string, any> || {},
    };
  }

  /**
   * Convert Drizzle Edge result to SharedEdge
   */
  static convertToSharedEdge(row: {
    id: number;
    from_node_id?: number;
    to_node_id?: number;
    fromNodeId?: number;
    toNodeId?: number;
    weight: number | null;
    type: typeof edgeTypeEnum.enumValues[number];
    instructions: string | null;
    attributes: unknown;
  }, swapDirection: boolean = false): SharedEdge {
    // Handle both camelCase and snake_case field names
    const fromNodeId = row.from_node_id ?? row.fromNodeId!;
    const toNodeId = row.to_node_id ?? row.toNodeId!;
    
    return {
      id: row.id,
      from_node_id: swapDirection ? toNodeId : fromNodeId,
      to_node_id: swapDirection ? fromNodeId : toNodeId,
      weight: row.weight || undefined,
      type: TypeConverter.convertEdgeType(row.type),
      instructions: row.instructions || undefined,
      attributes: row.attributes as Record<string, any> || {},
    };
  }
}

export class DatabaseRepository {
  constructor(private dbService: DatabaseService) {}

  /**
   * Get a node by its ID with proper type conversion
   */
  async getNodeById(nodeId: number): Promise<SharedNode | null> {
    const db = this.dbService.getDb();
    
    const result = await db
      .select({
        id: nodes.id,
        name: nodes.name,
        type: nodes.type,
        floor_plan_id: nodes.floorPlanId,
        building_id: nodes.buildingId,
        coordinates_x_px: nodes.coordinatesXPx,
        coordinates_y_px: nodes.coordinatesYPx,
        is_accessible: nodes.isAccessible,
        qr_code_payload: nodes.qrCodePayload,
        attributes: nodes.attributes,
        // For geometry, we need to use raw SQL to extract coordinates
        geom_x: sql<number>`ST_X(${nodes.geom}::geometry)`.as('geom_x'),
        geom_y: sql<number>`ST_Y(${nodes.geom}::geometry)`.as('geom_y'),
      })
      .from(nodes)
      .where(eq(nodes.id, nodeId))
      .limit(1);

    if (result.length === 0) {
      return null;
    }

    const row = result[0];
    return TypeConverter.convertToSharedNode(row);
  }

  /**
   * Get all edges connected to a specific node (bidirectional support)
   */
  async getEdgesFromNode(nodeId: number): Promise<SharedEdge[]> {
    const db = this.dbService.getDb();
    
    const result = await db
      .select({
        id: edges.id,
        from_node_id: edges.fromNodeId,
        to_node_id: edges.toNodeId,
        weight: edges.weight,
        type: edges.type,
        instructions: edges.instructions,
        attributes: edges.attributes,
      })
      .from(edges)
      .where(or(eq(edges.fromNodeId, nodeId), eq(edges.toNodeId, nodeId)));

    return result.map((row) => {
      // For incoming edges, swap from/to to maintain consistent traversal direction
      const isIncoming = row.to_node_id === nodeId;
      const instructions = isIncoming ? this.reverseInstruction(row.instructions) : row.instructions;
      
      return TypeConverter.convertToSharedEdge({
        ...row,
        instructions
      }, isIncoming);
    });
  }

  /**
   * Get accessible edges from a node (for pathfinding)
   */
  async getAccessibleEdgesFromNode(nodeId: number): Promise<SharedEdge[]> {
    const db = this.dbService.getDb();
    
    // Get edges where both nodes are accessible
    const result = await db
      .select({
        e: edges,
        fromNode: {
          isAccessible: nodes.isAccessible,
        },
        toNode: {
          isAccessible: sql<boolean>`to_nodes.is_accessible`.as('to_accessible'),
        },
      })
      .from(edges)
      .innerJoin(nodes, eq(edges.fromNodeId, nodes.id))
      .innerJoin(
        sql`${nodes} as to_nodes`,
        sql`${edges.toNodeId} = to_nodes.id`
      )
      .where(
        and(
          or(eq(edges.fromNodeId, nodeId), eq(edges.toNodeId, nodeId)),
          eq(nodes.isAccessible, true),
          sql`to_nodes.is_accessible = true`
        )
      );

    return result.map((row) => {
      const isIncoming = row.e.toNodeId === nodeId;
      const instructions = isIncoming ? this.reverseInstruction(row.e.instructions) : row.e.instructions;
      
      return TypeConverter.convertToSharedEdge({
        ...row.e,
        instructions
      }, isIncoming);
    });
  }

  /**
   * Get nodes by location (building and/or floor plan)
   */
  async getNodesByLocation(buildingId?: number, floorPlanId?: number): Promise<SharedNode[]> {
    const db = this.dbService.getDb();
    
    const baseQuery = db
      .select({
        id: nodes.id,
        name: nodes.name,
        type: nodes.type,
        floor_plan_id: nodes.floorPlanId,
        building_id: nodes.buildingId,
        coordinates_x_px: nodes.coordinatesXPx,
        coordinates_y_px: nodes.coordinatesYPx,
        is_accessible: nodes.isAccessible,
        qr_code_payload: nodes.qrCodePayload,
        attributes: nodes.attributes,
        geom_x: sql<number>`ST_X(${nodes.geom}::geometry)`.as('geom_x'),
        geom_y: sql<number>`ST_Y(${nodes.geom}::geometry)`.as('geom_y'),
      })
      .from(nodes);

    // Build conditions array
    const conditions = [];
    if (buildingId !== undefined) {
      conditions.push(eq(nodes.buildingId, buildingId));
    }
    if (floorPlanId !== undefined) {
      conditions.push(eq(nodes.floorPlanId, floorPlanId));
    }

    // Apply where clause if conditions exist, otherwise use base query
    const result = conditions.length > 0 
      ? await baseQuery.where(and(...conditions)).orderBy(nodes.id)
      : await baseQuery.orderBy(nodes.id);

    return result.map((row) => TypeConverter.convertToSharedNode(row));
  }

  /**
   * Get floor transition nodes (elevators, stairs) within a building
   */
  async getFloorTransitionNodes(buildingId: number): Promise<SharedNode[]> {
    const db = this.dbService.getDb();
    
    const result = await db
      .select({
        id: nodes.id,
        name: nodes.name,
        type: nodes.type,
        floor_plan_id: nodes.floorPlanId,
        building_id: nodes.buildingId,
        coordinates_x_px: nodes.coordinatesXPx,
        coordinates_y_px: nodes.coordinatesYPx,
        is_accessible: nodes.isAccessible,
        qr_code_payload: nodes.qrCodePayload,
        attributes: nodes.attributes,
        geom_x: sql<number>`ST_X(${nodes.geom}::geometry)`.as('geom_x'),
        geom_y: sql<number>`ST_Y(${nodes.geom}::geometry)`.as('geom_y'),
      })
      .from(nodes)
      .innerJoin(edges, or(eq(edges.fromNodeId, nodes.id), eq(edges.toNodeId, nodes.id)))
      .where(
        and(
          eq(nodes.buildingId, buildingId),
          or(
            eq(edges.type, 'ELEVATOR'),
            eq(edges.type, 'STAIRCASE')
          )
        )
      )
      .groupBy(nodes.id); // Remove duplicates

    return result.map((row) => TypeConverter.convertToSharedNode(row));
  }

  /**
   * Find node by QR code payload
   */
  async getNodeByQRCode(qrPayload: string): Promise<SharedNode | null> {
    const db = this.dbService.getDb();
    
    const result = await db
      .select({
        id: nodes.id,
        name: nodes.name,
        type: nodes.type,
        floor_plan_id: nodes.floorPlanId,
        building_id: nodes.buildingId,
        coordinates_x_px: nodes.coordinatesXPx,
        coordinates_y_px: nodes.coordinatesYPx,
        is_accessible: nodes.isAccessible,
        qr_code_payload: nodes.qrCodePayload,
        attributes: nodes.attributes,
        geom_x: sql<number>`ST_X(${nodes.geom}::geometry)`.as('geom_x'),
        geom_y: sql<number>`ST_Y(${nodes.geom}::geometry)`.as('geom_y'),
      })
      .from(nodes)
      .where(eq(nodes.qrCodePayload, qrPayload))
      .limit(1);

    if (result.length === 0) {
      return null;
    }

    const row = result[0];
    return TypeConverter.convertToSharedNode(row);
  }

  /**
   * Generate reverse instruction for bidirectional edge traversal
   */
  private reverseInstruction(instruction: string | null): string | null {
    if (!instruction) return instruction;
    
    // Simple instruction reversal logic
    return instruction
      .replace(/from (.+) to (.+)/i, 'from $2 to $1')
      .replace(/Climb stairs from (.+) to (.+)/i, 'Descend stairs from $2 to $1')
      .replace(/Take elevator from (.+) to (.+)/i, 'Take elevator from $2 to $1')
      .replace(/Walk to (.+) from (.+)/i, 'Walk to $2 from $1')
      .replace(/Turn (.+) to (.+)/i, 'Walk from $2 and turn opposite direction');
  }

  /**
   * Execute raw SQL query for complex operations
   */
  async executeRawQuery<T = any>(query: string, params: any[] = []): Promise<T[]> {
    const sql = this.dbService.getSql();
    return await sql.unsafe(query, params);
  }

  /**
   * Begin a transaction
   */
  async withTransaction<T>(callback: (tx: any) => Promise<T>): Promise<T> {
    return await this.dbService.withTransaction(callback);
  }
} 