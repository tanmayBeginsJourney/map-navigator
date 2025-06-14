import { Node, Edge, RouteResponse, PathStep, Point, EdgeType } from '@campus-nav/shared/types';
import { createDatabaseService } from './db/connection';

interface AStarNode {
  node: Node;
  gCost: number; // Distance from start
  hCost: number; // Heuristic distance to end
  fCost: number; // Total cost (g + h)
  parent?: AStarNode;
  edge?: Edge; // Edge used to reach this node
}

/**
 * Simple min-heap implementation for A* open set
 */
class MinHeap<T> {
  private heap: T[] = [];
  
  constructor(private compare: (a: T, b: T) => number) {}
  
  get length(): number {
    return this.heap.length;
  }
  
  push(item: T): void {
    this.heap.push(item);
    this.bubbleUp(this.heap.length - 1);
  }
  
  pop(): T | undefined {
    if (this.heap.length === 0) return undefined;
    if (this.heap.length === 1) return this.heap.pop();
    
    const root = this.heap[0];
    this.heap[0] = this.heap.pop()!;
    this.bubbleDown(0);
    return root;
  }
  
  peek(): T | undefined {
    return this.heap.length > 0 ? this.heap[0] : undefined;
  }
  
  private bubbleUp(index: number): void {
    while (index > 0) {
      const parentIndex = Math.floor((index - 1) / 2);
      if (this.compare(this.heap[index], this.heap[parentIndex]) >= 0) break;
      
      [this.heap[index], this.heap[parentIndex]] = [this.heap[parentIndex], this.heap[index]];
      index = parentIndex;
    }
  }
  
  private bubbleDown(index: number): void {
    while (true) {
      let minIndex = index;
      const leftChild = 2 * index + 1;
      const rightChild = 2 * index + 2;
      
      if (leftChild < this.heap.length && this.compare(this.heap[leftChild], this.heap[minIndex]) < 0) {
        minIndex = leftChild;
      }
      
      if (rightChild < this.heap.length && this.compare(this.heap[rightChild], this.heap[minIndex]) < 0) {
        minIndex = rightChild;
      }
      
      if (minIndex === index) break;
      
      [this.heap[index], this.heap[minIndex]] = [this.heap[minIndex], this.heap[index]];
      index = minIndex;
    }
  }
}

export class PathfindingService {
  private db: ReturnType<typeof createDatabaseService>;

  constructor(dbService: ReturnType<typeof createDatabaseService>) {
    this.db = dbService;
  }

  /**
   * Ensure database connection is established
   */
  private async ensureConnection(): Promise<void> {
    await this.db.connect();
  }
  
  /**
   * Calculate Euclidean distance between two points
   */
  private calculateDistance(point1: Point, point2: Point): number {
    // Handle nullable coordinates - if either point is missing coordinates, return a large default distance
    if (point1.x === null || point1.y === null || point2.x === null || point2.y === null) {
      return 1000; // Large default distance when coordinates are missing
    }
    
    const dx = point1.x - point2.x;
    const dy = point1.y - point2.y;
    return Math.sqrt(dx * dx + dy * dy);
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
    let baseCost = edge.weight ?? 1; // Weight is now NOT NULL but keep fallback for safety
    
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
      case EdgeType.STAIRS: {
        const direction = (fromNode.floor_plan_id || 0) < (toNode.floor_plan_id || 0) ? 'up' : 'down';
        return `Take stairs ${direction} to ${toNode.name || 'next floor'}`;
      }
      
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
    
    // Ensure IDs are numbers (in case they're passed as strings from API)
    const startId = typeof startNodeId === 'string' ? parseInt(startNodeId, 10) : startNodeId;
    const endId = typeof endNodeId === 'string' ? parseInt(endNodeId, 10) : endNodeId;
    
    // Ensure database connection
    await this.ensureConnection();
    
    // Get start and end nodes
    const startNode = await this.db.getNodeById(startId);
    const endNode = await this.db.getNodeById(endId);

    // If start or end node is not found, return null (will be a 404 in the API layer)
    if (!startNode || !endNode) {
      return null;
    }
    
    // Min-heap for the open set (nodes to be evaluated)
    const openSet = new MinHeap<AStarNode>((a, b) => a.fCost - b.fCost);
    
    // Map to keep track of nodes in the open set for quick lookups
    const openSetMap = new Map<number, AStarNode>();
    
    // Set for the closed set (nodes already evaluated)
    const closedSet = new Set<number>();
    
    // Initialize start node for A*
    const startAStarNode: AStarNode = {
      node: startNode,
      gCost: 0,
      hCost: this.calculateHeuristic(startNode, endNode),
      fCost: this.calculateHeuristic(startNode, endNode),
      parent: undefined,
      edge: undefined
    };
    
    openSet.push(startAStarNode);
    openSetMap.set(startNode.id, startAStarNode);
    
    // Main A* loop
    while (openSet.length > 0) {
      const currentNode = openSet.pop()!;
      openSetMap.delete(currentNode.node.id);
      
      // Check if we've reached the goal
      if (currentNode.node.id === endId) {
        return this.reconstructPath(currentNode);
      }
      
      closedSet.add(currentNode.node.id);
      
      // Get neighbors for the current node, considering accessibility
      const neighbors = accessibilityRequired 
        ? await this.db.getAccessibleEdgesFromNode(currentNode.node.id)
        : await this.db.getEdgesFromNode(currentNode.node.id);
      
      for (const edge of neighbors) {
        
        // Determine the actual neighbor node's ID
        const neighborNodeId = edge.from_node_id === currentNode.node.id 
          ? edge.to_node_id
          : edge.from_node_id;

        // This should not happen with good data, but as a safeguard:
        if (neighborNodeId === null || neighborNodeId === undefined) {
          continue;
        }

        // Skip if neighbor is already evaluated
        if (closedSet.has(neighborNodeId)) {
          continue;
        }
        
        // Skip inaccessible paths if required
        if (accessibilityRequired && (edge.type === EdgeType.STAIRS || edge.is_accessible === false)) {
          continue;
        }
        
        const edgeCost = this.getEdgeCost(edge, accessibilityRequired);
        const tentativeGCost = currentNode.gCost + edgeCost;
        
        const existingNeighbor = openSetMap.get(neighborNodeId);
        
        if (!existingNeighbor || tentativeGCost < existingNeighbor.gCost) {
          const neighborNode = await this.db.getNodeById(neighborNodeId);
          if (!neighborNode) continue; // Safeguard if an edge points to a non-existent node

          const hCost = this.calculateHeuristic(neighborNode, endNode);
          
          const neighborAStarNode: AStarNode = {
            node: neighborNode,
            gCost: tentativeGCost,
            hCost: hCost,
            fCost: tentativeGCost + hCost,
            parent: currentNode,
            edge: edge
          };
          
          if (!existingNeighbor) {
            openSet.push(neighborAStarNode);
            openSetMap.set(neighborNodeId, neighborAStarNode);
          } else {
            // Update the existing node in the heap
            // This is complex for a min-heap; for simplicity, we add a new node
            // The algorithm will still work, just slightly less efficient
            openSet.push(neighborAStarNode);
            openSetMap.set(neighborNodeId, neighborAStarNode);
          }
        }
      }
    }
    
    // No path found
    return null;
  }

  /**
   * Reconstruct the final path from A* result
   */
  private reconstructPath(goalNode: AStarNode): RouteResponse {
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

// PathfindingService should be instantiated with a shared database service
// export const pathfindingService = new PathfindingService(createDatabaseService()); 