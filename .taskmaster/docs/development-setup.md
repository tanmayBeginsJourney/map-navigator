# Development Setup Guide

This guide covers setting up the Campus Navigation System development environment.

## 🎯 Current Project Status: 7/39 Tasks Complete (17.9%)

### ✅ **FOUNDATION COMPLETE:**
- ✅ **Task 1:** Project Setup & Monorepo Configuration
- ✅ **Task 2:** Dockerized Development Environment (PostgreSQL + PostGIS)
- ✅ **Task 3:** Environment Configuration & Secrets Management ⭐ **JUST COMPLETED**
- ✅ **Task 5:** Database Schema Design & Migrations
- ✅ **Task 6:** Sample Data & Database Seeding (39 nodes, 50 edges)
- ✅ **Task 7:** A* Pathfinding Algorithm Implementation
- ✅ **Task 8:** Route Calculation API Endpoint

### 🎯 **NEXT PRIORITY:**
- **Task 9:** Frontend - Initialize React SPA with Vite (all dependencies satisfied)

---

## 🚀 Quick Start (Development Environment Ready!)

The development environment is **fully configured and operational**. Follow these steps to get started:

### 1. **Clone and Install**
```powershell
# Clone the repository
git clone <repository-url>; `
cd map_navigation

# Install dependencies (uses pnpm workspaces)
pnpm install
```

### 2. **Start Database (Docker)**
```powershell
# Start PostgreSQL + PostGIS container
docker-compose up -d

# Verify database is running
docker-compose ps
```

### 3. **Configure Environment Variables**
```powershell
# Backend configuration
Copy-Item packages/api/.env.example packages/api/.env
# Edit packages/api/.env with your database credentials

# Frontend configuration  
Copy-Item apps/web-app/.env.example apps/web-app/.env
# Edit apps/web-app/.env with your API URL and feature flags
```

### 4. **Run Database Migrations & Seed Data**
```powershell
# Run migrations to create schema
cd packages/api; `
node scripts/run-migrations.js

# Seed with sample data (Engineering Building)
node scripts/seed.js
```

### 5. **Start Development Servers**
```powershell
# Start both API and web app in parallel
pnpm dev

# Or start individually:
# API server (port 3001): pnpm --filter api dev
# Web app (port 5173): pnpm --filter web-app dev
```

### 6. **Verify System**
```powershell
# Check API health
Invoke-RestMethod -Uri "http://localhost:3001/health"

# Test pathfinding
$body = @{
  startNodeId = "1"
  endNodeId = "10"
  accessibilityMode = $false
} | ConvertTo-Json

Invoke-RestMethod -Uri "http://localhost:3001/api/route" `
  -Method POST `
  -ContentType "application/json" `
  -Body $body
```

---

## 📋 Prerequisites

### Required Software
- **Node.js 18+** (LTS recommended)
- **pnpm 8+** (package manager)
- **Docker & Docker Compose** (for PostgreSQL)
- **PowerShell** (Windows users - enforced for consistency)

### Development Environment
- **Operating System:** Windows with PowerShell
- **Editor:** VS Code with TypeScript support recommended
- **Terminal:** PowerShell (WSL/bash commands not supported)

---

## 🏗️ Project Architecture

### **Monorepo Structure**
```
map_navigation/
├── 📦 packages/
│   ├── api/              # Backend Node.js/Express API
│   │   ├── src/          # TypeScript source code
│   │   ├── migrations/   # Database schema migrations
│   │   ├── scripts/      # Database seeding and utilities
│   │   └── sample-data/  # Engineering Building sample data
│   └── shared/           # Shared TypeScript types
├── 🌐 apps/
│   └── web-app/          # Frontend React/Vite SPA
├── 🔧 .taskmaster/       # Project management
├── 🐳 docker-compose.yml # PostgreSQL + PostGIS
└── 📋 Configuration files
```

### **Technology Stack**
- **Frontend:** React 18 + TypeScript + Vite
- **Backend:** Node.js + Express + TypeScript
- **Database:** PostgreSQL 16 + PostGIS 3.4
- **Package Manager:** pnpm (workspaces)
- **Development:** Docker Compose + PowerShell

---

## 🔧 Configuration Systems

### **Backend Configuration (`packages/api/src/config.ts`)**
- ✅ **Zod validation** with comprehensive error reporting
- ✅ **dotenv integration** for development environment
- ✅ **Production-ready** with required variable validation
- ✅ **Security-first** approach (no hardcoded secrets)

**Required Environment Variables:**
```powershell
# packages/api/.env
PORT=3001
NODE_ENV=development
DB_HOST=localhost
DB_PORT=5432
DB_NAME=campus_navigation
DB_USER=postgres
DB_PASSWORD=your_secure_password_here
CORS_ORIGINS=http://localhost:5173,http://localhost:3000
LOG_LEVEL=info
API_VERSION=v1
```

### **Frontend Configuration (`apps/web-app/src/config.ts`)**
- ✅ **Vite environment variables** (VITE_ prefix)
- ✅ **TypeScript interfaces** for type safety
- ✅ **Feature flags** for development/production modes
- ✅ **API URL helpers** for consistent endpoint access

**Required Environment Variables:**
```powershell
# apps/web-app/.env
VITE_API_URL=http://localhost:3001
VITE_NODE_ENV=development
VITE_API_VERSION=v1
VITE_ENABLE_DEBUG_MODE=true
VITE_ENABLE_OFFLINE_MODE=false
VITE_ENABLE_ANALYTICS=false
# VITE_MAPBOX_TOKEN=your_mapbox_token_here  # Not needed - using custom SVG renderer
```

---

## 🗄️ Database Setup

### **Schema Overview**
- **Buildings** → **Floor Plans** → **Nodes** → **Edges**
- **PostGIS geometry** with SRID 0 (Cartesian coordinates)
- **Spatial indexing** for performance optimization
- **Accessibility support** with alternative routing

### **Sample Data Available**
- **Engineering Building:** 4 floors, 39 nodes, 50 edges
- **Multi-floor navigation** with stairs and elevators
- **Accessibility features** for wheelchair routing
- **Comprehensive test scenarios** for pathfinding

### **Database Commands**
```powershell
# Run migrations
cd packages/api; `
node scripts/run-migrations.js

# Seed sample data
node scripts/seed.js

# Test database connection
node scripts/test-connection.js

# Clear and reseed data
node scripts/seed.js --clear
```

