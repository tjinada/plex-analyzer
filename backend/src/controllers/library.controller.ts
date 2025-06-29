import { Request, Response, NextFunction } from 'express';
import { HTTP_STATUS, ERROR_MESSAGES } from '../config/constants';
import { analyzerService } from '../services/analyzer-factory';
import { plexService } from '../services/plex.service';
import { tautulliService } from '../services/tautulli.service';
import { config } from '../config';
import { ApiResponse } from '../models';

export class LibraryController {
  /**
   * Get all libraries with enhanced information (counts and sizes)
   */
  async getLibraries(_req: Request, res: Response, next: NextFunction): Promise<void> {
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

      // Get basic library information
      const basicLibraries = await analyzerService.getLibraries();
      
      // Enhance each library with actual item counts and sizes
      const enhancedLibraries = await Promise.all(
        basicLibraries.map(async (library) => {
          try {
            // Get actual library items to count them
            const items = await plexService.getLibraryItems(library.id);
            
            // Get size analysis for total size
            const sizeAnalysis = await analyzerService.getSizeAnalysis(library.id);
            
            return {
              ...library,
              itemCount: items.length,
              totalSize: sizeAnalysis.totalSize
            };
          } catch (error) {
            console.warn(`Failed to enhance library ${library.title}:`, error);
            // Return original library data if enhancement fails
            return library;
          }
        })
      );

      const response: ApiResponse = {
        success: true,
        data: enhancedLibraries,
        timestamp: new Date().toISOString(),
      };

      res.status(HTTP_STATUS.OK).json(response);
    } catch (error) {
      next(error);
    }
  }

  /**
   * Get detailed information about a specific library
   */
  async getLibrary(req: Request, res: Response, next: NextFunction): Promise<void> {
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

      // Get library basic info
      const libraries = await analyzerService.getLibraries();
      const library = libraries.find(lib => lib.id === libraryId);

      if (!library) {
        res.status(HTTP_STATUS.NOT_FOUND).json({
          success: false,
          error: {
            message: 'Library not found',
            code: 'LIBRARY_NOT_FOUND',
          },
          timestamp: new Date().toISOString(),
        });
        return;
      }

      const response: ApiResponse = {
        success: true,
        data: library,
        timestamp: new Date().toISOString(),
      };

      res.status(HTTP_STATUS.OK).json(response);
    } catch (error) {
      next(error);
    }
  }

  /**
   * Get all items in a specific library
   */
  async getLibraryItems(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const { libraryId } = req.params;
      const { limit = '50', offset = '0' } = req.query;

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

      const items = await plexService.getLibraryItems(libraryId);
      
      // Apply pagination (YAGNI - simple implementation)
      const limitNum = parseInt(limit as string, 10);
      const offsetNum = parseInt(offset as string, 10);
      const paginatedItems = items.slice(offsetNum, offsetNum + limitNum);

      const response: ApiResponse = {
        success: true,
        data: {
          items: paginatedItems,
          total: items.length,
          limit: limitNum,
          offset: offsetNum,
        },
        timestamp: new Date().toISOString(),
      };

      res.status(HTTP_STATUS.OK).json(response);
    } catch (error) {
      next(error);
    }
  }

  /**
   * Get detailed information about a specific media item
   */
  async getMediaItem(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const { itemId } = req.params;

      if (!itemId) {
        res.status(HTTP_STATUS.BAD_REQUEST).json({
          success: false,
          error: {
            message: 'Invalid item ID',
            code: 'INVALID_ITEM_ID',
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

      const item = await plexService.getMediaDetails(itemId);

      if (!item) {
        res.status(HTTP_STATUS.NOT_FOUND).json({
          success: false,
          error: {
            message: 'Media item not found',
            code: 'ITEM_NOT_FOUND',
          },
          timestamp: new Date().toISOString(),
        });
        return;
      }

      const response: ApiResponse = {
        success: true,
        data: item,
        timestamp: new Date().toISOString(),
      };

      res.status(HTTP_STATUS.OK).json(response);
    } catch (error) {
      next(error);
    }
  }

  /**
   * Refresh library data (clear cache)
   */
  async refreshLibrary(req: Request, res: Response, next: NextFunction): Promise<void> {
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

      // Clear cache for this library
      const { cache } = await import('../utils/cache.util');
      cache.delete(`library_stats_${libraryId}`);
      cache.delete('libraries');
      cache.delete('global_stats');

      const response: ApiResponse = {
        success: true,
        data: {
          message: `Library ${libraryId} data refreshed`,
        },
        timestamp: new Date().toISOString(),
      };

      res.status(HTTP_STATUS.OK).json(response);
    } catch (error) {
      next(error);
    }
  }
}

export const libraryController = new LibraryController();