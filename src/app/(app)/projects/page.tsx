"use client";

import { useState, useMemo } from "react";
import { AppSidebar } from "@/app/(app)/components/AppSidebar";
import { SidebarInset, SidebarProvider } from "@/components/ui/sidebar";
import { ProjectDialog } from "./components/ProjectDialog";
import { DeleteDialog } from "./components/DeleteDialog";
import { ProjectsHeader } from "./components/ProjectsHeader";
import { ProjectsErrorAlert } from "./components/ProjectsErrorAlert";
import { ProjectsToolbar, type Tab } from "./components/ProjectsToolbar";
import { ProjectsGrid } from "./components/ProjectsGrid";
import { useProjects } from "./hooks/useProjects";

export default function ProjectsPage() {
  const [activeTab, setActiveTab] = useState<Tab>("My Projects");
  const [search, setSearch] = useState("");

  const {
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
  } = useProjects();

  const filtered = useMemo(() => {
    const query = search.trim().toLowerCase();
    if (!query) return projects;
    return projects.filter((p) => p.title.toLowerCase().includes(query));
  }, [projects, search]);

  return (
    <SidebarProvider>
      <AppSidebar />
      <SidebarInset className="bg-background text-foreground overflow-y-auto">
        <ProjectsHeader />

        <main>
          <ProjectsErrorAlert
            error={pageError}
            onRetry={fetchProjects}
            onDismiss={() => setPageError(null)}
          />

          <ProjectsToolbar
            activeTab={activeTab}
            onTabChange={setActiveTab}
            search={search}
            onSearchChange={setSearch}
            onNewProject={() => setActiveProject(null)}
          />

          <div className="px-6 pb-12">
            <ProjectsGrid
              activeTab={activeTab}
              isLoading={isLoading}
              projects={filtered}
              search={search}
              onEdit={(p) =>
                setActiveProject({
                  id: p.id,
                  name: p.title,
                  description: p.description,
                  image: p.image,
                })
              }
              onDelete={(p) => setDeletingProject(p)}
              onCreateNew={() => setActiveProject(null)}
            />
          </div>
        </main>

        <ProjectDialog
          open={activeProject !== undefined}
          project={activeProject}
          onOpenChange={(open) => !open && setActiveProject(undefined)}
          onSuccess={handleSaveSuccess}
        />

        <DeleteDialog
          open={!!deletingProject}
          project={deletingProject}
          onOpenChange={(open) => !open && setDeletingProject(null)}
          onConfirm={handleConfirmDelete}
        />
      </SidebarInset>
    </SidebarProvider>
  );
}
