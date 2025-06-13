import { Node, Edge, RouteResponse, PathStep, Point, NodeType, EdgeType } from '@campus-nav/shared/types';
import { db } from './database';

interface AStarNode {
  node: Node;
  gCost: number; // Distance from start
  hCost: number; // Heuristic distance to end
  fCost: number; // Total cost (g + h)
  parent?: AStarNode;
  edge?: Edge; // Edge used to reach this node
}

export class PathfindingService {
  
  /**
   * Calculate Euclidean distance between two points
   */
  private calculateDistance(point1: Point, point2: Point): number {
    const dx = point1.x - point2.x;
    const dy = point1.y - point2.y;
    return Math.sqrt(dx * dx + dy * dy);
  }

  /**
   * Calculate Manhattan distance (useful for grid-like indoor spaces)
   */
  private calculateManhattanDistance(point1: Point, point2: Point): number {
    return Math.abs(point1.x - point2.x) + Math.abs(point1.y - point2.y);
  }

  /**
   * Heuristic function for A* algorithm
   * Uses Euclidean distance with penalties for floor changes
   */
  private calculateHeuristic(current: Node, target: Node): number {
    let distance = this.calculateDistance(current.geom, target.geom);
    
    // Add penalty for different floors
    if (current.floor_plan_id !== target.floor_plan_id) {
      distance += 50; // Additional cost for floor transitions
    }
    
    // Add penalty for different buildings  
    if (current.building_id !== target.building_id) {
      distance += 100; // Additional cost for building transitions
    }
    
    return distance;
  }

  /**
   * Get actual cost of an edge with type-based modifiers
   */
  private getEdgeCost(edge: Edge, accessibility: boolean = false): number {
    let baseCost = edge.weight || 1;
    
    // Apply type-based cost modifiers
    switch (edge.type) {
      case EdgeType.STAIRS:
        baseCost *= accessibility ? 1000 : 1.5; // High penalty for accessibility
        break;
      case EdgeType.ELEVATOR:
        baseCost *= 2; // Elevator takes time
        break;
      case EdgeType.DOOR:
        baseCost *= 1.1; // Slight penalty for doors
        break;
      case EdgeType.OUTDOOR_PATH:
        baseCost *= 1.2; // Weather/distance factor
        break;
      case EdgeType.WALKWAY:
      default:
        break; // No modifier
    }
    
    return baseCost;
  }

  /**
   * Generate navigation instructions based on edge type and context
   */
  private generateInstruction(edge: Edge, fromNode: Node, toNode: Node): string {
    if (edge.instructions) {
      return edge.instructions;
    }
    
    // Generate contextual instructions
    switch (edge.type) {
      case EdgeType.STAIRS:
        const direction = (fromNode.floor_plan_id || 0) < (toNode.floor_plan_id || 0) ? 'up' : 'down';
        return `Take stairs ${direction} to ${toNode.name || 'next floor'}`;
      
      case EdgeType.ELEVATOR:
        return `Take elevator to ${toNode.name || 'destination floor'}`;
      
      case EdgeType.DOOR:
        return `Go through door to ${toNode.name || 'next area'}`;
      
      case EdgeType.OUTDOOR_PATH:
        return `Walk outside to ${toNode.name || 'destination'}`;
      
      case EdgeType.WALKWAY:
      default:
        if (toNode.name) {
          return `Walk to ${toNode.name}`;
        }
        return 'Continue straight';
    }
  }

