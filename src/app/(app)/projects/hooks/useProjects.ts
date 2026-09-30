"use client";

import { useState, useEffect, useCallback, useMemo } from "react";
import type { Project, ProjectRecord } from "../types";
import { formatTimeAgo } from "../utils/formatTimeAgo";

export function dbRowToProject(row: ProjectRecord): Project {
  return {
    id: row.id,
    title: row.name,
    description: row.description || "",
    agentCount: 1,
    updatedAt: formatTimeAgo(row.updatedAt || row.createdAt),
    image: row.image || "/sass.jpg",
  };
}

export function useProjects() {
  const [projects, setProjects] = useState<Project[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [pageError, setPageError] = useState<string | null>(null);

  // undefined = closed, null = create new, object = edit
  const [activeProject, setActiveProject] = useState<ProjectRecord | null | undefined>(undefined);
  const [deletingProject, setDeletingProject] = useState<Project | null>(null);

  const fetchProjects = useCallback(async () => {
    try {
      setIsLoading(true);
      setPageError(null);
      const res = await fetch("/api/v1/project");
      if (!res.ok) {
        const json = await res.json().catch(() => ({}));
        throw new Error(json.error || `Failed to load projects (${res.status})`);
      }
      const data = await res.json();
      if (Array.isArray(data.projects)) {
        setProjects(data.projects.map(dbRowToProject));
      }
    } catch (err) {
      console.error("[useProjects error]:", err);
      setPageError(err instanceof Error ? err.message : "Failed to load projects.");
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchProjects();
  }, [fetchProjects]);

  const handleConfirmDelete = async (projectId: string) => {
    try {
      setPageError(null);
      const res = await fetch(`/api/v1/project/delete?projectId=${projectId}`, {
        method: "DELETE",
      });
      if (!res.ok) {
        const json = await res.json().catch(() => ({}));
        throw new Error(json.error || "Failed to delete project");
      }
      setProjects((prev) => prev.filter((p) => p.id !== projectId));
    } catch (err) {
      const msg = err instanceof Error ? err.message : "Failed to delete project";
      setPageError(msg);
      throw err;
    }
  };

  const handleSaveSuccess = (saved: ProjectRecord) => {
    const formatted = dbRowToProject(saved);
    setProjects((prev) =>
      activeProject
        ? prev.map((p) => (p.id === formatted.id ? formatted : p))
        : [formatted, ...prev],
    );
    setActiveProject(undefined);
    setPageError(null);
  };

  return {
    projects,
    isLoading,
    pageError,
    setPageError,
    activeProject,
    setActiveProject,
    deletingProject,
    setDeletingProject,
    fetchProjects,
    handleConfirmDelete,
    handleSaveSuccess,
  };
}
