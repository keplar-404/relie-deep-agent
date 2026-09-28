import { NextRequest } from "next/server";
import { z } from "zod";
import { currentUser } from "@/lib/auth";
import createSandBox from "@/lib/sandbox";
import { createProject, deleteProject } from "@/lib/db/action";

const createProjectBody = z.object({
  name: z.string().min(1).max(255),
  description: z.string().optional(),
});

const deleteProjectBody = z.object({
  projectId: z.uuid(),
});

export async function POST(req: NextRequest) {
  const user = await currentUser();
  if (!user) {
    return Response.json({ error: "Unauthorized" }, { status: 401 });
  }

  let rawBody: unknown;
  try {
    rawBody = await req.json();
  } catch {
    return Response.json({ error: "Malformed or empty JSON body" }, { status: 400 });
  }

  const parsed = createProjectBody.safeParse(rawBody);
  if (!parsed.success) {
    return Response.json({ error: parsed.error.flatten() }, { status: 400 });
  }

  try {
    const { previewUrl, sandboxId } = await createSandBox();

    const project = await createProject({
      userId: user.id,
      name: parsed.data.name,
      description: parsed.data.description,
      sandboxId,
    });

    return Response.json({ project, previewUrl }, { status: 201 });
  } catch (error) {
    console.error("[POST /api/v1/project error]:", error);
    return Response.json(
      { error: error instanceof Error ? error.message : "Failed to create project" },
      { status: 500 }
    );
  }
}

export async function DELETE(req: NextRequest) {
  const user = await currentUser();
  if (!user) {
    return Response.json({ error: "Unauthorized" }, { status: 401 });
  }

  let projectId: string | undefined;

  // Support both query param (?projectId=...) and JSON body ({ projectId })
  const queryId = req.nextUrl.searchParams.get("projectId");
  if (queryId) {
    projectId = queryId;
  } else {
    try {
      const body = await req.json();
      const parsed = deleteProjectBody.safeParse(body);
      if (parsed.success) {
        projectId = parsed.data.projectId;
      }
    } catch {
      // Body parsing failed or empty
    }
  }

  if (!projectId) {
    return Response.json({ error: "Missing or invalid projectId" }, { status: 400 });
  }

  try {
    const ok = await deleteProject({ projectId, userId: user.id });
    return ok
      ? Response.json({ ok: true })
      : Response.json({ error: "Project not found" }, { status: 404 });
  } catch (error) {
    console.error("[DELETE /api/v1/project error]:", error);
    return Response.json(
      { error: error instanceof Error ? error.message : "Failed to delete project" },
      { status: 500 }
    );
  }
}
