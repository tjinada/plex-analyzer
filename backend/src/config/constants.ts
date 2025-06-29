export const HTTP_STATUS = {
  OK: 200,
  CREATED: 201,
  BAD_REQUEST: 400,
  UNAUTHORIZED: 401,
  FORBIDDEN: 403,
  NOT_FOUND: 404,
  INTERNAL_SERVER_ERROR: 500,
  SERVICE_UNAVAILABLE: 503,
} as const;

export const CACHE_KEYS = {
  LIBRARIES: 'libraries',
  LIBRARY_STATS: 'library_stats',
  GLOBAL_STATS: 'global_stats',
  CONFIG: 'config',
} as const;

export const API_TIMEOUTS = {
  PLEX: 10000, // 10 seconds
  TAUTULLI: 5000, // 5 seconds
  RADARR: 5000, // 5 seconds
  SONARR: 5000, // 5 seconds
} as const;

export const LIBRARY_TYPES = {
  MOVIE: 'movie',
  SHOW: 'show',
  ARTIST: 'artist',
  PHOTO: 'photo',
} as const;

export const ERROR_MESSAGES = {
  CONFIG_NOT_FOUND: 'Configuration not found. Please run setup first.',
  INVALID_API_KEY: 'Invalid API key provided.',
  SERVICE_UNAVAILABLE: 'External service is currently unavailable.',
  INVALID_LIBRARY_ID: 'Invalid library ID provided.',
  EXPORT_FAILED: 'Export operation failed.',
} as const;