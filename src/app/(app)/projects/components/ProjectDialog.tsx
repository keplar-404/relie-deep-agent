"use client";

import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { AlertCircleIcon, Loader2Icon, SparklesIcon, PencilIcon } from "lucide-react";
import type { ProjectRecord } from "../types";
import { CardPreview } from "./CardPreview";
import { ThumbnailUploader } from "./ThumbnailUploader";
import { useProjectForm } from "../hooks/useProjectForm";

interface ProjectDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  project?: ProjectRecord | null;
  onSuccess: (project: ProjectRecord) => void;
}

export function ProjectDialog({
  open,
  onOpenChange,
  project,
  onSuccess,
}: ProjectDialogProps) {
  const {
    register,
    control,
    handleSubmit,
    isEdit,
    serverError,
    setServerError,
    isSubmitting,
    isUploadingImage,
    setIsUploadingImage,
    previewImage,
    handleImageChange,
    handlePreviewChange,
    formState: { errors },
  } = useProjectForm({ project, open, onSuccess, onOpenChange });

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <div className="flex items-center gap-2">
            <div
              className={`flex size-7 items-center justify-center rounded-md ${
                isEdit ? "bg-amber-500/10 text-amber-500" : "bg-primary/10 text-primary"
              }`}
            >
              {isEdit ? <PencilIcon className="size-4" /> : <SparklesIcon className="size-4" />}
            </div>
            <DialogTitle>{isEdit ? "Edit Project" : "Create New Project"}</DialogTitle>
          </div>
          <DialogDescription>
            {isEdit ? "Update your AI agent workspace name, thumbnail, or description." : "Configure your AI agent workspace with a name, description, and thumbnail."}
          </DialogDescription>
        </DialogHeader>

        {serverError && (
          <Alert variant="destructive" className="py-2.5">
            <AlertCircleIcon className="size-4 shrink-0" />
            <AlertDescription className="text-xs">{serverError}</AlertDescription>
          </Alert>
        )}

        <form onSubmit={handleSubmit} className="flex flex-col gap-4">
          <div className="flex flex-col gap-1.5">
            <Label htmlFor="proj-name" className="text-xs font-medium text-foreground">
              Project Name <span className="text-destructive">*</span>
            </Label>
            <Input
              id="proj-name"
              placeholder="e.g. Shopify Inventory Sync"
              autoFocus
              {...register("name")}
              aria-invalid={!!errors.name}
              className={`h-9 text-sm ${errors.name ? "border-destructive focus-visible:border-destructive" : ""}`}
            />
            {errors.name && <p className="text-[11px] text-destructive">{errors.name.message}</p>}
          </div>

          <div className="flex flex-col gap-1.5">
            <Label htmlFor="proj-desc" className="text-xs font-medium text-foreground">
              Description <span className="text-muted-foreground text-[11px] font-normal">(optional)</span>
            </Label>
            <Input
              id="proj-desc"
              placeholder="Brief description of what this agent does…"
              {...register("description")}
              className="h-9 text-sm"
            />
          </div>

          <ThumbnailUploader
            isUploading={isUploadingImage}
            onUploadingChange={setIsUploadingImage}
            onImageChange={handleImageChange}
            onPreviewChange={handlePreviewChange}
            onError={setServerError}
          />

          <CardPreview control={control} previewImage={previewImage} />

          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={() => onOpenChange(false)}
              disabled={isSubmitting || isUploadingImage}
            >
              Cancel
            </Button>
            <Button
              type="submit"
              size="sm"
              disabled={isSubmitting || isUploadingImage}
              className="gap-1.5 font-medium cursor-pointer"
            >
              {isSubmitting ? (
                <>
                  <Loader2Icon className="size-3.5 animate-spin" />
                  {isEdit ? "Saving…" : "Creating…"}
                </>
              ) : isEdit ? (
                "Save Changes"
              ) : (
                "Create Project"
              )}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
