"use client";

import { useState, useEffect } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import type { ProjectRecord, ProjectFormData } from "../types";

export const projectFormSchema = z.object({
  name: z.string().trim().min(1, "Project name is required").max(255),
  description: z.string().trim().max(1000).optional(),
  image: z
    .string()
    .trim()
    .refine((url) => !url.startsWith("blob:"), "Thumbnail upload still in progress")
    .optional(),
});

interface UseProjectFormOptions {
  project?: ProjectRecord | null;
  open: boolean;
  onSuccess: (project: ProjectRecord) => void;
  onOpenChange: (open: boolean) => void;
}

export function useProjectForm({
  project,
  open,
  onSuccess,
  onOpenChange,
}: UseProjectFormOptions) {
  const isEdit = Boolean(project);
  const [serverError, setServerError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isUploadingImage, setIsUploadingImage] = useState(false);
  const [previewImage, setPreviewImage] = useState<string>(
    project?.image || "/sass.jpg"
  );

  const form = useForm<ProjectFormData>({
    resolver: zodResolver(projectFormSchema),
    defaultValues: {
      name: project?.name || "",
      description: project?.description || "",
      image: project?.image || "/sass.jpg",
    },
  });

  const { reset, setValue, setError } = form;

  useEffect(() => {
    if (open) {
      const initialImage = project?.image || "/sass.jpg";
      reset({
        name: project?.name || "",
        description: project?.description || "",
        image: initialImage,
      });
      setPreviewImage(initialImage);
      setServerError(null);
      setIsUploadingImage(false);
    }
  }, [open, project, reset]);

  const handleImageChange = (url: string) => {
    setValue("image", url, { shouldValidate: true, shouldDirty: true });
    setPreviewImage(url);
  };

  const handlePreviewChange = (url: string) => {
    setPreviewImage(url);
  };

  const onSubmit = async (data: ProjectFormData) => {
    if (isUploadingImage) return;

    setIsSubmitting(true);
    setServerError(null);

    try {
      const endpoint = isEdit
        ? "/api/v1/project/update"
        : "/api/v1/project/create";
      const payload = isEdit ? { projectId: project?.id, ...data } : data;

      const res = await fetch(endpoint, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      const json = await res.json();
      if (!res.ok) {
        if (json.details?.fieldErrors) {
          Object.entries(json.details.fieldErrors).forEach(([field, msgs]) => {
            const msg = Array.isArray(msgs) ? msgs[0] : String(msgs);
            setError(field as keyof ProjectFormData, { message: msg });
          });
        }
        setServerError(json.error || `Failed to ${isEdit ? "update" : "create"} project.`);
        return;
      }

      onSuccess(json.project);
      onOpenChange(false);
    } catch (err) {
      setServerError(err instanceof Error ? err.message : "Network error. Please try again.");
    } finally {
      setIsSubmitting(false);
    }
  };

  return {
    ...form,
    isEdit,
    serverError,
    setServerError,
    isSubmitting,
    isUploadingImage,
    setIsUploadingImage,
    previewImage,
    handleImageChange,
    handlePreviewChange,
    handleSubmit: form.handleSubmit(onSubmit),
  };
}
