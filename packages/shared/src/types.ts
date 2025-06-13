// Shared types for Campus Navigation System

export interface ApiResponse<T = unknown> {
  success: boolean;
  data?: T;
  error?: string;
  timestamp: string;
}

export interface HealthStatus {
  status: 'OK' | 'ERROR';
  message: string;
  service: string;
  timestamp: string;
}

export interface Location {
  id: string;
  name: string;
  description?: string;
  latitude: number;
  longitude: number;
}

export interface BuildingInfo {
  id: string;
  name: string;
  address: string;
  floors: number;
  locations: Location[];
}

// Pathfinding-related types
export interface Point {
  x: number;
  y: number;
}

export interface Node {
  id: number;
  name?: string;
  type: NodeType;
  floor_plan_id?: number;
  building_id?: number;
  coordinates_x_px?: number;
  coordinates_y_px?: number;
  geom: Point;
  is_accessible: boolean;
  qr_code_payload?: string;
  attributes?: Record<string, any>;
}

export interface Edge {
  id: number;
  from_node_id: number;
  to_node_id: number;
  weight?: number;
  type: EdgeType;
  instructions?: string;
  attributes?: Record<string, any>;
}

export enum NodeType {
  ENTRANCE = 'entrance',
  EXIT = 'exit',
  STAIRCASE = 'staircase',
  ELEVATOR = 'elevator',
  ROOM = 'room',
  BATHROOM = 'bathroom',
  FOOD_COURT = 'food_court',
  EMERGENCY_EXIT = 'emergency_exit',
  CHECKPOINT = 'checkpoint',
  JUNCTION = 'junction'
}

export enum EdgeType {
  WALKWAY = 'walkway',
  STAIRS = 'stairs',
  ELEVATOR = 'elevator',
  DOOR = 'door',
  OUTDOOR_PATH = 'outdoor_path'
}

export interface PathRequest {
  start_node_id: number;
  end_node_id: number;
  accessibility_required?: boolean;
}

export interface PathStep {
  node: Node;
  edge?: Edge;
  instruction?: string;
  distance?: number;
  duration_seconds?: number;
}

export interface RouteResponse {
  path: PathStep[];
  total_distance: number;
  total_duration_seconds: number;
  floors_involved: number[];
  buildings_involved: number[];
  accessibility_compatible: boolean;
}

// Task 8: Route Calculation API specific types
export interface RoutePathNode {
  nodeId: string;
  coordinates_x_px: number;
  coordinates_y_px: number;
  floor_plan_id: string;
  instructions: string;
  type: string;
}

export interface RouteSegment {
  floor_plan_id: string;
  path_on_floor: Array<{ x: number; y: number }>;
  instructions_segment: string;
}

export interface RouteCalculationResponse {
  path: RoutePathNode[];
  segments: RouteSegment[];
}

export const API_ENDPOINTS = {
  HEALTH: '/health',
  BUILDINGS: '/buildings',
  LOCATIONS: '/locations',
  ROUTES: '/routes',
  PATHFIND: '/pathfind',
  ROUTE: '/api/route', // Task 8: New route calculation endpoint
} as const; 