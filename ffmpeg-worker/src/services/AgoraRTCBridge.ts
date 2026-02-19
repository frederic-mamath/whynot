import puppeteer, { Browser, Page } from "puppeteer";
import { Writable } from "stream";
import { convertRGBAtoYUV420 } from "../utils/frameConverter";

export interface RTCBridgeConfig {
  appId: string;
  channelName: string;
  token: string;
  workerUid: number;
}

interface AgoraState {
  client: any;
  videoTrack: any;
  audioTrack: any;
  videoReady: boolean;
  audioReady: boolean;
  joined: boolean;
  error: string | null;
}

/**
 * AgoraRTCBridge - Subscribes to Agora RTC using Puppeteer + Web SDK
 * Acts as a virtual buyer that receives seller's stream
 */
export class AgoraRTCBridge {
  private browser: Browser | null = null;
  private page: Page | null = null;
  private frameStream: Writable | null = null;
  private captureInterval: NodeJS.Timeout | null = null;
  private frameCount: number = 0;
  private lastFrameTime: number = 0;
  private isCapturing: boolean = false;

  async connect(config: RTCBridgeConfig): Promise<void> {
    console.log(
      `🌐 Launching headless browser for channel ${config.channelName}`,
    );

    try {
      // Launch Puppeteer with optimized flags
      this.browser = await puppeteer.launch({
        headless: true,
        args: [
          "--no-sandbox",
          "--disable-setuid-sandbox",
          "--disable-dev-shm-usage",
          "--disable-accelerated-2d-canvas",
          "--disable-gpu",
          "--disable-software-rasterizer",
          "--disable-web-security", // Allow loading Agora SDK from CDN
        ],
      });

      this.page = await this.browser.newPage();

      // Set viewport for consistent video resolution
      await this.page.setViewport({
        width: 640,
        height: 360,
      });

      // Enable console logs from browser
      this.page.on("console", (msg) => {
        const text = msg.text();
        if (text.includes("✅")) {
          console.log(`[Browser] ${text}`);
        } else if (text.includes("error") || text.includes("Error")) {
          console.error(`[Browser Error] ${text}`);
        }
      });

      // Log page errors
      this.page.on("pageerror", (error) => {
        const message = error instanceof Error ? error.message : String(error);
        console.error("[Browser Page Error]", message);
      });

      // Navigate to subscriber page with query params
      const url = `http://localhost:3001/rtc-subscriber.html?appId=${config.appId}&channel=${config.channelName}&token=${encodeURIComponent(config.token)}`;
      console.log(`📄 Loading RTC subscriber page...`);

      await this.page.goto(url, {
        waitUntil: "networkidle2",
        timeout: 30000,
      });

      console.log("⏳ Waiting for RTC connection...");

      // Wait for Agora client to join
      await this.waitForConnection();

      console.log(`✅ RTC Bridge connected to channel ${config.channelName}`);
    } catch (error) {
      console.error("Failed to connect RTC bridge:", error);
      await this.cleanup();
      throw error;
    }
  }

  /**
   * Wait for Agora client to join the channel
   */
  private async waitForConnection(): Promise<void> {
    if (!this.page) throw new Error("Page not initialized");

    try {
      await this.page.waitForFunction(
        () => {
          // @ts-ignore - window is available in browser context
          return window.agoraState?.joined === true;
        },
        { timeout: 30000 },
      );

      console.log("✅ Joined Agora channel");
    } catch (error) {
      // Get error details from page
      const state = await this.getAgoraState();
      if (state?.error) {
        throw new Error(`Agora join failed: ${state.error}`);
      }
      throw new Error("Timeout waiting for Agora connection");
    }
  }

  /**
   * Wait for video and audio tracks to be ready
   */
  async waitForTracks(timeout: number = 60000): Promise<void> {
    if (!this.page) throw new Error("Page not initialized");

    console.log("⏳ Waiting for seller to publish video/audio...");

    try {
      await this.page.waitForFunction(
        () => {
          // @ts-ignore - window is available in browser context
          const state = window.agoraState;
          return state?.videoReady === true && state?.audioReady === true;
        },
        { timeout },
      );

      console.log("📹 Video and audio tracks ready");
    } catch (error) {
      const state = await this.getAgoraState();
      console.warn(
        "Track readiness:",
        state?.videoReady ? "✅ Video" : "❌ Video",
        state?.audioReady ? "✅ Audio" : "❌ Audio",
      );

      if (!state?.videoReady && !state?.audioReady) {
        throw new Error(
          "Timeout: No video or audio tracks received from seller",
        );
      }

      // Continue if at least video is ready (audio optional)
      if (!state?.videoReady) {
        throw new Error("Timeout: No video track received from seller");
      }

      console.log("⚠️ Continuing with video only (no audio track)");
    }
  }

  /**
   * Get current Agora state from the browser
   */
  private async getAgoraState(): Promise<AgoraState | null> {
    if (!this.page) return null;

    try {
      const state = await this.page.evaluate(() => {
        // @ts-ignore - window is available in browser context
        return window.agoraState;
      });
      return state;
    } catch (error) {
      console.error("Failed to get Agora state:", error);
      return null;
    }
  }

