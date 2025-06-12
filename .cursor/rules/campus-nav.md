---
description: Campus Navigation App development guidelines and patterns
globs: src/**/*.{ts,tsx,js,jsx}, backend/**/*.{ts,js}, *.{ts,tsx,js,jsx}
alwaysApply: true
---

# Campus Navigation Development Rules

## **Project Architecture**

### **Frontend Structure**
- Use **React 18 + TypeScript** with functional components and hooks
- Organize by feature modules: `/components/map/`, `/components/navigation/`, `/components/qr/`
- Keep shared utilities in `/lib/` and types in `/types/`
- Use **Zustand** for state management, avoid Redux complexity

```typescript
// ✅ DO: Feature-based component organization
src/
├── components/
│   ├── map/
│   │   ├── MapCanvas.tsx
│   │   ├── FloorSelector.tsx
│   │   └── PathOverlay.tsx
│   ├── navigation/
│   │   ├── RouteInstructions.tsx
│   │   └── NextStepButton.tsx
│   └── qr/
│       ├── QRScanner.tsx
│       └── ManualLocationInput.tsx
├── lib/
│   ├── pathfinding.ts
│   └── api-client.ts
└── types/
    ├── navigation.ts
    └── map.ts

// ❌ DON'T: Generic component names or flat structure
src/components/Button.tsx  // Too generic
src/Scanner.tsx           // Missing context
```

### **Backend Structure**
- Use **Node.js + Express + TypeScript** with clear separation of concerns
- Organize routes, controllers, services, and data access layers
- Keep database schema migrations in `/migrations/`

```typescript
// ✅ DO: Layered architecture
backend/
├── src/
│   ├── routes/
│   │   ├── route-calculation.ts
│   │   └── node-search.ts
│   ├── controllers/
│   │   ├── NavigationController.ts
│   │   └── SearchController.ts
│   ├── services/
│   │   ├── PathfindingService.ts
│   │   └── GraphService.ts
│   ├── models/
│   │   ├── Node.ts
│   │   └── Edge.ts
│   └── database/
│       ├── connection.ts
│       └── queries.ts
└── migrations/
    ├── 001_create_nodes.sql
    └── 002_create_edges.sql
```

## **Data Modeling Patterns**

### **Node and Edge Types**
```typescript
// ✅ DO: Strong typing for graph data
interface NavigationNode {
  id: string;           // Format: "b1-1101" or "b1-corridor-a"
  label: string;        // Human-readable: "Room 1101"
  building: string;     // Building code: "B1"
  floor: number;        // 0-N, -1 for outdoor
  coordinates: Point;   // Local coordinate system
  nodeType: 'room' | 'corridor' | 'lift' | 'exit' | 'poi';
  metadata?: NodeMetadata;
}

interface NavigationEdge {
  fromNode: string;
  toNode: string;
  distance: number;     // meters
  weight: number;       // pathfinding weight
  edgeType: 'corridor' | 'lift' | 'outdoor';
  accessibility?: AccessibilityInfo;
}

// ❌ DON'T: Loose typing or unclear naming
interface Point {        // Too generic
  x: any;               // Should be number
  y: any;
}
```

### **Route Response Format**
```typescript
// ✅ DO: Structured route segments
interface RouteResponse {
  segments: RouteSegment[];
  totalDistance: number;
  estimatedTime: number;
  accessibility: AccessibilityLevel;
}

interface RouteSegment {
  floor: number | 'campus';
  building?: string;
  polyline: Point[];
  instruction: string;
  segmentType: 'indoor' | 'vertical' | 'outdoor';
  estimatedTime: number;
}

// ❌ DON'T: Flat or ambiguous structure
interface Route {
  path: any[];         // Unclear what this contains
  directions: string;  // Should be structured instructions
}
```

## **Mobile-First Development**

### **Responsive Design Patterns**
```typescript
// ✅ DO: Mobile-first responsive breakpoints
const breakpoints = {
  mobile: '320px',      // iPhone SE minimum
  tablet: '768px',      // iPad mini
  desktop: '1024px',    // Desktop minimum
} as const;

// Use CSS-in-JS or Tailwind with mobile-first approach
const MapContainer = styled.div`
  height: 100vh;
  width: 100vw;
  
  @media (min-width: ${breakpoints.tablet}) {
    height: 70vh;
    width: 80vw;
  }
`;

// ❌ DON'T: Desktop-first or fixed dimensions
const MapContainer = styled.div`
  height: 800px;       // Fixed height breaks mobile
  width: 1200px;       // Fixed width breaks responsive
`;
```

### **Touch Interaction Patterns**
```typescript
// ✅ DO: Mobile-optimized touch targets
const NextStepButton = styled.button`
  min-height: 44px;     // iOS touch target minimum
  min-width: 44px;
  padding: 12px 20px;
  position: sticky;
  bottom: 20px;         // Within thumb reach
  border-radius: 12px;
  font-size: 16px;      // Prevent zoom on iOS
