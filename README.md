# Campus Indoor-Outdoor Navigation System

A mobile-first web application that enables seamless navigation within campus buildings and between outdoor locations, solving the critical gap where traditional GPS navigation fails inside multi-floor buildings.

## 🎯 Project Overview

**Problem:** GPS accuracy limitations inside buildings make traditional navigation apps ineffective for indoor spaces with multiple floors.

**Solution:** QR code-based indoor navigation system with step-by-step guidance through floor transitions and building-to-building routing.

**Target Users:** First-year students, campus visitors, new faculty, and anyone unfamiliar with campus layout.

## ✨ Key Features

- **QR Code Location Detection** - Precise indoor positioning via QR anchor points
- **Multi-Floor Navigation** - Floor-by-floor guidance with lift-based routing
- **Outdoor Campus Routing** - Seamless indoor-outdoor transitions
- **Mobile-First Interface** - Optimized for one-hand operation while walking
- **Step-by-Step Guidance** - Clear instructions with user confirmation system

## 🛠 Tech Stack

- **Frontend:** React 18 + TypeScript, Vite, Custom SVG Renderer, Zustand
- **Backend:** Node.js + Express + TypeScript, PostgreSQL + PostGIS
- **Development:** Docker, ESLint, Prettier, Vitest, Cypress
- **Project Management:** TaskMaster AI for task breakdown and tracking

## 📚 Documentation

| Document | Description |
|----------|-------------|
| [📋 Product Requirements](/.taskmaster/docs/prd.txt) | Complete PRD with technical specifications |
| [📖 User Stories](/.taskmaster/docs/user-stories.md) | Comprehensive user stories and acceptance criteria |
| [🔧 Development Setup](/.taskmaster/docs/development-setup.md) | Local development environment guide |
| [📏 Coding Guidelines](/.cursor/rules/campus-nav.md) | Project-specific development patterns |
| [🏗️ Technical Specifications](/.taskmaster/docs/technical-specs.md) | Detailed technical architecture and API specs |

## 🚀 Quick Start

### Prerequisites
- Node.js 20+
- Docker Desktop
- TaskMaster AI (for project management)

### Setup
```bash
# Clone repository
git clone https://github.com/tanmayBeginsJourney/map-navigator.git
cd map-navigator

# Initialize TaskMaster (if not already done)
npx task-master-ai init

# Start database
docker-compose up -d

# Setup backend
cd backend
npm install
cp .env.example .env
# Edit .env with your database URL
npm run migrate

# Setup frontend
cd ../frontend
npm install
cp .env.example .env.local
# Edit .env.local with your configuration

# Start development servers
npm run dev  # Frontend: http://localhost:5173
cd ../backend && npm run dev  # Backend: http://localhost:3001
```

## 📱 Mobile Testing

Test on real devices for the best experience:

```bash
# Option 1: LAN access
cd frontend
npm run dev -- --host
# Use the network URL on your mobile device

# Option 2: USB debugging (Android)
adb reverse tcp:5173 tcp:5173
# Access localhost:5173 on device
```

## 🎯 Development Progress

### Current Status: **Foundation Phase**
- [x] Project setup and TaskMaster integration
- [x] 39 tasks with 205+ subtasks generated
- [x] Complete end-to-end PRD coverage verified
- [ ] Ready to begin Task 1: Project Initialization

### Task Management
```bash
# View current tasks
npx task-master-ai list

# Get next task to work on
npx task-master-ai next

# Mark task as complete
npx task-master-ai set-status --id=<task-id> --status=done
```

## 🔧 Development

### Key Commands
```bash
# Frontend
npm run dev          # Development server
npm run build        # Production build
npm run test         # Component tests
npm run lint         # Code style check

# Backend
npm run dev          # Development server with hot reload
npm run migrate      # Run database migrations
npm run test         # Unit tests
npm run build        # Production build

# TaskMaster
npx task-master-ai list              # View all tasks
npx task-master-ai next              # Get next task
npx task-master-ai show <id>         # View specific task
npx task-master-ai set-status --id=<id> --status=done  # Mark complete
```

### Code Quality
- **ESLint + Prettier** for consistent formatting
- **TypeScript** for type safety
- **Husky** pre-commit hooks
- **Conventional Commits** for clear history

## 🎨 Design Principles

- **Mobile-First:** Optimized for phone usage while walking
- **Accessible:** WCAG AA compliance, high contrast colors
- **Performance:** <2s load time, <150ms route calculation
- **Offline-Ready:** Cached routes and maps (Phase 3)

## 🤝 Contributing

1. Fork the repository
2. Create feature branch: `git checkout -b feat/amazing-feature`
3. Follow [coding guidelines](/.cursor/rules/campus-nav.md)
4. Commit changes: `git commit -m 'feat: add amazing feature'`
5. Push to branch: `git push origin feat/amazing-feature`
6. Open Pull Request

## 📄 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## 🎓 Academic Context

This is a college project developed by a computer science student to solve real campus navigation challenges. The project emphasizes:

- **Learning-Focused:** Practical application of web development concepts
- **Systematic Development:** TaskMaster AI for structured task management
- **Problem-Solving:** Real-world spatial navigation challenges
- **Modern Tech Stack:** Industry-standard tools and patterns

## 📞 Support

- **Issues:** [GitHub Issues](https://github.com/tanmayBeginsJourney/map-navigator/issues)
- **Discussions:** [GitHub Discussions](https://github.com/tanmayBeginsJourney/map-navigator/discussions)
- **Documentation:** See the `/.taskmaster/docs/` folder for detailed guides

---

**Vision:** "Never get lost again on campus. Scan, choose destination, and follow guided navigation that works both indoors and outdoors." 