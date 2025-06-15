import { create } from 'zustand';
import type { StateCreator } from 'zustand';
import logger from '../utils/logger';
// Local type definitions (from shared package)
interface Node {
  id: number;
  name?: string;
  type: string;
  floor_plan_id?: number;
  building_id?: number;
  coordinates_x_px?: number;
  coordinates_y_px?: number;
  geom: { x: number | null; y: number | null };
  is_accessible: boolean;
  qr_code_payload?: string;
  attributes?: Record<string, unknown>;
}

interface RouteSegment {
  floor_plan_id: string;
  path_on_floor: Array<{ x: number; y: number }>;
  instructions_segment: string;
}

interface PathRequest {
  start_node_id: number;
  end_node_id: number;
  accessibility_required?: boolean;
}

interface PathStep {
  node: Node;
  edge?: unknown;
  instruction?: string;
  distance?: number;
  duration_seconds?: number;
}

interface RouteResponse {
  path: PathStep[];
  total_distance: number;
  total_duration_seconds: number;
  floors_involved: number[];
  buildings_involved: number[];
  accessibility_compatible: boolean;
}

// Navigation State Interface
interface NavigationState {
  // Current navigation context
  currentLocationNodeId: number | null;
  destinationNodeId: number | null;
  
  // Route calculation state
  routeRequest: PathRequest | null;
  routeResponse: RouteResponse | null;
  routeSegments: RouteSegment[];
  currentSegmentIndex: number;
  
  // Location tracking
  userLocation: {
    coordinates: { x: number; y: number } | null;
    nodeId: number | null;
    buildingId: number | null;
    floorPlanId: number | null;
    accuracy: number;
    timestamp: number;
  } | null;
  
  // Navigation progress
  navigationProgress: {
    isNavigating: boolean;
    startTime: number | null;
    estimatedArrival: number | null;
    distanceRemaining: number;
    nextInstruction: string | null;
  };
  
  // Route preferences
  routePreferences: {
    accessibilityRequired: boolean;
    avoidStairs: boolean;
    preferElevators: boolean;
    shortestPath: boolean;
  };
  
  // QR Code scanning context
  qrScanContext: {
    isScanning: boolean;
    lastScannedNodeId: number | null;
    scanTimestamp: number | null;
    scanResult: string | null;
  };
  
  // History and favorites
  navigationHistory: Array<{
    from: number;
    to: number;
    timestamp: number;
    duration: number;
  }>;
  favoriteDestinations: Array<{
    nodeId: number;
    name: string;
    category: string;
    addedAt: number;
  }>;
  
  // Emergency and safety
  emergencyMode: {
    isActive: boolean;
    nearestExits: Node[];
    evacuationRoute: PathStep[] | null;
  };
}

// Navigation Actions Interface
interface NavigationActions {
  // Location actions
  setCurrentLocationNodeId: (nodeId: number | null) => void;
  setDestinationNodeId: (nodeId: number | null) => void;
  updateUserLocation: (location: NavigationState['userLocation']) => void;
  
  // Route calculation actions
  setRouteRequest: (request: PathRequest | null) => void;
  setRouteResponse: (response: RouteResponse | null) => void;
  setRouteSegments: (segments: RouteSegment[]) => void;
  setCurrentSegmentIndex: (index: number) => void;
  nextSegment: () => void;
  previousSegment: () => void;
  
  // Navigation control actions
  startNavigation: () => void;
  stopNavigation: () => void;
  pauseNavigation: () => void;
  resumeNavigation: () => void;
  updateNavigationProgress: (progress: Partial<NavigationState['navigationProgress']>) => void;
  
  // Route preference actions
  setRoutePreferences: (preferences: Partial<NavigationState['routePreferences']>) => void;
  toggleAccessibilityRequired: () => void;
  toggleAvoidStairs: () => void;
  togglePreferElevators: () => void;
  
  // QR Code actions
  startQRScanning: () => void;
  stopQRScanning: () => void;
  setQRScanResult: (result: string, nodeId: number) => void;
  clearQRScanResult: () => void;
  
  // History and favorites actions
  addToHistory: (from: number, to: number, duration: number) => void;
  addToFavorites: (nodeId: number, name: string, category: string) => void;
  removeFromFavorites: (nodeId: number) => void;
  clearHistory: () => void;
  
  // Emergency actions
  activateEmergencyMode: () => void;
  deactivateEmergencyMode: () => void;
  setNearestExits: (exits: Node[]) => void;
  setEvacuationRoute: (route: PathStep[] | null) => void;
  
  // Utility actions
  clearRoute: () => void;
  resetNavigation: () => void;
  swapStartDestination: () => void;
}

// Combined NavigationStore type
type NavigationStore = NavigationState & NavigationActions;

