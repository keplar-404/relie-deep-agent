"use client";

import { memo, useState } from "react";
import {
  Attachment,
  AttachmentGroup,
  AttachmentMedia,
  AttachmentContent,
  AttachmentTitle,
  AttachmentDescription,
  AttachmentActions,
  AttachmentAction,
} from "@/components/ui/attachment";
import { Icon } from "./icons";
import { formatFileSize, getFileTypeLabel } from "./fileValidation";
import { ImagePreviewDialog } from "./ImagePreviewDialog";
import type { AttachedFile } from "./types";

interface AttachmentListProps {
  files: AttachedFile[];
  onRemove: (index: number) => void;
  error?: string | null;
  onClearError?: () => void;
}

function AttachmentListInner({ files, onRemove, error, onClearError }: AttachmentListProps) {
  const [previewFile, setPreviewFile] = useState<AttachedFile | null>(null);

  if (files.length === 0 && !error) return null;

  return (
    <>
      <div className="flex flex-col gap-1.5 pb-0.5">
        {error && (
          <div className="flex items-center justify-between gap-1.5 rounded-lg bg-destructive/10 border border-destructive/25 px-2 py-1 text-[11px] text-destructive leading-tight">
            <span>{error}</span>
            <button type="button" onClick={onClearError} className="shrink-0 p-0.5 hover:opacity-70 cursor-pointer">
              <Icon size={10} strokeWidth={2.5}><path d="M18 6L6 18M6 6l12 12" /></Icon>
            </button>
          </div>
        )}

        {files.length > 0 && (
          <AttachmentGroup className="flex flex-wrap gap-1.5">
            {files.map((file, i) => {
              const isImg = Boolean(file.url);
              const isPdf = file.name.toLowerCase().endsWith(".pdf") || file.type?.includes("pdf");
              const isLoading = file.state === "uploading" || file.state === "processing";

              return (
                <Attachment key={file.id || `${file.name}-${i}`} size="xs" state={file.state ?? "done"} className="h-9 max-w-52 items-center bg-secondary/80 border-border/50 text-foreground py-1 pr-1.5 pl-1 rounded-lg">
                  <AttachmentMedia variant={isImg ? "image" : "icon"} className="size-7 rounded-md overflow-hidden bg-muted/80">
                    {isLoading ? (
                      <span className="size-3.5 rounded-full border-2 border-primary border-t-transparent animate-spin" />
                    ) : isImg ? (
                      <img
                        src={file.url}
                        alt={file.name}
                        onClick={() => setPreviewFile(file)}
                        className="size-full object-cover cursor-pointer hover:scale-110 transition-transform"
                        title="Click to view full image"
                      />
                    ) : isPdf ? (
                      <span className="text-[10px] font-bold text-red-500 uppercase tracking-tighter">PDF</span>
                    ) : (
                      <Icon size={12} className="text-muted-foreground"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" /></Icon>
                    )}
                  </AttachmentMedia>

                  <AttachmentContent className="min-w-0 pr-1 cursor-default">
                    <AttachmentTitle className="max-w-28 truncate text-[11px] font-medium leading-none text-foreground">{file.name}</AttachmentTitle>
                    <AttachmentDescription className="text-[9.5px] text-muted-foreground mt-0.5 leading-none">
                      {getFileTypeLabel(file)} • {formatFileSize(file.size)}
                    </AttachmentDescription>
                  </AttachmentContent>

                  <AttachmentActions>
                    <AttachmentAction variant="ghost" size="icon-xs" onClick={() => onRemove(i)} className="size-5 p-0 text-muted-foreground hover:text-foreground hover:bg-muted cursor-pointer rounded-md">
                      <Icon size={9} strokeWidth={2.5}><path d="M18 6L6 18M6 6l12 12" /></Icon>
                    </AttachmentAction>
                  </AttachmentActions>
                </Attachment>
              );
            })}
          </AttachmentGroup>
        )}
      </div>

      <ImagePreviewDialog file={previewFile} onClose={() => setPreviewFile(null)} />
    </>
  );
}

export const AttachmentList = memo(AttachmentListInner);
