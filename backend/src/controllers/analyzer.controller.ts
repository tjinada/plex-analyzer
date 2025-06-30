import { Request, Response, NextFunction } from 'express';
import { HTTP_STATUS } from '../config/constants';
import { ApiResponse, PaginatedApiResponse, PaginationParams } from '../models';
import { analyzerService } from '../services/analyzer-factory';
import { enhancedAnalyzerService } from '../services/enhanced-analyzer.service';
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
   * Get enhanced size analysis with quality metrics
   */
  async getEnhancedSizeAnalysis(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const libraryId = req.params.libraryId;
      console.log(`=====================================`);
      console.log(`[AnalyzerController] *** ENHANCED ENDPOINT HIT ***`);
      console.log(`[AnalyzerController] Library: ${libraryId}, Query:`, req.query);
      console.log(`=====================================`);
      
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
        limit: req.query.limit ? parseInt(req.query.limit as string, 10) : -1, // Default to all items for enhanced view
        offset: req.query.offset ? parseInt(req.query.offset as string, 10) : undefined
      };
      
      const { limit, offset } = validatePaginationParams(paginationParams, 'size');
      console.log(`[AnalyzerController] Calling enhancedAnalyzerService with limit: ${limit}, offset: ${offset}`);
      const result = await enhancedAnalyzerService.generateEnhancedSizeAnalysis(libraryId, limit, offset);
      console.log(`[AnalyzerController] Received result with ${result.data.largestFiles.length} files`);
      
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
   * Get technical analysis for a specific file
   */
  async getFileAnalysis(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const fileId = req.params.fileId;
      
      if (!fileId) {
        res.status(HTTP_STATUS.BAD_REQUEST).json({
          success: false,
          error: {
            message: 'File ID is required',
            code: 'MISSING_FILE_ID',
          },
          timestamp: new Date().toISOString(),
        });
        return;
      }

      // This would need to be implemented in the enhanced analyzer service
      // For now, return a placeholder response
      const response: ApiResponse = {
        success: true,
        data: {
          message: 'File analysis endpoint - implementation pending',
          fileId: fileId,
        },
        timestamp: new Date().toISOString(),
      };

      res.status(HTTP_STATUS.OK).json(response);
    } catch (error) {
      next(error);
    }
  }

  /**
   * Get quality metrics overview for a library
   */
  async getQualityMetrics(req: Request, res: Response, next: NextFunction): Promise<void> {
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

      // Generate enhanced analysis and extract quality metrics
      const enhancedAnalysis = await enhancedAnalyzerService.generateEnhancedSizeAnalysis(libraryId, -1, 0);
      
      const qualityMetrics = {
        qualityDistribution: enhancedAnalysis.data.qualityDistribution,
        codecDistribution: enhancedAnalysis.data.codecDistribution,
        technicalBreakdown: enhancedAnalysis.data.technicalBreakdown,
        upgradeRecommendations: enhancedAnalysis.data.upgradeRecommendations
      };

      const response: ApiResponse = {
        success: true,
        data: qualityMetrics,
        timestamp: new Date().toISOString(),
      };

      res.status(HTTP_STATUS.OK).json(response);
    } catch (error) {
      next(error);
    }
  }

  /**
   * Get upgrade recommendations for a library
   */
  async getUpgradeRecommendations(req: Request, res: Response, next: NextFunction): Promise<void> {
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

      // Generate enhanced analysis and extract upgrade recommendations
      const enhancedAnalysis = await enhancedAnalyzerService.generateEnhancedSizeAnalysis(libraryId, -1, 0);
      
      const response: ApiResponse = {
        success: true,
        data: {
          recommendations: enhancedAnalysis.data.upgradeRecommendations,
          summary: {
            totalItems: enhancedAnalysis.data.largestFiles.length,
            upgradeOpportunities: enhancedAnalysis.data.upgradeRecommendations.length,
            qualityDistribution: enhancedAnalysis.data.qualityDistribution
          }
        },
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