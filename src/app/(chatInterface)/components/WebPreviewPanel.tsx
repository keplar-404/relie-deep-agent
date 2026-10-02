"use client";

import {
  WebPreview,
  WebPreviewBody,
  WebPreviewNavigation,
  WebPreviewUrl,
} from "@/components/ai-elements/web-preview";

export default function WebPreviewPanel({ url }: { url?: string | null }) {
  return (
    <WebPreview defaultUrl={url ?? ""} className="h-full w-full">
      <WebPreviewNavigation>
        <WebPreviewUrl />
      </WebPreviewNavigation>
      <WebPreviewBody src={url ?? undefined} />
    </WebPreview>
  );
}
