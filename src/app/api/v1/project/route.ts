import { NextRequest } from "next/server";
import { currentUser } from "@/lib/auth";
import { getProject, listProjects } from "@/lib/db/action";

/** GET /api/v1/project — List all projects or get a single project by id */
export async function GET(req: NextRequest) {
  const user = await currentUser();
  if (!user) {
    return Response.json({ error: "Unauthorized" }, { status: 401 });
  }

  const projectId =
    req.nextUrl.searchParams.get("projectId") ||
    req.nextUrl.searchParams.get("id");

  try {
    if (projectId) {
      const project = await getProject(projectId, user.id);
      if (!project) {
        return Response.json({ error: "Project not found" }, { status: 404 });
      }
      return Response.json({ project }, { status: 200 });
    }

    const projects = await listProjects(user.id);
    return Response.json({ projects }, { status: 200 });
  } catch (error) {
    console.error("[GET /api/v1/project error]:", error);
    return Response.json({ error: "Failed to fetch projects" }, { status: 500 });
  }
}