// Initial state
const initialState: NavigationState = {
  currentLocationNodeId: null,
  destinationNodeId: null,
  routeRequest: null,
  routeResponse: null,
  routeSegments: [],
  currentSegmentIndex: 0,
  userLocation: null,
  navigationProgress: {
    isNavigating: false,
    startTime: null,
    estimatedArrival: null,
    distanceRemaining: 0,
    nextInstruction: null,
  },
  routePreferences: {
    accessibilityRequired: false,
    avoidStairs: false,
    preferElevators: false,
    shortestPath: true,
  },
  qrScanContext: {
    isScanning: false,
    lastScannedNodeId: null,
    scanTimestamp: null,
    scanResult: null,
  },
  navigationHistory: [],
  favoriteDestinations: [],
  emergencyMode: {
    isActive: false,
    nearestExits: [],
    evacuationRoute: null,
  },
};

// Create store creator function
const createNavigationStore: StateCreator<NavigationStore> = (set, get) => ({
  ...initialState,
  
  // Location actions
  setCurrentLocationNodeId: (currentLocationNodeId: number | null) => {
    logger.info({ currentLocationNodeId }, 'Current location node changed');
    set({ currentLocationNodeId });
  },
  setDestinationNodeId: (destinationNodeId: number | null) => {
    logger.info({ destinationNodeId }, 'Destination node changed');
    set({ destinationNodeId });
  },
  updateUserLocation: (userLocation: NavigationState['userLocation']) => {
    logger.debug({ 
      nodeId: userLocation?.nodeId,
      buildingId: userLocation?.buildingId,
      floorPlanId: userLocation?.floorPlanId,
      accuracy: userLocation?.accuracy 
    }, 'User location updated');
    set({ userLocation });
  },
  
  // Route calculation actions
  setRouteRequest: (routeRequest: PathRequest | null) => {
    if (routeRequest) {
      logger.info({ 
        startNodeId: routeRequest.start_node_id,
        endNodeId: routeRequest.end_node_id,
        accessibilityRequired: routeRequest.accessibility_required 
      }, 'Route calculation requested');
    } else {
      logger.debug('Route request cleared');
    }
    set({ routeRequest });
  },
  setRouteResponse: (routeResponse: RouteResponse | null) => {
    if (routeResponse) {
      logger.info({ 
        totalDistance: routeResponse.total_distance,
        totalDuration: routeResponse.total_duration_seconds,
        floorsInvolved: routeResponse.floors_involved.length,
        buildingsInvolved: routeResponse.buildings_involved.length,
        accessibilityCompatible: routeResponse.accessibility_compatible
      }, 'Route calculation completed');
    } else {
      logger.debug('Route response cleared');
    }
    set({ routeResponse });
  },
  setRouteSegments: (routeSegments: RouteSegment[]) => {
    logger.debug({ segmentCount: routeSegments.length }, 'Route segments updated');
    set({ routeSegments });
  },
  setCurrentSegmentIndex: (currentSegmentIndex: number) => {
    logger.debug({ currentSegmentIndex }, 'Current route segment changed');
    set({ currentSegmentIndex });
  },
  nextSegment: () => {
    const state = get();
    if (state.currentSegmentIndex < state.routeSegments.length - 1) {
      set({ currentSegmentIndex: state.currentSegmentIndex + 1 });
    }
  },
  previousSegment: () => {
    const state = get();
    if (state.currentSegmentIndex > 0) {
      set({ currentSegmentIndex: state.currentSegmentIndex - 1 });
    }
  },
  
  // Navigation control actions
  startNavigation: () => {
    const now = Date.now();
    logger.info('Navigation started');
    set((state: NavigationState) => ({
      navigationProgress: {
        ...state.navigationProgress,
        isNavigating: true,
        startTime: now,
      }
    }));
  },
  stopNavigation: () => {
    logger.info('Navigation stopped');
    set((state: NavigationState) => ({
      navigationProgress: {
        ...state.navigationProgress,
        isNavigating: false,
        startTime: null,
        estimatedArrival: null,
      }
    }));
  },
  pauseNavigation: () => {
    set((state: NavigationState) => ({
      navigationProgress: {
        ...state.navigationProgress,
        isNavigating: false,
      }
    }));
  },
  resumeNavigation: () => {
    set((state: NavigationState) => ({
      navigationProgress: {
        ...state.navigationProgress,
        isNavigating: true,
      }
    }));
  },
  updateNavigationProgress: (progress: Partial<NavigationState['navigationProgress']>) => {
    set((state: NavigationState) => ({
      navigationProgress: { ...state.navigationProgress, ...progress }
    }));
  },
  
  // Route preference actions
  setRoutePreferences: (newPreferences: Partial<NavigationState['routePreferences']>) => {
    set((state: NavigationState) => ({
      routePreferences: { ...state.routePreferences, ...newPreferences }
    }));
  },
  toggleAccessibilityRequired: () => {
    set((state: NavigationState) => ({
      routePreferences: {
        ...state.routePreferences,
        accessibilityRequired: !state.routePreferences.accessibilityRequired
      }
    }));
  },
  toggleAvoidStairs: () => {
    set((state: NavigationState) => ({
      routePreferences: {
        ...state.routePreferences,
        avoidStairs: !state.routePreferences.avoidStairs
      }
    }));
  },
  togglePreferElevators: () => {
    set((state: NavigationState) => ({
      routePreferences: {
        ...state.routePreferences,
        preferElevators: !state.routePreferences.preferElevators
      }
    }));
  },
  
  // QR Code actions
  startQRScanning: () => {
    logger.info('QR code scanning started');
    set((state: NavigationState) => ({
      qrScanContext: { ...state.qrScanContext, isScanning: true }
    }));
  },
  stopQRScanning: () => {
    logger.info('QR code scanning stopped');
    set((state: NavigationState) => ({
      qrScanContext: { ...state.qrScanContext, isScanning: false }
    }));
  },
  setQRScanResult: (result: string, nodeId: number) => {
    logger.info({ result, nodeId }, 'QR code scan result received');
    set((state: NavigationState) => ({
      qrScanContext: {
        ...state.qrScanContext,
        scanResult: result,
        lastScannedNodeId: nodeId,
        scanTimestamp: Date.now(),
        isScanning: false,
      }
    }));
  },
  clearQRScanResult: () => set((state: NavigationState) => ({
    qrScanContext: {
      ...state.qrScanContext,
      scanResult: null,
      lastScannedNodeId: null,
      scanTimestamp: null,
    }
  })),
  
  // History and favorites actions
  addToHistory: (from: number, to: number, duration: number) => {
    set((state: NavigationState) => ({
      navigationHistory: [
        ...state.navigationHistory.slice(-49), // Keep last 50 items
        { from, to, timestamp: Date.now(), duration }
      ]
    }));
  },
  addToFavorites: (nodeId: number, name: string, category: string) => {
    set((state: NavigationState) => ({
      favoriteDestinations: [
        ...state.favoriteDestinations.filter(fav => fav.nodeId !== nodeId),
        { nodeId, name, category, addedAt: Date.now() }
      ]
    }));
  },
  removeFromFavorites: (nodeId: number) => {
    set((state: NavigationState) => ({
      favoriteDestinations: state.favoriteDestinations.filter(fav => fav.nodeId !== nodeId)
    }));
  },
  clearHistory: () => set({ navigationHistory: [] }),
  
  // Emergency actions
  activateEmergencyMode: () => {
    logger.warn('Emergency mode activated');
    set((state: NavigationState) => ({
      emergencyMode: { ...state.emergencyMode, isActive: true }
    }));
  },
  deactivateEmergencyMode: () => {
    logger.info('Emergency mode deactivated');
    set({
      emergencyMode: {
        isActive: false,
        nearestExits: [],
        evacuationRoute: null,
      }
    });
  },
  setNearestExits: (nearestExits: Node[]) => set((state: NavigationState) => ({
    emergencyMode: { ...state.emergencyMode, nearestExits }
  })),
  setEvacuationRoute: (evacuationRoute: PathStep[] | null) => set((state: NavigationState) => ({
    emergencyMode: { ...state.emergencyMode, evacuationRoute }
  })),
  
  // Utility actions
  clearRoute: () => set({
    routeRequest: null,
    routeResponse: null,
    routeSegments: [],
    currentSegmentIndex: 0,
    navigationProgress: {
      isNavigating: false,
      startTime: null,
      estimatedArrival: null,
      distanceRemaining: 0,
      nextInstruction: null,
    },
  }),
  resetNavigation: () => set(initialState),
  swapStartDestination: () => {
    const state = get();
    set({
      currentLocationNodeId: state.destinationNodeId,
      destinationNodeId: state.currentLocationNodeId,
    });
  },
});

// Create NavigationStore with Zustand
export const useNavigationStore = create<NavigationStore>(createNavigationStore);

// Selectors for common navigation state combinations
export const useLocationState = () => useNavigationStore((state: NavigationState) => ({
  currentLocationNodeId: state.currentLocationNodeId,
  destinationNodeId: state.destinationNodeId,
  userLocation: state.userLocation,
}));

export const useRouteState = () => useNavigationStore((state: NavigationState) => ({
  routeRequest: state.routeRequest,
  routeResponse: state.routeResponse,
  routeSegments: state.routeSegments,
  currentSegmentIndex: state.currentSegmentIndex,
}));

export const useNavigationProgressState = () => useNavigationStore((state: NavigationState) => ({
  navigationProgress: state.navigationProgress,
  routePreferences: state.routePreferences,
}));

export const useQRScanState = () => useNavigationStore((state: NavigationState) => ({
  qrScanContext: state.qrScanContext,
}));

export const useEmergencyState = () => useNavigationStore((state: NavigationState) => ({
  emergencyMode: state.emergencyMode,
})); 