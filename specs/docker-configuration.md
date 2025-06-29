# Docker Configuration - Implementation Documentation

## Overview
This document details the Docker configuration for the Plex Analyzer project, completed on 2025-01-28.

## Implementation Details

### Docker Strategy
- **Multi-stage builds**: Minimize production image size
- **Non-root user**: Security best practice
- **Health checks**: Container monitoring
- **Development containers**: Hot-reloading support

### Files Created

#### 1. `Dockerfile` (Production)
Multi-stage build process:
1. **Frontend Build Stage**:
   - Uses Node 18 Alpine (lightweight)
   - Installs dependencies with `npm ci`
   - Builds Angular production bundle
   
2. **Backend Build Stage**:
   - Compiles TypeScript to JavaScript
   - Prepares production-ready code
   
3. **Production Stage**:
   - Minimal Alpine image
   - Non-root user (nodejs:1001)
   - Only production dependencies
   - Static files served from `/public`
   - Health check endpoint monitoring

#### 2. `docker-compose.yml`
Services configured:
- **plex-analyzer**: Production container
  - Port 3000 exposed
  - Health check configured
  - Auto-restart policy
  
- **Development services** (profile: dev):
  - backend-dev: Hot-reloading backend
  - frontend-dev: Angular dev server
  - Volume mounts for live updates

#### 3. `.dockerignore`
Excludes from build context:
- Node modules (fresh install)
- Build outputs
- Environment files
- Documentation
- Development files

#### 4. Development Dockerfiles
- `backend/Dockerfile.dev`: Node with tsx watch
- `frontend/Dockerfile.dev`: Angular CLI global install

### Design Principles Applied

#### KISS (Keep It Simple, Stupid)
- Single service architecture
- Standard Node.js patterns
- Minimal configuration
- Clear separation of dev/prod

#### YAGNI (You Aren't Gonna Need It)
- No orchestration complexity
- No reverse proxy (yet)
- No persistent volumes (stateless)
- No complex networking

#### SOLID Principles
- **Single Responsibility**: Each stage has one purpose
- **Open/Closed**: Easy to extend with new services
- **Dependency Inversion**: Configuration via environment

### Security Features
1. **Non-root user**: Runs as nodejs:1001
2. **Minimal base image**: Alpine Linux
3. **No secrets in image**: Environment variables
4. **Health checks**: Container monitoring
5. **dumb-init**: Proper signal handling

### Performance Optimizations
1. **Multi-stage builds**: ~70MB final image
2. **Layer caching**: Efficient rebuilds
3. **Production dependencies only**: Minimal size
4. **Static file serving**: Nginx-like performance

### Environment Variables
```bash
# Server Configuration
NODE_ENV=production    # Node environment
PORT=3000              # Server port

# Optional API Configuration
PLEX_URL=              # Plex server URL
PLEX_TOKEN=            # Plex auth token
TAUTULLI_URL=          # Tautulli URL
TAUTULLI_API_KEY=      # Tautulli API key
RADARR_URL=            # Radarr URL
RADARR_API_KEY=        # Radarr API key
SONARR_URL=            # Sonarr URL
SONARR_API_KEY=        # Sonarr API key
```

### Usage Instructions

#### Production Build
```bash
# Build the image
docker build -t plex-analyzer .

# Run the container
docker run -d \
  --name plex-analyzer \
  -p 3000:3000 \
  -e NODE_ENV=production \
  plex-analyzer

# With API configuration
docker run -d \
  --name plex-analyzer \
  -p 3000:3000 \
  -e NODE_ENV=production \
  -e PLEX_URL=http://plex:32400 \
  -e PLEX_TOKEN=your-token \
  plex-analyzer
```

#### Development Mode
```bash
# Start development containers
docker-compose --profile dev up

# Backend: http://localhost:3000
# Frontend: http://localhost:4200
```

#### Using Docker Compose
```bash
# Production
docker-compose up -d

# Development
docker-compose --profile dev up

# Stop all services
docker-compose down
```

### Unraid Deployment

#### Docker Template
The application is configured for easy Unraid deployment:
1. Uses standard ports
2. No persistent storage required
3. Environment variable configuration
4. Health check included

#### Unraid Installation Steps
1. Add new container from DockerHub
2. Configure port mapping (3000)
3. Add environment variables
4. No volume mappings needed
5. Start container

### Health Monitoring
- Endpoint: `/health`
- Interval: 30 seconds
- Timeout: 3 seconds
- Retries: 3
- Returns: `{ status: 'ok', timestamp: '...' }`

### Build Optimization
1. **Dependency caching**: package*.json copied first
2. **Minimal rebuilds**: Source changes don't invalidate deps
3. **Production builds**: Optimized bundles
4. **Layer optimization**: Frequently changing files last

### Troubleshooting

#### Common Issues
1. **Port conflicts**: Change PORT environment variable
2. **Build failures**: Check Node version compatibility
3. **Permission errors**: Ensure proper file ownership
4. **Health check failures**: Verify backend is running

#### Debug Commands
```bash
# View logs
docker logs plex-analyzer

# Enter container
docker exec -it plex-analyzer sh

# Check health
docker inspect plex-analyzer --format='{{.State.Health}}'

# View resource usage
docker stats plex-analyzer
```

### Future Enhancements
1. **Nginx sidecar**: Better static serving
2. **Multi-platform builds**: ARM support
3. **Kubernetes manifests**: Cloud deployment
4. **CI/CD integration**: Automated builds

## Conclusion
Docker configuration is complete with both production and development setups. The multi-stage build creates a minimal, secure production image while maintaining developer productivity with hot-reloading development containers.