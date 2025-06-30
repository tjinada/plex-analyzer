import { Request, Response, NextFunction } from 'express';
import { HTTP_STATUS, ERROR_MESSAGES } from '../config/constants';
import { analyzerService } from '../services/analyzer-factory';
import { plexService } from '../services/plex.service';
import { tautulliService } from '../services/tautulli.service';
import { config } from '../config';
import { ApiResponse } from '../models';

export class StatisticsController {
  /**
   * Get global statistics across all libraries
   */
  async getGlobalStatistics(_req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      // Check if the appropriate service is ready based on data source
      const dataSource = config.settings.dataSource;
      const isServiceReady = dataSource === 'tautulli' 
        ? tautulliService.isReady() 
        : plexService.isReady();
      
      if (!isServiceReady) {
        res.status(HTTP_STATUS.SERVICE_UNAVAILABLE).json({
          success: false,
          error: {
            message: ERROR_MESSAGES.CONFIG_NOT_FOUND,
            code: 'CONFIG_NOT_FOUND',
          },
          timestamp: new Date().toISOString(),
        });
        return;
      }

      const globalStats = await analyzerService.getGlobalStats();

      const response: ApiResponse = {
        success: true,
        data: globalStats,
        timestamp: new Date().toISOString(),
      };

      res.status(HTTP_STATUS.OK).json(response);
    } catch (error) {
      next(error);
    }
  }

  /**
   * Get detailed statistics for a specific library
   */
  async getLibraryStatistics(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const { libraryId } = req.params;

      if (!libraryId) {
        res.status(HTTP_STATUS.BAD_REQUEST).json({
          success: false,
          error: {
            message: ERROR_MESSAGES.INVALID_LIBRARY_ID,
            code: 'INVALID_LIBRARY_ID',
          },
          timestamp: new Date().toISOString(),
        });
        return;
      }

      // Check if the appropriate service is ready based on data source
      const dataSource = config.settings.dataSource;
      const isServiceReady = dataSource === 'tautulli' 
        ? tautulliService.isReady() 
        : plexService.isReady();
      
      if (!isServiceReady) {
        res.status(HTTP_STATUS.SERVICE_UNAVAILABLE).json({
          success: false,
          error: {
            message: ERROR_MESSAGES.CONFIG_NOT_FOUND,
            code: 'CONFIG_NOT_FOUND',
          },
          timestamp: new Date().toISOString(),
        });
        return;
      }

      const libraryStats = await analyzerService.getLibraryStats(libraryId);

      const response: ApiResponse = {
        success: true,
        data: libraryStats,
        timestamp: new Date().toISOString(),
      };

      res.status(HTTP_STATUS.OK).json(response);
    } catch (error) {
      next(error);
    }
  }

  /**
   * Get quality distribution across all libraries
   */
  async getQualityOverview(_req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      // Check if the appropriate service is ready based on data source
      const dataSource = config.settings.dataSource;
      const isServiceReady = dataSource === 'tautulli' 
        ? tautulliService.isReady() 
        : plexService.isReady();
      
      if (!isServiceReady) {
        res.status(HTTP_STATUS.SERVICE_UNAVAILABLE).json({
          success: false,
          error: {
            message: ERROR_MESSAGES.CONFIG_NOT_FOUND,
            code: 'CONFIG_NOT_FOUND',
          },
          timestamp: new Date().toISOString(),
        });
        return;
      }

      const libraries = await analyzerService.getLibraries();
      const qualityOverview: Record<string, { count: number; size: number; libraries: string[] }> = {};

      // Simple aggregation across libraries (KISS principle)
      for (const library of libraries) {
        try {
          const stats = await analyzerService.getLibraryStats(library.id);
          
          Object.entries(stats.qualityDistribution).forEach(([quality, data]) => {
            if (!qualityOverview[quality]) {
              qualityOverview[quality] = { count: 0, size: 0, libraries: [] };
            }
            qualityOverview[quality].count += (data as any).count;
            qualityOverview[quality].size += (data as any).size;
            if (!qualityOverview[quality].libraries.includes(library.title)) {
              qualityOverview[quality].libraries.push(library.title);
            }
          });
        } catch (error) {
          console.warn(`Failed to get stats for library ${library.id}:`, error);
        }
      }

      const response: ApiResponse = {
        success: true,
        data: qualityOverview,
        timestamp: new Date().toISOString(),
      };

      res.status(HTTP_STATUS.OK).json(response);
    } catch (error) {
      next(error);
    }
  }

  /**
   * Get storage usage breakdown
   */
  async getStorageBreakdown(_req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      // Check if the appropriate service is ready based on data source
      const dataSource = config.settings.dataSource;
      const isServiceReady = dataSource === 'tautulli' 
        ? tautulliService.isReady() 
        : plexService.isReady();
      
      if (!isServiceReady) {
        res.status(HTTP_STATUS.SERVICE_UNAVAILABLE).json({
          success: false,
          error: {
            message: ERROR_MESSAGES.CONFIG_NOT_FOUND,
            code: 'CONFIG_NOT_FOUND',
          },
          timestamp: new Date().toISOString(),
        });
        return;
      }

      const globalStats = await analyzerService.getGlobalStats();
      
      // Transform data for easier frontend consumption
      const storageBreakdown = {
        total: globalStats.totalSize,
        byLibrary: globalStats.libraryBreakdown.map((lib: any) => ({
          name: lib.title,
          type: lib.type,
          size: lib.size,
          percentage: lib.percentage,
          itemCount: lib.itemCount,
        })),
        summary: {
          totalFiles: globalStats.totalItems,
          averageFileSize: globalStats.averageFileSize,
          largestLibrary: globalStats.libraryBreakdown.reduce((largest: any, current: any) => 
            current.size > largest.size ? current : largest,
            globalStats.libraryBreakdown[0] || { size: 0 }
          ),
        },
      };

      const response: ApiResponse = {
        success: true,
        data: storageBreakdown,
        timestamp: new Date().toISOString(),
      };

      res.status(HTTP_STATUS.OK).json(response);
    } catch (error) {
      next(error);
    }
  }

  /**
   * Refresh all statistics (clear cache)
   */
  async refreshStatistics(_req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      // Clear all statistics caches
      const { cache } = await import('../utils/cache.util');
      cache.clear();

      const response: ApiResponse = {
        success: true,
        data: {
          message: 'All statistics refreshed successfully',
        },
        timestamp: new Date().toISOString(),
      };

      res.status(HTTP_STATUS.OK).json(response);
    } catch (error) {
      next(error);
    }
  }
}

export const statisticsController = new StatisticsController();