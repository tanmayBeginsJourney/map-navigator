import { Pool, PoolClient } from 'pg';
import { Node, Edge } from '@campus-nav/shared/types';

export class DatabaseService {
  private pool: Pool;

  constructor() {
    const dbPort = process.env.DB_PORT;
    const port = dbPort && !isNaN(Number(dbPort)) ? parseInt(dbPort) : 5432;
    
    this.pool = new Pool({
      host: process.env.DB_HOST || 'localhost',
      port,
      database: process.env.DB_NAME || 'campus_navigation',
      user: process.env.DB_USER || 'postgres',
      password: process.env.DB_PASSWORD || 'postgres',
      max: 20,
      idleTimeoutMillis: 30000,
      connectionTimeoutMillis: 2000,
    });
  }

  async getClient(): Promise<PoolClient> {
    return this.pool.connect();
  }

  async close(): Promise<void> {
    await this.pool.end();
  }

  /**
   * Get a node by its ID
   */
  async getNodeById(nodeId: number): Promise<Node | null> {
    const client = await this.getClient();
    try {
      const query = `
        SELECT 
          id,
          name,
          type,
          floor_plan_id,
          building_id,
          coordinates_x_px,
          coordinates_y_px,
          ST_X(geom) as geom_x,
          ST_Y(geom) as geom_y,
          is_accessible,
          qr_code_payload,
          attributes
        FROM nodes 
        WHERE id = $1
      `;
      
      const result = await client.query(query, [nodeId]);
      
      if (result.rows.length === 0) {
        return null;
      }

      const row = result.rows[0];
      return {
        id: row.id,
        name: row.name,
        type: row.type,
        floor_plan_id: row.floor_plan_id,
        building_id: row.building_id,
        coordinates_x_px: row.coordinates_x_px,
        coordinates_y_px: row.coordinates_y_px,
        geom: {
          x: row.geom_x ?? 0,
          y: row.geom_y ?? 0,
        },
        is_accessible: row.is_accessible,
        qr_code_payload: row.qr_code_payload,
        attributes: row.attributes || null,
      };
    } finally {
      client.release();
    }
  }

  /**
   * Get all edges connected to a specific node (bidirectional support)
   * Returns edges where the node is either the source or destination
   */
  async getEdgesFromNode(nodeId: number): Promise<Edge[]> {
    const client = await this.getClient();
    try {
      const query = `
        SELECT 
          id,
          from_node_id,
          to_node_id,
          weight,
          type,
          instructions,
          attributes,
          CASE 
            WHEN from_node_id = $1 THEN 'outgoing'
            WHEN to_node_id = $1 THEN 'incoming'
          END as direction
        FROM edges 
        WHERE from_node_id = $1 OR to_node_id = $1
        ORDER BY weight ASC
      `;
      
      const result = await client.query(query, [nodeId]);
      
      return result.rows.map((row: any) => {
        // For incoming edges, swap from/to to maintain consistent traversal direction
        const isIncoming = row.direction === 'incoming';
        
        return {
        id: row.id,
          from_node_id: isIncoming ? row.to_node_id : row.from_node_id,
          to_node_id: isIncoming ? row.from_node_id : row.to_node_id,
        weight: row.weight,
        type: row.type,
          instructions: isIncoming ? this.reverseInstruction(row.instructions) : row.instructions,
        attributes: row.attributes,
        };
      });
    } finally {
      client.release();
    }
  }

