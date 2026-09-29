import { and, eq } from "drizzle-orm";
import { db } from "../drizzle";
import { projects } from "../schema/project";
import { createProjectSchema, type CreateProject } from "../validators";

export async function createProject(input: CreateProject) {
  const data = createProjectSchema.parse(input);
  const [row] = await db.insert(projects).values(data).returning();
  return row;
}

export async function getProject(projectId: string, userId: string) {
  const [row] = await db
    .select()
    .from(projects)
    .where(and(eq(projects.id, projectId), eq(projects.userId, userId)))
    .limit(1);
  return row ?? null;
}