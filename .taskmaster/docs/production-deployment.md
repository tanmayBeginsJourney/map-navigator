# Production Deployment Guide

This guide covers deploying the Campus Navigation System to production using Vercel (frontend) and Railway (backend).

## 🚀 Frontend Deployment (Vercel)

### Prerequisites
- Vercel account
- GitHub repository connected to Vercel

### Environment Variables Required

Set these in your Vercel dashboard under Project Settings > Environment Variables:

```bash
# Required Variables
VITE_API_URL=https://your-api-domain.railway.app
VITE_NODE_ENV=production

# Optional Variables
VITE_API_VERSION=v1
VITE_ENABLE_DEBUG_MODE=false
VITE_ENABLE_OFFLINE_MODE=true
VITE_ENABLE_ANALYTICS=true
# VITE_MAPBOX_TOKEN=your_production_mapbox_token  # Not needed - using custom SVG renderer
```

### Deployment Steps

1. **Connect Repository**
   ```bash
   # Push your code to GitHub
   git push origin main
   ```

2. **Configure Vercel**
   - Import project from GitHub
   - Set build command: `pnpm build`
   - Set output directory: `apps/web-app/dist`
   - Set install command: `pnpm install`

3. **Set Environment Variables**
   - Go to Project Settings > Environment Variables
   - Add all required VITE_ prefixed variables
   - Ensure VITE_API_URL points to your Railway backend

4. **Deploy**
   - Vercel will automatically deploy on push to main
   - Monitor build logs for any issues

## 🚂 Backend Deployment (Railway)

### Prerequisites
- Railway account
- PostgreSQL database (Railway provides this)

### Environment Variables Required

Set these in your Railway dashboard under Variables tab:

```bash
# Server Configuration
PORT=3001
NODE_ENV=production

# Database Configuration (Railway provides DATABASE_URL)
DB_HOST=your-railway-postgres-host
DB_PORT=5432
DB_NAME=your-database-name
DB_USER=your-database-user
DB_PASSWORD=your-secure-database-password

# Alternative: Use Railway's DATABASE_URL
# DATABASE_URL=postgresql://user:password@host:port/database

# CORS Configuration
CORS_ORIGINS=https://your-vercel-domain.vercel.app,https://your-custom-domain.com

# Logging
LOG_LEVEL=info

# API Configuration
API_VERSION=v1
```

### Deployment Steps

1. **Create Railway Project**
   ```bash
   # Install Railway CLI
   npm install -g @railway/cli
   
   # Login to Railway
   railway login
   
   # Initialize project
   railway init
   ```

2. **Add PostgreSQL Database**
   - In Railway dashboard, click "New" > "Database" > "PostgreSQL"
   - Note the connection details provided

3. **Configure Environment Variables**
   - Go to your service > Variables tab
   - Add all required environment variables
   - Use Railway's provided database credentials

4. **Deploy**
   ```bash
   # Deploy from local
   railway up
   
   # Or connect GitHub repository for automatic deployments
   ```

5. **Database Setup**
   ```bash
   # Run migrations if you have them
   railway run npm run migrate
   
   # Seed database if needed
   railway run npm run seed
   ```

## 🐳 Docker Deployment (Alternative)

### Using Docker Compose

1. **Create Production Environment File**
   ```bash
   # Copy example and configure
   cp .env.example .env
   # Edit .env with production values
   ```

2. **Build and Deploy**
   ```bash
   # Build images
   docker-compose build
   
   # Start services
   docker-compose up -d
   ```

3. **Environment Variables for Docker**
   ```bash
   # In .env file or docker-compose.yml
   POSTGRES_USER=postgres
   POSTGRES_PASSWORD=your_secure_password
   POSTGRES_DB=campus_navigation
   POSTGRES_PORT=5432
   
   # Backend variables
   DB_HOST=postgres_db
   DB_PORT=5432
   DB_NAME=campus_navigation
   DB_USER=postgres
   DB_PASSWORD=your_secure_password
   CORS_ORIGINS=http://localhost:5173,https://your-domain.com
   ```

## 🔒 Security Considerations

### Environment Variables Security
- Never commit `.env` files to version control
- Use strong, unique passwords for production
- Rotate secrets regularly
- Use platform-specific secret management when available

### CORS Configuration
- Set specific origins in production (not wildcards)
- Include all domains that will access your API
- Test CORS configuration thoroughly

### Database Security
- Use SSL connections in production
- Implement proper backup strategies
- Monitor database access logs
- Use connection pooling appropriately

## 🔍 Monitoring and Debugging

### Health Checks
- Backend: `https://your-api-domain.railway.app/health`
- Frontend: Check Vercel deployment logs

### Common Issues

1. **CORS Errors**
   - Verify CORS_ORIGINS includes your frontend domain
   - Check for trailing slashes in URLs

2. **Database Connection Issues**
   - Verify all DB_ environment variables
   - Check Railway database status
   - Ensure SSL is configured if required

3. **Build Failures**
   - Check Node.js version compatibility
   - Verify all dependencies are in package.json
   - Review build logs for specific errors

### Logging
- Railway provides built-in logging
- Vercel provides function logs
- Set LOG_LEVEL=debug for detailed troubleshooting

## 📊 Performance Optimization

### Frontend (Vercel)
- Enable Vercel's Edge Network
- Configure proper caching headers
- Optimize bundle size with tree shaking

### Backend (Railway)
- Use connection pooling for database
- Implement proper error handling
- Monitor memory usage and scaling

## 🔄 CI/CD Pipeline

### Automated Deployment
1. **GitHub Actions** (recommended)
   ```yaml
   # .github/workflows/deploy.yml
   name: Deploy
   on:
     push:
       branches: [main]
   jobs:
     deploy:
       runs-on: ubuntu-latest
       steps:
         - uses: actions/checkout@v2
         - name: Deploy to Vercel
           uses: amondnet/vercel-action@v20
         - name: Deploy to Railway
           uses: railway-app/railway-action@v1
   ```

2. **Automatic Deployments**
   - Vercel: Auto-deploys on push to main
   - Railway: Can be configured for auto-deployment

## 📋 Deployment Checklist

### Pre-Deployment
- [ ] All environment variables configured
- [ ] Database migrations ready
- [ ] CORS origins updated for production domains
- [ ] SSL certificates configured
- [ ] Monitoring and logging set up

### Post-Deployment
- [ ] Health checks passing
- [ ] Frontend loads correctly
- [ ] API endpoints responding
- [ ] Database connectivity verified
- [ ] CORS working for cross-origin requests
- [ ] Performance monitoring active

### Rollback Plan
- [ ] Previous version tagged in git
- [ ] Database backup available
- [ ] Rollback procedure documented
- [ ] Team notified of deployment status

## 🆘 Support and Troubleshooting

### Platform Documentation
- [Vercel Deployment Docs](https://vercel.com/docs/deployments)
- [Railway Deployment Docs](https://docs.railway.app/deploy/deployments)

### Common Commands
```bash
# Vercel
vercel --prod                    # Deploy to production
vercel logs                      # View deployment logs
vercel env ls                    # List environment variables

# Railway
railway status                   # Check service status
railway logs                     # View application logs
railway variables                # List environment variables
```

This deployment guide ensures a secure, scalable production environment for the Campus Navigation System. 