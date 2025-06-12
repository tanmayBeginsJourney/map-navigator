# Technical Specifications

## System Architecture Details

### Frontend Stack

```
React 18 + TypeScript
├── Vite (build tool, dev server)
├── Custom SVG Map Renderer (no external map dependencies)
├── Zustand (state management)
├── jsQR (QR code scanning)
└── React Testing Library (testing)
```

### Backend Stack

```
Node.js 20 + Express 5 + TypeScript
├── pg (PostgreSQL driver)
├── PostGIS (spatial extensions)
├── Supertest (API testing)
└── Vitest (unit testing)
```

### Database Schema

#### Nodes Table (Simplified - No PostGIS)

```sql
CREATE TABLE nodes (
    id TEXT PRIMARY KEY,           -- e.g., 'b1-1101'
    label TEXT NOT NULL,           -- e.g., 'Room 1101'
    building TEXT NOT NULL,        -- Building code
    floor INTEGER NOT NULL,        -- 0-N; -1 for outdoor campus
    x FLOAT NOT NULL,              -- pixels in SVG coordinate system
    y FLOAT NOT NULL,              -- pixels in SVG coordinate system
    node_type TEXT CHECK (node_type IN ('room', 'corridor', 'lift', 'exit', 'poi')),
    created_at TIMESTAMP DEFAULT NOW()
);
```

#### Edges Table

```sql
CREATE TABLE edges (
    from_node TEXT REFERENCES nodes(id),
    to_node TEXT REFERENCES nodes(id),
    distance_m FLOAT NOT NULL,
    weight FLOAT NOT NULL DEFAULT 1.0,
    edge_type TEXT CHECK (edge_type IN ('corridor', 'lift', 'outdoor')),
    created_at TIMESTAMP DEFAULT NOW(),
    PRIMARY KEY (from_node, to_node)
);
```

### API Specification

#### Route Calculation

```http
POST /api/route
Content-Type: application/json

{
  "source": "b1-1101",
  "target": "b2-2201",
  "constraints": {
    "liftsOnly": true
  }
}
```

**Response:**

```json
{
  "segments": [
    {
      "floor": 1,
      "building": "B1",
      "polyline": [[24.6, 13.2], [25.1, 13.2], [25.1, 15.8]],
      "instruction": "Leave room 1101 and turn left"
    },
    {
      "floor": 0,
      "building": "B1",
      "polyline": [[25.1, 15.8], [30.2, 15.8], [30.2, 20.1]],
      "instruction": "Take lift A to Ground"
    },
    {
      "floor": "campus",
      "polyline": [[building1_exit], [path_point_1], [building2_entrance]],
      "instruction": "Exit Building 1 via south door, walk to Building 2"
    }
  ],
  "distance_m": 415,
  "eta_min": 6
}
```

#### Node Search

```http
GET /api/search?q=mess+hall&building=all&floor=all
```

**Response:**

```json
{
  "results": [
    {
      "id": "b3-ground-mess",
      "label": "Main Mess Hall",
      "building": "B3",
      "floor": 0,
      "relevance": 0.95
    }
  ]
}
```

## Performance Requirements

### Response Time Targets

- Route calculation: ≤ 150ms (95th percentile)
- Initial page load: ≤ 2s (median, mobile 3G)
- Map tile loading: ≤ 500ms per tile
- QR scan to location detection: ≤ 1s

### Mobile Performance

- First Contentful Paint: ≤ 2.5s
- Time to Interactive: ≤ 4s
- Cumulative Layout Shift: ≤ 0.1
- Bundle size: ≤ 500KB gzipped

### Browser Support Matrix

| Browser          | Version | Notes                   |
| ---------------- | ------- | ----------------------- |
| Chrome Mobile    | 100+    | Primary target          |
| Safari iOS       | 15+     | Required for camera API |
| Firefox Mobile   | 100+    | Secondary support       |
| Samsung Internet | 18+     | Common on Android       |

## Development Environment

### Local Setup

```bash
# Database
docker-compose up -d postgres

# Backend
cd backend
npm install
npm run dev  # Port 3001

# Frontend
cd frontend
npm install
npm run dev  # Port 5173
```

### Environment Variables

```bash
# .env.example
DATABASE_URL=postgresql://user:pass@localhost:5432/campus_nav
NODE_ENV=development
PORT=3001

# Frontend (.env.local)
VITE_API_BASE_URL=http://localhost:3001/api
VITE_APP_NAME=Campus Navigation
```

### Testing Strategy

#### Unit Tests (Vitest)

- Pathfinding algorithm correctness
- Data validation and transformation
- Utility functions
- Target: ≥90% coverage on core logic

#### Component Tests (React Testing Library)

- Map rendering without errors
- QR scanner component
- Route display and interactions
- Navigation flow components

#### Integration Tests (Supertest)

- API endpoint responses
- Database queries
- Error handling
- Authentication flows

#### E2E Tests (Cypress)

- Complete user journeys
- Cross-browser compatibility
- Mobile viewport testing
- QR scanning workflows

## Asset Pipeline

### SVG Floor Plans

```bash
# Convert PDF floor plans to SVG
scripts/pdf2svg.sh input.pdf output.svg

# Extract room coordinates and generate graph
node scripts/extract-coordinates.mjs building1-floor1.svg
```

### Map Data Processing

```bash
# Build navigation graph from SVG assets
npm run build:graph

# Validate graph connectivity
npm run validate:graph

# Export for frontend consumption
npm run export:json
```

## Deployment Architecture

### Development

```
Developer → GitHub → GitHub Actions → Preview Deploy (Vercel)
```

### Production

```
main branch → GitHub Actions → Build & Test → Production Deploy
                ↓
            Database Migration → Health Check → Go Live
```

### Infrastructure (Free Tier)

- **Frontend:** Vercel (free tier - unlimited bandwidth)
- **Backend:** Railway/Render (free tier - sufficient for moderate traffic)
- **Database:** Supabase (free tier - 500MB storage, 2GB bandwidth/month)
- **Assets:** GitHub Pages (floor plan SVGs and static assets)
- **Monitoring:** LogRocket free tier or basic error logging

## Security Considerations

### Data Privacy

- No PII collection or storage
- QR codes contain only opaque node IDs
- Optional anonymous usage analytics
- GDPR compliance for EU users

### API Security

- Rate limiting (100 requests/minute per IP)
- Input validation and sanitization
- SQL injection prevention (parameterized queries)
- CORS configuration for frontend domain

### Frontend Security

- CSP headers to prevent XSS
- Secure camera API usage
- No sensitive data in localStorage
- Subresource integrity for CDN assets

## Monitoring and Analytics

### Application Metrics

- Route calculation response times
- Navigation success rates
- QR scan success/failure rates
- User session duration

### Infrastructure Metrics

- API uptime and availability
- Database query performance
- CDN cache hit rates
- Error rates by endpoint

### User Analytics (Anonymous)

- Popular routes and destinations
- Floor/building usage patterns
- Device and browser distribution
- Navigation abandonment points
