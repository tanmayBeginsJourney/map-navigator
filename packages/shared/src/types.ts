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

export const API_ENDPOINTS = {
  HEALTH: '/health',
  BUILDINGS: '/buildings',
  LOCATIONS: '/locations',
  ROUTES: '/routes',
} as const; 