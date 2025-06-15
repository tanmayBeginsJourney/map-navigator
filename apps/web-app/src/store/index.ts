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
  
  try {
    // Reset all stores to initial state with defensive checks
    const uiState = useUiStore.getState();
    const mapState = useMapStore.getState();
    const navigationState = useNavigationStore.getState();
    
    if (typeof uiState.resetUiState === 'function') {
      uiState.resetUiState();
    } else {
      logger.error('resetUiState method not found on UI store');
    }
    
    if (typeof mapState.resetMapState === 'function') {
      mapState.resetMapState();
    } else {
      logger.error('resetMapState method not found on Map store');
    }
    
    if (typeof navigationState.resetNavigation === 'function') {
      navigationState.resetNavigation();
    } else {
      logger.error('resetNavigation method not found on Navigation store');
    }
    
    logger.info('All stores reset to initial state');
  } catch (error) {
    logger.error({ error }, 'Failed to reset stores');
    throw error;
  }
}; 