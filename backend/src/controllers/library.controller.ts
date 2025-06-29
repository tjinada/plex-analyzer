import { Request, Response, NextFunction } from 'express';
import { HTTP_STATUS, ERROR_MESSAGES } from '../config/constants';
import { analyzerService } from '../services/analyzer.service';
import { plexService } from '../services/plex.service';
import { ApiResponse } from '../models';

export class LibraryController {
  /**
   * Get all libraries with basic information
   */
  async getLibraries(_req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      if (!plexService.isReady()) {
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

      const response: ApiResponse = {
        success: true,
        data: libraries,
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

      if (!plexService.isReady()) {
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

      if (!plexService.isReady()) {
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

      if (!plexService.isReady()) {
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