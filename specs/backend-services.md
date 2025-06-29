# Backend Services Documentation

## Overview

The Plex Analyzer backend implements a service-oriented architecture following SOLID principles. Each service is responsible for a single external API integration, and the AnalyzerService aggregates data from multiple sources.

## Service Architecture

```
┌─────────────────┐    ┌─────────────────┐    ┌─────────────────┐
│  PlexService    │    │ TautulliService │    │  RadarrService  │
│  (Required)     │    │   (Optional)    │    │   (Optional)    │
└─────────────────┘    └─────────────────┘    └─────────────────┘
         │                       │                       │
         └───────────────────────┼───────────────────────┘
                                 │
                  ┌─────────────────┐    ┌─────────────────┐
                  │  SonarrService  │    │ AnalyzerService │
                  │   (Optional)    │    │ (Aggregation)   │
                  └─────────────────┘    └─────────────────┘
```

## Services

### PlexService (Required)

**Purpose**: Primary integration with Plex Media Server API
**Status**: ✅ Implemented

#### Features
- Library discovery and enumeration
- Media item metadata retrieval
- File information and technical details
- Connection testing and validation

#### Key Methods
```typescript
configure(serverUrl: string, token: string): void
testConnection(): Promise<boolean>
getLibraries(): Promise<Library[]>
getLibraryItems(libraryId: string): Promise<MediaItem[]>
getMediaDetails(itemId: string): Promise<MediaItem | null>
getServerInfo(): Promise<any>
```

#### Configuration
```typescript
{
  url: "http://localhost:32400",
  token: "your-plex-token"
}
```

#### Error Handling
- Service unavailable when not configured
- Network timeout handling (10 seconds)
- Graceful failure for invalid tokens/URLs

---

### TautulliService (Optional)

**Purpose**: Enhanced statistics and watch history from Tautulli
**Status**: ✅ Implemented

#### Features
- Library statistics with file sizes
- Watch history and user activity
- Enhanced metadata information
- Play count and duration tracking

#### Key Methods
```typescript
configure(serverUrl: string, apiKey: string): void
testConnection(): Promise<boolean>
getLibraries(): Promise<TautulliLibraryStats[]>
getHistory(days?: number, limit?: number): Promise<TautulliWatchHistory[]>
getMetadata(ratingKey: string): Promise<any>
getServerInfo(): Promise<any>
```

#### Configuration
```typescript
{
  url: "http://localhost:8181",
  apiKey: "your-tautulli-api-key",
  enabled: true
}
```

#### Data Enhancements
- Provides accurate file sizes for libraries
- Adds historical usage patterns
- Enhances media metadata with play statistics

---

### RadarrService (Optional)

**Purpose**: Movie quality management and file information
**Status**: ✅ Implemented

#### Features
- Movie collection management
- Quality profile information
- File format and encoding details
- Download status and monitoring

#### Key Methods
```typescript
configure(serverUrl: string, apiKey: string): void
testConnection(): Promise<boolean>
getMovies(): Promise<RadarrMovie[]>
getMovieFiles(): Promise<RadarrMovieFile[]>
getQualityProfiles(): Promise<RadarrQualityProfile[]>
getMovie(movieId: number): Promise<RadarrMovie | null>
```

#### Configuration
```typescript
{
  url: "http://localhost:7878",
  apiKey: "your-radarr-api-key",
  enabled: true
}
```

#### Use Cases
- Quality upgrade analysis
- File format standardization
- Collection completeness tracking

---

### SonarrService (Optional)

**Purpose**: TV show quality management and episode tracking
**Status**: ✅ Implemented

#### Features
- Series and episode management
- Quality profile configuration
- Season and episode file tracking
- Download monitoring

#### Key Methods
```typescript
configure(serverUrl: string, apiKey: string): void
testConnection(): Promise<boolean>
getSeries(): Promise<SonarrSeries[]>
getEpisodes(seriesId: number): Promise<SonarrEpisode[]>
getEpisodeFiles(): Promise<SonarrEpisodeFile[]>
getQualityProfiles(): Promise<SonarrQualityProfile[]>
```

