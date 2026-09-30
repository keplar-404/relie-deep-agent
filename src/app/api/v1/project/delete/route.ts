import { NextRequest } from "next/server";
import { currentUser } from "@/lib/auth";
import { deleteProject } from "@/lib/db/action";

/** DELETE/POST /api/v1/project/delete — Delete a project by ID */
export async function DELETE(req: NextRequest) {
  const user = await currentUser();
  if (!user) {
    return Response.json({ error: "Unauthorized" }, { status: 401 });
  }

  let projectId = req.nextUrl.searchParams.get("projectId");
  if (!projectId) {
    try {
      const body = await req.json();
      projectId = body?.projectId;
    } catch {
      // Empty body
    }
  }

  if (!projectId) {
    return Response.json({ error: "Missing or invalid projectId" }, { status: 400 });
  }

  try {
    const ok = await deleteProject({ projectId, userId: user.id });
    return ok
      ? Response.json({ ok: true })
      : Response.json({ error: "Project not found or unauthorized" }, { status: 404 });
  } catch (error) {
    console.error("[project/delete error]:", error);
    return Response.json({ error: "Failed to delete project" }, { status: 500 });
  }
}

export const POST = DELETE;