`;

// ❌ DON'T: Small touch targets or desktop-only interactions
const TinyButton = styled.button`
  height: 24px;         // Too small for touch
  width: 24px;
`;
```

## **QR Code Integration**

### **Camera Access Patterns**
```typescript
// ✅ DO: Robust error handling for camera access
const useQRScanner = () => {
  const [hasPermission, setHasPermission] = useState<boolean | null>(null);
  const [error, setError] = useState<string | null>(null);

  const requestCameraPermission = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: 'environment' } // Rear camera preferred
      });
      setHasPermission(true);
      return stream;
    } catch (err) {
      setHasPermission(false);
      setError('Camera access denied');
      // Provide fallback to manual input
      return null;
    }
  };

  return { hasPermission, error, requestCameraPermission };
};

// ❌ DON'T: Assume camera access works
const scanner = navigator.mediaDevices.getUserMedia({ video: true });
// No error handling or fallback
```

### **QR Code Processing**
```typescript
// ✅ DO: Validate QR content before processing
const processQRCode = (content: string): NavigationNode | null => {
  // Expected format: "nav:b1-1101" or just "b1-1101"
  const nodeIdPattern = /^(nav:)?([a-z0-9]+-[a-z0-9]+(-[a-z0-9]+)?)$/i;
  const match = content.match(nodeIdPattern);
  
  if (!match) {
    showError('Invalid QR code format');
    return null;
  }
  
  const nodeId = match[2];
  return findNodeById(nodeId);
};

// ❌ DON'T: Process QR content without validation
const processQRCode = (content: string) => {
  // Directly use content without validation
  return findNodeById(content);
};
```

## **Map Interaction Patterns**

### **Mapbox GL JS Integration**
```typescript
// ✅ DO: Proper map lifecycle management
const useMapInstance = (container: RefObject<HTMLDivElement>) => {
  const [map, setMap] = useState<mapboxgl.Map | null>(null);

  useEffect(() => {
    if (!container.current || map) return;

    const mapInstance = new mapboxgl.Map({
      container: container.current,
      style: 'mapbox://styles/mapbox/light-v11',
      center: [0, 0],
      zoom: 18,
      maxZoom: 22,        // Indoor detail level
      minZoom: 16,        // Campus overview level
    });

    mapInstance.on('load', () => {
      setMap(mapInstance);
    });

    return () => {
      mapInstance.remove();
      setMap(null);
    };
  }, [container, map]);

  return map;
};

// ❌ DON'T: Create map without cleanup or limits
const map = new mapboxgl.Map({
  container: 'map',
  // No zoom limits or cleanup
});
```

### **Path Rendering**
```typescript
// ✅ DO: Clear visual hierarchy for paths
const addRouteToMap = (map: mapboxgl.Map, route: RouteSegment[]) => {
  const currentSegment = route[currentSegmentIndex];
  
  // Current path segment - prominent blue
  map.addLayer({
    id: 'current-path',
    type: 'line',
    source: 'route',
    layout: { 'line-join': 'round', 'line-cap': 'round' },
    paint: {
      'line-color': '#2979FF',    // Brand blue
      'line-width': 6,
      'line-opacity': 1
    }
  });

  // Future segments - lighter blue
  map.addLayer({
    id: 'future-path',
    type: 'line',
    source: 'future-route',
    paint: {
      'line-color': '#2979FF',
      'line-width': 4,
      'line-opacity': 0.4
    }
  });
};

// ❌ DON'T: Unclear visual distinction
map.addLayer({
  id: 'path',
  paint: {
    'line-color': '#000',       // Poor contrast
    'line-width': 2             // Too thin for mobile
  }
});
```

## **State Management Patterns**

### **Zustand Store Structure**
```typescript
// ✅ DO: Feature-based store slices
interface NavigationStore {
  // Current navigation state
  currentLocation: NavigationNode | null;
  destination: NavigationNode | null;
  route: RouteResponse | null;
  currentSegmentIndex: number;
  
  // UI state
  isScanning: boolean;
  isCalculatingRoute: boolean;
  
  // Actions
  setCurrentLocation: (node: NavigationNode) => void;
  setDestination: (node: NavigationNode) => void;
  calculateRoute: () => Promise<void>;
  advanceToNextSegment: () => void;
  reset: () => void;
}

const useNavigationStore = create<NavigationStore>((set, get) => ({
  // State initialization
  currentLocation: null,
  destination: null,
  route: null,
  currentSegmentIndex: 0,
  isScanning: false,
  isCalculatingRoute: false,
  
  // Actions with async handling
  calculateRoute: async () => {
    const { currentLocation, destination } = get();
    if (!currentLocation || !destination) return;
    
    set({ isCalculatingRoute: true });
    try {
      const route = await apiClient.calculateRoute(currentLocation.id, destination.id);
      set({ route, currentSegmentIndex: 0 });
    } catch (error) {
      // Handle error appropriately
    } finally {
      set({ isCalculatingRoute: false });
    }
  }
}));

// ❌ DON'T: Monolithic or poorly structured state
const useStore = create((set) => ({
  data: {},              // Too generic
  loading: false,        // Unclear what's loading
  updateStuff: () => {}  // Unclear action
}));
```

