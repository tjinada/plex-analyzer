/**
 * Format bytes to human-readable string
 */
export function formatBytes(bytes: number, decimals = 2): string {
  if (bytes === 0) return '0 Bytes';

  const k = 1024;
  const dm = decimals < 0 ? 0 : decimals;
  const sizes = ['Bytes', 'KB', 'MB', 'GB', 'TB', 'PB'];

  const i = Math.floor(Math.log(bytes) / Math.log(k));

  return `${parseFloat((bytes / Math.pow(k, i)).toFixed(dm))} ${sizes[i]}`;
}

/**
 * Format duration to human-readable string
 */
export function formatDuration(milliseconds: number): string {
  const seconds = Math.floor(milliseconds / 1000);
  const minutes = Math.floor(seconds / 60);
  const hours = Math.floor(minutes / 60);

  if (hours > 0) {
    return `${hours}h ${minutes % 60}m`;
  } else if (minutes > 0) {
    return `${minutes}m ${seconds % 60}s`;
  } else {
    return `${seconds}s`;
  }
}

/**
 * Format bitrate to human-readable string
 */
export function formatBitrate(bitrate: number): string {
  if (bitrate >= 1000000) {
    return `${(bitrate / 1000000).toFixed(1)} Mbps`;
  } else if (bitrate >= 1000) {
    return `${(bitrate / 1000).toFixed(0)} Kbps`;
  } else {
    return `${bitrate} bps`;
  }
}

/**
 * Parse resolution string to get dimensions
 */
export function parseResolution(resolution: string): { width: number; height: number } | null {
  const match = resolution.match(/(\d+)x(\d+)/);
  if (match) {
    return {
      width: parseInt(match[1], 10),
      height: parseInt(match[2], 10),
    };
  }
  return null;
}

/**
 * Get quality category from resolution
 */
export function getQualityCategory(resolution: string): string {
  const parsed = parseResolution(resolution);
  if (!parsed) return 'Unknown';

  const { height } = parsed;

  if (height >= 2160) return '4K';
  if (height >= 1080) return '1080p';
  if (height >= 720) return '720p';
  if (height >= 480) return '480p';
  return 'SD';
}

/**
 * Get file size category
 */
export function getSizeCategory(bytes: number): string {
  const gb = bytes / (1024 * 1024 * 1024);

  if (gb >= 50) return 'Very Large (50GB+)';
  if (gb >= 20) return 'Large (20-50GB)';
  if (gb >= 5) return 'Medium (5-20GB)';
  if (gb >= 1) return 'Small (1-5GB)';
  return 'Very Small (<1GB)';
}

/**
 * Calculate percentage with specified decimal places
 */
export function calculatePercentage(value: number, total: number, decimals = 1): number {
  if (total === 0) return 0;
  return parseFloat(((value / total) * 100).toFixed(decimals));
}

/**
 * Sanitize filename for safe export
 */
export function sanitizeFilename(filename: string): string {
  return filename
    .replace(/[<>:"/\\|?*]/g, '_')
    .replace(/\s+/g, '_')
    .toLowerCase();
}

/**
 * Generate timestamp string for filenames
 */
export function getTimestampString(): string {
  return new Date().toISOString().replace(/[:.]/g, '-').split('T')[0];
}