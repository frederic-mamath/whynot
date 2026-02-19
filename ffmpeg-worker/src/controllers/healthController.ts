// src/controllers/healthController.ts
import { Request, Response, Router } from "express";
import { StreamService } from "../services/StreamService";

/**
 * HealthController
 * HTTP endpoints for health checks and monitoring
 */
export class HealthController {
  public router: Router;
  private streamService: StreamService;

  constructor(streamService: StreamService) {
    this.streamService = streamService;
    this.router = Router();
    this.setupRoutes();
  }

  private setupRoutes(): void {
    // Health check endpoint
    this.router.get("/health", this.getHealth.bind(this));

    // Streams endpoint (debugging)
    this.router.get("/streams", this.getStreams.bind(this));

    // Stats endpoint
    this.router.get("/stats", this.getStats.bind(this));

    // Root endpoint
    this.router.get("/", this.getRoot.bind(this));
  }

  /**
   * GET /health
   * Returns health status of the worker
   */
  private getHealth(req: Request, res: Response): void {
    const stats = this.streamService.getStats();

    const health = {
      status: stats.activeStreams < stats.maxStreams ? "healthy" : "degraded",
      timestamp: new Date().toISOString(),
      uptime: process.uptime(),
      activeStreams: stats.activeStreams,
      maxStreams: stats.maxStreams,
      utilization: stats.utilization,
      memory: {
        used: process.memoryUsage().heapUsed / 1024 / 1024,
        total: process.memoryUsage().heapTotal / 1024 / 1024,
      },
    };

    const statusCode = health.status === "healthy" ? 200 : 503;
    res.status(statusCode).json(health);
  }

  /**
   * GET /streams
   * Returns list of active streams
   */
  private getStreams(req: Request, res: Response): void {
    const streams = this.streamService.getAllStreams();
    res.json({ count: streams.length, streams });
  }

  /**
   * GET /stats
   * Returns worker statistics
   */
  private getStats(req: Request, res: Response): void {
    const stats = this.streamService.getStats();
    res.json(stats);
  }

  /**
   * GET /
   * Returns service information
   */
  private getRoot(req: Request, res: Response): void {
    res.json({
      service: "whynot-ffmpeg-worker",
      version: "1.0.0",
      endpoints: ["/health", "/streams", "/stats"],
    });
  }
}
