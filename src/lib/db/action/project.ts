import { and, eq, desc } from "drizzle-orm";
import { db } from "../drizzle";
import { projects } from "../schema/project";
import {
  createProjectSchema,
  updateProjectSchema,
  type CreateProject,
  type UpdateProject,
} from "../validators";

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

export async function listProjects(userId: string) {
  return await db
    .select()
    .from(projects)
    .where(eq(projects.userId, userId))
    .orderBy(desc(projects.updatedAt), desc(projects.createdAt));
}

export async function updateProject(input: UpdateProject) {
  const data = updateProjectSchema.parse(input);
  const { id, userId, ...values } = data;

  const [row] = await db
    .update(projects)
    .set({
      ...values,
      updatedAt: new Date(),
    })
    .where(and(eq(projects.id, id), eq(projects.userId, userId)))
    .returning();

  return row ?? null;
}