import { and, eq, desc } from "drizzle-orm";
import { db } from "../drizzle";
import projectSchema from "../schema/projectSchema";
import {
  createProjectSchema,
  updateProjectSchema,
  type CreateProject,
  type UpdateProject,
} from "../validators";

export async function createProject(input: CreateProject) {
  const data = createProjectSchema.parse(input);
  const [row] = await db.insert(projectSchema).values(data).returning();
  return row;
}

export async function getProject(projectId: string, userId: string) {
  const [row] = await db
    .select()
    .from(projectSchema)
    .where(
      and(eq(projectSchema.id, projectId), eq(projectSchema.userId, userId)),
    )
    .limit(1);
  return row ?? null;
}

export async function listProjects(userId: string) {
  return await db
    .select()
    .from(projectSchema)
    .where(eq(projectSchema.userId, userId))
    .orderBy(desc(projectSchema.updatedAt), desc(projectSchema.createdAt));
}

export async function updateProject(input: UpdateProject) {
  const data = updateProjectSchema.parse(input);
  const { id, userId, ...values } = data;

  const [row] = await db
    .update(projectSchema)
    .set({
      ...values,
      updatedAt: new Date(),
    })
    .where(and(eq(projectSchema.id, id), eq(projectSchema.userId, userId)))
    .returning();

  return row ?? null;
}
