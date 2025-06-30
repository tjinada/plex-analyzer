import { Router, Request, Response } from 'express';
import { contentManagerService } from '../services/content-manager.service';

const router = Router();

/**
 * Get combined content summary from both Radarr and Sonarr
 */
router.get('/summary', async (_req: Request, res: Response) => {
  try {
    const summary = await contentManagerService.getContentSummary();
    res.json(summary);
  } catch (error) {
    console.error('Error fetching content summary:', error);
    res.status(500).json({ 
      error: 'Failed to fetch content summary',
      message: error instanceof Error ? error.message : 'Unknown error'
    });
  }
});

/**
 * Get combined download queue from both services
 */
router.get('/queue', async (_req: Request, res: Response) => {
  try {
    const queue = await contentManagerService.getCombinedQueue();
    res.json(queue);
  } catch (error) {
    console.error('Error fetching combined queue:', error);
    res.status(500).json({ 
      error: 'Failed to fetch queue',
      message: error instanceof Error ? error.message : 'Unknown error'
    });
  }
});

/**
 * Get status of both Radarr and Sonarr services
 */
router.get('/services/status', async (_req: Request, res: Response) => {
  try {
    const status = await contentManagerService.getServicesStatus();
    res.json(status);
  } catch (error) {
    console.error('Error fetching services status:', error);
    res.status(500).json({ 
      error: 'Failed to fetch services status',
      message: error instanceof Error ? error.message : 'Unknown error'
    });
  }
});

export default router;