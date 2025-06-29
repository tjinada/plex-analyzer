# Plex Analyzer API Documentation

## Overview

The Plex Analyzer API provides endpoints for configuring external service connections and retrieving library analytics data.

## Base URL

```
http://localhost:3000/api
```

## Authentication

Currently, no authentication is required. The API is designed for single-user deployment.

## Response Format

All API responses follow a standardized format:

```typescript
interface ApiResponse<T = any> {
  success: boolean;
  data?: T;
  error?: {
    message: string;
    code?: string;
    details?: any;
  };
  timestamp: string;
}
```

### Success Response Example
```json
{
  "success": true,
  "data": {
    "message": "Operation completed successfully"
  },
  "timestamp": "2025-01-28T10:30:00.000Z"
}
```

### Error Response Example
```json
{
  "success": false,
  "error": {
    "message": "Invalid configuration provided",
    "code": "INVALID_CONFIG",
    "details": {
      "field": "plex.url",
      "reason": "URL format is invalid"
    }
  },
  "timestamp": "2025-01-28T10:30:00.000Z"
}
```

## Endpoints

### Health Check

#### GET /health

Check if the server is running.

**Response:**
```json
{
  "status": "ok",
  "timestamp": "2025-01-28T10:30:00.000Z"
}
```

---

### Configuration Management

#### GET /api/config

Get the current configuration status.

**Response:**
```json
{
  "success": true,
  "data": {
    "isConfigured": true,
    "services": {
      "plex": {
        "configured": true,
        "url": "http://192.168.1.100:32400"
      },
      "tautulli": {
        "configured": true,
        "enabled": true,
        "url": "http://192.168.1.100:8181"
      },
      "radarr": {
        "configured": false,
        "enabled": false,
        "url": ""
      },
      "sonarr": {
        "configured": false,
        "enabled": false,
        "url": ""
      }
    }
  },
  "timestamp": "2025-01-28T10:30:00.000Z"
}
```

#### POST /api/config

Update the configuration with new service connections.

**Request Body:**
```json
{
  "plex": {
    "url": "http://192.168.1.100:32400",
    "token": "your-plex-token"
  },
  "tautulli": {
    "url": "http://192.168.1.100:8181",
    "apiKey": "your-tautulli-api-key",
    "enabled": true
  },
  "radarr": {
    "url": "http://192.168.1.100:7878",
    "apiKey": "your-radarr-api-key",
    "enabled": true
  },
  "sonarr": {
    "url": "http://192.168.1.100:8989",
    "apiKey": "your-sonarr-api-key",
    "enabled": true
  }
}
```

**Response:**
```json
{
  "success": true,
  "data": {
    "message": "Configuration updated successfully",
    "isConfigured": true
  },
  "timestamp": "2025-01-28T10:30:00.000Z"
}
```

**Error Codes:**
- `INVALID_CONFIG` - Invalid configuration provided
- `PLEX_CONNECTION_FAILED` - Unable to connect to Plex server

#### POST /api/config/test

Test connections to all configured services.

**Response:**
```json
{
  "success": true,
  "data": {
    "plex": true,
    "tautulli": true,
    "radarr": false,
    "sonarr": false
  },
  "timestamp": "2025-01-28T10:30:00.000Z"
}
```

#### DELETE /api/config

Reset the configuration to defaults.

**Response:**
```json
{
  "success": true,
  "data": {
    "message": "Configuration reset successfully"
  },
  "timestamp": "2025-01-28T10:30:00.000Z"
}
```

---

### Libraries (Coming Soon)

#### GET /api/libraries

Get all available libraries with basic statistics.

**Response:**
```json
{
  "success": true,
  "data": [
    {
      "id": "1",
      "title": "Movies",
      "type": "movie",
      "itemCount": 1250,
      "totalSize": 5497558138880,
      "createdAt": "2023-01-15T10:30:00.000Z",
      "updatedAt": "2025-01-28T08:15:00.000Z"
    },
    {
      "id": "2",
      "title": "TV Shows",
      "type": "show",
      "itemCount": 89,
      "totalSize": 2198765432100,
      "createdAt": "2023-01-15T10:30:00.000Z",
      "updatedAt": "2025-01-28T07:45:00.000Z"
    }
  ],
  "timestamp": "2025-01-28T10:30:00.000Z"
}
```

#### GET /api/libraries/:id

Get detailed information about a specific library.

