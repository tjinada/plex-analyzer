# Plex Library Analyzer - Initial Project Plan

## Table of Contents
1. [Project Overview](#project-overview)
2. [Technical Architecture](#technical-architecture)
3. [API Integration Details](#api-integration-details)
4. [Feature Specifications](#feature-specifications)
5. [Implementation Timeline](#implementation-timeline)
6. [Technical Decisions](#technical-decisions)
7. [Security Considerations](#security-considerations)
8. [Deployment Strategy](#deployment-strategy)
9. [Testing Strategy](#testing-strategy)
10. [Future Enhancements](#future-enhancements)

## Project Overview

### Purpose
The Plex Library Analyzer is a web-based tool designed to provide comprehensive insights into Plex media libraries. It addresses the need for detailed analysis of storage usage, media quality distribution, and content organization that isn't readily available in the standard Plex interface.

### Key Objectives
- **Storage Analysis**: Identify large files and space usage patterns
- **Quality Insights**: Understand media profile distribution across libraries
- **Content Overview**: Visualize library composition by various metadata
- **Integration**: Leverage multiple APIs (Plex, Tautulli, Radarr, Sonarr) for comprehensive data
- **User-Friendly**: Simple setup wizard and intuitive dashboard
- **Containerized**: Easy deployment on Unraid via Docker

### Target Users
- Plex server administrators
- Media collectors managing large libraries
- Users wanting to optimize storage usage
- Content curators monitoring quality standards

## Technical Architecture

### System Architecture
```
┌─────────────────┐     ┌─────────────────┐     ┌─────────────────┐
│                 │     │                 │     │                 │
│  Angular SPA    │────▶│  Express API    │────▶│  External APIs  │
│  (Frontend)     │     │  (Backend)      │     │  (Plex, etc.)   │
│                 │     │                 │     │                 │
└─────────────────┘     └─────────────────┘     └─────────────────┘
        │                       │                       │
        └───────────────────────┴───────────────────────┘
                        Docker Container
```

### Component Architecture

#### Frontend (Angular)
```
src/
├── app/
│   ├── core/
│   │   ├── services/
│   │   │   ├── api.service.ts
│   │   │   ├── config.service.ts
│   │   │   └── notification.service.ts
│   │   ├── guards/
│   │   │   └── config.guard.ts
│   │   └── interceptors/
│   │       └── error.interceptor.ts
│   ├── features/
│   │   ├── setup/
│   │   │   ├── components/
│   │   │   └── setup.module.ts
│   │   ├── dashboard/
│   │   │   ├── components/
│   │   │   └── dashboard.module.ts
│   │   └── analyzer/
│   │       ├── components/
│   │       └── analyzer.module.ts
│   ├── shared/
│   │   ├── components/
│   │   ├── pipes/
│   │   └── directives/
│   └── models/
│       ├── config.model.ts
│       ├── library.model.ts
│       └── statistics.model.ts
```

#### Backend (Node.js/Express)
```
src/
├── config/
│   ├── index.ts
│   └── constants.ts
├── controllers/
│   ├── config.controller.ts
│   ├── library.controller.ts
│   └── statistics.controller.ts
├── services/
│   ├── plex.service.ts
│   ├── tautulli.service.ts
│   ├── radarr.service.ts
│   ├── sonarr.service.ts
│   └── analyzer.service.ts
├── middleware/
│   ├── error.middleware.ts
│   └── validation.middleware.ts
├── routes/
│   └── index.ts
├── utils/
│   ├── cache.util.ts
│   └── formatter.util.ts
└── app.ts
```

### Data Flow
1. User configures API connections through setup wizard
2. Frontend requests library data from backend
3. Backend aggregates data from multiple API sources
4. Data is processed and analyzed
5. Results are cached and returned to frontend
6. Frontend visualizes data through charts and tables

## API Integration Details

### Plex API Integration

#### Authentication
- Token-based authentication using X-Plex-Token header
- Token obtained through user configuration

#### Key Endpoints Used
```typescript
// Libraries
GET {server}/library/sections
Response: List of all libraries with metadata

// Library Contents
GET {server}/library/sections/{id}/all
Response: All items in a specific library

// Media Details
GET {server}/library/metadata/{id}
Response: Detailed metadata for specific item

// File Information
GET {server}/library/parts/{id}
Response: File location, size, and technical details
```

#### Data Collected
- Library names and types
- Media titles and metadata
- File paths and sizes
- Video/audio codec information
- Resolution and bitrate data

### Tautulli API Integration

#### Authentication
- API key-based authentication
- Key provided during setup

#### Key Endpoints Used
```typescript
// Libraries
GET /api/v2?cmd=get_libraries
Response: Enhanced library statistics

// History
GET /api/v2?cmd=get_history
Response: Watch history with detailed stats

// Media Info
GET /api/v2?cmd=get_metadata
Response: Extended media information
```

#### Data Collected
- Watch statistics
- Play count data
- User activity patterns
- Extended media metadata

### Radarr API Integration

#### Authentication
- API key in X-Api-Key header
- Base URL configuration required

#### Key Endpoints Used
```typescript
// Movies
GET /api/v3/movie
Response: All movies with quality profiles

// Quality Profiles
GET /api/v3/qualityprofile
Response: Available quality profiles

// File Information
GET /api/v3/moviefile
Response: File details for movies
```

#### Data Collected
- Movie quality profiles
- File quality information
- Download status
- Alternative titles

### Sonarr API Integration

#### Authentication
- API key in X-Api-Key header
- Base URL configuration required

#### Key Endpoints Used
```typescript
// Series
GET /api/v3/series
Response: All TV shows with metadata

// Episodes
GET /api/v3/episode?seriesId={id}
Response: Episode information

// Quality Profiles
GET /api/v3/qualityprofile
Response: Available quality profiles
```

#### Data Collected
- TV show quality profiles
- Episode file information
- Season organization
- Series metadata

## Feature Specifications

### 1. Setup Wizard

#### Purpose
Guide users through initial configuration of API connections

#### Components
- **Welcome Screen**: Introduction and requirements
- **Plex Configuration**: 
  - Server URL input
  - Token input with validation
  - Connection test button
- **Tautulli Configuration** (Optional):
  - Server URL input
  - API key input
  - Enable/disable toggle
- **Radarr Configuration** (Optional):
  - Server URL input
  - API key input
  - Enable/disable toggle
- **Sonarr Configuration** (Optional):
  - Server URL input
  - API key input
  - Enable/disable toggle
- **Summary Screen**: Review configuration

#### Validation
- Real-time connection testing
- URL format validation
- API key format validation
- Error messaging for failed connections

### 2. Dashboard

#### Purpose
Provide quick overview of all libraries and key statistics

#### Components
- **Library Cards**: 
  - Library name and type icon
  - Item count
  - Total size
  - Last updated timestamp
  - Quick actions menu
- **Global Statistics**:
  - Total storage used
  - Number of movies/shows
  - Average file size
  - Quality distribution summary
- **Recent Activity** (if Tautulli enabled):
  - Recently added items
  - Most watched content
- **Quick Actions**:
  - Refresh all libraries
  - Export global report
  - Access settings

### 3. Library Analyzer

#### Purpose
Deep dive analysis of individual libraries

#### Views

##### Size Analysis View
- **Largest Files Table**:
  - Title, file size, path
  - Sortable columns
  - Quick filter options
- **Space Distribution Chart**:
  - Pie chart by media type
  - Tree map visualization
  - Drill-down capability
- **Growth Timeline**:
  - Line chart showing library growth
  - Monthly/yearly views

##### Quality Analysis View
- **Quality Profile Distribution**:
  - Bar chart of quality profiles
  - Percentage breakdown
  - File count per profile
- **Technical Details Table**:
  - Resolution distribution
  - Codec usage statistics
  - Bitrate analysis
- **Upgrade Candidates**:
  - Items below preferred quality
  - Missing qualities

##### Content Analysis View
- **Metadata Statistics**:
  - Genre distribution
  - Release year histogram
  - Runtime distribution
- **Collection Overview**:
  - Complete vs incomplete series
  - Missing episodes (TV)
  - Collection gaps

### 4. Export Functionality

#### Formats Supported
- **CSV Export**:
  - Customizable columns
  - Filtered data export
- **PDF Reports**:
  - Executive summary
  - Detailed charts
  - Recommendations
- **JSON Export**:
  - Raw data for external processing
  - API-compatible format

### 5. Settings Management

#### Configuration Options
- **API Settings**: Update connection details
- **Cache Settings**: 
  - Cache duration
  - Manual cache clear
- **Display Preferences**:
  - Default view settings
  - Chart preferences
  - Table pagination
- **Export Templates**:
  - Customize report formats
  - Save report presets

## Implementation Timeline

### Phase 1: Foundation (Week 1-2) ✅ COMPLETED
- [x] Create project specification
- [x] Set up development environment  
- [x] Initialize Angular and Node.js projects
- [x] Configure TypeScript and linting
- [x] Set up basic Docker configuration
- [x] Implement basic Express server
- [x] Create Angular routing structure

### Phase 2: Backend Core (Week 3-4) ✅ COMPLETED
- [x] Implement configuration management
- [x] Create Plex service with basic endpoints
- [x] Add Tautulli service integration
- [x] Add Radarr service integration
- [x] Add Sonarr service integration
- [x] Implement caching layer
- [x] Create data aggregation service

### Phase 3: Frontend Foundation (Week 5-6) ✅ COMPLETED
- [x] Implement setup wizard UI
- [x] Create dashboard layout
- [x] Build library card components
- [x] Implement navigation structure
- [x] Add Material Design theming
- [x] Create shared components library

### Phase 4: Analysis Features (Week 7-8) ✅ COMPLETED
- [x] Implement size analysis components
- [x] Create quality analysis views
- [x] Build content analysis features
- [ ] Add chart visualizations
- [x] Implement data tables
- [ ] Create filtering system

### Phase 5: Advanced Features (Week 9-10)
- [ ] Add export functionality
- [ ] Implement settings management
- [ ] Create notification system
- [ ] Add loading states and error handling
- [ ] Implement data refresh mechanisms
- [ ] Add keyboard shortcuts

### Phase 6: Polish & Deployment (Week 11-12)
- [ ] Optimize performance
- [ ] Complete Docker configuration
- [ ] Write user documentation
- [ ] Create deployment guide
- [ ] Perform security audit
- [ ] Conduct user testing

## Technical Decisions

### Frontend Framework: Angular
**Rationale**:
- Comprehensive framework with built-in features
- Excellent TypeScript support
- Material Design integration
- Powerful data binding for complex visualizations
- Strong community and ecosystem

### UI Library: Angular Material
**Rationale**:
- Consistent design language
- Accessibility built-in
- Responsive components
- Theming support
- Well-documented

### Backend Framework: Express.js
**Rationale**:
- Lightweight and flexible
- Large ecosystem of middleware
- Easy integration with TypeScript
- Suitable for API-focused applications
- Good performance characteristics

### Chart Library: Chart.js with ng2-charts
**Rationale**:
- Wide variety of chart types
- Good performance
- Responsive design
- Easy Angular integration
- Extensive customization options

### No Database Decision
**Rationale**:
- Data is already stored in external services
- Reduces complexity and maintenance
- Caching provides adequate performance
- Simplifies deployment
- Reduces resource requirements

### Docker for Deployment
**Rationale**:
- Standard in Unraid ecosystem
- Simplifies deployment process
- Ensures consistent environment
- Easy updates and rollbacks
- Resource isolation

## Security Considerations

### API Key Management
- Keys stored in memory only
- Never logged or exposed in responses
- Encrypted in transit (HTTPS)
- Configuration endpoint protected
- Option to use environment variables

### Authentication & Authorization
- Initial implementation: Single user
- All endpoints require configuration
- Session-based access control
- Timeout for inactive sessions

### Data Protection
- No sensitive data stored locally
- Cache cleared on configuration change
- HTTPS enforcement in production
- CORS properly configured
- Input validation on all endpoints

### Docker Security
- Non-root user in container
- Minimal base image
- No unnecessary packages
- Read-only file system where possible
- Health checks implemented

## Deployment Strategy

### Docker Configuration

#### Multi-stage Dockerfile
```dockerfile
# Build stage - Frontend
FROM node:18-alpine AS frontend-build
WORKDIR /app/frontend
COPY frontend/package*.json ./
RUN npm ci
COPY frontend/ ./
RUN npm run build

# Build stage - Backend
FROM node:18-alpine AS backend-build
WORKDIR /app/backend
COPY backend/package*.json ./
RUN npm ci
COPY backend/ ./
RUN npm run build

# Production stage
FROM node:18-alpine
RUN apk add --no-cache dumb-init
RUN addgroup -g 1001 -S nodejs && adduser -S nodejs -u 1001

WORKDIR /app
COPY --from=backend-build --chown=nodejs:nodejs /app/backend/dist ./
COPY --from=backend-build --chown=nodejs:nodejs /app/backend/package*.json ./
COPY --from=frontend-build --chown=nodejs:nodejs /app/frontend/dist ./public

RUN npm ci --production

USER nodejs
EXPOSE 3000

ENTRYPOINT ["dumb-init", "--"]
CMD ["node", "app.js"]
```

### Environment Variables
```bash
# Server Configuration
PORT=3000
NODE_ENV=production

# Frontend Configuration
API_URL=/api

# Optional: Pre-configured connections
PLEX_URL=
PLEX_TOKEN=
TAUTULLI_URL=
TAUTULLI_API_KEY=
RADARR_URL=
RADARR_API_KEY=
SONARR_URL=
SONARR_API_KEY=
```

### Unraid Template
```xml
<?xml version="1.0"?>
<Container version="2">
  <Name>PlexAnalyzer</Name>
  <Repository>yourusername/plex-analyzer</Repository>
  <Registry>https://hub.docker.com/</Registry>
  <Network>bridge</Network>
  <Privileged>false</Privileged>
  <Support>https://github.com/yourusername/plex-analyzer</Support>
  <Project>https://github.com/yourusername/plex-analyzer</Project>
  <Overview>Comprehensive Plex library analyzer with size and quality insights</Overview>
  <Category>MediaApp:Video MediaApp:Other</Category>
  <WebUI>http://[IP]:[PORT:3000]</WebUI>
  <Icon>https://raw.githubusercontent.com/yourusername/plex-analyzer/main/icon.png</Icon>
  <Config Name="Web Port" Target="3000" Default="3000" Mode="tcp" Description="Web UI Port" Type="Port" Display="always" Required="true">3000</Config>
  <Config Name="Config Path" Target="/config" Default="/mnt/user/appdata/plex-analyzer" Mode="rw" Description="Configuration storage" Type="Path" Display="always" Required="true">/mnt/user/appdata/plex-analyzer</Config>
</Container>
```

## Testing Strategy

### Unit Testing

#### Frontend (Jasmine/Karma)
- Component logic testing
- Service method testing
- Pipe transformation tests
- Guard and interceptor tests
- 80% code coverage target

#### Backend (Jest)
- Service unit tests
- Controller tests
- Middleware tests
- Utility function tests
- Mock external API calls

### Integration Testing
- API endpoint testing
- Service integration tests
- Database transaction tests
- Error handling verification

### End-to-End Testing (Cypress)
- Setup wizard flow
- Dashboard interactions
- Analysis feature workflows
- Export functionality
- Error scenarios

### Performance Testing
- API response time benchmarks
- Frontend rendering performance
- Large dataset handling
- Concurrent user support

## Future Enhancements

### Version 2.0 Features

#### Multi-User Support
- User authentication system
- Role-based access control
- Personal dashboards
- Shared reports

#### Advanced Analytics
- AI-powered recommendations
- Predictive storage modeling
- Automated quality suggestions
- Duplicate detection algorithms

#### Enhanced Integrations
- Jellyfin support
- Emby support
- Overseerr integration
- Ombi integration

#### Mobile Application
- React Native mobile app
- Push notifications
- Remote monitoring
- Quick actions

### Version 3.0 Vision

#### Database Integration
- PostgreSQL for historical data
- Trend analysis over time
- Custom report builder
- Data warehousing

#### Automation Features
- Scheduled reports
- Automated cleanup suggestions
- Quality upgrade automation
- Storage optimization scripts

#### Extended Ecosystem
- Plugin architecture
- Third-party integrations
- API for external tools
- Webhook support

---

## Document Information
- **Version**: 1.0.0
- **Created**: 2025-01-28
- **Author**: Development Team
- **Status**: Initial Planning
- **Next Review**: After Phase 1 completion

## Appendices

### A. API Response Examples
[Will be added during implementation]

### B. UI Mockups
[Will be created during design phase]

### C. Performance Benchmarks
[Will be established during testing]