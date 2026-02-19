import puppeteer, { Browser, Page } from "puppeteer";
import { Writable } from "stream";

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
        width: 1280,
        height: 720,
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
   * This is a placeholder - actual implementation will use Canvas API
   */
  async startFrameCapture(outputStream: Writable): Promise<void> {
    if (!this.page) throw new Error("Page not initialized");

    this.frameStream = outputStream;

    console.log(
      "🎬 Frame capture started (placeholder - no actual frames yet)",
    );
    console.log("⚠️  TODO: Implement Canvas API frame extraction");

    // TODO: Implement actual frame capture using Canvas API
    // This will be done in frameConverter utility
    // For now, just log that we're ready
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
    if (this.captureInterval) {
      clearInterval(this.captureInterval);
      this.captureInterval = null;
    }

    // Leave Agora channel
    if (this.page) {
      try {
        await this.page.evaluate(() => {
          // @ts-ignore - window is available in browser context
          if (window.cleanup) {
            // @ts-ignore
            window.cleanup();
          }
        });
      } catch (error) {
        console.error("Error during Agora cleanup:", error);
      }
    }

    // Close browser
    if (this.browser) {
      try {
        await this.browser.close();
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
