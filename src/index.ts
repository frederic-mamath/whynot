import express from 'express';
import cors from 'cors';
import path from 'path';
import { fileURLToPath } from 'url';
import * as trpcExpress from '@trpc/server/adapters/express';
import { appRouter } from './routers';
import { Context } from './types/context';
import { verifyToken } from './utils/auth';
import { logger } from './utils/logger';
import * as dotenv from 'dotenv';

dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const port = process.env.PORT || 3000;

app.use(cors());
app.use(express.json());
app.use(logger);

const createContext = ({
  req,
}: trpcExpress.CreateExpressContextOptions): Context => {
  const token = req.headers.authorization?.replace('Bearer ', '');
  
  if (token) {
    const payload = verifyToken(token);
    if (payload) {
      return { userId: payload.userId };
    }
  }
  
  return {};
};

// Health check endpoint
app.get('/health', (req, res) => {
  res.json({ status: 'ok' });
});

// tRPC endpoint
app.use(
  '/trpc',
  trpcExpress.createExpressMiddleware({
    router: appRouter,
    createContext,
    onError: ({ path, error }) => {
      const timestamp = new Date().toISOString().replace('T', ' ').substring(0, 19);
      console.error(`${timestamp} ERROR [${path}]:`, error.message);
      if (error.code === 'INTERNAL_SERVER_ERROR') {
        console.error('Stack:', error.stack);
      }
    },
  })
);

// Serve static files from the dist directory
const clientDistPath = path.join(__dirname, '..', 'dist', 'client');
app.use(express.static(clientDistPath));

// Handle client-side routing - send all non-API/health requests to index.html
app.use((req, res, next) => {
  // Don't handle /trpc or /health routes
  if (req.path.startsWith('/trpc') || req.path === '/health') {
    return next();
  }
  // Send all other routes to index.html for client-side routing
  res.sendFile(path.join(clientDistPath, 'index.html'));
});

app.listen(port, () => {
  console.log(`Server running on http://localhost:${port}`);
  console.log(`tRPC endpoint: http://localhost:${port}/trpc`);
  console.log(`Frontend served from: http://localhost:${port}`);
});