## **Error Handling Patterns**

### **API Error Handling**
```typescript
// ✅ DO: Structured error handling with user-friendly messages
class NavigationApiError extends Error {
  constructor(
    message: string,
    public code: string,
    public userMessage: string
  ) {
    super(message);
    this.name = 'NavigationApiError';
  }
}

const handleApiError = (error: unknown): string => {
  if (error instanceof NavigationApiError) {
    return error.userMessage;
  }
  
  if (error instanceof Error) {
    // Map technical errors to user-friendly messages
    switch (error.message) {
      case 'ROUTE_NOT_FOUND':
        return 'No route found between these locations. Please check if both are accessible.';
      case 'INVALID_NODE_ID':
        return 'Location not recognized. Please scan a different QR code or select manually.';
      default:
        return 'Something went wrong. Please try again.';
    }
  }
  
  return 'An unexpected error occurred.';
};

// ❌ DON'T: Generic error handling
catch (error) {
  console.log(error);     // Not helpful for users
  alert('Error');         // No context
}
```

## **Performance Optimization**

### **Code Splitting**
```typescript
// ✅ DO: Lazy load non-critical components
const QRScanner = lazy(() => import('./components/qr/QRScanner'));
const MapCanvas = lazy(() => import('./components/map/MapCanvas'));

// Wrap with Suspense and meaningful fallbacks
<Suspense fallback={<MapSkeleton />}>
  <MapCanvas />
</Suspense>

// ❌ DON'T: Import everything upfront
import QRScanner from './components/qr/QRScanner';
import MapCanvas from './components/map/MapCanvas';
// All components loaded regardless of usage
```

### **Data Fetching Optimization**
```typescript
// ✅ DO: Cache and batch API calls
const useRouteCalculation = () => {
  const [cache, setCache] = useState<Map<string, RouteResponse>>(new Map());
  
  const calculateRoute = useCallback(async (from: string, to: string) => {
    const cacheKey = `${from}-${to}`;
    
    if (cache.has(cacheKey)) {
      return cache.get(cacheKey)!;
    }
    
    const route = await apiClient.calculateRoute(from, to);
    setCache(prev => new Map(prev).set(cacheKey, route));
    
    return route;
  }, [cache]);
  
  return { calculateRoute };
};

// ❌ DON'T: Unnecessary API calls
const calculateRoute = async (from: string, to: string) => {
  // Always fetch, no caching
  return await apiClient.calculateRoute(from, to);
};
```

## **Testing Patterns**

### **Component Testing**
```typescript
// ✅ DO: Test user interactions and edge cases
describe('QRScanner', () => {
  it('shows manual input fallback when camera access is denied', async () => {
    // Mock camera permission denial
    Object.defineProperty(navigator, 'mediaDevices', {
      value: {
        getUserMedia: jest.fn().mockRejectedValue(new Error('Permission denied'))
      }
    });
    
    render(<QRScanner onLocationDetected={mockCallback} />);
    
    await waitFor(() => {
      expect(screen.getByText('Enter location manually')).toBeInTheDocument();
    });
  });
  
  it('processes valid QR codes correctly', async () => {
    const mockCallback = jest.fn();
    render(<QRScanner onLocationDetected={mockCallback} />);
    
    // Simulate QR code detection
    const validQRContent = 'nav:b1-1101';
    fireEvent(screen.getByTestId('qr-result'), new CustomEvent('qr-detected', {
      detail: { content: validQRContent }
    }));
    
    expect(mockCallback).toHaveBeenCalledWith(expect.objectContaining({
      id: 'b1-1101'
    }));
  });
});

// ❌ DON'T: Only test happy path
describe('QRScanner', () => {
  it('renders', () => {
    render(<QRScanner />);
    // No meaningful assertions
  });
});
```

## **Accessibility Guidelines**

### **WCAG Compliance**
```typescript
// ✅ DO: Ensure keyboard navigation and screen reader support
const NextStepButton: React.FC<Props> = ({ onNext, instruction, disabled }) => {
  return (
    <button
      onClick={onNext}
      disabled={disabled}
      aria-label={`Next step: ${instruction}`}
      aria-describedby="route-instruction"
      className="next-step-button"
    >
      <span id="route-instruction" className="sr-only">
        {instruction}
      </span>
      Next Step
      <ArrowRightIcon aria-hidden="true" />
    </button>
  );
};

// ❌ DON'T: Inaccessible interactive elements
<div onClick={onNext}>        // Not keyboard accessible
  Next                        // No screen reader context
</div>
```

Follow these patterns consistently to maintain code quality and user experience standards throughout the campus navigation application. 