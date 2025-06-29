import { Request, Response, NextFunction } from 'express';
import { HTTP_STATUS } from '../config/constants';
import { ApiResponse } from '../models';
import { analyzerService } from '../services/analyzer-factory';

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
      const limit = req.query.limit ? parseInt(req.query.limit as string, 10) : undefined;
      
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

      const sizeAnalysis = await analyzerService.getSizeAnalysis(libraryId, limit);
      
      const response: ApiResponse = {
        success: true,
        data: sizeAnalysis,
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
      const limit = req.query.limit ? parseInt(req.query.limit as string, 10) : undefined;
      
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

      const qualityAnalysis = await analyzerService.getQualityAnalysis(libraryId, limit);
      
      const response: ApiResponse = {
        success: true,
        data: qualityAnalysis,
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
      const limit = req.query.limit ? parseInt(req.query.limit as string, 10) : undefined;
      
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

      const contentAnalysis = await analyzerService.getContentAnalysis(libraryId, limit);
      
      const response: ApiResponse = {
        success: true,
        data: contentAnalysis,
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