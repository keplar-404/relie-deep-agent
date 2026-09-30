import { NextRequest } from "next/server";
import { z } from "zod";
import { currentUser } from "@/lib/auth";
import createSandBox from "@/lib/sandbox";
import { createProject } from "@/lib/db/action";

const createSchema = z.object({
  name: z.string().trim().min(1, "Project name is required").max(255),
  description: z.string().trim().max(1000).optional(),
  image: z
    .string()
    .trim()
    .refine((url) => !url.startsWith("blob:"), "Image must be an uploaded URL, not a blob")
    .optional(),
});

/** POST /api/v1/project/create — Create a new project */
export async function POST(req: NextRequest) {
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

  const parsed = createSchema.safeParse(body);
  if (!parsed.success) {
    const message = parsed.error.issues.map((i) => i.message).join(", ");
    return Response.json(
      { error: message || "Validation failed", details: parsed.error.flatten() },
      { status: 400 },
    );
  }

  // Provision Daytona sandbox (resilient: don't crash if quota exceeded)
  let sandboxId: string | undefined;
  let previewUrl: string | undefined;
  try {
    const sandbox = await createSandBox();
    sandboxId = sandbox.sandboxId;
    previewUrl = sandbox.previewUrl;
  } catch (sbError) {
    console.warn("[project/create] Sandbox provisioning skipped/failed:", sbError);
  }

  try {
    const project = await createProject({
      userId: user.id,
      name: parsed.data.name,
      description: parsed.data.description,
      image: parsed.data.image || "/sass.jpg",
      sandboxId,
    });

    return Response.json({ project, previewUrl }, { status: 201 });
  } catch (error) {
    console.error("[project/create error]:", error);
    return Response.json({ error: "Failed to create project in database" }, { status: 500 });
  }
}
