"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
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
  const router = useRouter();
  const isEdit = Boolean(project);
  const [serverError, setServerError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const previewImage = project?.image || "/sass.jpg";

  const form = useForm<ProjectFormData>({
    resolver: zodResolver(projectFormSchema),
    defaultValues: {
      name: project?.name || "",
      description: project?.description || "",
      image: previewImage,
    },
  });

  const { reset, setError } = form;

  useEffect(() => {
    if (open) {
      reset({
        name: project?.name || "",
        description: project?.description || "",
        image: project?.image || "/sass.jpg",
      });
      setServerError(null);
    }
  }, [open, project, reset]);

  const onSubmit = async (data: ProjectFormData) => {
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

      if (!isEdit && json.project?.id) {
        router.push(`/project/${json.project.id}`);
      }
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
    previewImage,
    handleSubmit: form.handleSubmit(onSubmit),
  };
}
