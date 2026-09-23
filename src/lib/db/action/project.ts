import { db } from "../drizzle";
import { projects } from "../schema/project";
import { createProjectSchema, type CreateProject } from "../validators";

export async function createProject(input: CreateProject) {
  const data = createProjectSchema.parse(input);
  const [row] = await db.insert(projects).values(data).returning();
  return row;
}