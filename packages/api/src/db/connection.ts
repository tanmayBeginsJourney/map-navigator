import { drizzle } from 'drizzle-orm/postgres-js';
import postgres from 'postgres';
import * as schema from './schema';
import { config, isProduction } from '../config';
import type { PgTransaction } from 'drizzle-orm/pg-core';
import type { PostgresJsQueryResultHKT } from 'drizzle-orm/postgres-js';
import type { ExtractTablesWithRelations } from 'drizzle-orm';
import logger from '../logger';

// Connection retry configuration
const RETRY_ATTEMPTS = 5;
const INITIAL_RETRY_DELAY = 1000; // 1 second
const MAX_RETRY_DELAY = 30000; // 30 seconds

export interface DatabaseConfig {
  host: string;
  port: number;
  name: string;
  user: string;
  password: string;
  ssl?: boolean;
  maxConnections?: number;
  idleTimeout?: number;
  connectionTimeout?: number;
}

export class DatabaseService {
  private sql: postgres.Sql | null = null;
  private db: ReturnType<typeof drizzle> | null = null;
  private isConnected = false;
  private connectionAttempts = 0;

  constructor(private dbConfig: DatabaseConfig) {}

  /**
   * Initialize database connection with retry logic
   */
  async connect(): Promise<void> {
    if (this.isConnected && this.sql && this.db) {
      return;
    }

    await this.connectWithRetry();
  }

  /**
   * Connect with exponential backoff retry logic
   */
  private async connectWithRetry(): Promise<void> {
    for (let attempt = 1; attempt <= RETRY_ATTEMPTS; attempt++) {
      try {
        logger.info(`🔌 Attempting database connection (attempt ${attempt}/${RETRY_ATTEMPTS})`);
        
        // Create postgres connection
        this.sql = postgres({
          host: this.dbConfig.host,
          port: this.dbConfig.port,
          database: this.dbConfig.name,
          username: this.dbConfig.user,
          password: this.dbConfig.password,
          ssl: this.dbConfig.ssl,
          max: this.dbConfig.maxConnections || 20,
          idle_timeout: this.dbConfig.idleTimeout || 30,
          connect_timeout: this.dbConfig.connectionTimeout || 10,
          // Enable connection pooling
          max_lifetime: 60 * 30, // 30 minutes
          // Transform undefined to null for better compatibility
          transform: {
            undefined: null,
          },
        });

        // Initialize Drizzle with schema
        this.db = drizzle(this.sql, { schema });

        // Test connection with a simple query
        await this.sql`SELECT 1 as test`;
        
        this.isConnected = true;
        this.connectionAttempts = 0;
        
        logger.info('✅ Database connected successfully');
        return;

      } catch (error) {
        this.connectionAttempts = attempt;
        logger.error({ err: error }, `❌ Database connection attempt ${attempt} failed`);

        // Clean up failed connection
        if (this.sql) {
          try {
            await this.sql.end();
          } catch (cleanupError) {
            logger.warn({ err: cleanupError }, 'Warning: Error during connection cleanup');
          }
          this.sql = null;
          this.db = null;
        }

        // If this was the last attempt, throw the error
        if (attempt === RETRY_ATTEMPTS) {
          throw new Error(`Database connection failed after ${RETRY_ATTEMPTS} attempts. Last error: ${error}`);
        }

        // Calculate delay with exponential backoff
        const delay = Math.min(
          INITIAL_RETRY_DELAY * Math.pow(2, attempt - 1),
          MAX_RETRY_DELAY
        );
        
        logger.info(`⏳ Retrying in ${delay}ms...`);
        await new Promise(resolve => setTimeout(resolve, delay));
      }
    }
  }

  /**
   * Get the Drizzle database instance
   */
  getDb() {
    if (!this.db) {
      throw new Error('Database not connected. Call connect() first.');
    }
    return this.db;
  }

  /**
   * Get the raw postgres SQL instance for complex queries
   */
  getSql() {
    if (!this.sql) {
      throw new Error('Database not connected. Call connect() first.');
    }
    return this.sql;
  }

  /**
   * Execute a function within a database transaction
   */
  async withTransaction<T>(
    callback: (tx: any) => Promise<T>
  ): Promise<T> {
    const db = this.getDb();
    return await db.transaction(callback);
  }

  /**
   * Check database health
   */
  async healthCheck(): Promise<{ status: 'healthy' | 'unhealthy'; latency?: number; error?: string }> {
    try {
      const startTime = Date.now();
      await this.getSql()`SELECT 1 as health_check`;
      const latency = Date.now() - startTime;
      
      return { status: 'healthy', latency };
    } catch (error) {
      return { 
        status: 'unhealthy', 
        error: error instanceof Error ? error.message : 'Unknown error' 
      };
    }
  }

  /**
   * Check PostGIS extension
   */
  async checkPostGIS(): Promise<{ available: boolean; version?: string; error?: string }> {
    try {
      const result = await this.getSql()`SELECT PostGIS_Version() as version`;
      return { 
        available: true, 
        version: result[0]?.version || 'Unknown'
      };
    } catch (error) {
      return { 
        available: false, 
        error: error instanceof Error ? error.message : 'Unknown error' 
      };
    }
  }

