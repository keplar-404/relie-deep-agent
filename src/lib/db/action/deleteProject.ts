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

  // 1. Daytona cloud sandbox
  if (project.sandboxId) {
    try {
      const sb = await daytona.get(project.sandboxId);
      await daytona.delete(sb);
    } catch {
      // ponytail: ignore if already deleted or 404
    }
  }

  // 2. Neon S3 project files (user uploads, agent tool files, screenshots)
  await deleteProjectFiles({ projectId, userId, sandboxId: project.sandboxId });

  // 3. LangGraph checkpointer thread checkpoints
  try {
    await checkpointer.deleteThread(projectId);
  } catch {
    // ponytail: ignore if thread was uninitialized
  }

  // 4. Postgres DB project row (cascades chat_history & llm_executions via schema FK)
  await db
    .delete(projects)
    .where(and(eq(projects.id, projectId), eq(projects.userId, userId)));

  return true;
}
