import { NextRequest } from "next/server";
import { currentUser } from "@/lib/auth";
import { getProject } from "@/lib/db/action";
import { getSandboxInstance } from "@/lib/sandbox";

/**
 * GET /api/v1/project/preview?projectId=...
 * Dedicated, on-demand endpoint for fetching a live Daytona signed preview URL.
 * Never spams Daytona on generic project fetches; only called when the preview mounts or refreshes.
 */
export async function GET(req: NextRequest) {
  const user = await currentUser();
  if (!user) {
    return Response.json({ error: "Unauthorized" }, { status: 401 });
  }

  const projectId =
    req.nextUrl.searchParams.get("projectId") ||
    req.nextUrl.searchParams.get("id");

  if (!projectId) {
    return Response.json({ error: "Missing projectId" }, { status: 400 });
  }

  const project = await getProject(projectId, user.id);
  if (!project) {
    return Response.json(
      { error: "Project not found or unauthorized" },
      { status: 404 },
    );
  }

  if (!project.sandboxId) {
    return Response.json({ previewUrl: null }, { status: 200 });
  }

  try {
    const sb = await getSandboxInstance(project.sandboxId);
    if ((sb as any).state === "stopped" || (sb as any).status === "stopped") {
      try {
        await sb.start();
      } catch (err) {
        console.warn("[preview route] Could not start sandbox:", err);
      }
    }
    const preview = await sb.getSignedPreviewUrl(3000, 3600);

    console.log(preview.url);
    return Response.json({ previewUrl: preview.url }, { status: 200 });
  } catch (error) {
    console.error("[preview route error]:", error);
    return Response.json(
      { previewUrl: null, error: "Failed to get preview URL" },
      { status: 200 },
    );
  }
}
