import express from "express";
import cors from "cors";
import * as trpcExpress from "@trpc/server/adapters/express";
import { appRouter } from "./routers";
import { Context } from "./types/context";
import { verifyToken } from "./utils/auth";
import { logger } from "./utils/logger";
import { createWebSocketServer } from "./websocket/server";
import { securityHeaders, rateLimit, requestLogger } from "./middleware/security";
import { startAuctionProcessor, stopAuctionProcessor } from "./jobs/auctionProcessor";
import * as dotenv from "dotenv";
import path from "path";

dotenv.config();

const app = express();
const port = process.env.PORT || 3000;
const isProduction = process.env.NODE_ENV === 'production';

// @ts-ignore
if (typeof PhusionPassenger !== "undefined") {
  // @ts-ignore
  PhusionPassenger.configure({ autoInstall: false });
}

// Trust proxy (required for Heroku to get correct client IP)
app.set('trust proxy', 1);

// Security headers (apply first)
app.use(securityHeaders);

// CORS - only needed in development (different origins)
if (!isProduction) {
  app.use(cors({
    origin: process.env.CORS_ORIGIN?.split(',') || ['http://localhost:5173'],
    credentials: true,
  }));
}

// Stripe webhook endpoint (MUST be before express.json())
app.post(
  '/api/webhooks/stripe',
  express.raw({ type: 'application/json' }),
  async (req, res) => {
    const sig = req.headers['stripe-signature'];
    
    if (!sig || Array.isArray(sig) || !process.env.STRIPE_WEBHOOK_SECRET) {
      return res.status(400).send('Missing signature or webhook secret');
    }

    try {
      const { stripeService } = await import('./services/StripeService');
      const { db } = await import('./db');
      
      const event = stripeService.verifyWebhookSignature(
        req.body,
        sig,
        process.env.STRIPE_WEBHOOK_SECRET
      );

      switch (event.type) {
        case 'payment_intent.succeeded': {
          const paymentIntent = event.data.object as any;
          const orderId = paymentIntent.metadata?.orderId;

          if (orderId) {
            await db
              .updateTable('orders')
              .set({
                payment_status: 'paid',
                paid_at: new Date(),
              })
              .where('id', '=', orderId)
              .execute();
            
            console.log(`✅ Order ${orderId} marked as paid`);
          }
          break;
        }

        case 'payment_intent.payment_failed': {
          const paymentIntent = event.data.object as any;
          const orderId = paymentIntent.metadata?.orderId;

          if (orderId) {
            await db
              .updateTable('orders')
              .set({ payment_status: 'failed' })
              .where('id', '=', orderId)
              .execute();
            
            console.log(`❌ Order ${orderId} payment failed`);
          }
          break;
        }

        case 'charge.refunded': {
          const charge = event.data.object as any;
          const paymentIntentId = charge.payment_intent;

          if (paymentIntentId) {
            await db
              .updateTable('orders')
              .set({ payment_status: 'refunded' })
              .where('stripe_payment_intent_id', '=', paymentIntentId)
              .execute();
            
            console.log(`💰 Order refunded for payment intent ${paymentIntentId}`);
          }
          break;
        }
      }

      res.json({ received: true });
    } catch (err: any) {
      console.error('Webhook error:', err);
      res.status(400).send(`Webhook Error: ${err.message}`);
    }
  }
);

// Body parsing
app.use(express.json());

// Request logging
app.use(requestLogger);

const createContext = ({
  req,
}: trpcExpress.CreateExpressContextOptions): Context => {
  const token = req.headers.authorization?.replace("Bearer ", "");

  if (token) {
    const payload = verifyToken(token);
    if (payload) {
      return { userId: payload.userId };
    }
  }

  return {};
};

// Health check endpoint (no auth, no rate limiting)
app.get("/health", (req, res) => {
  res.json({ 
    status: "ok",
    timestamp: new Date().toISOString(),
    environment: process.env.NODE_ENV || 'development',
  });
});

