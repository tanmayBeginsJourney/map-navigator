import { PathfindingService } from '../pathfinding';
import { DatabaseService } from '../db/connection';
import { Node, Edge, EdgeType, NodeType } from '../types/shared';

// 1. Mock Data: Define a simple graph: A -> B -> C
const mockNodes: Record<number, Node> = {
  1: { id: 1, name: 'Start A', type: NodeType.CHECKPOINT, geom: { x: 0, y: 0 }, is_accessible: true },
  2: { id: 2, name: 'Middle B', type: NodeType.CHECKPOINT, geom: { x: 10, y: 0 }, is_accessible: true },
  3: { id: 3, name: 'End C', type: NodeType.CHECKPOINT, geom: { x: 20, y: 0 }, is_accessible: true },
};

const mockEdges: Edge[] = [
  { id: 1, from_node_id: 1, to_node_id: 2, weight: 10, type: EdgeType.WALKWAY },
  { id: 2, from_node_id: 2, to_node_id: 3, weight: 10, type: EdgeType.WALKWAY },
];


describe('PathfindingService Unit Tests', () => {
  let pathfindingService: PathfindingService;
  let mockDbService: jest.Mocked<DatabaseService>;

  beforeEach(() => {
    // 2. Mock DatabaseService
    mockDbService = {
      getNodeById: jest.fn(async (id: number) => mockNodes[id] || null),
      getEdgesFromNode: jest.fn(async (id: number) => mockEdges.filter(e => e.from_node_id === id)),
      getAccessibleEdgesFromNode: jest.fn(async (id: number) => mockEdges.filter(e => e.from_node_id === id)),
      connect: jest.fn().mockResolvedValue(undefined),
    } as any; 

    // 3. Instantiate the service with the mock
    pathfindingService = new PathfindingService(mockDbService);
  });

  it('should find a simple path from A to C', async () => {
    const startNodeId = 1;
    const endNodeId = 3;

    const result = await pathfindingService.findPath(startNodeId, endNodeId, false);

    // 4. Assertions
    expect(result).not.toBeNull();
    // The reconstructPath method adds the start node's cost, so total distance will be 20
    expect(result?.total_distance).toBeCloseTo(20);
    expect(result?.path).toHaveLength(3); // A, B, C

    // Check the path steps
    expect(result?.path[0].node.id).toBe(1); // Start A
    expect(result?.path[1].node.id).toBe(2); // Middle B
    expect(result?.path[2].node.id).toBe(3); // End C

    // Check that the correct database methods were called
    expect(mockDbService.getNodeById).toHaveBeenCalledWith(1);
    expect(mockDbService.getNodeById).toHaveBeenCalledWith(3);
    expect(mockDbService.getEdgesFromNode).toHaveBeenCalledWith(1);
    expect(mockDbService.getEdgesFromNode).toHaveBeenCalledWith(2);
  });

}); 