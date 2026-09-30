import sharp from "sharp";

const MAX_IMAGE_SIZE = 300 * 1024; // 300 KB ceiling
const MAX_WIDTH = 1280;
const MAX_HEIGHT = 720;

export interface OptimizedImageResult {
  buffer: Buffer;
  contentType: string;
  isWebp: boolean;
}

/**
 * Server-side silent image optimizer.
 * Ensures any uploaded image is sanitized, resized to max 1280x720,
 * and compressed into high-efficiency WebP strictly under 300 KB.
 */
export async function optimizeServerImage(
  buffer: Buffer,
  contentType: string
): Promise<OptimizedImageResult> {
  // Non-images or SVGs pass through directly
  if (!contentType.startsWith("image/") || contentType === "image/svg+xml") {
    return { buffer, contentType, isWebp: false };
  }

  try {
    const image = sharp(buffer);
    const metadata = await image.metadata();

    // If client already provided a compliant file, avoid re-encoding
    if (
      buffer.length <= MAX_IMAGE_SIZE &&
      metadata.width &&
      metadata.width <= MAX_WIDTH &&
      metadata.height &&
      metadata.height <= MAX_HEIGHT &&
      contentType === "image/webp"
    ) {
      return { buffer, contentType, isWebp: true };
    }

    // Silently downscale and convert to WebP
    let quality = 82;
    let optimized = await sharp(buffer)
      .resize(MAX_WIDTH, MAX_HEIGHT, {
        fit: "inside",
        withoutEnlargement: true,
      })
      .webp({ quality, effort: 4 })
      .toBuffer();

    // Iteratively step down quality if still over 300 KB
    let attempts = 0;
    while (optimized.length > MAX_IMAGE_SIZE && quality > 40 && attempts < 3) {
      quality -= 15;
      attempts++;
      optimized = await sharp(buffer)
        .resize(MAX_WIDTH, MAX_HEIGHT, {
          fit: "inside",
          withoutEnlargement: true,
        })
        .webp({ quality, effort: 4 })
        .toBuffer();
    }

    return {
      buffer: optimized,
      contentType: "image/webp",
      isWebp: true,
    };
  } catch (error) {
    console.warn("[optimizeServerImage] Fallback to original buffer:", error);
    return { buffer, contentType, isWebp: false };
  }
}
