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
- [x] Add item limit selector (10, 50, 100, 200, ALL)
- [x] Implement common limit selector across all analysis tabs
- [x] Fix TV show quality analysis (use episode-level data)
- [x] Add chart visualizations
- [x] Implement data tables
- [x] Create filtering system

### Phase 4.5: Enhanced Media Analysis 🚧 COMPLETED
- [x] Implement video technical details extraction
- [x] Create quality scoring algorithm with 5-component system
- [x] Add encoding metrics (codec, profile, bit depth, HDR format)
- [x] Implement source type detection (Blu-ray, Web-DL, etc.)
- [x] Create enhanced analyzer service
- [x] Add enhanced view toggle in frontend
- [x] Implement MediaInfo service with filename parsing fallback
- [x] Add quality distribution and upgrade recommendations
- [x] Fix enhanced view pagination (show all items by default)
- [x] Add view-specific metrics for TV shows vs episodes
- [x] Resolve technical details display (5 key fields)
- [x] Fix enhanced analyzer service inheritance issues

### Phase 4.6: Performance Optimization 🚧 IN PROGRESS
- [ ] Implement smart pagination with backend support
- [ ] Add lazy tab loading to prevent loading all data upfront
- [ ] Implement frontend caching with RxJS
- [ ] Add loading states and skeleton loaders (pending)
- [x] Optimize API responses for large datasets

### Phase 4.7: Quality Preferences System ✅ COMPLETED
- [x] Add resolution preference configuration (movies: 4K, TV shows: 1080p)
- [x] Modify quality scoring to respect user preferences
- [x] Update config system to support quality preferences
- [x] Implement content-type aware scoring (movies vs episodes)
- [x] Add preference-based resolution scoring algorithm

### Phase 5: Radarr/Sonarr Integration ✅ COMPLETED
- [x] Create comprehensive data models for wanted/missing/queue items
- [x] Extend Radarr service with wanted movies, missing movies, and queue management
- [x] Extend Sonarr service with wanted episodes, missing episodes, and queue management
- [x] Implement content manager service for unified data aggregation
- [x] Add manual search triggers for movies and episodes
- [x] Create queue management functionality (cancel, remove, blacklist)
- [x] Build comprehensive API endpoints (15+ routes)
- [x] Add advanced filtering capabilities for all content types
- [x] Implement service health monitoring and status checking
- [x] Create comprehensive API documentation

### Phase 6: Radarr/Sonarr Frontend Integration (Week 9-10)

#### 6.1: Frontend Services & Models ✅ COMPLETED
- [x] Create Radarr frontend service (`radarr.service.ts`)
- [x] Create Sonarr frontend service (`sonarr.service.ts`) 
- [x] Create content management service (`content-management.service.ts`)
- [x] Add TypeScript models for frontend (`arr-models.ts`)
- [x] Implement error handling and loading states

#### 6.2: Dashboard Cards Infrastructure ✅ COMPLETED
- [x] Create wanted content card component (`wanted-content-card.component.ts`)
- [x] Create missing content card component (`missing-content-card.component.ts`)
- [x] Create download queue card component (`download-queue-card.component.ts`)
- [x] Add card styling and responsive design
- [x] Implement card refresh and auto-update functionality

#### 6.3: Wanted Content Management
- [ ] Build wanted movies display with search triggers
- [ ] Build wanted episodes display with series grouping
- [ ] Add manual search buttons and confirmation dialogs
- [ ] Implement real-time search status updates
- [ ] Add filtering by quality profile and monitoring status

#### 6.4: Missing Content Management
- [ ] Display missing movies with availability dates
- [ ] Display missing episodes with air date information
- [ ] Add series/season grouping for TV shows
- [ ] Implement search triggers for missing content
- [ ] Add availability status indicators

#### 6.5: Download Queue Management
- [ ] Real-time queue display with progress bars
- [ ] Download speed and ETA indicators
- [ ] Cancel/remove queue item functionality
- [ ] Blacklist failed downloads capability
- [ ] Queue filtering by status and download client

#### 6.6: Interactive Features
- [ ] Add confirmation dialogs for destructive actions
- [ ] Implement toast notifications for actions
- [ ] Add keyboard shortcuts for common actions
- [ ] Create context menus for queue items
- [ ] Add bulk actions for multiple items

#### 6.7: Dashboard Integration ✅ COMPLETED
- [x] Add new cards to main dashboard layout
- [x] Implement dashboard grid system for card arrangement
- [x] Add service status indicators on dashboard
- [x] Create visual distinction between Radarr (movies) and Sonarr (TV shows) data
- [x] Implement clickable tiles with detailed content dialogs
- [x] Fix backend Sonarr service to populate series data for episodes
- [x] Resolve empty Sonarr lists issue in wanted/missing content dialogs
- [ ] Add toggle switches to show/hide specific cards
- [ ] Create dashboard refresh mechanism

#### 6.8: Advanced UI Features
- [ ] Add search functionality within cards
- [ ] Implement sorting options (date, size, status)
- [ ] Create detailed view modals for items
- [ ] Add export functionality for lists
- [ ] Implement drag-and-drop for queue reordering