  /**
   * Get connection status
   */
  getStatus() {
    return {
      connected: this.isConnected,
      attempts: this.connectionAttempts,
      hasDb: !!this.db,
      hasSql: !!this.sql,
    };
  }

  /**
   * Gracefully close database connections
   */
  async disconnect(): Promise<void> {
    logger.info('🔌 Closing database connections...');
    
    try {
      if (this.sql) {
        await this.sql.end();
        this.sql = null;
      }
      
      this.db = null;
      this.isConnected = false;
      this.connectionAttempts = 0;
      
      logger.info('✅ Database connections closed successfully');
    } catch (error) {
      logger.error({ err: error },'❌ Error closing database connections:');
      throw error;
    }
  }

  // ===== PATHFINDING SERVICE METHODS =====
  // These methods provide the interface required by the pathfinding service

  /**
   * Get a node by its ID (compatible with pathfinding service)
   */
  async getNodeById(nodeId: number): Promise<import('@campus-nav/shared/types').Node | null> {
    try {
      const sql = this.getSql();
      const result = await sql`
        SELECT 
          id,
          name,
          type,
          floor_plan_id,
          building_id,
          coordinates_x_px,
          coordinates_y_px,
          ST_X(geom::geometry) as geom_x,
          ST_Y(geom::geometry) as geom_y,
          is_accessible,
          qr_code_payload,
          attributes
        FROM nodes 
        WHERE id = ${nodeId}
      `;
      
      if (result.length === 0) {
        return null;
      }

      const row = result[0];
      return {
        id: row.id,
        name: row.name,
        type: row.type,
        floor_plan_id: row.floor_plan_id,
        building_id: row.building_id,
        coordinates_x_px: row.coordinates_x_px,
        coordinates_y_px: row.coordinates_y_px,
        geom: {
          x: row.geom_x ?? null,
          y: row.geom_y ?? null,
        },
        is_accessible: row.is_accessible,
        qr_code_payload: row.qr_code_payload,
        attributes: row.attributes || null,
      };
    } catch (error) {
      logger.error({ err: error },`Error getting node ${nodeId}:`);
      throw error;
    }
  }

  /**
   * Get all edges connected to a specific node (bidirectional support)
   */
  async getEdgesFromNode(nodeId: number): Promise<import('@campus-nav/shared/types').Edge[]> {
    try {
      const sql = this.getSql();
      const result = await sql`
        SELECT 
          id,
          from_node_id,
          to_node_id,
          weight,
          type,
          instructions,
          attributes,
          CASE 
            WHEN from_node_id = ${nodeId} THEN 'outgoing'
            WHEN to_node_id = ${nodeId} THEN 'incoming'
          END as direction
        FROM edges 
        WHERE from_node_id = ${nodeId} OR to_node_id = ${nodeId}
        ORDER BY weight ASC
      `;
      
      return result.map((row: any) => {
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
    } catch (error) {
      logger.error({ err: error },`Error getting edges for node ${nodeId}:`);
      throw error;
    }
  }

  /**
   * Get accessible edges from a node (for wheelchair accessibility)
   */
  async getAccessibleEdgesFromNode(nodeId: number): Promise<import('@campus-nav/shared/types').Edge[]> {
    try {
      const sql = this.getSql();
      const result = await sql`
        SELECT 
          e.id,
          e.from_node_id,
          e.to_node_id,
          e.weight,
          e.type,
          e.instructions,
          e.attributes,
          CASE 
            WHEN e.from_node_id = ${nodeId} THEN 'outgoing'
            WHEN e.to_node_id = ${nodeId} THEN 'incoming'
          END as direction
        FROM edges e
        WHERE (e.from_node_id = ${nodeId} OR e.to_node_id = ${nodeId})
          AND e.type != 'STAIRCASE'
          AND EXISTS (
            SELECT 1 FROM nodes n1 
            WHERE n1.id = CASE 
              WHEN e.from_node_id = ${nodeId} THEN e.to_node_id 
              ELSE e.from_node_id 
            END 
            AND n1.is_accessible = true
          )
        ORDER BY e.weight ASC
      `;
      
      return result.map((row: any) => {
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
    } catch (error) {
      logger.error({ err: error },`Error getting accessible edges for node ${nodeId}:`);
      throw error;
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
}

// Create singleton instance
export const createDatabaseService = (dbConfig?: DatabaseConfig): DatabaseService => {
  const finalConfig: DatabaseConfig = {
    ...{
      host: config.database.host,
      port: config.database.port,
      name: config.database.name,
      user: config.database.user,
      password: config.database.password,
      ssl: isProduction,
      maxConnections: isProduction ? 50 : 10,
      idleTimeout: 30,
      connectionTimeout: 10,
    },
    ...dbConfig,
  };
  
  return new DatabaseService(finalConfig);
};

// Export schema for external use
export { schema }; 