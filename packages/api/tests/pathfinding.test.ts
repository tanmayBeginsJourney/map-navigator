import { describe, beforeEach, afterEach, it, expect, jest } from '@jest/globals';
import { PathfindingService } from '../src/pathfinding';
import { DatabaseService as _DatabaseService } from '../src/db/connection';
import { Node, Edge, EdgeType, NodeType } from '@campus-nav/shared/types';

// Mock the DatabaseService
jest.mock('../src/db/connection', () => {
  // Mock the factory function createDatabaseService
  const mockCreateDatabaseService = () => {
    // Return an object with mock methods
    return {
      connect: jest.fn().mockResolvedValue(undefined),
      getNodeById: jest.fn(),
      getEdgesFromNode: jest.fn(),
      getAccessibleEdgesFromNode: jest.fn(),
    };
  };
  
  // Return the module export, including the mocked factory
  return {
    createDatabaseService: mockCreateDatabaseService,
    // Keep other exports if necessary, but we only mock the service here
  };
});


// Sample Test Data
const mockNodes: Record<number, Node> = {
  1: { id: 1, name: 'Entrance', geom: { x: 0, y: 0 }, is_accessible: true, floor_plan_id: 1, building_id: 1, type: NodeType.ENTRANCE },
  2: { id: 2, name: 'Hallway A', geom: { x: 10, y: 0 }, is_accessible: true, floor_plan_id: 1, building_id: 1, type: NodeType.JUNCTION },
  3: { id: 3, name: 'Room 101', geom: { x: 20, y: 0 }, is_accessible: true, floor_plan_id: 1, building_id: 1, type: NodeType.ROOM },
  4: { id: 4, name: 'Stairs', geom: { x: 10, y: 10 }, is_accessible: false, floor_plan_id: 1, building_id: 1, type: NodeType.STAIRCASE },
  5: { id: 5, name: 'Elevator', geom: { x: 10, y: -10 }, is_accessible: true, floor_plan_id: 1, building_id: 1, type: NodeType.ELEVATOR },
  6: { id: 6, name: 'Upper Hallway', geom: { x: 10, y: 10 }, is_accessible: true, floor_plan_id: 2, building_id: 1, type: NodeType.JUNCTION },
};

const mockEdges: Record<number, Edge[]> = {
  1: [{ id: 1, from_node_id: 1, to_node_id: 2, weight: 10, type: EdgeType.WALKWAY }],
  2: [
    { id: 2, from_node_id: 2, to_node_id: 1, weight: 10, type: EdgeType.WALKWAY },
    { id: 3, from_node_id: 2, to_node_id: 3, weight: 10, type: EdgeType.WALKWAY },
    { id: 4, from_node_id: 2, to_node_id: 4, weight: 5, type: EdgeType.STAIRS },
    { id: 5, from_node_id: 2, to_node_id: 5, weight: 8, type: EdgeType.ELEVATOR },
  ],
  4: [{ id: 6, from_node_id: 4, to_node_id: 6, weight: 5, type: EdgeType.STAIRS }],
  5: [{ id: 7, from_node_id: 5, to_node_id: 6, weight: 8, type: EdgeType.ELEVATOR }],
  6: [{ id: 8, from_node_id: 6, to_node_id: 4, weight: 5, type: EdgeType.STAIRS }, { id: 9, from_node_id: 6, to_node_id: 5, weight: 8, type: EdgeType.ELEVATOR }]
};

const mockAccessibleEdges: Record<number, Edge[]> = {
    1: mockEdges[1],
    2: mockEdges[2].filter(e => e.type !== EdgeType.STAIRS), // Exclude stairs
    5: mockEdges[5],
    6: mockEdges[6].filter(e => e.type !== EdgeType.STAIRS)
};


describe('PathfindingService', () => {
  let pathfindingService: PathfindingService;
  let mockDbService: any;

  beforeEach(() => {
    // Create a new mock for each test to ensure isolation
    const { createDatabaseService } = require('../src/db/connection');
    mockDbService = createDatabaseService();
    pathfindingService = new PathfindingService(mockDbService);

    // Setup mock implementations
    mockDbService.getNodeById.mockImplementation((id: number) => Promise.resolve(mockNodes[id]));
    mockDbService.getEdgesFromNode.mockImplementation((id: number) => Promise.resolve(mockEdges[id] || []));
    mockDbService.getAccessibleEdgesFromNode.mockImplementation((id: number) => Promise.resolve(mockAccessibleEdges[id] || []));
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  it('should find a simple direct path', async () => {
    const route = await pathfindingService.findPath(1, 3);
    expect(route).not.toBeNull();
    expect(route?.path.map(p => p.node.id)).toEqual([1, 2, 3]);
    expect(mockDbService.getEdgesFromNode).toHaveBeenCalled();
    expect(mockDbService.getAccessibleEdgesFromNode).not.toHaveBeenCalled();
  });

  it('should return null if no path exists', async () => {
    // Attempt to path from node 3 to 6, which is impossible without more edges
    const route = await pathfindingService.findPath(3, 6);
    expect(route).toBeNull();
  });
  
  it('should return null if start or end node does not exist', async () => {
    mockDbService.getNodeById.mockImplementation((id: number) => {
        if (id === 99) return Promise.resolve(undefined);
        return Promise.resolve(mockNodes[id]);
    });
    
    const route = await pathfindingService.findPath(1, 99);
    expect(route).toBeNull();
  });

  it('should find a path using an elevator when accessibility is required', async () => {
    const route = await pathfindingService.findPath(1, 6, true);
    
    expect(route).not.toBeNull();
    expect(route?.path.map(p => p.node.id)).toEqual([1, 2, 5, 6]);
    expect(route?.path.some(p => p.edge?.type === EdgeType.ELEVATOR)).toBe(true);
    expect(route?.path.some(p => p.edge?.type === EdgeType.STAIRS)).toBe(false);

    // Verify correct DB method was called
    expect(mockDbService.getAccessibleEdgesFromNode).toHaveBeenCalled();
    expect(mockDbService.getEdgesFromNode).not.toHaveBeenCalled();
  });
  
  it('should find a path using stairs when accessibility is NOT required', async () => {
    const route = await pathfindingService.findPath(1, 6, false);
    
    expect(route).not.toBeNull();
    expect(route?.path.map(p => p.node.id)).toEqual([1, 2, 4, 6]);
    expect(route?.path.some(p => p.edge?.type === EdgeType.STAIRS)).toBe(true);
    expect(route?.path.some(p => p.edge?.type === EdgeType.ELEVATOR)).toBe(false);
  });

}); 