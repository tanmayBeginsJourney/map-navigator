import React, { useRef, useEffect } from 'react';
import { 
  useUiStore, 
  useLoadingState, 
  useErrorState,
  useMapStore, 
  useViewportState,
  useNavigationStore, 
  useLocationState 
} from '../store';

const StoreTestComponent: React.FC = () => {
  // Ref to track timeout for cleanup
  const timeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  
  // Cleanup timeout on unmount
  useEffect(() => {
    return () => {
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
      }
    };
  }, []);
  
  // UI Store hooks
  const { isLoading, setLoading, error, setError, clearError, showToast } = useUiStore();
  const loadingState = useLoadingState();
  const errorState = useErrorState();
  
  // Map Store hooks  
  const { currentBuildingId, setBuildingId, viewport, setZoom } = useMapStore();
  const viewportState = useViewportState();
  
  // Navigation Store hooks
  const { 
    currentLocationNodeId, 
    destinationNodeId, 
    setCurrentLocationNodeId, 
    setDestinationNodeId,
    routePreferences,
    toggleAccessibilityRequired 
  } = useNavigationStore();
  const locationState = useLocationState();

  return (
    <div style={{ padding: '20px', fontFamily: 'Arial, sans-serif' }}>
      <h2>🧪 Zustand Store Test Component</h2>
      
      {/* UI Store Tests */}
      <div style={{ marginBottom: '20px', padding: '15px', border: '1px solid #ddd', borderRadius: '8px' }}>
        <h3>🎨 UI Store</h3>
        <p><strong>Loading:</strong> {isLoading ? '⏳ Loading...' : '✅ Ready'}</p>
        <p><strong>Error:</strong> {error || '✅ No errors'}</p>
        <p><strong>Any Loading:</strong> {loadingState.anyLoading ? 'Yes' : 'No'}</p>
        <p><strong>Has Error:</strong> {errorState.hasError ? 'Yes' : 'No'}</p>
        
        <div style={{ marginTop: '10px' }}>
          <button 
            onClick={() => setLoading(!isLoading)}
            style={{ marginRight: '10px', padding: '5px 10px' }}
          >
            Toggle Loading
          </button>
          <button 
            onClick={() => setError(error ? null : 'Test error message')}
            style={{ marginRight: '10px', padding: '5px 10px' }}
          >
            Toggle Error
          </button>
          <button 
            onClick={() => clearError()}
            style={{ marginRight: '10px', padding: '5px 10px' }}
          >
            Clear Error
          </button>
          <button 
            onClick={() => showToast('Test toast message!', 'success')}
            style={{ padding: '5px 10px' }}
          >
            Show Toast
          </button>
        </div>
      </div>
      
      {/* Map Store Tests */}
      <div style={{ marginBottom: '20px', padding: '15px', border: '1px solid #ddd', borderRadius: '8px' }}>
        <h3>🗺️ Map Store</h3>
        <p><strong>Building ID:</strong> {currentBuildingId || 'None selected'}</p>
        <p><strong>Zoom Level:</strong> {viewport.zoom}</p>
        <p><strong>Center:</strong> ({viewport.center.x}, {viewport.center.y})</p>
        <p><strong>Map Dimensions:</strong> {viewportState.mapDimensions ? 'Set' : 'Not set'}</p>
        
        <div style={{ marginTop: '10px' }}>
          <button 
            onClick={() => setBuildingId(currentBuildingId === 1 ? 2 : 1)}
            style={{ marginRight: '10px', padding: '5px 10px' }}
          >
            Switch Building ({currentBuildingId === 1 ? '2' : '1'})
          </button>
          <button 
            onClick={() => setZoom(viewport.zoom + 0.5)}
            style={{ marginRight: '10px', padding: '5px 10px' }}
          >
            Zoom In
          </button>
          <button 
            onClick={() => setZoom(Math.max(0.1, viewport.zoom - 0.5))}
            style={{ padding: '5px 10px' }}
          >
            Zoom Out
          </button>
        </div>
      </div>
      
      {/* Navigation Store Tests */}
      <div style={{ marginBottom: '20px', padding: '15px', border: '1px solid #ddd', borderRadius: '8px' }}>
        <h3>🧭 Navigation Store</h3>
        <p><strong>Current Location:</strong> Node {currentLocationNodeId || 'None'}</p>
        <p><strong>Destination:</strong> Node {destinationNodeId || 'None'}</p>
        <p><strong>Accessibility Required:</strong> {routePreferences.accessibilityRequired ? '✅ Yes' : '❌ No'}</p>
        <p><strong>User Location Set:</strong> {locationState.userLocation ? 'Yes' : 'No'}</p>
        
        <div style={{ marginTop: '10px' }}>
          <button 
            onClick={() => setCurrentLocationNodeId(currentLocationNodeId === 1 ? 5 : 1)}
            style={{ marginRight: '10px', padding: '5px 10px' }}
          >
            Set Location ({currentLocationNodeId === 1 ? '5' : '1'})
          </button>
          <button 
            onClick={() => setDestinationNodeId(destinationNodeId === 10 ? 15 : 10)}
            style={{ marginRight: '10px', padding: '5px 10px' }}
          >
            Set Destination ({destinationNodeId === 10 ? '15' : '10'})
          </button>
          <button 
            onClick={() => toggleAccessibilityRequired()}
            style={{ padding: '5px 10px' }}
          >
            Toggle Accessibility
          </button>
        </div>
      </div>
      
      {/* Integration Test */}
      <div style={{ padding: '15px', backgroundColor: '#f0f0f0', borderRadius: '8px' }}>
        <h3>🔗 Integration Test</h3>
        <p>All stores are working independently and can communicate through shared state patterns.</p>
        <button 
          onClick={() => {
            setLoading(true);
            setBuildingId(1);
            setCurrentLocationNodeId(1);
            setDestinationNodeId(10);
            
            // Clear any existing timeout
            if (timeoutRef.current) {
              clearTimeout(timeoutRef.current);
            }
            
            // Set new timeout with ref tracking
            timeoutRef.current = setTimeout(() => {
              setLoading(false);
              showToast('Navigation setup complete!', 'success');
              timeoutRef.current = null;
            }, 1000);
          }}
          style={{ 
            padding: '10px 20px', 
            backgroundColor: '#007bff', 
            color: 'white', 
            border: 'none', 
            borderRadius: '5px',
            cursor: 'pointer'
          }}
        >
          🚀 Test Integration (Set Building 1, Nodes 1→10)
        </button>
      </div>
    </div>
  );
};

export default StoreTestComponent; 