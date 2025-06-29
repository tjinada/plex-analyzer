import { Request, Response, NextFunction } from 'express';
import { HTTP_STATUS } from '../config/constants';
import { config, updateConfig } from '../config';
import { ApiResponse } from '../models';

export class SettingsController {
  /**
   * Get current settings
   */
  async getSettings(_req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const response: ApiResponse = {
        success: true,
        data: {
          dataSource: config.settings.dataSource,
        },
        timestamp: new Date().toISOString(),
      };

      res.status(HTTP_STATUS.OK).json(response);
    } catch (error) {
      next(error);
    }
  }

  /**
   * Update settings
   */
  async updateSettings(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const { dataSource } = req.body;
      
      // Validate data source
      if (dataSource && !['plex', 'tautulli'].includes(dataSource)) {
        res.status(HTTP_STATUS.BAD_REQUEST).json({
          success: false,
          error: {
            message: 'Invalid data source. Must be either "plex" or "tautulli"',
            code: 'INVALID_DATA_SOURCE',
          },
          timestamp: new Date().toISOString(),
        });
        return;
      }

      // Update configuration
      const updated = updateConfig({
        settings: {
          dataSource: dataSource || config.settings.dataSource,
        },
      });

      if (!updated) {
        res.status(HTTP_STATUS.INTERNAL_SERVER_ERROR).json({
          success: false,
          error: {
            message: 'Failed to update settings',
            code: 'UPDATE_FAILED',
          },
          timestamp: new Date().toISOString(),
        });
        return;
      }

      const response: ApiResponse = {
        success: true,
        data: {
          dataSource: config.settings.dataSource,
        },
        timestamp: new Date().toISOString(),
      };

      res.status(HTTP_STATUS.OK).json(response);
    } catch (error) {
      next(error);
    }
  }
}

export const settingsController = new SettingsController();