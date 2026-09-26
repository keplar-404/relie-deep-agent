/**
 * engine.ts — Core bounding-box detection + in-memory Sharp crop engine.
 *
 * Slices visual assets out of input images based on text labels.
 * Processing is 100% in-memory — no local disk files are created.
 *
 * Uses:
 *   - @langchain/openrouter (ChatOpenRouter withStructuredOutput)
 *   - sharp (image decode, EXIF normalisation, and in-memory bounding-box crop)
 *   - env.OPENROUTER_API_KEY
 */

import { ChatOpenRouter } from "@langchain/openrouter";
import { HumanMessage, SystemMessage } from "@langchain/core/messages";
import sharp from "sharp";
import { z } from "zod";
import { env } from "@/lib/utils/env";
import { uploadFiles } from "@/lib/objectStorage";
import type { ExtractedAsset, SourceImage, AssetRequest } from "./types";

// ---------------------------------------------------------------------------
// Constants
// ---------------------------------------------------------------------------

const MAX_ASSETS_PER_REQUEST = 25;
const DEFAULT_IMAGE_DETAIL = "original";
const ASSET_EXTRACTION_MODEL = "google/gemini-3.6-flash";
const OPENROUTER_BASE_URL = "https://openrouter.ai/api/v1";

const SUPPORTED_MIME_TYPES = new Set([
  "image/png",
  "image/jpeg",
  "image/webp",
  "image/heic",
  "image/heif",
]);

const SYSTEM_INSTRUCTION =
  "You are a precise 2D object detector for screenshot asset extraction.\n" +
  "Return only one schema-valid JSON object. Never return masks, segmentation, " +
  "markdown fences, prose, or invented detections. " +
  "Process no more than 25 requested objects per response.";

// ---------------------------------------------------------------------------
// Zod schemas for Gemini structured output
// ---------------------------------------------------------------------------

const AssetDetectionSchema = z.object({
  request_id: z
    .string()
    .describe("The unchanged request_id from the corresponding input request."),
  image_index: z
    .number()
    .nullable()
    .describe(
      "1-based source image number containing the requested asset, or null when absent."
    ),
  box_2d: z
    .array(z.number())
    .length(4)
    .nullable()
    .describe(
      "Tight [ymin, xmin, ymax, xmax] bounds normalised to 0-1000, or null."
    ),
  label: z
    .string()
    .nullable()
    .describe(
      "Short label distinguishing this occurrence from lookalikes, or null."
    ),
});

const AssetDetectionBatchSchema = z.object({
  detections: z
    .array(AssetDetectionSchema)
    .max(MAX_ASSETS_PER_REQUEST)
    .describe("Exactly one detection for every requested request_id."),
});

type AssetDetection = z.infer<typeof AssetDetectionSchema>;
type AssetDetectionBatch = z.infer<typeof AssetDetectionBatchSchema>;

// ---------------------------------------------------------------------------
// Image fetch and normalisation helpers (In-Memory Sharp)
// ---------------------------------------------------------------------------

async function fetchImageBuffer(
  imageUrl: string
): Promise<{ buffer: Buffer; mimeType: string }> {
  if (imageUrl.startsWith("data:image/")) {
    const [header, encoded] = imageUrl.split(",", 2) as [string, string];
    const mimeType = header.replace("data:", "").split(";")[0]!.toLowerCase();
    return { buffer: Buffer.from(encoded, "base64"), mimeType };
  }

  const response = await fetch(imageUrl);
  if (!response.ok) {
    throw new Error(
      `Failed to fetch image from ${imageUrl}: ${response.status} ${response.statusText}`
    );
  }

  const contentType =
    response.headers.get("content-type")?.split(";")[0]?.trim() || "image/png";
  const arrayBuf = await response.arrayBuffer();
  return { buffer: Buffer.from(arrayBuf), mimeType: contentType };
}

async function normaliseImage(
  imageUrl: string,
  imageIndex: number
): Promise<{ source: SourceImage; buffer: Buffer } | null> {
  try {
    const { buffer: rawBuffer, mimeType } = await fetchImageBuffer(imageUrl);

    if (!SUPPORTED_MIME_TYPES.has(mimeType) && !imageUrl.startsWith("data:image/")) {
      // Continue anyway as Sharp can handle many image formats
    }

    // sharp handles EXIF auto-rotation and format normalization
    const instance = sharp(rawBuffer).rotate();
    const metadata = await instance.metadata();
    const pngBuffer = await instance.png().toBuffer();
    const normalisedDataUrl = `data:image/png;base64,${pngBuffer.toString("base64")}`;

    return {
      source: {
        dataUrl: normalisedDataUrl,
        width: metadata.width ?? 0,
        height: metadata.height ?? 0,
        mimeType: "image/png",
        imageIndex,
      },
      buffer: pngBuffer,
    };
  } catch (err) {
    console.error(`[AssetExtraction] Error normalising image ${imageIndex}:`, err);
    return null;
  }
}

