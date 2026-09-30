"use client";

import { useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { AlertCircleIcon, RefreshCwIcon } from "lucide-react";

export default function ProjectsError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error("[Projects Error Boundary]:", error);
  }, [error]);

  return (
    <div className="flex flex-col items-center justify-center min-h-[50vh] p-6 text-center">
      <div className="w-full max-w-md">
        <Alert variant="destructive" className="text-left">
          <AlertCircleIcon className="size-4 shrink-0" />
          <AlertTitle className="text-sm font-semibold">Something went wrong</AlertTitle>
          <AlertDescription className="text-xs text-muted-foreground mt-1">
            {error?.message || "An unexpected error occurred while loading projects."}
          </AlertDescription>
        </Alert>
        <div className="mt-4 flex justify-center gap-3">
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={() => reset()}
            className="gap-1.5 text-xs font-medium cursor-pointer"
          >
            <RefreshCwIcon className="size-3.5" />
            Try again
          </Button>
        </div>
      </div>
    </div>
  );
}