**Parameters:**
- `id` - Library ID

**Response:**
```json
{
  "success": true,
  "data": {
    "id": "1",
    "title": "Movies",
    "type": "movie",
    "itemCount": 1250,
    "totalSize": 5497558138880,
    "averageFileSize": 4398046511,
    "largestFile": {
      "title": "Avengers: Endgame (2019)",
      "size": 15032385536,
      "path": "/movies/Avengers Endgame (2019)/Avengers.Endgame.2019.2160p.UHD.BluRay.x265-TERMINAL.mkv"
    },
    "qualityDistribution": {
      "4K": { "count": 145, "size": 2198765432100, "percentage": 40.0 },
      "1080p": { "count": 890, "size": 2747483647800, "percentage": 50.0 },
      "720p": { "count": 215, "size": 549748364780, "percentage": 10.0 }
    }
  },
  "timestamp": "2025-01-28T10:30:00.000Z"
}
```

---

### Statistics (Coming Soon)

#### GET /api/statistics

Get global statistics across all libraries.

**Response:**
```json
{
  "success": true,
  "data": {
    "totalLibraries": 4,
    "totalItems": 1523,
    "totalSize": 7696323570980,
    "averageFileSize": 5055443321,
    "libraryBreakdown": [
      {
        "libraryId": "1",
        "title": "Movies",
        "type": "movie",
        "itemCount": 1250,
        "size": 5497558138880,
        "percentage": 71.4
      },
      {
        "libraryId": "2",
        "title": "TV Shows",
        "type": "show", 
        "itemCount": 273,
        "size": 2198765432100,
        "percentage": 28.6
      }
    ]
  },
  "timestamp": "2025-01-28T10:30:00.000Z"
}
```

#### GET /api/statistics/:libraryId

Get detailed statistics for a specific library.

**Parameters:**
- `libraryId` - Library ID

**Response:**
```json
{
  "success": true,
  "data": {
    "libraryId": "1",
    "totalItems": 1250,
    "totalSize": 5497558138880,
    "averageFileSize": 4398046511,
    "largestFile": {
      "id": "12345",
      "title": "Avengers: Endgame (2019)",
      "size": 15032385536,
      "path": "/movies/Avengers Endgame (2019)/Avengers.Endgame.2019.2160p.UHD.BluRay.x265-TERMINAL.mkv"
    },
    "qualityDistribution": {
      "4K": { "count": 145, "size": 2198765432100, "percentage": 40.0 },
      "1080p": { "count": 890, "size": 2747483647800, "percentage": 50.0 },
      "720p": { "count": 215, "size": 549748364780, "percentage": 10.0 }
    },
    "formatDistribution": {
      "mkv": { "count": 980, "size": 4398046511000, "percentage": 80.0 },
      "mp4": { "count": 245, "size": 1099511627600, "percentage": 20.0 }
    },
    "sizeDistribution": {
      "Very Large (50GB+)": { "count": 12, "size": 659706814464, "percentage": 12.0 },
      "Large (20-50GB)": { "count": 123, "size": 3848290697216, "percentage": 70.0 },
      "Medium (5-20GB)": { "count": 890, "size": 989560627200, "percentage": 18.0 },
      "Small (1-5GB)": { "count": 225, "size": 0, "percentage": 0.0 }
    }
  },
  "timestamp": "2025-01-28T10:30:00.000Z"
}
```

## Error Codes

| Code | Description |
|------|-------------|
| `CONFIG_NOT_FOUND` | Configuration not found. Please run setup first. |
| `INVALID_API_KEY` | Invalid API key provided. |
| `SERVICE_UNAVAILABLE` | External service is currently unavailable. |
| `INVALID_LIBRARY_ID` | Invalid library ID provided. |
| `EXPORT_FAILED` | Export operation failed. |
| `PLEX_CONNECTION_FAILED` | Unable to connect to Plex server. |

## Rate Limiting

Currently, no rate limiting is implemented. This may be added in future versions.

## Caching

The API implements in-memory caching for external service calls to improve performance:
- Default cache TTL: 5 minutes
- Cache is automatically cleared when configuration changes
- Cache can be manually cleared via configuration reset

## Development Notes

- All timestamps are in ISO 8601 format
- File sizes are in bytes
- Percentages are calculated to 1 decimal place
- URLs in configuration responses are masked for security
- API keys and tokens are never returned in responses