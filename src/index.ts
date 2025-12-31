import express from "express";
import cors from "cors";
import * as trpcExpress from "@trpc/server/adapters/express";
import { appRouter } from "./routers";
import { Context } from "./types/context";
import { verifyToken } from "./utils/auth";
import { logger } from "./utils/logger";
import { createWebSocketServer } from "./websocket/server";
import * as dotenv from "dotenv";

dotenv.config();

const app = express();
const port = process.env.PORT || 3000;
const wsPort = process.env.WS_PORT || 3001;

// @ts-ignore
if (typeof PhusionPassenger !== "undefined") {
  // @ts-ignore
  PhusionPassenger.configure({ autoInstall: false });
}

app.use(cors({
  origin: process.env.CORS_ORIGIN?.split(',') || ['http://localhost:5173'],
  credentials: true,
}));
app.use(express.json());
app.use(logger);

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

// Health check endpoint
app.get("/health", (req, res) => {
  res.json({ status: "ok" });
});

// tRPC endpoint
app.use(
  "/trpc",
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
  });

  // Start WebSocket server (only in non-Passenger mode)
  const { wss } = createWebSocketServer(Number(wsPort));

  // Graceful shutdown
  process.on('SIGTERM', async () => {
    console.log('SIGTERM received, shutting down gracefully...');
    wss.close(() => {
      console.log('WebSocket server closed');
      server.close(() => {
        console.log('HTTP server closed');
        process.exit(0);
      });
    });
  });

  process.on('SIGINT', async () => {
    console.log('\nSIGINT received, shutting down gracefully...');
    wss.close(() => {
      console.log('WebSocket server closed');
      server.close(() => {
        console.log('HTTP server closed');
        process.exit(0);
      });
    });
  });
}
