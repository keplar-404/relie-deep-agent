import { and, eq } from "drizzle-orm";
import { db } from "../drizzle";
import { projects } from "../schema/project";
import { daytona } from "@/lib/sandbox";
import { deleteProjectFiles } from "@/lib/objectStorage";
import { checkpointer } from "@/lib/agent";

export async function deleteProject({
  projectId,
  userId,
}: {
  projectId: string;
  userId: string;
}) {
  const [project] = await db
    .select({ sandboxId: projects.sandboxId })
    .from(projects)
    .where(and(eq(projects.id, projectId), eq(projects.userId, userId)))
    .limit(1);

  if (!project) return false;

  // Run external cleanups (Daytona, S3 files, Checkpointer) concurrently
  const cleanupTasks: Promise<unknown>[] = [];

  if (project.sandboxId) {
    cleanupTasks.push(
      daytona
        .get(project.sandboxId)
        .then((sb) => daytona.delete(sb))
        .catch((err) => {
          console.error(
            `[deleteProject] Failed to delete Daytona sandbox "${project.sandboxId}":`,
            err?.message || err,
          );
        }),
    );
  }

  cleanupTasks.push(
    deleteProjectFiles({ projectId, userId, sandboxId: project.sandboxId }).catch((err) => {
      console.error("[deleteProject] Failed to delete S3 files:", err?.message || err);
    }),
  );

  cleanupTasks.push(
    checkpointer.deleteThread(projectId).catch((err) => {
      console.error("[deleteProject] Failed to delete checkpointer thread:", err?.message || err);
    }),
  );

  await Promise.allSettled(cleanupTasks);

  // Postgres DB project row (cascades chat_history & llm_executions via schema FK)
  await db
    .delete(projects)
    .where(and(eq(projects.id, projectId), eq(projects.userId, userId)));

  return true;
}
