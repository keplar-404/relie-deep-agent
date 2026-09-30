"use client";

import { useRef } from "react";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { ImageIcon, Loader2Icon } from "lucide-react";
import { compressThumbnail } from "../utils/compressImage";

interface ThumbnailUploaderProps {
  isUploading: boolean;
  onUploadingChange: (uploading: boolean) => void;
  onImageChange: (url: string) => void;
  onPreviewChange: (url: string) => void;
  onError: (msg: string | null) => void;
}

export function ThumbnailUploader({
  isUploading,
  onUploadingChange,
  onImageChange,
  onPreviewChange,
  onError,
}: ThumbnailUploaderProps) {
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleUpload = async (file: File) => {
    if (!file) return;

    if (!file.type.startsWith("image/")) {
      onError("Please select a valid image file (PNG, JPG, SVG, WebP).");
      return;
    }

    // Instant local preview for CardPreview
    const localBlob = URL.createObjectURL(file);
    onPreviewChange(localBlob);
    onError(null);
    onUploadingChange(true);

    try {
      // Downscale and compress to WebP under 300 KB before uploading
      const optimizedFile = await compressThumbnail(file);

      const formData = new FormData();
      formData.append("file", optimizedFile);

      // Calls universal fileupload endpoint
      const res = await fetch("/api/v1/fileupload", {
        method: "POST",
        body: formData,
      });

      const json = await res.json();
      if (!res.ok) {
        throw new Error(json.error || "Upload failed");
      }

      // Sets real server URL only after successful upload
      onImageChange(json.url);
    } catch (err) {
      onPreviewChange("/sass.jpg");
      onError(err instanceof Error ? err.message : "Failed to upload image.");
    } finally {
      onUploadingChange(false);
    }
  };

  return (
    <div className="flex flex-col gap-1.5">
      <Label className="text-xs font-medium text-foreground">
        Thumbnail Image
      </Label>

      <div className="flex items-center gap-2">
        <input
          type="file"
          ref={fileInputRef}
          accept="image/*"
          className="hidden"
          onChange={(e) => {
            const file = e.target.files?.[0];
            if (file) handleUpload(file);
          }}
        />
        <Button
          type="button"
          variant="outline"
          size="sm"
          onClick={() => fileInputRef.current?.click()}
          disabled={isUploading}
          className="h-9 gap-1.5 px-3 text-xs font-normal cursor-pointer"
        >
          {isUploading ? (
            <>
              <Loader2Icon className="size-3.5 animate-spin" />
              Uploading thumbnail…
            </>
          ) : (
            <>
              <ImageIcon className="size-3.5 text-muted-foreground" />
              Upload Thumbnail
            </>
          )}
        </Button>
      </div>
    </div>
  );
}
