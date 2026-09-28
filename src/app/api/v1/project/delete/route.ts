import { NextRequest } from "next/server";
import { currentUser } from "@/lib/auth";
import { deleteProject } from "@/lib/db/action";

export async function POST(req: NextRequest) {
  const user = await currentUser();
  if (!user) return Response.json({ error: "Unauthorized" }, { status: 401 });

  let projectId = req.nextUrl.searchParams.get("projectId");
  if (!projectId) {
    try {
      const body = await req.json();
      projectId = body?.projectId;
    } catch {
      // empty or non-JSON body
    }
  }

  if (!projectId) return Response.json({ error: "Missing projectId" }, { status: 400 });

  const ok = await deleteProject({ projectId, userId: user.id });
  return ok
    ? Response.json({ ok: true })
    : Response.json({ error: "Project not found" }, { status: 404 });
}

export const DELETE = POST;