#### Configuration
```typescript
{
  url: "http://localhost:8989",
  apiKey: "your-sonarr-api-key", 
  enabled: true
}
```

#### Use Cases
- Episode collection gaps analysis
- Quality consistency tracking
- Series completion monitoring

---

### AnalyzerService (Data Aggregation)

**Purpose**: Combine data from multiple services for comprehensive analysis
**Status**: ✅ Implemented

#### Features
- Multi-source data aggregation
- Statistical calculations and distributions
- Caching for performance optimization
- Graceful degradation when services unavailable

#### Key Methods
```typescript
getLibraries(): Promise<Library[]>
getLibraryStats(libraryId: string): Promise<LibraryStats>
getGlobalStats(): Promise<GlobalStats>
```

#### Data Processing
- **Quality Distribution**: Categorizes media by resolution (4K, 1080p, 720p, etc.)
- **Format Distribution**: Analyzes container formats (MKV, MP4, etc.)
- **Size Distribution**: Groups files by size categories
- **Statistical Aggregation**: Calculates totals, averages, and percentages

#### Caching Strategy
- 5-minute default TTL for expensive operations
- Cache keys for different data types
- Automatic cache invalidation on configuration changes
- Memory-based caching for simplicity

## Error Handling

### Service-Level Errors
```typescript
interface ApiError extends Error {
  statusCode: number;
  code?: string;
  details?: any;
}
```

### Error Strategies
1. **Graceful Degradation**: Continue with available services if optional services fail
2. **Timeout Handling**: Configurable timeouts per service
3. **Connection Validation**: Test connections before use
4. **Logging**: Comprehensive error logging without exposing sensitive data

### HTTP Status Codes
- `500`: Service configuration errors
- `503`: External service unavailable  
- `404`: Resource not found
- `400`: Invalid parameters

## Configuration Management

### Service Configuration Flow
1. User provides service URLs and API keys
2. System validates required Plex configuration
3. Optional services configured if enabled
4. Connection tests performed
5. Cache cleared to refresh data

### Environment Variables
```bash
# Required
PLEX_URL=http://localhost:32400
PLEX_TOKEN=your-plex-token

# Optional
TAUTULLI_URL=http://localhost:8181
TAUTULLI_API_KEY=your-tautulli-api-key
RADARR_URL=http://localhost:7878
RADARR_API_KEY=your-radarr-api-key
SONARR_URL=http://localhost:8989
SONARR_API_KEY=your-sonarr-api-key
```

## Performance Considerations

### Optimization Strategies
1. **Caching**: In-memory caching reduces API calls
2. **Pagination**: Limit large dataset queries (YAGNI principle)
3. **Parallel Processing**: Multiple service calls when possible
4. **Timeout Management**: Prevent hanging requests

### Resource Limits
- **File Analysis**: Limited to first 50 items per library for performance
- **API Timeouts**: 5-10 seconds per service
- **Cache TTL**: 5 minutes default
- **Memory Usage**: Bounded by cache size limits

## Testing Strategy

### Unit Tests
- Service method validation
- Error condition handling
- Data transformation accuracy
- Cache behavior verification

### Integration Tests
- External API mocking
- Service interaction flows
- Error propagation testing
- Configuration validation

### Connection Testing
- Live API endpoint validation
- Authentication verification
- Network timeout handling
- Service availability checking

## Security Considerations

### API Key Management
- Keys stored in memory only
- Never logged or exposed in responses
- Encrypted in transit (HTTPS recommended)
- Configuration endpoint access control

### Data Protection
- No persistent storage of sensitive data
- Cache cleared on configuration changes
- Input validation on all endpoints
- CORS properly configured

## Future Enhancements

### Planned Improvements
1. **Database Integration**: For historical data persistence
2. **Background Jobs**: Scheduled data refresh
3. **Webhook Support**: Real-time updates from services
4. **Advanced Analytics**: ML-based insights
5. **Service Discovery**: Auto-detection of local services

### Extensibility
- Plugin architecture for new services
- Configurable data processing pipelines
- Custom analytics modules
- External integration hooks