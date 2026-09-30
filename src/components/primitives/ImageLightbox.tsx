"use client";

import { useEffect } from "react";
import { createPortal } from "react-dom";

interface Props {
  src: string | null;
  name?: string;
  onClose: () => void;
}

function LightboxContent({ src, name, onClose }: Props) {
  useEffect(() => {
    if (!src) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") { e.stopPropagation(); onClose(); }
    };
    window.addEventListener("keydown", onKey, true);
    return () => window.removeEventListener("keydown", onKey, true);
  }, [src, onClose]);

  if (!src) return null;

  return (
    <div
      className="fixed inset-0 flex items-center justify-center bg-black/80 backdrop-blur-sm p-4 animate-in fade-in duration-150"
      style={{ zIndex: 99999 }}
      onClick={onClose}
    >
      <div
        className="relative flex max-h-[90vh] max-w-4xl flex-col gap-0 overflow-hidden rounded-2xl border border-border/80 bg-card shadow-2xl"
        onClick={(e) => e.stopPropagation()}
      >
        {/* header */}
        <div className="flex h-10 shrink-0 items-center justify-between border-b border-border/40 px-3 text-xs">
          <span className="truncate font-semibold text-foreground max-w-xs">{name ?? "Image"}</span>
          <button
            type="button"
            onClick={(e) => { e.stopPropagation(); onClose(); }}
            className="ml-3 flex size-6 shrink-0 items-center justify-center rounded-md text-muted-foreground transition-colors hover:bg-muted hover:text-foreground cursor-pointer"
            aria-label="Close"
          >
            <svg viewBox="0 0 24 24" className="size-3.5" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round">
              <path d="M18 6L6 18M6 6l12 12" />
            </svg>
          </button>
        </div>
        {/* image */}
        <div className="overflow-auto p-2 flex items-center justify-center">
          <img src={src} alt={name ?? "preview"} className="max-h-[80vh] max-w-full rounded-lg object-contain" />
        </div>
      </div>
    </div>
  );
}

/**
 * Generic image lightbox rendered in a body Portal.
 * Accepts a raw `src` URL / data-URI — no dependency on AttachedFile.
 * Used by both AttachmentList and ToolChips.
 */
export function ImageLightbox({ src, name, onClose }: Props) {
  if (!src || typeof document === "undefined") return null;
  return createPortal(<LightboxContent src={src} name={name} onClose={onClose} />, document.body);
}
