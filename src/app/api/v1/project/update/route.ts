import { NextRequest } from "next/server";
import { z } from "zod";
import { currentUser } from "@/lib/auth";
import { updateProject } from "@/lib/db/action";

const updateSchema = z.object({
  projectId: z.uuid("Invalid project ID"),
  name: z.string().trim().min(1, "Project name cannot be empty").max(255).optional(),
  description: z.string().trim().max(1000).optional(),
  image: z
    .string()
    .trim()
    .refine((url) => !url.startsWith("blob:"), "Image must be an uploaded URL, not a blob")
    .optional(),
});

/** PATCH/POST /api/v1/project/update — Update an existing project */
export async function PATCH(req: NextRequest) {
  const user = await currentUser();
  if (!user) {
    return Response.json({ error: "Unauthorized" }, { status: 401 });
  }

  let body: unknown;
  try {
    body = await req.json();
  } catch {
    return Response.json({ error: "Malformed or empty JSON body" }, { status: 400 });
  }

  const parsed = updateSchema.safeParse(body);
  if (!parsed.success) {
    const message = parsed.error.issues.map((i) => i.message).join(", ");
    return Response.json(
      { error: message || "Validation failed", details: parsed.error.flatten() },
      { status: 400 },
    );
  }

  try {
    const updated = await updateProject({
      id: parsed.data.projectId,
      userId: user.id,
      name: parsed.data.name,
      description: parsed.data.description,
      image: parsed.data.image,
    });

    if (!updated) {
      return Response.json({ error: "Project not found or unauthorized" }, { status: 404 });
    }

    return Response.json({ project: updated }, { status: 200 });
  } catch (error) {
    console.error("[project/update error]:", error);
    return Response.json({ error: "Failed to update project" }, { status: 500 });
  }
}

export const POST = PATCH;
