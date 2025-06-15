import { create } from 'zustand';
import type { StateCreator } from 'zustand';
import logger from '../utils/logger';

// Map State Interface
interface MapState {
  // Current viewing context
  currentBuildingId: number | null;
  currentFloorPlanId: number | null;
  
  // Map viewport and display
  viewport: {
    center: { x: number; y: number };
    zoom: number;
    rotation: number;
  };
  
  // Map dimensions and SVG properties
  mapDimensions: {
    width: number;
    height: number;
    svgViewBox: string;
  } | null;
  
  // Interactive elements
  selectedNodeId: number | null;
  hoveredNodeId: number | null;
  highlightedPath: Array<{ x: number; y: number }> | null;
  
  // Mobile-specific interactions
  touchState: {
    isPanning: boolean;
    isPinching: boolean;
    lastTouchDistance: number | null;
    panStart: { x: number; y: number } | null;
  };
  
  // UI preferences
  showNodeLabels: boolean;
  showAccessibilityNodes: boolean;
  mapTheme: 'light' | 'dark' | 'auto';
  
  // Floor plans and navigation
  availableFloors: Array<{
    id: number;
    name: string;
    level: number;
    buildingId: number;
  }>;
  
  // Route visualization
  routeVisualization: {
    currentSegmentIndex: number;
    showFullRoute: boolean;
    animateProgress: boolean;
  };
}

// Map Actions Interface
interface MapActions {
  // Building and floor actions
  setBuildingId: (buildingId: number | null) => void;
  setFloorPlanId: (floorPlanId: number | null) => void;
  setAvailableFloors: (floors: MapState['availableFloors']) => void;
  
  // Viewport actions
  setViewport: (viewport: Partial<MapState['viewport']>) => void;
  setCenter: (center: { x: number; y: number }) => void;
  setZoom: (zoom: number) => void;
  setRotation: (rotation: number) => void;
  resetViewport: () => void;
  
  // Map dimensions
  setMapDimensions: (dimensions: MapState['mapDimensions']) => void;
  
  // Interactive element actions
  setSelectedNode: (nodeId: number | null) => void;
  setHoveredNode: (nodeId: number | null) => void;
  setHighlightedPath: (path: Array<{ x: number; y: number }> | null) => void;
  
  // Touch interaction actions
  startPanning: (startPoint: { x: number; y: number }) => void;
  updatePanning: (currentPoint: { x: number; y: number }) => void;
  stopPanning: () => void;
  startPinching: (distance: number) => void;
  updatePinching: (distance: number) => void;
  stopPinching: () => void;
  
  // UI preference actions
  toggleNodeLabels: () => void;
  toggleAccessibilityNodes: () => void;
  setMapTheme: (theme: MapState['mapTheme']) => void;
  
  // Route visualization actions
  setCurrentSegmentIndex: (index: number) => void;
  setShowFullRoute: (show: boolean) => void;
  setAnimateProgress: (animate: boolean) => void;
  
  // Utility actions
  fitToContent: () => void;
  centerOnNode: (nodeId: number, coordinates: { x: number; y: number }) => void;
  resetMapState: () => void;
}

// Combined MapStore type
type MapStore = MapState & MapActions;

// Initial state
const initialState: MapState = {
  currentBuildingId: null,
  currentFloorPlanId: null,
  viewport: {
    center: { x: 0, y: 0 },
    zoom: 1,
    rotation: 0,
  },
  mapDimensions: null,
  selectedNodeId: null,
  hoveredNodeId: null,
  highlightedPath: null,
  touchState: {
    isPanning: false,
    isPinching: false,
    lastTouchDistance: null,
    panStart: null,
  },
  showNodeLabels: true,
  showAccessibilityNodes: true,
  mapTheme: 'auto',
  availableFloors: [],
  routeVisualization: {
    currentSegmentIndex: 0,
    showFullRoute: true,
    animateProgress: false,
  },
};