// ---------------------------------------------------------------------------
// Bounding-box validation & in-memory cropping
// ---------------------------------------------------------------------------

function normaliseBox(
  value: unknown
): [number, number, number, number] | null {
  if (!Array.isArray(value) || value.length !== 4) return null;

  const coords = value.map((v) => {
    if (typeof v !== "number" || !isFinite(v)) return null;
    return v;
  });
  if (coords.some((c) => c === null)) return null;

  const [rawYmin, rawXmin, rawYmax, rawXmax] = coords as number[];
  const ymin = Math.max(0, Math.min(1000, Math.min(rawYmin, rawYmax)));
  const ymax = Math.max(0, Math.min(1000, Math.max(rawYmin, rawYmax)));
  const xmin = Math.max(0, Math.min(1000, Math.min(rawXmin, rawXmax)));
  const xmax = Math.max(0, Math.min(1000, Math.max(rawXmin, rawXmax)));

  if (ymax <= ymin || xmax <= xmin) return null;
  return [ymin, xmin, ymax, xmax];
}

async function cropBox(
  buffer: Buffer,
  box2d: [number, number, number, number],
  width: number,
  height: number
): Promise<Buffer | null> {
  try {
    const [ymin, xmin, ymax, xmax] = box2d;
    const left = Math.max(0, Math.min(width, Math.floor((xmin / 1000) * width)));
    const top = Math.max(0, Math.min(height, Math.floor((ymin / 1000) * height)));
    const right = Math.max(0, Math.min(width, Math.ceil((xmax / 1000) * width)));
    const bottom = Math.max(0, Math.min(height, Math.ceil((ymax / 1000) * height)));

    if (right <= left || bottom <= top) return null;

    return await sharp(buffer)
      .extract({ left, top, width: right - left, height: bottom - top })
      .png()
      .toBuffer();
  } catch (err) {
    console.error("[AssetExtraction] Error during crop:", err);
    return null;
  }
}

// ---------------------------------------------------------------------------
// Detection prompt builder
// ---------------------------------------------------------------------------

function buildDetectionPrompt(
  sources: SourceImage[],
  requests: AssetRequest[]
): string {
  const sourceMapping = sources
    .map(
      (src, i) =>
        `- attached image ${i + 1} = source image ${src.imageIndex} ` +
        `(${src.width}x${src.height} pixels after EXIF normalisation)`
    )
    .join("\n");

  const requestJson = JSON.stringify(
    requests.map((r) => ({
      request_id: r.requestId,
      description: r.description,
    })),
    null,
    2
  );

  return `Locate each requested visual asset in the attached source images.

SOURCE IMAGE MAPPING (image_index must use the 1-based source image number):
${sourceMapping}

REQUESTS:
${requestJson}

BOUNDING-BOX RULES:
- Return exactly one detections record per request, retaining each request_id unchanged.
- box_2d is [ymin, xmin, ymax, xmax], relative to the selected source image, normalised 0-1000.
- Return the smallest axis-aligned box containing the whole visible requested asset.
- Exclude surrounding UI: cards, containers, backgrounds, padding, borders, nearby text.
- If absent or ambiguous, return that request_id with image_index=null, box_2d=null, label=null.
- Return JSON only through the supplied schema.`;
}

// ---------------------------------------------------------------------------
// OpenRouter Gemini Detector Call
// ---------------------------------------------------------------------------

function buildDetector(apiKey: string) {
  const llm = new ChatOpenRouter({
    model: ASSET_EXTRACTION_MODEL,
    apiKey,
    baseURL: OPENROUTER_BASE_URL,
    temperature: 0.5,
  });

  return llm.withStructuredOutput(AssetDetectionBatchSchema, {
    method: "functionCalling",
    includeRaw: true,
  });
}

