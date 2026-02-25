/**
 * Frame Converter Utilities
 * Handles conversion of WebRTC frames to FFmpeg-compatible formats
 */

/**
 * Convert RGBA image data to YUV420p format (planar)
 *
 * YUV420p format:
 * - Y plane: full resolution (width * height bytes)
 * - U plane: quarter resolution (width/2 * height/2 bytes)
 * - V plane: quarter resolution (width/2 * height/2 bytes)
 *
 * @param rgba - RGBA pixel data (4 bytes per pixel)
 * @param width - Image width in pixels
 * @param height - Image height in pixels
 * @returns YUV420p data as Uint8Array
 */
export function convertRGBAtoYUV420(
  rgba: Uint8ClampedArray,
  width: number,
  height: number,
): Uint8Array {
  const ySize = width * height;
  const uvSize = (width / 2) * (height / 2);
  const totalSize = ySize + uvSize * 2;

  const yuv = new Uint8Array(totalSize);

  let yIndex = 0;
  let uIndex = ySize;
  let vIndex = ySize + uvSize;

  // Convert RGBA to YUV
  // Using ITU-R BT.601 conversion formula
  for (let y = 0; y < height; y++) {
    for (let x = 0; x < width; x++) {
      const rgbaIndex = (y * width + x) * 4;
      const r = rgba[rgbaIndex];
      const g = rgba[rgbaIndex + 1];
      const b = rgba[rgbaIndex + 2];
      // Alpha channel (rgbaIndex + 3) is ignored

      // Calculate Y (luminance)
      const Y = 0.299 * r + 0.587 * g + 0.114 * b;
      yuv[yIndex++] = Math.round(Y);

      // Calculate U and V for every 2x2 block (subsampling)
      if (y % 2 === 0 && x % 2 === 0) {
        const U = -0.169 * r - 0.331 * g + 0.5 * b + 128;
        const V = 0.5 * r - 0.419 * g - 0.081 * b + 128;

        yuv[uIndex++] = Math.round(U);
        yuv[vIndex++] = Math.round(V);
      }
    }
  }

  return yuv;
}

/**
 * Convert Float32 audio samples to PCM16 (signed 16-bit integer)
 *
 * @param float32Samples - Audio samples in Float32 format (-1.0 to 1.0)
 * @returns PCM16 data as Int16Array
 */
export function convertFloat32ToPCM16(
  float32Samples: Float32Array,
): Int16Array {
  const pcm16 = new Int16Array(float32Samples.length);

  for (let i = 0; i < float32Samples.length; i++) {
    // Clamp to [-1.0, 1.0]
    let sample = Math.max(-1.0, Math.min(1.0, float32Samples[i]));

    // Convert to 16-bit integer range [-32768, 32767]
    sample = sample < 0 ? sample * 32768 : sample * 32767;
    pcm16[i] = Math.round(sample);
  }

  return pcm16;
}

/**
 * Validate frame dimensions for YUV420p
 * Width and height must be even numbers for proper subsampling
 */
export function validateFrameDimensions(
  width: number,
  height: number,
): { valid: boolean; error?: string } {
  if (width % 2 !== 0) {
    return { valid: false, error: `Width must be even, got ${width}` };
  }
  if (height % 2 !== 0) {
    return { valid: false, error: `Height must be even, got ${height}` };
  }
  if (width < 320 || width > 1920) {
    return {
      valid: false,
      error: `Width out of range (320-1920), got ${width}`,
    };
  }
  if (height < 240 || height > 1080) {
    return {
      valid: false,
      error: `Height out of range (240-1080), got ${height}`,
    };
  }
  return { valid: true };
}

/**
 * Calculate expected YUV420p buffer size
 */
export function getYUV420BufferSize(width: number, height: number): number {
  const ySize = width * height;
  const uvSize = (width / 2) * (height / 2);
  return ySize + uvSize * 2;
}

/**
 * Get target frame rate (frames per second)
 * Can be adjusted based on performance
 */
export const TARGET_FPS = 30;

/**
 * Get frame interval in milliseconds
 */
export function getFrameInterval(fps: number = TARGET_FPS): number {
  return Math.floor(1000 / fps);
}