### Phase 6.9: Other Advanced Features
- [ ] Add general export functionality
- [ ] Implement settings management
- [ ] Create notification system
- [x] Add loading states and error handling
- [ ] Implement data refresh mechanisms
- [ ] Add keyboard shortcuts

### Phase 7: Polish & Deployment (Week 11-12)
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

## Completed Advanced Features

### Enhanced Media Analysis (Phase 4.5)

#### Video Technical Details Extraction
- **Resolution, Codec, and Profile Detection**: Extracts video resolution, codec information, and encoding profiles from media files
- **Bit Depth and Color Information**: Analyzes bit depth (8-bit, 10-bit, 12-bit) and color space (Rec. 709, Rec. 2020)
- **HDR Format Detection**: Identifies HDR formats including HDR10, HDR10+, Dolby Vision, and HLG
- **Frame Rate and Scan Type**: Determines frame rates and progressive/interlaced scan types

#### Quality Scoring Algorithm
- **5-Component Scoring System**:
  - Resolution Score (25%): Based on video resolution quality
  - Codec Score (20%): Efficiency and quality of video codec
  - Bitrate Score (20%): Video bitrate relative to resolution
  - Source Score (20%): Quality tier of source material (Blu-ray > Web-DL > HDTV)
  - Technical Score (15%): HDR support and advanced encoding features
- **Quality Tiers**: Excellent (90-100), Good (70-89), Fair (50-69), Poor (0-49)
- **Upgrade Recommendations**: Automated suggestions for quality improvements

#### Source Type Detection
- **Intelligent Source Detection**: Analyzes filenames and metadata to identify source types
- **Supported Sources**: Blu-ray Remux, Blu-ray, Web-DL, WEB-RIP, HDTV, DVD, CAM, Screener
- **Release Group Extraction**: Identifies encoding groups from filenames

#### Enhanced User Interface
- **Enhanced View Toggle**: Switch between basic and enhanced analysis modes
- **Technical Details Display**: Shows 5 key technical metrics (Resolution, Codec, Video Profile, Bit Depth, Video Bitrate)
- **Quality Distribution Charts**: Visual breakdown of quality tiers across libraries
- **View-Specific Metrics**: Separate metrics for TV show aggregation vs episode-level analysis

#### Performance Optimizations
- **Filename Parsing Fallback**: Pure TypeScript implementation when MediaInfo isn't available
- **Caching Strategy**: 24-hour TTL for enhanced analysis results
- **Pagination Support**: Default to show all items in enhanced view
- **Service Architecture**: Flexible analyzer service selection (Plex vs Tautulli)

#### Implementation Details
- **MediaInfo Service**: `backend/src/services/mediainfo.service.ts` - Technical detail extraction
- **Quality Scorer Service**: `backend/src/services/quality-scorer.service.ts` - 5-component scoring engine
- **Enhanced Analyzer Service**: `backend/src/services/enhanced-analyzer.service.ts` - Main analysis orchestration
- **Frontend Integration**: Enhanced size analysis component with toggle functionality
- **API Endpoints**: `/analyzer/library/{id}/enhanced` for enhanced analysis data

### Chart Visualizations (Phase 4 - Charts)

#### Chart Infrastructure
- **Chart Service**: `frontend/src/app/shared/services/chart.service.ts` - Reusable Chart.js wrapper
- **Chart Component**: `frontend/src/app/shared/components/chart/chart.component.ts` - Angular wrapper component
- **Responsive Design**: All charts adapt to screen size and container dimensions

#### Size Analysis Charts
- **Size Distribution Pie Chart**: Visual breakdown of file size ranges (< 1GB, 1-5GB, etc.)
- **Quality Distribution Donut Chart**: Enhanced view quality tier visualization (Excellent/Good/Fair/Poor)

#### Quality Analysis Charts
- **Resolution Distribution Donut Chart**: Visual breakdown of video resolutions (4K, 1080p, 720p, etc.)
- **Codec Distribution Bar Chart**: Horizontal bar chart showing codec usage

#### Content Analysis Charts
- **Genre Distribution Bar Chart**: Top 10 genres by count with horizontal layout
- **Release Year Timeline**: Recent 20 years of content distribution
- **Runtime Distribution Chart**: Runtime range breakdown

#### Chart Features
- Interactive tooltips with percentages and counts
- Color-coded themes (resolution, quality, primary)
- Consistent Material Design styling
- Export capabilities (inherits from Chart.js)

### Filtering System (Phase 4 - Filters)

#### Filter Infrastructure
- **Filter Service**: `frontend/src/app/shared/services/filter.service.ts` - Centralized filter state management
- **Filter Bar Component**: `frontend/src/app/shared/components/filter-bar/filter-bar.component.ts` - Reusable filter UI

#### Available Filters
- **Text Search**: Real-time search across title and file path (300ms debounce)
- **File Type Filter**: Multi-select for movies, episodes, shows
- **Resolution Filter**: Multi-select for video resolutions with item counts
- **Codec Filter**: Multi-select for video codecs with usage statistics
- **Quality Tier Filter**: Enhanced view only - filter by quality tiers