async function locateAssetBatch(
  detector: ReturnType<typeof buildDetector>,
  sources: SourceImage[],
  requests: AssetRequest[]
): Promise<AssetDetectionBatch> {
  const prompt = buildDetectionPrompt(sources, requests);

  const userContent = sources.map((src) => ({
    type: "image_url" as const,
    image_url: { url: src.dataUrl, detail: DEFAULT_IMAGE_DETAIL },
  }));

  try {
    const output = await detector.invoke([
      new SystemMessage(SYSTEM_INSTRUCTION),
      new HumanMessage({
        content: [...userContent, { type: "text" as const, text: prompt }],
      }),
    ]);

    const parsed =
      typeof output === "object" && output !== null && "parsed" in output
        ? (output as Record<string, unknown>).parsed
        : output;

    const result = AssetDetectionBatchSchema.safeParse(parsed);
    return result.success ? result.data : { detections: [] };
  } catch (err) {
    console.error("[AssetExtraction] Gemini detection batch failed:", err);
    return { detections: [] };
  }
}

// ---------------------------------------------------------------------------
// Main Extraction Function
// ---------------------------------------------------------------------------

export async function extractAssets(
  imageUrls: string[],
  labels: string[]
): Promise<ExtractedAsset[]> {
  const apiKey = env.OPENROUTER_API_KEY;
  if (!apiKey) {
    throw new Error("OPENROUTER_API_KEY is not configured.");
  }

  // 1. Fetch & normalize all input images in-memory
  const sourceImages: SourceImage[] = [];
  const imageBuffers = new Map<number, Buffer>();

  for (let i = 0; i < imageUrls.length; i++) {
    const normalised = await normaliseImage(imageUrls[i]!, i + 1);
    if (normalised) {
      sourceImages.push(normalised.source);
      imageBuffers.set(normalised.source.imageIndex, normalised.buffer);
    }
  }

  if (sourceImages.length === 0) {
    throw new Error("No valid input images could be loaded for asset extraction.");
  }

  const cleanLabels = labels.map((l) => l.trim()).filter(Boolean);
  if (cleanLabels.length === 0) {
    return [];
  }

  // 2. Prepare requests with stable identifiers
  const requests: AssetRequest[] = cleanLabels.map((desc, i) => ({
    requestId: `asset-${String(i + 1).padStart(4, "0")}`,
    description: desc,
  }));

  // 3. Batch requests into chunks of MAX_ASSETS_PER_REQUEST
  const chunks: AssetRequest[][] = [];
  for (let i = 0; i < requests.length; i += MAX_ASSETS_PER_REQUEST) {
    chunks.push(requests.slice(i, i + MAX_ASSETS_PER_REQUEST));
  }

  const detector = buildDetector(apiKey);

  // 4. Run detection batches concurrently
  const batchResults = await Promise.all(
    chunks.map((chunk) => locateAssetBatch(detector, sourceImages, chunk))
  );

  // 5. Index detections by request_id
  const detectionMap = new Map<string, AssetDetection>();
  for (let ci = 0; ci < chunks.length; ci++) {
    const chunk = chunks[ci]!;
    const batch = batchResults[ci]!;
    const expectedIds = new Set(chunk.map((r) => r.requestId));
    for (const det of batch.detections) {
      if (expectedIds.has(det.request_id) && !detectionMap.has(det.request_id)) {
        detectionMap.set(det.request_id, det);
      }
    }
  }

  // 6. Crop detected bounding boxes in-memory
  const sourceByIndex = new Map(sourceImages.map((s) => [s.imageIndex, s]));
  const results: ExtractedAsset[] = [];

  for (const req of requests) {
    const det = detectionMap.get(req.requestId);
    const imageIndex =
      det && typeof det.image_index === "number" && !Number.isNaN(det.image_index)
        ? det.image_index
        : null;
    const box = det?.box_2d ? normaliseBox(det.box_2d) : null;

    let url: string | null = null;

    if (imageIndex !== null && box !== null) {
      const src = sourceByIndex.get(imageIndex);
      const rawBuf = imageBuffers.get(imageIndex);

      if (src && rawBuf) {
        const croppedBuffer = await cropBox(rawBuf, box, src.width, src.height);
        if (croppedBuffer) {
          const cleanLabel = req.description.replace(/[^a-zA-Z0-9_-]/g, "_").toLowerCase();
          const filename = `assets/${req.requestId}-${cleanLabel}.png`;
          try {
            [url] = await uploadFiles([{ key: filename, buffer: croppedBuffer, contentType: "image/png" }]);
          } catch (uploadErr) {
            console.error(`[AssetExtraction] Failed to upload ${filename} to object storage:`, uploadErr);
          }
        }
      }
    }

    results.push({
      label: req.description,
      url,
    });
  }

  return results;
}
