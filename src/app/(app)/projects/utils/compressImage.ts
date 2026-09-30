/**
 * Client-side image compression & downscaling utility.
 * Resizes images to max 1280x720 (16:9 card aspect) and encodes to WebP
 * ensuring the resulting file stays well under the 300 KB budget.
 */

const MAX_WIDTH = 1280;
const MAX_HEIGHT = 720;
const MAX_FILE_SIZE = 300 * 1024; // 300 KB budget

interface CompressionOptions {
  maxWidth?: number;
  maxHeight?: number;
  maxSizeBytes?: number;
  quality?: number;
}

export async function compressThumbnail(
  file: File,
  options: CompressionOptions = {}
): Promise<File> {
  // SVGs are vector graphics; don't rasterize them
  if (file.type === "image/svg+xml") {
    return file;
  }

  const maxWidth = options.maxWidth ?? MAX_WIDTH;
  const maxHeight = options.maxHeight ?? MAX_HEIGHT;
  const maxSizeBytes = options.maxSizeBytes ?? MAX_FILE_SIZE;
  const initialQuality = options.quality ?? 0.82;

  try {
    const bitmap = await createImageBitmap(file);
    const { width: origW, height: origH } = bitmap;

    // Calculate proportional downscaled dimensions
    let targetW = origW;
    let targetH = origH;

    if (targetW > maxWidth || targetH > maxHeight) {
      const ratio = Math.min(maxWidth / targetW, maxHeight / targetH);
      targetW = Math.round(targetW * ratio);
      targetH = Math.round(targetH * ratio);
    }

    const canvas = document.createElement("canvas");
    canvas.width = targetW;
    canvas.height = targetH;
    const ctx = canvas.getContext("2d");
    if (!ctx) {
      bitmap.close();
      return file;
    }

    // High quality scaling
    ctx.imageSmoothingEnabled = true;
    ctx.imageSmoothingQuality = "high";
    ctx.drawImage(bitmap, 0, 0, targetW, targetH);
    bitmap.close();

    // Iteratively compress if needed to stay under maxSizeBytes
    let quality = initialQuality;
    let blob: Blob | null = await new Promise((resolve) =>
      canvas.toBlob(resolve, "image/webp", quality)
    );

    // Fallback to JPEG if WebP encoding is unsupported
    if (!blob) {
      blob = await new Promise((resolve) =>
        canvas.toBlob(resolve, "image/jpeg", quality)
      );
    }

    // Step down quality if still over 300 KB
    let iterations = 0;
    while (blob && blob.size > maxSizeBytes && quality > 0.4 && iterations < 3) {
      quality -= 0.15;
      iterations++;
      blob = await new Promise((resolve) =>
        canvas.toBlob(resolve, "image/webp", quality)
      );
    }

    if (!blob) return file;

    // Produce clean filename with .webp extension
    const baseName = file.name.replace(/\.[^/.]+$/, "");
    const ext = blob.type === "image/webp" ? ".webp" : ".jpg";
    return new File([blob], `${baseName}${ext}`, { type: blob.type });
  } catch (error) {
    console.warn("[compressThumbnail] Compression failed, using original:", error);
    return file;
  }
}