  /**
   * Generate reverse instruction for bidirectional edge traversal
   */
  private reverseInstruction(instruction: string): string {
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
   * Get all nodes within a specific building and/or floor plan
   */
  async getNodesByLocation(buildingId?: number, floorPlanId?: number): Promise<Node[]> {
    const client = await this.getClient();
    try {
      let query = `
        SELECT 
          id,
          name,
          type,
          floor_plan_id,
          building_id,
          coordinates_x_px,
          coordinates_y_px,
          ST_X(geom) as geom_x,
          ST_Y(geom) as geom_y,
          is_accessible,
          qr_code_payload,
          attributes
        FROM nodes 
        WHERE 1=1
      `;
      
      const params: any[] = [];
      let paramIndex = 1;
      
      if (buildingId !== undefined) {
        query += ` AND building_id = $${paramIndex++}`;
        params.push(buildingId);
      }
      
      if (floorPlanId !== undefined) {
        query += ` AND floor_plan_id = $${paramIndex++}`;
        params.push(floorPlanId);
      }
      
      query += ' ORDER BY id';
      
      const result = await client.query(query, params);
      
      return result.rows.map((row: any) => ({
        id: row.id,
        name: row.name,
        type: row.type,
        floor_plan_id: row.floor_plan_id,
        building_id: row.building_id,
        coordinates_x_px: row.coordinates_x_px,
        coordinates_y_px: row.coordinates_y_px,
        geom: {
          x: row.geom_x ?? 0,
          y: row.geom_y ?? 0,
        },
        is_accessible: row.is_accessible,
        qr_code_payload: row.qr_code_payload,
        attributes: row.attributes || null,
      }));
    } finally {
      client.release();
    }
  }

  /**
   * Find nodes that enable floor transitions (stairs, elevators)
   */
  async getFloorTransitionNodes(buildingId: number): Promise<Node[]> {
    const client = await this.getClient();
    try {
      const query = `
        SELECT 
          id,
          name,
          type,
          floor_plan_id,
          building_id,
          coordinates_x_px,
          coordinates_y_px,
          ST_X(geom) as geom_x,
          ST_Y(geom) as geom_y,
          is_accessible,
          qr_code_payload,
          attributes
        FROM nodes 
        WHERE building_id = $1 
          AND type IN ('staircase', 'elevator')
        ORDER BY type, floor_plan_id
      `;
      
      const result = await client.query(query, [buildingId]);
      
      return result.rows.map((row: any) => ({
        id: row.id,
        name: row.name,
        type: row.type,
        floor_plan_id: row.floor_plan_id,
        building_id: row.building_id,
        coordinates_x_px: row.coordinates_x_px,
        coordinates_y_px: row.coordinates_y_px,
        geom: {
          x: row.geom_x,
          y: row.geom_y,
        },
        is_accessible: row.is_accessible,
        qr_code_payload: row.qr_code_payload,
        attributes: row.attributes,
      }));
    } finally {
      client.release();
    }
  }

  /**
   * Get edges with accessibility requirements (bidirectional support)
   */
  async getAccessibleEdgesFromNode(nodeId: number): Promise<Edge[]> {
    const client = await this.getClient();
    try {
      const query = `
        SELECT 
          e.id,
          e.from_node_id,
          e.to_node_id,
          e.weight,
          e.type,
          e.instructions,
          e.attributes,
          CASE 
            WHEN e.from_node_id = $1 THEN 'outgoing'
            WHEN e.to_node_id = $1 THEN 'incoming'
          END as direction
        FROM edges e
        WHERE (e.from_node_id = $1 OR e.to_node_id = $1)
          AND e.type != 'STAIRCASE'
          AND EXISTS (
            SELECT 1 FROM nodes n1 
            WHERE n1.id = CASE 
              WHEN e.from_node_id = $1 THEN e.to_node_id 
              ELSE e.from_node_id 
            END 
            AND n1.is_accessible = true
          )
        ORDER BY e.weight ASC
      `;
      
      const result = await client.query(query, [nodeId]);
      
      return result.rows.map((row: any) => {
        // For incoming edges, swap from/to to maintain consistent traversal direction
        const isIncoming = row.direction === 'incoming';
        
        return {
        id: row.id,
          from_node_id: isIncoming ? row.to_node_id : row.from_node_id,
          to_node_id: isIncoming ? row.from_node_id : row.to_node_id,
        weight: row.weight,
        type: row.type,
          instructions: isIncoming ? this.reverseInstruction(row.instructions) : row.instructions,
        attributes: row.attributes,
        };
      });
    } finally {
      client.release();
    }
  }
}

export const db = new DatabaseService(); 