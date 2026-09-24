

/** Final extracted asset shape returned to the agent (lightweight URL only to save context window) */
export interface ExtractedAsset {
  label: string;
  url: string | null; // URL in Neon DB / S3 object storage
}

/** Internal normalized source image representation */
export interface SourceImage {
  dataUrl: string;
  width: number;
  height: number;
  mimeType: string;
  imageIndex: number;
}

/** Internal asset request item */
export interface AssetRequest {
  requestId: string;
  description: string;
}