// Create store creator function
const createMapStore: StateCreator<MapStore> = (set, get) => ({
  ...initialState,
  
  // Building and floor actions
  setBuildingId: (currentBuildingId: number | null) => {
    logger.info({ currentBuildingId }, 'Map building changed');
    set({ currentBuildingId });
  },
  setFloorPlanId: (currentFloorPlanId: number | null) => {
    logger.info({ currentFloorPlanId }, 'Map floor plan changed');
    set({ currentFloorPlanId });
  },
  setAvailableFloors: (availableFloors: MapState['availableFloors']) => {
    logger.debug({ floorCount: availableFloors.length }, 'Available floors updated');
    set({ availableFloors });
  },
  
  // Viewport actions
  setViewport: (newViewport: Partial<MapState['viewport']>) => set((state: MapState) => ({
    viewport: { ...state.viewport, ...newViewport }
  })),
  setCenter: (center: { x: number; y: number }) => set((state: MapState) => ({
    viewport: { ...state.viewport, center }
  })),
  setZoom: (zoom: number) => {
    // Clamp zoom between reasonable bounds for mobile
    const clampedZoom = Math.max(0.1, Math.min(5, zoom));
    logger.debug({ originalZoom: zoom, clampedZoom }, 'Map zoom level changed');
    set((state: MapState) => ({
      viewport: { ...state.viewport, zoom: clampedZoom }
    }));
  },
  setRotation: (rotation: number) => set((state: MapState) => ({
    viewport: { ...state.viewport, rotation }
  })),
  resetViewport: () => set({
    viewport: {
      center: { x: 0, y: 0 },
      zoom: 1,
      rotation: 0,
    }
  }),
  
  // Map dimensions
  setMapDimensions: (mapDimensions: MapState['mapDimensions']) => set({ mapDimensions }),
  
  // Interactive element actions
  setSelectedNode: (selectedNodeId: number | null) => {
    logger.debug({ selectedNodeId }, 'Map node selection changed');
    set({ selectedNodeId });
  },
  setHoveredNode: (hoveredNodeId: number | null) => {
    logger.trace({ hoveredNodeId }, 'Map node hover changed');
    set({ hoveredNodeId });
  },
  setHighlightedPath: (highlightedPath: Array<{ x: number; y: number }> | null) => {
    logger.debug({ pathLength: highlightedPath?.length || 0 }, 'Map highlighted path changed');
    set({ highlightedPath });
  },
  
  // Touch interaction actions
  startPanning: (panStart: { x: number; y: number }) => set((state: MapState) => ({
    touchState: { ...state.touchState, isPanning: true, panStart }
  })),
  updatePanning: (currentPoint: { x: number; y: number }) => {
    const state = get();
    if (state.touchState.isPanning && state.touchState.panStart) {
      const deltaX = currentPoint.x - state.touchState.panStart.x;
      const deltaY = currentPoint.y - state.touchState.panStart.y;
      const newCenter = {
        x: state.viewport.center.x - deltaX / state.viewport.zoom,
        y: state.viewport.center.y - deltaY / state.viewport.zoom,
      };
      set((state: MapState) => ({
        viewport: { ...state.viewport, center: newCenter },
        touchState: { ...state.touchState, panStart: currentPoint }
      }));
    }
  },
  stopPanning: () => set((state: MapState) => ({
    touchState: { ...state.touchState, isPanning: false, panStart: null }
  })),
  startPinching: (lastTouchDistance: number) => set((state: MapState) => ({
    touchState: { ...state.touchState, isPinching: true, lastTouchDistance }
  })),
  updatePinching: (distance: number) => {
    const state = get();
    if (state.touchState.isPinching && state.touchState.lastTouchDistance) {
      const scaleFactor = distance / state.touchState.lastTouchDistance;
      const newZoom = state.viewport.zoom * scaleFactor;
      get().setZoom(newZoom);
      set((state: MapState) => ({
        touchState: { ...state.touchState, lastTouchDistance: distance }
      }));
    }
  },
  stopPinching: () => set((state: MapState) => ({
    touchState: { ...state.touchState, isPinching: false, lastTouchDistance: null }
  })),
  
  // UI preference actions
  toggleNodeLabels: () => set((state: MapState) => ({ showNodeLabels: !state.showNodeLabels })),
  toggleAccessibilityNodes: () => set((state: MapState) => ({ showAccessibilityNodes: !state.showAccessibilityNodes })),
  setMapTheme: (mapTheme: MapState['mapTheme']) => set({ mapTheme }),
  
  // Route visualization actions
  setCurrentSegmentIndex: (currentSegmentIndex: number) => set((state: MapState) => ({
    routeVisualization: { ...state.routeVisualization, currentSegmentIndex }
  })),
  setShowFullRoute: (showFullRoute: boolean) => set((state: MapState) => ({
    routeVisualization: { ...state.routeVisualization, showFullRoute }
  })),
  setAnimateProgress: (animateProgress: boolean) => set((state: MapState) => ({
    routeVisualization: { ...state.routeVisualization, animateProgress }
  })),
  
  // Utility actions
  fitToContent: () => {
    // This would calculate appropriate viewport to fit all content
    // Implementation depends on map content dimensions
    set({
      viewport: {
        center: { x: 0, y: 0 },
        zoom: 1,
        rotation: 0,
      }
    });
  },
  centerOnNode: (nodeId: number, coordinates: { x: number; y: number }) => {
    set({
      selectedNodeId: nodeId,
      viewport: {
        ...get().viewport,
        center: coordinates,
      }
    });
  },
  resetMapState: () => set(initialState),
});

// Create MapStore with Zustand
export const useMapStore = create<MapStore>(createMapStore);

// Selectors for common map state combinations
export const useViewportState = () => useMapStore((state: MapState) => ({
  viewport: state.viewport,
  mapDimensions: state.mapDimensions,
}));

export const useFloorState = () => useMapStore((state: MapState) => ({
  currentBuildingId: state.currentBuildingId,
  currentFloorPlanId: state.currentFloorPlanId,
  availableFloors: state.availableFloors,
}));

export const useInteractionState = () => useMapStore((state: MapState) => ({
  selectedNodeId: state.selectedNodeId,
  hoveredNodeId: state.hoveredNodeId,
  highlightedPath: state.highlightedPath,
  touchState: state.touchState,
}));

export const useRouteVisualizationState = () => useMapStore((state: MapState) => ({
  routeVisualization: state.routeVisualization,
  highlightedPath: state.highlightedPath,
})); 