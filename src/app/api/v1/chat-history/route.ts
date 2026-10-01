import { NextRequest } from "next/server";
import { currentUser } from "@/lib/auth";
import { getChatMessages } from "@/lib/db/action/chatHistory";
import { getProject } from "@/lib/db/action";

/**
 * GET /api/v1/chat-history?projectId=...
 * Retrieves persistent message history for a given project.
 */
export async function GET(req: NextRequest) {
  const user = await currentUser();
  if (!user) {
    return Response.json({ error: "Unauthorized" }, { status: 401 });
  }

  const projectId = req.nextUrl.searchParams.get("projectId");
  if (!projectId) {
    return Response.json({ error: "Missing projectId" }, { status: 400 });
  }

  const project = await getProject(projectId, user.id);
  if (!project) {
    return Response.json({ error: "Project not found or unauthorized" }, { status: 404 });
  }

  try {
    const messages = await getChatMessages(projectId, user.id);
    return Response.json({ messages }, { status: 200 });
  } catch (error) {
    console.error("[GET /api/v1/chat-history error]:", error);
    return Response.json({ error: "Failed to load chat history" }, { status: 500 });
  }
}