---

## 🔍 API Endpoints Available

### **Health Check**
```bash
GET /health
# Response: {"status":"OK","service":"campus-navigation-api"}
```

### **Pathfinding**
```bash
POST /pathfind
Content-Type: application/json
{
  "startNodeId": 1,
  "endNodeId": 10,
  "accessibilityMode": false
}
```

### **Route Calculation (Task 8)**
```bash
POST /api/route
Content-Type: application/json
{
  "startNodeId": "1",
  "endNodeId": "10", 
  "accessibilityMode": false
}
```

---

## 🧪 Testing & Verification

### **System Health Checks**
```bash
# Verify all services
pnpm run health-check

# Check TypeScript compilation
pnpm run type-check

# Run database tests
cd packages/api && node scripts/test-connection.js
```

### **Development Workflow**
1. **Start with health checks** to ensure all services operational
2. **Use TaskMaster** for task management: `npx task-master-ai next`
3. **Follow PowerShell-only development** (no Unix/WSL commands)
4. **Test pathfinding** with sample data before frontend development

---

## 🚀 Production Deployment

### **Frontend (Vercel)**
- Environment variables configured in Vercel dashboard
- Build command: `pnpm build`
- Output directory: `apps/web-app/dist`

### **Backend (Railway)**
- PostgreSQL database provided by Railway
- Environment variables configured in Railway dashboard
- Automatic deployment from GitHub

**See `.taskmaster/docs/production-deployment.md` for complete deployment guide.**

---

## 🔧 Development Tools

### **Code Quality**
- **ESLint v9** with modern configuration
- **Prettier** for consistent formatting
- **TypeScript** with strict type checking
- **Path aliases** for clean imports

### **Task Management**
- **TaskMaster AI** integration via MCP
- **Comprehensive task tracking** with 39 tasks total
- **Dependency management** and progress monitoring

### **PowerShell Integration**
- **Enforced PowerShell environment** for consistency
- **Windows command compatibility** across team
- **Proper path handling** for native Windows development

---

## 🆘 Troubleshooting

### **Common Issues**

1. **Database Connection Failed**
   ```bash
   # Check Docker container status
   docker-compose ps
   
   # Restart database
   docker-compose restart postgres_db
   ```

2. **TypeScript Errors**
   ```bash
   # Check compilation
   pnpm run type-check
   
   # Rebuild dependencies
   pnpm install
   ```

3. **Port Conflicts**
   ```bash
   # Check port usage
   lsof -i :3001  # API port
   lsof -i :5173  # Frontend port
   ```

4. **Environment Variables**
   ```bash
   # Verify .env files exist
   Get-ChildItem packages/api/.env
Get-ChildItem apps/web-app/.env
   ```

### **Getting Help**
- Check `.taskmaster/docs/` for comprehensive documentation
- Review `DOCKER_SETUP.md` for database issues
- Use `npx task-master-ai next` for task guidance

---

## 📈 Next Steps

With the foundation complete, the next development phase focuses on:

1. **Task 9:** Frontend React SPA initialization
2. **Task 10:** Basic routing and navigation setup
3. **Task 11:** Map visualization components
4. **Task 12:** User interface development

**The development environment is production-ready and fully operational!** 🎉
