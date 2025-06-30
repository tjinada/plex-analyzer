/**
 * Service to aggregate and manage content from both Radarr and Sonarr
 * Provides unified endpoints for wanted/missing content and download queues
 */
import { radarrService } from './radarr.service';
import { sonarrService } from './sonarr.service';
import { ContentSummary, QueueSummary, QueueItem } from '../models/arr-models';

export class ContentManagerService {
  
  /**
   * Get combined content summary from both services
   */
  async getContentSummary(): Promise<ContentSummary> {
    const summary: ContentSummary = {
      wanted: {
        movies: 0,
        episodes: 0
      },
      missing: {
        movies: 0,
        episodes: 0
      },
      queue: {
        totalItems: 0,
        totalSize: 0,
        downloading: 0,
        completed: 0,
        failed: 0
      }
    };

    try {
      // Get data from both services in parallel
      const [
        radarrWanted,
        radarrMissing,
        radarrQueue,
        sonarrWanted,
        sonarrMissing,
        sonarrQueue
      ] = await Promise.allSettled([
        radarrService.isReady() ? radarrService.getWantedMovies() : Promise.resolve([]),
        radarrService.isReady() ? radarrService.getMissingMovies() : Promise.resolve([]),
        radarrService.isReady() ? radarrService.getQueue() : Promise.resolve([]),
        sonarrService.isReady() ? sonarrService.getWantedEpisodes() : Promise.resolve([]),
        sonarrService.isReady() ? sonarrService.getMissingEpisodes() : Promise.resolve([]),
        sonarrService.isReady() ? sonarrService.getQueue() : Promise.resolve([])
      ]);

      // Process Radarr results
      if (radarrWanted.status === 'fulfilled') {
        summary.wanted.movies = radarrWanted.value.length;
      }
      if (radarrMissing.status === 'fulfilled') {
        summary.missing.movies = radarrMissing.value.length;
      }
      if (radarrQueue.status === 'fulfilled') {
        const queue = radarrQueue.value;
        summary.queue.totalItems += queue.length;
        summary.queue.totalSize += queue.reduce((sum, item) => sum + (item.size || 0), 0);
        summary.queue.downloading += queue.filter(item => item.status === 'downloading').length;
        summary.queue.completed += queue.filter(item => item.status === 'completed').length;
        summary.queue.failed += queue.filter(item => item.status === 'failed').length;
      }

      // Process Sonarr results
      if (sonarrWanted.status === 'fulfilled') {
        summary.wanted.episodes = sonarrWanted.value.length;
      }
      if (sonarrMissing.status === 'fulfilled') {
        summary.missing.episodes = sonarrMissing.value.length;
      }
      if (sonarrQueue.status === 'fulfilled') {
        const queue = sonarrQueue.value;
        summary.queue.totalItems += queue.length;
        summary.queue.totalSize += queue.reduce((sum, item) => sum + (item.size || 0), 0);
        summary.queue.downloading += queue.filter(item => item.status === 'downloading').length;
        summary.queue.completed += queue.filter(item => item.status === 'completed').length;
        summary.queue.failed += queue.filter(item => item.status === 'failed').length;
      }

    } catch (error) {
      console.error('Error getting content summary:', error);
      // Return partial data even if some services fail
    }

    return summary;
  }

  /**
   * Get combined queue from both services
   */
  async getCombinedQueue(): Promise<QueueSummary> {
    const queueItems: QueueItem[] = [];
    
    try {
      // Get queue from both services in parallel
      const [radarrQueue, sonarrQueue] = await Promise.allSettled([
        radarrService.isReady() ? radarrService.getQueue() : Promise.resolve([]),
        sonarrService.isReady() ? sonarrService.getQueue() : Promise.resolve([])
      ]);

      // Combine queue items
      if (radarrQueue.status === 'fulfilled') {
        queueItems.push(...radarrQueue.value.map(item => ({
          ...item,
          sourceService: 'radarr' as const
        })));
      }

      if (sonarrQueue.status === 'fulfilled') {
        queueItems.push(...sonarrQueue.value.map(item => ({
          ...item,
          sourceService: 'sonarr' as const
        })));
      }

    } catch (error) {
      console.error('Error getting combined queue:', error);
    }

    // Calculate summary statistics
    const summary: QueueSummary = {
      totalItems: queueItems.length,
      totalSize: queueItems.reduce((sum, item) => sum + (item.size || 0), 0),
      totalSizeLeft: queueItems.reduce((sum, item) => sum + (item.sizeleft || 0), 0),
      downloading: queueItems.filter(item => item.status === 'downloading').length,
      completed: queueItems.filter(item => item.status === 'completed').length,
      failed: queueItems.filter(item => item.status === 'failed').length,
      paused: queueItems.filter(item => item.status === 'paused').length,
      items: queueItems
    };

    return summary;
  }

  /**
   * Get service status for both Radarr and Sonarr
   */
  async getServicesStatus(): Promise<{
    radarr: {
      configured: boolean;
      connected: boolean;
      error?: string;
    };
    sonarr: {
      configured: boolean;
      connected: boolean;
      error?: string;
    };
  }> {
    const status = {
      radarr: {
        configured: radarrService.isReady(),
        connected: false,
        error: undefined as string | undefined
      },
      sonarr: {
        configured: sonarrService.isReady(),
        connected: false,
        error: undefined as string | undefined
      }
    };

    // Test connections for configured services
    if (status.radarr.configured) {
      try {
        status.radarr.connected = await radarrService.testConnection();
      } catch (error) {
        status.radarr.error = error instanceof Error ? error.message : 'Connection failed';
      }
    }

    if (status.sonarr.configured) {
      try {
        status.sonarr.connected = await sonarrService.testConnection();
      } catch (error) {
        status.sonarr.error = error instanceof Error ? error.message : 'Connection failed';
      }
    }

    return status;
  }

  /**
   * Format file size in human readable format
   */
  formatFileSize(bytes: number): string {
    if (bytes === 0) return '0 B';
    
    const k = 1024;
    const sizes = ['B', 'KB', 'MB', 'GB', 'TB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  }

  /**
   * Calculate estimated time remaining from timeLeft string
   */
  parseTimeLeft(timeLeft: string): {
    totalMinutes: number;
    formatted: string;
  } {
    if (!timeLeft || timeLeft === '00:00:00') {
      return { totalMinutes: 0, formatted: 'Unknown' };
    }

    // Parse time format (HH:MM:SS or similar)
    const timeParts = timeLeft.split(':');
    if (timeParts.length === 3) {
      const hours = parseInt(timeParts[0], 10) || 0;
      const minutes = parseInt(timeParts[1], 10) || 0;
      const seconds = parseInt(timeParts[2], 10) || 0;
      
      const totalMinutes = hours * 60 + minutes + Math.ceil(seconds / 60);
      
      if (totalMinutes < 60) {
        return { totalMinutes, formatted: `${totalMinutes}m` };
      } else if (totalMinutes < 1440) {
        const hrs = Math.floor(totalMinutes / 60);
        const mins = totalMinutes % 60;
        return { totalMinutes, formatted: `${hrs}h ${mins}m` };
      } else {
        const days = Math.floor(totalMinutes / 1440);
        const hrs = Math.floor((totalMinutes % 1440) / 60);
        return { totalMinutes, formatted: `${days}d ${hrs}h` };
      }
    }

    return { totalMinutes: 0, formatted: timeLeft };
  }
}

// Export singleton instance
export const contentManagerService = new ContentManagerService();