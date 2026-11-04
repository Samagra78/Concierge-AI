import express, { Application, Request, Response, NextFunction } from 'express';
import cors from 'cors';
import helmet from 'helmet';
import cookieParser from 'cookie-parser';
import path from 'path';
import fs from 'fs';
import routes from './routes';
import { errorHandler } from './middleware/errorHandler';
import { config } from './config/env';

export function createApp(): Application {
  const app = express();

  // Security headers
  app.use(
    helmet({
      contentSecurityPolicy: false,
      crossOriginEmbedderPolicy: false,
    })
  );

  // CORS configuration
  app.use(
    cors({
      origin: [config.clientUrl, 'http://localhost:3000', 'http://127.0.0.1:3000', 'http://localhost:5173', 'http://127.0.0.1:5173'],
      credentials: true,
      methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
      allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With'],
    })
  );

  // Body and cookie parsing
  app.use(express.json());
  app.use(express.urlencoded({ extended: true }));
  app.use(cookieParser());

  // Mount API routes at both root and /api prefix for client convenience
  app.use('/api', routes);
  app.use(routes);

  // Database offline fallback per AI Studio Web migration guide
  app.use((err: any, req: Request, res: Response, next: NextFunction) => {
    if (
      err.name === 'MongooseError' ||
      err.name === 'MongoNetworkError' ||
      err.name === 'MongoServerSelectionError' ||
      (err.message && (err.message.includes('buffering timed out') || err.message.includes('topology was destroyed') || err.message.includes('server selection timed out')))
    ) {
      console.warn(`[AI Studio] Database offline — returning mock response for ${req.method} ${req.path}`);
      if (req.method === 'GET') {
        const resource = req.path.replace(/^\/api\//, '').replace(/^\//, '').split('/')[0] || 'items';
        return res.json({ success: true, [resource]: [] });
      }
      return res.status(503).json({ error: 'Service temporarily unavailable (database offline)' });
    }
    next(err);
  });

  // Centralized error handler
  app.use(errorHandler);

  // Serve static assets from client build directory
  const possiblePaths = [
    path.resolve(__dirname, '../../client/dist'),
    path.resolve(process.cwd(), 'client/dist'),
    path.resolve(__dirname, '../../../client/dist'),
  ];
  const clientDist = possiblePaths.find((p) => fs.existsSync(p)) || possiblePaths[0];

  if (fs.existsSync(clientDist)) {
    app.use(express.static(clientDist));
  }

  // SPA fallback for frontend client routing
  app.get('*', (req: Request, res: Response, next: NextFunction) => {
    if (
      req.path.startsWith('/api') ||
      req.path.startsWith('/auth') ||
      req.path.startsWith('/tasks') ||
      req.path.startsWith('/approvals') ||
      req.path.startsWith('/health')
    ) {
      return next();
    }
    const indexHtml = path.join(clientDist, 'index.html');
    if (fs.existsSync(indexHtml)) {
      return res.sendFile(indexHtml);
    }
    next();
  });

  return app;
}
