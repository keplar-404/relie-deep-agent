"use server";

import { db } from "@/lib/db/drizzle";
import projectSchema from "@/lib/db/schema/projectSchema";
import { eq } from "drizzle-orm";
import getSandboxPreviewURL from "@/lib/sandbox/getPreviewURL";

export default async function getPreviewURL(projectID: string) {
  const [project] = await db
    .select()
    .from(projectSchema)
    .where(eq(projectSchema.id, projectID));
  if (!project || !project.sandboxId) return null;
  const previewURL = await getSandboxPreviewURL(project.sandboxId);
  return previewURL;
}
