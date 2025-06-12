# Development Setup Guide

## Prerequisites

### Required Software

- **Node.js 20+** - JavaScript runtime
- **npm 9+** - Package manager (comes with Node.js)
- **Docker Desktop** - For local database
- **Git** - Version control
- **VS Code** (recommended) - Code editor with extensions

### VS Code Extensions (Recommended)

- **TypeScript and JavaScript Language Features** (built-in)
- **ES7+ React/Redux/React-Native snippets**
- **Auto Rename Tag**
- **Prettier - Code formatter**
- **ESLint**
- **Tailwind CSS IntelliSense** (if using Tailwind)

### Accounts Required

- **GitHub Account** - For version control and deployment
- **TaskMaster AI** - For project management (automatically configured)

## Project Structure

```
map_navigation/
├── frontend/                 # React TypeScript SPA
│   ├── src/
│   │   ├── components/       # React components
│   │   ├── lib/             # Utilities and API client
│   │   ├── types/           # TypeScript type definitions
│   │   └── assets/          # Static assets
│   ├── public/              # Public assets
│   ├── package.json
│   └── vite.config.ts
├── backend/                 # Node.js Express API
│   ├── src/
│   │   ├── routes/          # API routes
│   │   ├── controllers/     # Request handlers
│   │   ├── services/        # Business logic
│   │   ├── models/          # Data models
│   │   └── database/        # Database connection & queries
│   ├── migrations/          # SQL migration files
│   └── package.json
├── assets/                  # Floor plans and map data
│   └── svg/                 # Building floor plan SVGs
├── docker-compose.yml       # Local database setup
└── README.md
```

## Local Development Setup

### 1. Clone Repository

```bash
git clone https://github.com/tanmayBeginsJourney/map-navigator.git
cd map-navigator
```

### 2. Database Setup

```bash
# Start PostgreSQL with PostGIS extension
docker-compose up -d

# Wait for database to start (about 30 seconds)
docker-compose logs postgres

# Verify database is running
docker ps
```

### 3. Backend Setup

```bash
cd backend

# Install dependencies
npm install

# Copy environment template
cp .env.example .env

# Edit .env file with your settings
# Required variables:
# DATABASE_URL=postgresql://postgres:password@localhost:5432/campus_nav
# NODE_ENV=development
# PORT=3001
```

### 4. Frontend Setup

```bash
cd ../frontend

# Install dependencies
npm install

# Copy environment template
cp .env.example .env.local

# Edit .env.local file:
# VITE_API_BASE_URL=http://localhost:3001/api
# VITE_APP_NAME=Campus Navigation
```

### 5. Run Database Migrations

```bash
cd ../backend

# Run initial database setup
npm run migrate

# Seed with sample data (optional)
npm run seed
```

### 6. Start Development Servers

**Terminal 1 - Backend:**

```bash
cd backend
npm run dev
# Server starts on http://localhost:3001
```

**Terminal 2 - Frontend:**

```bash
cd frontend
npm run dev
# App starts on http://localhost:5173
```

### 7. Verify Setup

- **Frontend:** Open http://localhost:5173 in browser
- **Backend API:** Check http://localhost:3001/api/health
- **Database:** Should show "Connected to PostgreSQL" in backend logs

## Mobile Development Testing

### Testing on Real Devices

**Option 1: LAN Access (Recommended)**

```bash
cd frontend
npm run dev -- --host

# Note the network URL (e.g., http://192.168.1.100:5173)
# Access this URL on your mobile device
```

**Option 2: USB Debugging (Android)**

```bash
# Enable USB debugging on Android device
# Connect via USB
adb reverse tcp:5173 tcp:5173

# Access http://localhost:5173 on device
```

**Option 3: Safari Web Inspector (iOS)**

- Connect iPhone via USB
- Enable Web Inspector in Safari settings
- Open Safari on Mac > Develop menu > iPhone > localhost

### Device Testing Checklist

- [ ] Camera access works for QR scanning
- [ ] Touch interactions are responsive
- [ ] Map zooming and panning work smoothly
- [ ] Text is readable without zooming
- [ ] All buttons are easily tappable (44px minimum)

## Environment Variables Reference

### Backend (.env)

