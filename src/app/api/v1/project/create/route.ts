import { NextRequest } from "next/server";
import { z } from "zod";
import { currentUser } from "@/lib/auth";
import createSandBox, { daytona } from "@/lib/sandbox";
import { createProject } from "@/lib/db/action";

const createSchema = z.object({
  name: z.string().trim().min(1, "Project name is required").max(255),
  description: z.string().trim().max(1000).optional(),
  image: z
    .string()
    .trim()
    .refine(
      (url) => !url.startsWith("blob:"),
      "Image must be an uploaded URL, not a blob",
    )
    .optional(),
});

export async function POST(req: NextRequest) {
  // 1. Authenticate user session
  const user = await currentUser();
  if (!user) {
    return Response.json({ error: "Unauthorized" }, { status: 401 });
  }

  // 2. Parse and validate JSON request body
  let body: unknown;
  try {
    body = await req.json();
  } catch {
    return Response.json(
      { error: "Malformed or empty JSON body" },
      { status: 400 },
    );
  }
  if (!body || typeof body !== "object") {
    return Response.json(
      { error: "Malformed or empty JSON body" },
      { status: 400 },
    );
  }

  const parsed = createSchema.safeParse(body);
  if (!parsed.success) {
    const error = parsed.error.issues[0]?.message || "Validation failed";
    return Response.json(
      { error, details: parsed.error.flatten() },
      { status: 400 },
    );
  }

  const { name, description, image = "/sass.jpg" } = parsed.data;

  // 3. Provision Daytona sandbox (project will NOT be created if this fails)
  let sandbox: { sandboxId: string; previewUrl: string };
  try {
    sandbox = await createSandBox();
    if (!sandbox?.sandboxId) {
      throw new Error("Sandbox creation failed: missing sandbox ID");
    }
  } catch (error) {
    console.error("[project/create] Sandbox creation failed:", error);
    return Response.json(
      { error: error instanceof Error ? error.message : "Failed to create sandbox" },
      { status: 500 },
    );
  }

  // 4. Persist project record in database (with rollback on failure)
  try {
    const project = await createProject({
      userId: user.id,
      name,
      description,
      image,
      sandboxId: sandbox.sandboxId,
    });

    return Response.json({ project, previewUrl: sandbox.previewUrl }, { status: 201 });
  } catch (error) {
    console.error("[project/create error]:", error);

    // Rollback orphaned sandbox if DB insertion failed
    daytona
      .get(sandbox.sandboxId)
      .then((sb) => daytona.delete(sb))
      .catch(() => {});

    return Response.json(
      { error: "Failed to create project in database" },
      { status: 500 },
    );
  }
}
