import type { AttachedFile } from "./types";

export const DEFAULT_ACCEPTED_TYPES = "image/*,.pdf,.svg,application/pdf";
export const DEFAULT_MAX_FILE_SIZE = 10 * 1024 * 1024; // 10MB
export const DEFAULT_MAX_FILES = 6;

export interface FileValidationOptions {
  acceptedTypes?: string;
  maxFileSize?: number;
  maxFiles?: number;
  currentCount?: number;
}

export interface ValidationResult {
  validFiles: File[];
  errors: string[];
}

export function formatFileSize(bytes?: number): string {
  if (!bytes || bytes <= 0) return "";
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${Math.round(bytes / 1024)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

export function getFileTypeLabel(file: { name: string; type?: string }): string {
  if (file.type?.includes("pdf") || file.name.toLowerCase().endsWith(".pdf")) return "PDF";
  if (file.type?.includes("svg") || file.name.toLowerCase().endsWith(".svg")) return "SVG";
  if (file.type?.startsWith("image/")) return file.type.split("/")[1]?.toUpperCase() || "IMG";
  return file.name.split(".").pop()?.toUpperCase() || "FILE";
}

export function fileToAttachedFile(file: File): AttachedFile {
  const isImg = file.type.startsWith("image/") || file.name.toLowerCase().endsWith(".svg");
  return {
    id: `file-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`,
    name: file.name,
    size: file.size,
    type: file.type,
    url: isImg && typeof window !== "undefined" ? URL.createObjectURL(file) : undefined,
    state: "done",
    rawFile: file,
  };
}

export function validateFiles(
  files: FileList | File[],
  options?: FileValidationOptions
): ValidationResult {
  const acceptStr = options?.acceptedTypes ?? DEFAULT_ACCEPTED_TYPES;
  const maxBytes = options?.maxFileSize ?? DEFAULT_MAX_FILE_SIZE;
  const maxFiles = options?.maxFiles ?? DEFAULT_MAX_FILES;
  const currentCount = options?.currentCount ?? 0;
  const maxMB = Math.max(1, Math.round(maxBytes / (1024 * 1024)));
  const acceptTokens = acceptStr.split(",").map((t) => t.trim().toLowerCase()).filter(Boolean);

  const validFiles: File[] = [];
  const errors: string[] = [];
  const incoming = Array.from(files);

  if (currentCount + incoming.length > maxFiles) {
    errors.push(`You can only attach up to ${maxFiles} files.`);
  }

  const remainingSlots = Math.max(0, maxFiles - currentCount);
  const eligibleFiles = incoming.slice(0, remainingSlots);

  for (const file of eligibleFiles) {
    if (file.size > maxBytes) {
      errors.push(`"${file.name}" exceeds the ${maxMB}MB limit.`);
      continue;
    }

    if (acceptTokens.length > 0) {
      const fileName = file.name.toLowerCase();
      const fileType = file.type.toLowerCase();
      const ext = fileName.includes(".") ? `.${fileName.split(".").pop()}` : "";

      const matches = acceptTokens.some((token) => {
        if (token.startsWith(".")) return ext === token;
        if (token.endsWith("/*")) return fileType.startsWith(token.slice(0, -1));
        return fileType === token;
      });

      if (!matches) {
        errors.push(`"${file.name}" is not a supported file type. Allowed: images, SVGs, and PDFs.`);
        continue;
      }
    }

    validFiles.push(file);
  }

  return { validFiles, errors };
}