```bash
# Database
DATABASE_URL=postgresql://postgres:password@localhost:5432/campus_nav

# Server
NODE_ENV=development
PORT=3001

# External APIs (none required for MVP)
```

### Frontend (.env.local)

```bash
# API
VITE_API_BASE_URL=http://localhost:3001/api

# App Configuration
VITE_APP_NAME=Campus Navigation

# Development
VITE_NODE_ENV=development
```

## Common Development Commands

### Backend

```bash
npm run dev          # Start development server with hot reload
npm run build        # Build for production
npm run test         # Run unit tests
npm run test:watch   # Run tests in watch mode
npm run lint         # Check code style
npm run migrate      # Run database migrations
npm run migrate:down # Rollback last migration
npm run seed         # Populate with sample data
```

### Frontend

```bash
npm run dev          # Start development server
npm run build        # Build for production
npm run preview      # Preview production build locally
npm run test         # Run component tests
npm run test:ui      # Run tests with UI
npm run lint         # Check code style
npm run type-check   # Check TypeScript types
```

## Troubleshooting

### Database Issues

**Problem:** Database connection fails

```bash
# Check if PostgreSQL is running
docker ps

# Restart database
docker-compose down
docker-compose up -d

# Check logs
docker-compose logs postgres
```

**Problem:** Migration fails

```bash
# Reset database (WARNING: destroys data)
docker-compose down -v
docker-compose up -d
npm run migrate
```

### Frontend Issues

**Problem:** Vite dev server won't start

```bash
# Clear node_modules and reinstall
rm -rf node_modules package-lock.json
npm install

# Check port availability
lsof -i :5173
```

**Problem:** TypeScript errors

```bash
# Check types
npm run type-check

# Restart TypeScript server in VS Code
Cmd/Ctrl + Shift + P > "TypeScript: Restart TS Server"
```

### Mobile Testing Issues

**Problem:** Camera doesn't work on mobile

- Ensure HTTPS (use ngrok for local HTTPS tunnel)
- Check browser permissions
- Test on different browsers (Chrome, Safari)

**Problem:** Touch interactions not working

- Check touch target sizes (minimum 44px)
- Test on actual devices, not just browser dev tools
- Verify CSS touch-action properties

## Code Quality Setup

### Pre-commit Hooks

```bash
# Install husky for git hooks
npm install -g husky

# Setup pre-commit hook
npx husky add .husky/pre-commit "npm run lint && npm run type-check"
```

### VS Code Settings

Create `.vscode/settings.json`:

```json
{
  "editor.formatOnSave": true,
  "editor.defaultFormatter": "esbenp.prettier-vscode",
  "typescript.preferences.importModuleSpecifier": "relative",
  "editor.codeActionsOnSave": {
    "source.fixAll.eslint": true
  }
}
```

## Performance Monitoring

### Local Performance Testing

```bash
# Frontend bundle analysis
cd frontend
npm run build
npm run preview

# Open http://localhost:4173
# Run Lighthouse audit in Chrome DevTools
```

### API Performance

```bash
# Backend load testing (install artillery first)
npm install -g artillery
artillery quick --count 10 --num 10 http://localhost:3001/api/route
```

## Deployment Preparation

### Frontend Build Verification

```bash
cd frontend
npm run build
npm run preview

# Check bundle size
du -sh dist/
```

### Backend Production Build

```bash
cd backend
npm run build
npm start

# Verify production mode
curl http://localhost:3001/api/health
```

## Getting Help

### Resources

- **React Documentation:** [react.dev](https://react.dev)
- **TypeScript Handbook:** [typescriptlang.org](https://www.typescriptlang.org/docs/)
- **Mapbox GL JS:** [docs.mapbox.com](https://docs.mapbox.com/mapbox-gl-js/)
- **Express.js:** [expressjs.com](https://expressjs.com/)
- **PostgreSQL:** [postgresql.org](https://www.postgresql.org/docs/)

### Team Communication

- **Issues:** Use GitHub Issues for bugs and feature requests
- **Discussions:** Use GitHub Discussions for questions
- **Code Review:** All changes require PR review before merge

### Development Workflow

1. Create feature branch: `git checkout -b feat/feature-name`
2. Make changes and test locally
3. Commit with conventional commit format: `feat: add QR scanner component`
4. Push and create Pull Request
5. Address review feedback
6. Merge after approval and passing CI