  /**
   * Core A* pathfinding algorithm
   */
  async findPath(
    startNodeId: number, 
    endNodeId: number, 
    accessibilityRequired: boolean = false
  ): Promise<RouteResponse | null> {
    
    // Get start and end nodes
    const startNode = await db.getNodeById(startNodeId);
    const endNode = await db.getNodeById(endNodeId);
    
    if (!startNode || !endNode) {
      return null;
    }

    // Check accessibility requirements
    if (accessibilityRequired && (!startNode.is_accessible || !endNode.is_accessible)) {
      return null;
    }

    const openSet: AStarNode[] = [];
    const closedSet: Set<number> = new Set();
    
    // Initialize start node
    const startAStarNode: AStarNode = {
      node: startNode,
      gCost: 0,
      hCost: this.calculateHeuristic(startNode, endNode),
      fCost: 0,
    };
    startAStarNode.fCost = startAStarNode.gCost + startAStarNode.hCost;
    
    openSet.push(startAStarNode);
    
    while (openSet.length > 0) {
      // Find node with lowest fCost
      openSet.sort((a, b) => a.fCost - b.fCost);
      const current = openSet.shift()!;
      
      // Add to closed set
      closedSet.add(current.node.id);
      
      // Check if we reached the goal
      if (current.node.id === endNodeId) {
        return this.reconstructPath(current, startNode, endNode);
      }
      
      // Get neighbors
      const edges = accessibilityRequired 
        ? await db.getAccessibleEdgesFromNode(current.node.id)
        : await db.getEdgesFromNode(current.node.id);
      
      for (const edge of edges) {
        // Skip if already evaluated
        if (closedSet.has(edge.to_node_id)) {
          continue;
        }
        
        const neighbor = await db.getNodeById(edge.to_node_id);
        if (!neighbor) continue;
        
        // Skip inaccessible nodes if accessibility is required
        if (accessibilityRequired && !neighbor.is_accessible) {
          continue;
        }
        
        const gCost = current.gCost + this.getEdgeCost(edge, accessibilityRequired);
        const hCost = this.calculateHeuristic(neighbor, endNode);
        const fCost = gCost + hCost;
        
        // Check if this path to neighbor is better
        const existingNodeIndex = openSet.findIndex(n => n.node.id === neighbor.id);
        
        if (existingNodeIndex === -1) {
          // New node
          const neighborAStarNode: AStarNode = {
            node: neighbor,
            gCost,
            hCost,
            fCost,
            parent: current,
            edge,
          };
          openSet.push(neighborAStarNode);
        } else if (gCost < openSet[existingNodeIndex].gCost) {
          // Better path to existing node
          openSet[existingNodeIndex].gCost = gCost;
          openSet[existingNodeIndex].fCost = fCost;
          openSet[existingNodeIndex].parent = current;
          openSet[existingNodeIndex].edge = edge;
        }
      }
    }
    
    // No path found
    return null;
  }

  /**
   * Reconstruct the final path from A* result
   */
  private reconstructPath(goalNode: AStarNode, startNode: Node, endNode: Node): RouteResponse {
    const pathSteps: PathStep[] = [];
    const floorsInvolved = new Set<number>();
    const buildingsInvolved = new Set<number>();
    
    let current: AStarNode | undefined = goalNode;
    let totalDistance = 0;
    let totalDuration = 0;
    
    // Build path backwards
    const reversePath: { node: Node; edge?: Edge }[] = [];
    
    while (current) {
      reversePath.push({
        node: current.node,
        edge: current.edge,
      });
      
      if (current.node.floor_plan_id) {
        floorsInvolved.add(current.node.floor_plan_id);
      }
      if (current.node.building_id) {
        buildingsInvolved.add(current.node.building_id);
      }
      
      current = current.parent;
    }
    
    // Reverse to get correct order
    reversePath.reverse();
    
    // Convert to path steps with instructions
    for (let i = 0; i < reversePath.length; i++) {
      const pathItem = reversePath[i];
      const prevItem = i > 0 ? reversePath[i - 1] : null;
      
      let distance = 0;
      let instruction = '';
      
      if (pathItem.edge && prevItem) {
        distance = this.getEdgeCost(pathItem.edge);
        instruction = this.generateInstruction(pathItem.edge, prevItem.node, pathItem.node);
        totalDistance += distance;
        totalDuration += this.estimateDuration(pathItem.edge, distance);
      }
      
      pathSteps.push({
        node: pathItem.node,
        edge: pathItem.edge,
        instruction: instruction || (i === 0 ? 'Start here' : 'Continue'),
        distance,
        duration_seconds: this.estimateDuration(pathItem.edge, distance),
      });
    }
    
    return {
      path: pathSteps,
      total_distance: totalDistance,
      total_duration_seconds: totalDuration,
      floors_involved: Array.from(floorsInvolved),
      buildings_involved: Array.from(buildingsInvolved),
      accessibility_compatible: this.checkAccessibilityCompatibility(pathSteps),
    };
  }

  /**
   * Estimate walking duration based on edge type and distance
   */
  private estimateDuration(edge?: Edge, distance: number = 0): number {
    if (!edge) return 0;
    
    // Base walking speed: 1.4 m/s (5 km/h)
    let baseTime = distance / 1.4;
    
    switch (edge.type) {
      case EdgeType.STAIRS:
        baseTime *= 2; // Stairs take twice as long
        break;
      case EdgeType.ELEVATOR:
        baseTime += 30; // 30 second wait + travel time
        break;
      case EdgeType.DOOR:
        baseTime += 2; // 2 seconds to open/close door
        break;
      default:
        break;
    }
    
    return Math.round(baseTime);
  }

  /**
   * Check if path is accessibility compatible
   */
  private checkAccessibilityCompatibility(pathSteps: PathStep[]): boolean {
    return pathSteps.every(step => {
      // Check if node is accessible
      if (!step.node.is_accessible) return false;
      
      // Check if edge type is accessible (no stairs)
      if (step.edge && step.edge.type === EdgeType.STAIRS) return false;
      
      return true;
    });
  }
}

export const pathfindingService = new PathfindingService(); 