import { create } from 'zustand';
import type { StateCreator } from 'zustand';
import logger from '../utils/logger';

// UI State Interface
interface UiState {
  // Loading states
  isLoading: boolean;
  isNavigationLoading: boolean;
  isRouteCalculating: boolean;
  
  // Error states
  error: string | null;
  navigationError: string | null;
  
  // UI states for mobile navigation
  isSidebarOpen: boolean;
  isMapFullscreen: boolean;
  showQRScanner: boolean;
  
  // Toast/notification state
  toast: {
    message: string;
    type: 'success' | 'error' | 'warning' | 'info';
    duration?: number;
  } | null;
  
  // Internal state for toast timeout management
  toastTimeoutId: ReturnType<typeof setTimeout> | null;
}

// UI Actions Interface
interface UiActions {
  // Loading actions
  setLoading: (isLoading: boolean) => void;
  setNavigationLoading: (isLoading: boolean) => void;
  setRouteCalculating: (isLoading: boolean) => void;
  
  // Error actions
  setError: (error: string | null) => void;
  setNavigationError: (error: string | null) => void;
  clearError: () => void;
  clearNavigationError: () => void;
  clearAllErrors: () => void;
  
  // UI toggle actions
  toggleSidebar: () => void;
  setSidebarOpen: (open: boolean) => void;
  toggleMapFullscreen: () => void;
  setMapFullscreen: (fullscreen: boolean) => void;
  setShowQRScanner: (show: boolean) => void;
  
  // Toast actions
  showToast: (message: string, type: 'success' | 'error' | 'warning' | 'info', duration?: number) => void;
  hideToast: () => void;
  
  // Reset action
  resetUiState: () => void;
}

// Combined UiStore type
type UiStore = UiState & UiActions;

// Initial state
const initialState: UiState = {
  isLoading: false,
  isNavigationLoading: false,
  isRouteCalculating: false,
  error: null,
  navigationError: null,
  isSidebarOpen: false,
  isMapFullscreen: false,
  showQRScanner: false,
  toast: null,
  toastTimeoutId: null,
};

// Create store creator function
const createUiStore: StateCreator<UiStore> = (set, get) => ({
  ...initialState,
  
  // Loading actions
  setLoading: (isLoading: boolean) => {
    logger.debug({ isLoading }, 'UI loading state changed');
    set({ isLoading });
  },
  setNavigationLoading: (isNavigationLoading: boolean) => {
    logger.debug({ isNavigationLoading }, 'Navigation loading state changed');
    set({ isNavigationLoading });
  },
  setRouteCalculating: (isRouteCalculating: boolean) => {
    logger.debug({ isRouteCalculating }, 'Route calculation state changed');
    set({ isRouteCalculating });
  },
  
  // Error actions
  setError: (error: string | null) => {
    if (error) {
      logger.warn({ error }, 'UI error state set');
    } else {
      logger.debug('UI error state cleared');
    }
    set({ error });
  },
  setNavigationError: (navigationError: string | null) => {
    if (navigationError) {
      logger.warn({ navigationError }, 'Navigation error state set');
    } else {
      logger.debug('Navigation error state cleared');
    }
    set({ navigationError });
  },
  clearError: () => {
    logger.debug('UI error cleared');
    set({ error: null });
  },
  clearNavigationError: () => {
    logger.debug('Navigation error cleared');
    set({ navigationError: null });
  },
  clearAllErrors: () => {
    logger.debug('All UI errors cleared');
    set({ error: null, navigationError: null });
  },
  
  // UI toggle actions
  toggleSidebar: () => set((state: UiState) => ({ isSidebarOpen: !state.isSidebarOpen })),
  setSidebarOpen: (isSidebarOpen: boolean) => set({ isSidebarOpen }),
  toggleMapFullscreen: () => set((state: UiState) => ({ isMapFullscreen: !state.isMapFullscreen })),
  setMapFullscreen: (isMapFullscreen: boolean) => set({ isMapFullscreen }),
  setShowQRScanner: (showQRScanner: boolean) => set({ showQRScanner }),
  
  // Toast actions
  showToast: (message: string, type: 'success' | 'error' | 'warning' | 'info', duration = 3000) => {
    logger.info({ message, type, duration }, 'Toast notification shown');
    
    // Clear any existing timeout to prevent race conditions
    const currentState = get();
    if (currentState.toastTimeoutId) {
      clearTimeout(currentState.toastTimeoutId);
    }
    
    // Set new toast
    let timeoutId: ReturnType<typeof setTimeout> | null = null;
    
    // Auto-hide toast after duration
    if (duration > 0) {
      timeoutId = setTimeout(() => {
        const state = get();
        if (state.toast?.message === message) {
          logger.debug({ message }, 'Toast auto-hidden after duration');
          state.hideToast();
        }
      }, duration);
    }
    
    set({ toast: { message, type, duration }, toastTimeoutId: timeoutId });
  },
  hideToast: () => {
    logger.debug('Toast notification hidden');
    const currentState = get();
    if (currentState.toastTimeoutId) {
      clearTimeout(currentState.toastTimeoutId);
    }
    set({ toast: null, toastTimeoutId: null });
  },
  
  // Reset action
  resetUiState: () => {
    logger.info('UI store reset to initial state');
    // Clear any existing timeout before reset
    const currentState = get();
    if (currentState.toastTimeoutId) {
      clearTimeout(currentState.toastTimeoutId);
    }
    // Use structuredClone for deep copy to avoid shared references
    set(structuredClone(initialState));
  },
});

// Create UiStore with Zustand
export const useUiStore = create<UiStore>(createUiStore);

// Selectors for common UI state combinations
export const useLoadingState = () => useUiStore((state: UiState) => ({
  isLoading: state.isLoading,
  isNavigationLoading: state.isNavigationLoading,
  isRouteCalculating: state.isRouteCalculating,
  anyLoading: state.isLoading || state.isNavigationLoading || state.isRouteCalculating,
}));

export const useErrorState = () => useUiStore((state: UiState) => ({
  error: state.error,
  navigationError: state.navigationError,
  hasError: Boolean(state.error || state.navigationError),
}));

export const useMobileUIState = () => useUiStore((state: UiState) => ({
  isSidebarOpen: state.isSidebarOpen,
  isMapFullscreen: state.isMapFullscreen,
  showQRScanner: state.showQRScanner,
})); 