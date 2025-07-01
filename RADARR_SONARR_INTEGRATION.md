# Radarr/Sonarr Integration Documentation

This document describes the comprehensive integration with Radarr and Sonarr services to display wanted/missing content and download queue status.

## Backend Implementation

### Data Models (`/backend/src/models/arr-models.ts`)

Complete TypeScript interfaces for:
- **Movies & Episodes**: Full Radarr/Sonarr data structures
- **Queue Items**: Download queue with progress tracking
- **Wanted/Missing Content**: Monitored content tracking
- **Quality Profiles**: User quality settings
- **Filter Interfaces**: Comprehensive filtering options

### Enhanced Services

#### Radarr Service Extensions (`/backend/src/services/radarr.service.ts`)
- `getWantedMovies(filters?)` - Get monitored movies without files
- `getMissingMovies(filters?)` - Get available but missing movies  
- `getQueue(filters?)` - Get download queue with progress
- `getQueueSummary()` - Queue statistics
- `searchMovie(movieId)` - Trigger manual search
- `removeFromQueue(queueId, options)` - Remove/cancel downloads

#### Sonarr Service Extensions (`/backend/src/services/sonarr.service.ts`)
- `getWantedEpisodes(filters?)` - Get monitored episodes without files
- `getMissingEpisodes(filters?)` - Get aired but missing episodes
- `getQueue(filters?)` - Get download queue with progress
- `getQueueSummary()` - Queue statistics
- `searchEpisodes(episodeIds)` - Trigger episode search
- `searchSeries(seriesId)` - Trigger series search
- `removeFromQueue(queueId, options)` - Remove/cancel downloads

#### Content Manager Service (`/backend/src/services/content-manager.service.ts`)
Unified service aggregating both Radarr and Sonarr:
- `getContentSummary()` - Combined wanted/missing/queue stats
- `getCombinedQueue()` - Merged download queue from both services
- `getServicesStatus()` - Health check for both services

### API Endpoints

#### Radarr Endpoints (`/api/radarr/`)
```
GET /movies                 - All movies
GET /wanted                 - Wanted movies (with filters)
GET /missing                - Missing movies (with filters)  
GET /queue                  - Download queue (with filters)
GET /queue/summary          - Queue statistics
GET /quality-profiles       - Available quality profiles
GET /test                   - Connection test
POST /search/:movieId       - Trigger movie search
DELETE /queue/:queueId      - Remove from queue
```

#### Sonarr Endpoints (`/api/sonarr/`)
```
GET /series                 - All series
GET /series/:id/episodes    - Episodes for series
GET /wanted                 - Wanted episodes (with filters)
GET /missing                - Missing episodes (with filters)
GET /queue                  - Download queue (with filters)
GET /queue/summary          - Queue statistics
GET /quality-profiles       - Available quality profiles
GET /test                   - Connection test
POST /search/episodes       - Trigger episode search
POST /search/series/:id     - Trigger series search
DELETE /queue/:queueId      - Remove from queue
```

#### Content Management Endpoints (`/api/content/`)
```
GET /summary                - Combined content summary
GET /queue                  - Combined download queue
GET /services/status        - Service health status
```

## Filter Capabilities

### Movie Filters
- `monitored` - Only monitored movies
- `hasFile` - Movies with/without files
- `qualityProfileId` - Specific quality profile
- `minimumAvailability` - Availability status
- `year` - Release year
- `genres` - Genre filtering
- `sortBy` - title, year, added, inCinemas, physicalRelease
- `sortDirection` - asc/desc

### Episode Filters
- `seriesId` - Specific series
- `seasonNumber` - Specific season
- `monitored` - Only monitored episodes
- `hasFile` - Episodes with/without files
- `airDateCutoff` - Episodes aired before date
- `sortBy` - airDate, series, season, episode
- `sortDirection` - asc/desc

### Queue Filters
- `status` - downloading, completed, failed, paused
- `protocol` - usenet, torrent
- `downloadClient` - Specific client
- `includeUnknownItems` - Include unmatched items

## Response Formats

### Content Summary
```json
{
  "wanted": {
    "movies": 12,
    "episodes": 34
  },
  "missing": {
    "movies": 5,
    "episodes": 18
  },
  "queue": {
    "totalItems": 8,
    "totalSize": 15728640000,
    "downloading": 3,
    "completed": 2,
    "failed": 1
  }
}
```

### Queue Item
```json
{
  "id": 123,
  "title": "Movie Title (2023)",
  "status": "downloading",
  "progress": 65.2,
  "size": 2147483648,
  "sizeleft": 748257792,
  "timeleft": "00:15:30",
  "downloadClient": "qBittorrent",
  "quality": {
    "quality": {
      "name": "Bluray-1080p",
      "resolution": 1080
    }
  }
}
```

## Interactive Features

### Manual Search
- Trigger searches for specific movies/episodes
- Support for series-wide searches
- Real-time status updates

### Queue Management
- View download progress and ETA
- Cancel/remove downloads
- Blacklist failed downloads
- Remove from download client

### Quality Profile Integration
- Display configured quality profiles
- Filter content by quality requirements
- Show quality upgrade opportunities

## Error Handling

- Graceful degradation when services unavailable
- Detailed error messages with context
- Service-specific error codes
- Connection retry logic

## Performance Considerations

- Parallel API calls to both services
- Promise.allSettled for fault tolerance
- Caching for frequently accessed data
- Efficient filtering on large datasets

## Usage Examples

### Get Missing Content Summary
```bash
curl http://localhost:3000/api/content/summary
```

### Search for Wanted Movies
```bash
curl "http://localhost:3000/api/radarr/wanted?monitored=true&year=2023"
```

### Trigger Movie Search
```bash
curl -X POST http://localhost:3000/api/radarr/search/123
```

### Get Combined Download Queue
```bash
curl http://localhost:3000/api/content/queue
```

This integration provides comprehensive content management capabilities while maintaining clean separation between Radarr and Sonarr functionality.