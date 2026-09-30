import { currentUser } from "@/lib/auth";
import { listProjects } from "@/lib/db/action";

/** GET /api/v1/project — List all projects for authenticated user */
export async function GET() {
  const user = await currentUser();
  if (!user) {
    return Response.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const projects = await listProjects(user.id);
    return Response.json({ projects }, { status: 200 });
  } catch (error) {
    console.error("[GET /api/v1/project error]:", error);
    return Response.json({ error: "Failed to fetch projects" }, { status: 500 });
  }
}
