"use client";

import { Alert, AlertDescription } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { AlertCircleIcon, RefreshCwIcon } from "lucide-react";

interface ProjectsErrorAlertProps {
  error: string | null;
  onRetry: () => void;
  onDismiss: () => void;
}

export function ProjectsErrorAlert({
  error,
  onRetry,
  onDismiss,
}: ProjectsErrorAlertProps) {
  if (!error) return null;

  return (
    <div className="px-6 pt-4">
      <Alert variant="destructive" className="flex items-center justify-between py-2.5">
        <div className="flex items-center gap-2">
          <AlertCircleIcon className="size-4 shrink-0" />
          <AlertDescription className="text-xs">{error}</AlertDescription>
        </div>
        <div className="flex items-center gap-2">
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={onRetry}
            className="h-7 px-2.5 text-xs font-normal gap-1 cursor-pointer"
          >
            <RefreshCwIcon className="size-3" />
            Retry
          </Button>
          <button
            type="button"
            onClick={onDismiss}
            className="text-xs text-muted-foreground hover:text-foreground cursor-pointer px-1.5 py-0.5"
            aria-label="Dismiss alert"
          >
            ✕
          </button>
        </div>
      </Alert>
    </div>
  );
}
