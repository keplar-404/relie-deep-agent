import fs from "node:fs/promises";
import { existsSync } from "node:fs";
import path from "node:path";
import sharp from "sharp";
import * as mupdf from "mupdf";

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

export interface FileObjectInput {
  data?: Buffer | Uint8Array | Blob | File | string;
  buffer?: Buffer;
  path?: string;
  url?: string;
  mimeType?: string;
  name?: string;
}

export type FileInput =
  | Buffer
  | Uint8Array
  | Blob
  | File
  | string
  | FileObjectInput;

export interface ProcessFileOptions {
  /** Rendering scale factor (default: 2 for crisp 2x resolution) */
  scale?: number;
  /** Safe maximum pages to render from PDF (default: 50) */
  maxPages?: number;
}

// ---------------------------------------------------------------------------
// Helper: Resolve any FileInput to raw Buffer
// ---------------------------------------------------------------------------

async function toBuffer(input: FileInput): Promise<{ buffer: Buffer; hint?: string }> {
  if (Buffer.isBuffer(input)) {
    return { buffer: input };
  }
  if (input instanceof Uint8Array) {
    return { buffer: Buffer.from(input.buffer, input.byteOffset, input.byteLength) };
  }
  if (typeof Blob !== "undefined" && input instanceof Blob) {
    const arrayBuf = await input.arrayBuffer();
    return { buffer: Buffer.from(arrayBuf), hint: input.type };
  }
  if (typeof input === "string") {
    // Data URI
    if (input.startsWith("data:")) {
      const match = input.match(/^data:([^;]+);base64,(.+)$/);
      if (match) return { buffer: Buffer.from(match[2]!, "base64"), hint: match[1] };
      return { buffer: Buffer.from(input, "utf-8") };
    }
    // Remote URL
    if (input.startsWith("http://") || input.startsWith("https://")) {
      const res = await fetch(input);
      if (!res.ok) throw new Error(`Failed to fetch file from URL: ${input} (${res.status} ${res.statusText})`);
      const arrayBuf = await res.arrayBuffer();
      return { buffer: Buffer.from(arrayBuf), hint: res.headers.get("content-type") || undefined };
    }
    // Local File Path
    if (existsSync(input)) {
      return { buffer: await fs.readFile(input), hint: path.extname(input) };
    }
    // String content (e.g. raw SVG markup)
    return { buffer: Buffer.from(input, "utf-8") };
  }
  if (typeof input === "object" && input !== null) {
    const obj = input as FileObjectInput;
    if (obj.buffer && Buffer.isBuffer(obj.buffer)) return { buffer: obj.buffer, hint: obj.mimeType || obj.name };
    if (obj.path && existsSync(obj.path)) return { buffer: await fs.readFile(obj.path), hint: obj.path };
    if (obj.data) return toBuffer(obj.data);
  }
  throw new Error(`Unsupported file input type: ${typeof input}`);
}

// ---------------------------------------------------------------------------
// Main AsyncGenerator Function (Powered by MuPDF C/Wasm Engine)
// ---------------------------------------------------------------------------

/**
 * Ultra-fast AsyncGenerator powered by MuPDF (C/WASM) and Bun:
 * - If the file is an Image or SVG, yields the exact same input once and finishes.
 * - If the file is a PDF, yields page image Buffers on-demand up to a safe maximum of 50 pages.
 *
 * @param file Any file input (Buffer, File, Blob, string path/dataUrl/URL, or wrapped object)
 * @param options Optional rasterization options (scale: default 2, maxPages: default 50)
 * @yields The exact same input (if image/SVG) or individual page image Buffers (if PDF).
 */
export async function* processFileToImages<T extends FileInput>(
  file: T,
  options?: ProcessFileOptions
): AsyncGenerator<T | Buffer, void, unknown> {
  const { buffer, hint } = await toBuffer(file);

  // 1. Check if it's an Image or SVG via Sharp -> yield exact same thing
  const isImageOrSvg = await sharp(buffer)
    .metadata()
    .then((m) => !!m.format)
    .catch(() => false);

  if (isImageOrSvg) {
    yield file;
    return;
  }

  // 2. Check if it's a PDF (%PDF- header or .pdf hint)
  const isPdf =
    (buffer.length >= 4 && buffer.subarray(0, 4).toString("latin1") === "%PDF") ||
    hint?.toLowerCase().includes("pdf");

  if (isPdf) {
    // MuPDF: Opens in-memory, loads only the requested pages on demand
    const doc = mupdf.Document.openDocument(buffer, "application/pdf");
    const totalPages = doc.countPages();
    const maxPages = Math.min(totalPages, options?.maxPages ?? 50);
    const scale = options?.scale ?? 2;
    const matrix = mupdf.Matrix.scale(scale, scale);

    for (let i = 0; i < maxPages; i++) {
      // Load and rasterize ONLY this page
      const page = doc.loadPage(i);
      const pixmap = page.toPixmap(matrix, mupdf.ColorSpace.DeviceRGB, false, true);
      const pngBuffer = Buffer.from(pixmap.asPNG());

      yield pngBuffer;
    }
    return;
  }

  // 3. Fallback for unsupported formats
  throw new Error("Unsupported file format: expected an image, SVG, or PDF file.");
}

/**
 * Optional convenience helper that drains the generator and returns an array of page Buffers
 * (or the single input if it was an image/SVG).
 */
export async function processFileToImagesArray<T extends FileInput>(
  file: T,
  options?: ProcessFileOptions
): Promise<T | Buffer[]> {
  const items: (T | Buffer)[] = [];
  for await (const item of processFileToImages(file, options)) {
    items.push(item);
  }

  if (items.length === 1 && items[0] === file) {
    return file;
  }

  return items as Buffer[];
}

export default processFileToImages;
