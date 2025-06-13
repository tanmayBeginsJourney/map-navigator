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
```powershell
docker --version
docker-compose --version
```
Both commands should return version numbers without errors.

### 3. Additional Requirements
- Docker Desktop running and accessible
- Windows containers support enabled

## Quick Start

1. **Create environment variables** (copy from template):
```powershell
# Copy the template file and customize as needed
Copy-Item .env.example .env
```

**⚠️ Security Note**: Never commit the actual `.env` file to version control. The `.env` file is already in `.gitignore` to prevent accidental commits. Use the provided `.env.example` as your template.

2. **Start the database**:
```powershell
docker-compose up -d postgres_db
```

3. **Verify the database is running**:
```powershell
docker-compose ps
```

4. **Check database logs** (if needed):
```powershell
docker-compose logs postgres_db
```

## Environment Configuration

The project includes a `.env.example` file with template environment variables. This file contains:

- **Database Configuration**: PostgreSQL connection settings
- **Development URLs**: Pre-configured connection strings for local development

To set up your environment:
1. Copy `.env.example` to `.env`: `Copy-Item .env.example .env`
2. Modify values in `.env` if needed (default values work for local development)
3. Never commit your `.env` file to version control

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
```powershell
docker-compose down
```

## Removing Data (Reset Database)
```powershell
docker-compose down -v
```
**Warning**: This will delete all database data permanently.

## Troubleshooting

### Docker Command Not Found
- Ensure Docker Desktop is installed and running
- Restart your terminal after Docker installation
- Verify Docker Desktop is running (whale icon in system tray)
- Restart PowerShell after Docker installation

### Container Won't Start
- Check Docker Desktop is running
- Verify port 5432 isn't already in use: `Get-NetTCPConnection -LocalPort 5432`
- Check logs: `docker-compose logs postgres_db`

### Connection Refused
- Ensure container is running: `docker-compose ps`
- Verify environment variables in `.env` file
- Check if host firewall is blocking port 5432 