#### Filter Features
- **Dynamic Options**: Filter options generated from current data with counts
- **Persistent State**: Filter state maintained during view changes
- **Active Filter Indicator**: Shows count of active filters
- **Clear All**: One-click filter reset
- **Responsive Design**: Mobile-friendly stacked layout
- **Real-time Application**: Immediate results without refresh

### Radarr/Sonarr Integration (Phase 5)

#### Content Management System
- **Comprehensive Data Models**: Complete TypeScript interfaces for movies, episodes, queue items, and filters
- **Unified API Architecture**: 15+ REST endpoints for complete content management
- **Content Manager Service**: Aggregates data from both Radarr and Sonarr with parallel processing

#### Radarr Integration Features
- **Movie Management**: Complete movie library access with metadata
- **Wanted Movies**: Track monitored movies without files
- **Missing Movies**: Identify available but not downloaded content
- **Download Queue**: Real-time queue monitoring with progress tracking
- **Manual Search**: Trigger movie searches on demand
- **Queue Management**: Cancel, remove, and blacklist downloads
- **Quality Profiles**: Access and filter by quality settings

#### Sonarr Integration Features
- **Series Management**: Complete TV show library with episode tracking
- **Wanted Episodes**: Monitor missing episodes across all series
- **Missing Episodes**: Track aired but not downloaded episodes
- **Download Queue**: TV show download progress monitoring
- **Episode Search**: Trigger searches for specific episodes
- **Series Search**: Trigger full series searches
- **Season Management**: Track completion status by season

#### Advanced Filtering System
- **Movie Filters**: Monitored status, quality profiles, release year, genres, availability
- **Episode Filters**: Series-specific, season-specific, air date cutoffs, monitoring status
- **Queue Filters**: Download status, protocol (torrent/usenet), download client
- **Dynamic Options**: All filters include item counts and are generated from live data

#### API Endpoints Structure
```
/api/radarr/
├── /movies              - All movies
├── /wanted              - Wanted movies (filterable)
├── /missing             - Missing movies (filterable)
├── /queue               - Download queue (filterable)
├── /queue/summary       - Queue statistics
├── /quality-profiles    - Available quality profiles
├── /search/:movieId     - Trigger movie search
├── /test                - Connection test
└── DELETE /queue/:id    - Remove from queue

/api/sonarr/
├── /series              - All series
├── /series/:id/episodes - Episodes for series
├── /wanted              - Wanted episodes (filterable)
├── /missing             - Missing episodes (filterable)
├── /queue               - Download queue (filterable)
├── /queue/summary       - Queue statistics
├── /quality-profiles    - Available quality profiles
├── /search/episodes     - Trigger episode search
├── /search/series/:id   - Trigger series search
├── /test                - Connection test
└── DELETE /queue/:id    - Remove from queue

/api/content/
├── /summary             - Combined content summary
├── /queue               - Combined download queue
└── /services/status     - Service health status
```

#### Implementation Details
- **Service Extensions**: Enhanced Radarr and Sonarr services with comprehensive method coverage
- **Error Handling**: Graceful degradation when services are unavailable
- **Parallel Processing**: Promise.allSettled for fault-tolerant multi-service operations
- **Type Safety**: Complete TypeScript models for all data structures
- **Performance Optimized**: Efficient API calls with optional filtering
- **Health Monitoring**: Real-time service status checking

#### Content Summary Response
```json
{
  "wanted": { "movies": 12, "episodes": 34 },
  "missing": { "movies": 5, "episodes": 18 },
  "queue": {
    "totalItems": 8,
    "totalSize": 15728640000,
    "downloading": 3,
    "completed": 2,
    "failed": 1
  }
}
```

### Quality Preferences System (Phase 4.7)

#### User-Configurable Preferences
- **Movie Preferences**: Default 4K resolution preference with 4K/1080p as acceptable
- **TV Show Preferences**: Default 1080p resolution preference with 1080p/720p as acceptable
- **Custom Configuration**: User can modify preferences through config.json

#### Intelligent Quality Scoring
- **Content-Type Awareness**: Different scoring for movies vs TV episodes
- **Preference-Based Scoring**: 25 points for perfect match, 20 points for acceptable resolution
- **Fallback Scoring**: Traditional resolution scoring for non-preferred resolutions
- **Configuration Integration**: Seamless integration with existing config system

#### Implementation Features
- **Config Interface**: Extended ConfigData interface with qualityPreferences object
- **Dynamic Scoring**: Quality scorer adapts to user preferences in real-time
- **Resolution Categories**: Automatic categorization (4K, 1080p, 720p, SD)
- **Content Detection**: Automatic detection of movie vs episode content type

#### Benefits
- **Personalized Scoring**: Quality scores reflect user's actual download preferences
- **Storage Optimization**: Higher scores for preferred formats reduce unnecessary upgrades
- **Content Differentiation**: Different standards for movies (4K focus) vs TV shows (1080p focus)
- **User Control**: Configurable preferences allow customization per user's needs

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