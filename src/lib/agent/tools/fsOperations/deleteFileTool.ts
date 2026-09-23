import { tool } from "@langchain/core/tools";
import { z } from "zod";
import { deleteFile } from "@/lib/sandbox/fileOperation/deleteFile";

/** Deep-agent tool that deletes a file or directory (recursively if specified) from the sandbox workspace. */
export const deleteFileTool = tool(
  async ({ path, recursive }, config) => {
    const sandBoxId = config?.configurable?.sandBoxId as string;
    if (!sandBoxId) throw new Error("Missing sandBoxId in tool config");
    return await deleteFile({ path, sandBoxId, recursive });
  },
  {
    name: "delete_file",
    description: `Tool Name: delete_file
What it does: Deletes a specified file or directory (recursively if specified) from the sandbox workspace (/home/daytona/app).
When to use: Use to remove unused files, stale components, or directories (set recursive=true for non-empty directories).
Input Format: JSON object { path: string, recursive?: boolean } where path is relative to app root.
Output Format:
  - On Success: String "File deleted successfully from /home/daytona/app/<path>" or "Directory deleted recursively from /home/daytona/app/<path>"
  - On Error / Not Found: String "File or directory already removed or does not exist at /home/daytona/app/<path>" or "Error: Deleting the workspace root directory is forbidden..."
Rules / Constraints:
  - NEVER delete the workspace root directory ('/home/daytona/app' or '/').
  - NEVER delete 'package.json', 'package-lock.json', or 'bun.lockb'.
  - Do NOT use to rename or move files (use 'move_files' instead).`,
    schema: z.object({
      path: z.string().optional().describe("File or directory path relative to app root (e.g. 'src/old.ts')."),
      recursive: z.boolean().optional().describe("Set true when deleting non-empty directories."),
    }),
  },
);