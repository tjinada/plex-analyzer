import { Request, Response, NextFunction } from 'express';
import { HTTP_STATUS } from '../config/constants';
import { ApiResponse, PaginatedApiResponse, PaginationParams } from '../models';
import { analyzerService } from '../services/analyzer-factory';
import { validatePaginationParams } from '../utils/pagination.util';

export class AnalyzerController {
  /**
   * Get comprehensive library analysis
   */
  async getLibraryAnalysis(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const libraryId = req.params.libraryId;
      
      if (!libraryId) {
        res.status(HTTP_STATUS.BAD_REQUEST).json({
          success: false,
          error: {
            message: 'Library ID is required',
            code: 'MISSING_LIBRARY_ID',
          },
          timestamp: new Date().toISOString(),
        });
        return;
      }

      const analysis = await analyzerService.getLibraryAnalysis(libraryId);
      
      const response: ApiResponse = {
        success: true,
        data: analysis,
        timestamp: new Date().toISOString(),
      };

      res.status(HTTP_STATUS.OK).json(response);
    } catch (error) {
      next(error);
    }
  }

  /**
   * Get size analysis for a library
   */
  async getSizeAnalysis(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const libraryId = req.params.libraryId;
      
      if (!libraryId) {
        res.status(HTTP_STATUS.BAD_REQUEST).json({
          success: false,
          error: {
            message: 'Library ID is required',
            code: 'MISSING_LIBRARY_ID',
          },
          timestamp: new Date().toISOString(),
        });
        return;
      }

      // Extract and validate pagination parameters
      const paginationParams: PaginationParams = {
        limit: req.query.limit ? parseInt(req.query.limit as string, 10) : undefined,
        offset: req.query.offset ? parseInt(req.query.offset as string, 10) : undefined
      };
      
      const { limit, offset } = validatePaginationParams(paginationParams, 'size');
      const result = await analyzerService.getSizeAnalysis(libraryId, limit, offset);
      
      const response: PaginatedApiResponse = {
        success: true,
        data: result.data,
        pagination: result.pagination,
        timestamp: new Date().toISOString(),
      };

      res.status(HTTP_STATUS.OK).json(response);
    } catch (error) {
      next(error);
    }
  }

  /**
   * Get quality analysis for a library
   */
  async getQualityAnalysis(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const libraryId = req.params.libraryId;
      
      if (!libraryId) {
        res.status(HTTP_STATUS.BAD_REQUEST).json({
          success: false,
          error: {
            message: 'Library ID is required',
            code: 'MISSING_LIBRARY_ID',
          },
          timestamp: new Date().toISOString(),
        });
        return;
      }

      // Extract and validate pagination parameters
      const paginationParams: PaginationParams = {
        limit: req.query.limit ? parseInt(req.query.limit as string, 10) : undefined,
        offset: req.query.offset ? parseInt(req.query.offset as string, 10) : undefined
      };
      
      const { limit, offset } = validatePaginationParams(paginationParams, 'quality');
      const result = await analyzerService.getQualityAnalysis(libraryId, limit, offset);
      
      const response: PaginatedApiResponse = {
        success: true,
        data: result.data,
        pagination: result.pagination,
        timestamp: new Date().toISOString(),
      };

      res.status(HTTP_STATUS.OK).json(response);
    } catch (error) {
      next(error);
    }
  }

  /**
   * Get content analysis for a library
   */
  async getContentAnalysis(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const libraryId = req.params.libraryId;
      
      if (!libraryId) {
        res.status(HTTP_STATUS.BAD_REQUEST).json({
          success: false,
          error: {
            message: 'Library ID is required',
            code: 'MISSING_LIBRARY_ID',
          },
          timestamp: new Date().toISOString(),
        });
        return;
      }

      // Extract and validate pagination parameters
      const paginationParams: PaginationParams = {
        limit: req.query.limit ? parseInt(req.query.limit as string, 10) : undefined,
        offset: req.query.offset ? parseInt(req.query.offset as string, 10) : undefined
      };
      
      const { limit, offset } = validatePaginationParams(paginationParams, 'content');
      const result = await analyzerService.getContentAnalysis(libraryId, limit, offset);
      
      const response: PaginatedApiResponse = {
        success: true,
        data: result.data,
        pagination: result.pagination,
        timestamp: new Date().toISOString(),
      };

      res.status(HTTP_STATUS.OK).json(response);
    } catch (error) {
      next(error);
    }
  }

  /**
   * Refresh analysis data for a library
   */
  async refreshAnalysis(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const libraryId = req.params.libraryId;
      
      if (!libraryId) {
        res.status(HTTP_STATUS.BAD_REQUEST).json({
          success: false,
          error: {
            message: 'Library ID is required',
            code: 'MISSING_LIBRARY_ID',
          },
          timestamp: new Date().toISOString(),
        });
        return;
      }

      await analyzerService.refreshAnalysis(libraryId);
      
      const response: ApiResponse = {
        success: true,
        data: {
          message: 'Analysis refresh started',
          libraryId: libraryId,
        },
        timestamp: new Date().toISOString(),
      };

      res.status(HTTP_STATUS.OK).json(response);
    } catch (error) {
      next(error);
    }
  }
}

export const analyzerController = new AnalyzerController();