  /**
   * Start capturing frames and pipe to writable stream (FFmpeg stdin)
   */
  async startFrameCapture(outputStream: Writable): Promise<void> {
    if (!this.page) throw new Error("Page not initialized");

    this.frameStream = outputStream;
    this.lastFrameTime = Date.now();
    this.isCapturing = true;

    // Increase max listeners to prevent warning
    outputStream.setMaxListeners(20);

    console.log("🎬 Starting frame capture at 10 FPS...");

    const TARGET_FPS = 10;
    const FRAME_INTERVAL_MS = Math.floor(1000 / TARGET_FPS);

    // Use recursive timeout instead of setInterval to prevent overlapping
    const captureLoop = async () => {
      if (!this.isCapturing) return;

      const startTime = Date.now();

      try {
        await this.captureAndWriteFrame();
      } catch (error) {
        if (
          error instanceof Error &&
          !error.message.includes("execution context") &&
          !error.message.includes("Target closed")
        ) {
          console.error("Frame capture error:", error);
        }
      }

      // Schedule next capture to maintain target FPS
      const elapsed = Date.now() - startTime;
      const delay = Math.max(0, FRAME_INTERVAL_MS - elapsed);

      if (this.isCapturing) {
        this.captureInterval = setTimeout(captureLoop, delay) as any;
      }
    };

    // Start the loop
    captureLoop();

    console.log(`✅ Frame capture loop started (${TARGET_FPS} FPS)`);
  }

  /**
   * Capture a single frame and write to stream
   */
  private async captureAndWriteFrame(): Promise<void> {
    if (!this.page || !this.frameStream) return;

    try {
      // Get frame data from browser
      const frameData = await this.page.evaluate(() => {
        // @ts-ignore - window is available in browser context
        return window.getVideoFrame ? window.getVideoFrame() : null;
      });

      if (!frameData || !frameData.data) {
        // No frame available yet (video not ready)
        return;
      }

      // Convert Array to Uint8ClampedArray
      const rgbaData = new Uint8ClampedArray(frameData.data);

      // Convert RGBA to YUV420p
      const yuvData = convertRGBAtoYUV420(
        rgbaData,
        frameData.width,
        frameData.height,
      );

      // Write YUV frame to FFmpeg stdin
      const written = this.frameStream.write(Buffer.from(yuvData));

      this.frameCount++;

      // Log progress every 30 frames (1 second)
      if (this.frameCount % 30 === 0) {
        const elapsed = (Date.now() - this.lastFrameTime) / 1000;
        const actualFps = (30 / elapsed).toFixed(1);
        console.log(
          `📹 Captured ${this.frameCount} frames (current FPS: ${actualFps})`,
        );
        this.lastFrameTime = Date.now();
      }

      // Handle backpressure
      if (!written) {
        // Stream buffer is full, wait for drain
        await new Promise((resolve) =>
          this.frameStream?.once("drain", resolve),
        );
      }
    } catch (error) {
      // Only log significant errors
      if (
        error instanceof Error &&
        !error.message.includes("execution context")
      ) {
        console.error("Error capturing frame:", error);
      }
    }
  }

  /**
   * Stop capturing and disconnect
   */
  async disconnect(): Promise<void> {
    console.log("🛑 Disconnecting RTC Bridge");
    await this.cleanup();
    console.log("✅ RTC Bridge disconnected");
  }

  /**
   * Cleanup resources
   */
  private async cleanup(): Promise<void> {
    // Stop frame capture
    this.isCapturing = false;
    if (this.captureInterval) {
      clearTimeout(this.captureInterval);
      this.captureInterval = null;
    }

    // Leave Agora channel
    if (this.page) {
      try {
        await Promise.race([
          this.page.evaluate(() => {
            // @ts-ignore - window is available in browser context
            if (window.cleanup) {
              // @ts-ignore
              window.cleanup();
            }
          }),
          new Promise((resolve) => setTimeout(resolve, 2000)), // 2s timeout
        ]);
      } catch (error) {
        console.error("Error during Agora cleanup:", error);
      }
    }

    // Close browser (with timeout to prevent hanging)
    if (this.browser) {
      try {
        await Promise.race([
          this.browser.close(),
          new Promise((resolve) => setTimeout(resolve, 3000)), // 3s timeout
        ]);

        // If still alive after timeout, force kill the process
        const pid = this.browser.process()?.pid;
        if (pid) {
          try {
            process.kill(pid, "SIGKILL");
            console.log(`🔪 Force killed browser process ${pid}`);
          } catch (err) {
            // Process might already be dead
          }
        }
      } catch (error) {
        console.error("Error closing browser:", error);
      }
    }

    this.browser = null;
    this.page = null;
    this.frameStream = null;
  }

  /**
   * Check if bridge is connected
   */
  async isConnected(): Promise<boolean> {
    const state = await this.getAgoraState();
    return state?.joined === true;
  }

  /**
   * Check if video/audio tracks are ready
   */
  async hasVideoTrack(): Promise<boolean> {
    const state = await this.getAgoraState();
    return state?.videoReady === true;
  }

  async hasAudioTrack(): Promise<boolean> {
    const state = await this.getAgoraState();
    return state?.audioReady === true;
  }
}
