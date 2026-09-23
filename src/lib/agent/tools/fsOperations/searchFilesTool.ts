import { tool } from "@langchain/core/tools";
import { z } from "zod";
import { searchFiles } from "@/lib/sandbox/fileOperation/searchFiles";

/** Deep-agent tool that searches for file paths matching a glob pattern. */
export const searchFilesTool = tool(
  async ({ pattern, path }, config) => {
    const sandBoxId = config?.configurable?.sandBoxId as string;
    if (!sandBoxId) throw new Error("Missing sandBoxId in tool config");
    return await searchFiles({ pattern, path, sandBoxId });
  },
  {
    name: "search_files",
    description: `Tool Name: search_files
What it does: Searches for file paths matching a glob pattern (e.g. '*.tsx', '*.css', '*.json') across subdirectories in the sandbox workspace.
When to use: Use when locating file paths by extension or pattern when you know part of the file name or type but not its subfolder.
Input Format: JSON object { pattern?: string, path?: string } where pattern is a glob pattern (default '*') and path is the search root.
Output Format:
  - On Success: Array of match objects [{ name: string, path: string }] or file path strings.
  - On Error / Not Found: Returns an empty array [] if no files match the pattern.
Rules / Constraints:
  - Do NOT use to search for code text inside files (use 'find_files').
  - Do NOT use to list immediate contents of a single directory (use 'list_fs').`,
    schema: z.object({
      pattern: z.string().optional().describe("Glob pattern to match file names (e.g. '*.tsx', '*.css', '*.json'). Defaults to '*'."),
      path: z.string().optional().describe("Base directory relative to app root to search within (e.g. 'src')."),
    }),
  },
);