# Docker Development Environment Setup

## Prerequisites

### 1. Install Docker Desktop
**⚠️ Required**: Docker Desktop must be installed before proceeding.

1. **Download**: Visit [https://www.docker.com/products/docker-desktop/](https://www.docker.com/products/docker-desktop/)
2. **Install**: Download and run the Windows installer
3. **Restart**: Restart your computer after installation
4. **Launch**: Start Docker Desktop from the Start menu
5. **Verify**: Wait for Docker to start (whale icon in system tray)

### 2. Verify Installation
```bash
docker --version
docker-compose --version
```
Both commands should return version numbers without errors.

### 3. Additional Requirements
- Docker Desktop running and accessible
- WSL2 enabled (Windows Subsystem for Linux) - usually handled by Docker Desktop installer

## Quick Start

1. **Create environment variables** (create `.env` file in project root):
```bash
# Copy this template and replace with your actual values
# Database Configuration
POSTGRES_USER=admin
POSTGRES_PASSWORD=secret
POSTGRES_DB=campus_navigation
POSTGRES_HOST=localhost
POSTGRES_PORT=5432

# Development Database URL (for applications)
DATABASE_URL=postgresql://admin:secret@localhost:5432/campus_navigation
```

**⚠️ Security Note**: Never commit the actual `.env` file to version control. The `.env` file is already in `.gitignore` to prevent accidental commits.

2. **Start the database**:
```bash
docker-compose up -d postgres_db
```

3. **Verify the database is running**:
```bash
docker-compose ps
```

4. **Check database logs** (if needed):
```bash
docker-compose logs postgres_db
```

## Database Connection
- **Host**: localhost
- **Port**: 5432 (or value set in POSTGRES_PORT)
- **Database**: campus_navigation (or value set in POSTGRES_DB)
- **Username**: admin (or value set in POSTGRES_USER)
- **Password**: secret (or value set in POSTGRES_PASSWORD)

## PostGIS Verification
Connect to the database and run:
```sql
SELECT PostGIS_Version();
```

This should return the PostGIS version, confirming the spatial extension is available.

## Data Persistence
Database data is stored in Docker volume `pg_data_volume` and persists across container restarts.

## Stopping Services
```bash
docker-compose down
```

## Removing Data (Reset Database)
```bash
docker-compose down -v
```
**Warning**: This will delete all database data permanently.

## Troubleshooting

### Docker Command Not Found
- Ensure Docker Desktop is installed and running
- Restart your terminal/PowerShell after Docker installation
- Verify Docker Desktop is running (whale icon in system tray)

### Container Won't Start
- Check Docker Desktop is running
- Verify port 5432 isn't already in use: `netstat -an | findstr 5432`
- Check logs: `docker-compose logs postgres_db`

### Connection Refused
- Ensure container is running: `docker-compose ps`
- Verify environment variables in `.env` file
- Check if host firewall is blocking port 5432 