// tRPC endpoint with rate limiting
app.use(
  "/trpc",
  rateLimit(100, 60000), // 100 requests per minute per IP
  trpcExpress.createExpressMiddleware({
    router: appRouter,
    createContext,
    onError: ({ path, error }) => {
      const timestamp = new Date()
        .toISOString()
        .replace("T", " ")
        .substring(0, 19);
      console.error(`${timestamp} ERROR [${path}]:`, error.message);
      if (error.code === "INTERNAL_SERVER_ERROR") {
        console.error("Stack:", error.stack);
      }
    },
  }),
);

// Serve static files from Vite build
const publicPath = path.join(__dirname, 'public');

console.log(`📦 __dirname: ${__dirname}`);
console.log(`📦 Serving static files from: ${publicPath}`);
console.log(`📦 Files in public:`, require('fs').existsSync(publicPath) ? require('fs').readdirSync(publicPath) : 'DIRECTORY DOES NOT EXIST');

// Serve static assets with caching
app.use(express.static(publicPath, {
  maxAge: process.env.NODE_ENV === 'production' ? '1y' : '0',
  immutable: process.env.NODE_ENV === 'production',
  index: 'index.html',
  setHeaders: (res, filePath) => {
    // Don't cache index.html (entry point)
    if (filePath.endsWith('index.html')) {
      res.setHeader('Cache-Control', 'no-cache, no-store, must-revalidate');
    }
  },
}));

// Fallback to index.html for client-side routing (SPA)
// Only for routes that don't match static files or API routes
app.use((req, res, next) => {
  // Skip if it's an API route or static file was found
  if (req.path.startsWith('/trpc') || req.path.startsWith('/health')) {
    return next();
  }
  // Serve index.html for all other routes (SPA routing)
  res.sendFile(path.join(publicPath, 'index.html'));
});

// @ts-ignore
if (typeof PhusionPassenger !== "undefined") {
  app.listen("passenger", () => {
    console.log(`Server running on https://api.whynot.mamath.fr:${port}`);
    console.log(`tRPC endpoint: https://api.whynot.mamath.fr:${port}/trpc`);
  });
} else {
  const server = app.listen(port, () => {
    console.log(`🚀 HTTP server running on http://localhost:${port}`);
    console.log(`📡 tRPC endpoint: http://localhost:${port}/trpc`);
    console.log(`🔒 Security: ${isProduction ? 'PRODUCTION mode (CORS disabled, SSL enforced)' : 'DEVELOPMENT mode (CORS enabled)'}`);
    console.log(`⚡ Rate limiting: enabled (100 req/min per IP)`);
    
    // Start background jobs
    startAuctionProcessor();
  });

  // Attach WebSocket to same HTTP server
  const { wss } = createWebSocketServer(server);

  // Graceful shutdown
  // NOTE: When running via `npm run dev`, Ctrl+C may not work properly.
  // Use `npm start` directly or kill the process manually if needed.
  const shutdown = async (signal: string) => {
    console.log(`\n${signal} received, shutting down gracefully...`);
    
    // Stop background jobs first
    stopAuctionProcessor();
    
    // Set a timeout to force exit if graceful shutdown takes too long
    const forceExitTimeout = setTimeout(() => {
      console.log('Force exiting after 2 second timeout');
      process.exit(0);
    }, 2000); // 2 second timeout
    
    try {
      // Close WebSocket server
      await new Promise<void>((resolve, reject) => {
        const timeout = setTimeout(() => reject(new Error('WebSocket close timeout')), 1000);
        wss.close(() => {
          clearTimeout(timeout);
          console.log('WebSocket server closed');
          resolve();
        });
      });
      
      // Close HTTP server
      await new Promise<void>((resolve, reject) => {
        const timeout = setTimeout(() => reject(new Error('HTTP close timeout')), 1000);
        server.close(() => {
          clearTimeout(timeout);
          console.log('HTTP server closed');
          resolve();
        });
      });
      
      clearTimeout(forceExitTimeout);
      console.log('Shutdown complete');
      process.exit(0);
    } catch (error) {
      console.log('Shutdown error (forcing exit):', (error as Error).message);
      clearTimeout(forceExitTimeout);
      process.exit(0);
    }
  };
  
  process.on('SIGTERM', () => shutdown('SIGTERM'));
  process.on('SIGINT', () => shutdown('SIGINT'));
  
  console.log('✅ Shutdown handlers registered (Ctrl+C to exit)');
}
