// Zustand Store Exports
export { 
  useUiStore, 
  useLoadingState, 
  useErrorState, 
  useMobileUIState 
} from './useUiStore';

export { 
  useMapStore, 
  useViewportState, 
  useFloorState, 
  useInteractionState, 
  useRouteVisualizationState 
} from './useMapStore';

export { 
  useNavigationStore, 
  useLocationState, 
  useRouteState, 
  useNavigationProgressState, 
  useQRScanState, 
  useEmergencyState 
} from './useNavigationStore';

// Store initialization utility (if needed for persistence)
export const initializeStores = async () => {
  // This can be used to initialize stores with persisted data
  // or perform any setup needed when the app starts
  const { default: logger } = await import('../utils/logger');
  logger.info('Zustand stores initialized');
};

// Store reset utility for development/testing
export const resetAllStores = async () => {
  // Dynamic imports to avoid circular dependency issues
  const { useUiStore } = await import('./useUiStore');
  const { useMapStore } = await import('./useMapStore');
  const { useNavigationStore } = await import('./useNavigationStore');
  const { default: logger } = await import('../utils/logger');
  
  // Reset all stores to initial state
  useUiStore.getState().resetUiState();
  useMapStore.getState().resetMapState();
  useNavigationStore.getState().resetNavigation();
  logger.info('All stores reset to initial state');
}; 