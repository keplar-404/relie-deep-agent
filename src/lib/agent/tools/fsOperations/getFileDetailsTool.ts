import { tool } from "@langchain/core/tools";
import { z } from "zod";
import { getFileDetails } from "@/lib/sandbox/fileOperation/getFileDetails";

/** Deep-agent tool that retrieves metadata details for a file or directory. */
export const getFileDetailsTool = tool(
  async ({ path }, config) => {
    const sandBoxId = config?.configurable?.sandBoxId as string;
    if (!sandBoxId) throw new Error("Missing sandBoxId in tool config");
    return await getFileDetails({ path, sandBoxId });
  },
  {
    name: "get_file_details",
    description: `Tool Name: get_file_details
What it does: Retrieves metadata details for a specified file or directory in the sandbox (file name, file size in bytes, modification time, ISO timestamp).
When to use: Use to check if a file/folder exists, inspect file size before reading, or check modification timestamps.
Input Format: JSON object { path?: string } where path is relative to app root (e.g. 'package.json').
Output Format:
  - On Success: Formatted string "File Name:<name>\n File Size: <size> bytes\n File Modified time: <modTime>\n File modified at: <modifiedAt>"
  - On Error / Not Found: Throws DaytonaFileNotFoundError ("stat /home/daytona/app/<path>: no such file or directory").
Rules / Constraints:
  - Do NOT use to read file text content (use 'read_file_text').
  - Do NOT use to list folder contents (use 'list_fs').`,
    schema: z.object({
      path: z
        .string()
        .optional()
        .describe("Target file or folder path relative to app root (e.g. 'package.json', 'src/App.tsx')."),
    }),
  },
);