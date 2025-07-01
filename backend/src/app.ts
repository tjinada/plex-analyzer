import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import path from 'path';
import { errorHandler } from './middleware/error.middleware';
import routes from './routes';

// Load environment variables from root .env file
dotenv.config({ path: path.join(__dirname, '..', '..', '.env') });

const app = express();
const PORT = process.env.PORT || 3000;

// Middleware
app.use(cors());
app.use(express.json());

// Health check endpoint
app.get('/health', (_req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

// API routes
app.use('/api', routes);

// Serve static files from frontend build
const frontendPath = path.join(__dirname, '..', '..', 'dist', 'frontend', 'browser');
app.use(express.static(frontendPath));

// Handle Angular routing - serve index.html for all non-API routes
// Use a more compatible approach that avoids path-to-regexp issues
app.use((req, res, next) => {
  // Skip if this is an API route
  if (req.path.startsWith('/api') || req.path.startsWith('/health')) {
    return next();
  }
  
  // Skip if this is a static file request (already handled by express.static)
  if (req.path.includes('.')) {
    return next();
  }
  
  // For all other routes, serve the Angular index.html
  res.sendFile(path.join(frontendPath, 'index.html'));
});

// Error handling middleware (must be last)
app.use(errorHandler);

// Start server only if not in test mode
if (process.env.NODE_ENV !== 'test') {
  app.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`);
  });
}

export default app;