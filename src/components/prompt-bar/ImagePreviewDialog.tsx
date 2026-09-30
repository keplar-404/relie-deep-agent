"use client";

import { ImageLightbox } from "@/components/primitives/ImageLightbox";
import { getFileTypeLabel, formatFileSize } from "./fileValidation";
import type { AttachedFile } from "./types";

interface ImagePreviewDialogProps {
  file: AttachedFile | null;
  onClose: () => void;
}

/**
 * Thin wrapper over ImageLightbox that maps an AttachedFile → src + name.
 * Existing callers (AttachmentList) are unchanged.
 */
export function ImagePreviewDialog({ file, onClose }: ImagePreviewDialogProps) {
  if (!file?.url) return null;
  const label = file
    ? `${file.name} · ${getFileTypeLabel(file)} · ${formatFileSize(file.size)}`
    : undefined;
  return <ImageLightbox src={file.url} name={label} onClose={onClose} />;
}
