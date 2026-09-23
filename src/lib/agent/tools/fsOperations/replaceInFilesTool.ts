import { tool } from "@langchain/core/tools";
import { z } from "zod";
import { replaceInFiles } from "@/lib/sandbox/fileOperation/replaceInFiles";

/** Deep-agent tool that performs exact text search-and-replace across multiple files. */
export const replaceInFilesTool = tool(
  async ({ files, pattern, newValue }, config) => {
    const sandBoxId = config?.configurable?.sandBoxId as string;
    if (!sandBoxId) throw new Error("Missing sandBoxId in tool config");
    return await replaceInFiles({ files, pattern, newValue, sandBoxId });
  },
  {
    name: "replace_in_files",
    description: `Tool Name: replace_in_files
What it does: Performs exact text search-and-replace across multiple specified files in the sandbox workspace (/home/daytona/app).
When to use: Use when refactoring variable names, imports, component labels, or API endpoints across multiple files.
Input Format: JSON object { files: string[], pattern: string, newValue: string } relative to app root.
Output Format:
  - On Success: String "Replaced pattern \"<pattern>\" with \"<newValue>\" across X files."
  - On Error / Not Found: Throws Error exception if a specified file does not exist.
Rules / Constraints:
  - Do NOT use to write an entire file from scratch (use 'upload_file').
  - Ensure target files exist before calling (use 'find_files' first if uncertain).`,
    schema: z.object({
      files: z.array(z.string()).describe("List of target file paths relative to app root."),
      pattern: z.string().describe("Exact text pattern to search for and replace."),
      newValue: z.string().describe("Replacement text."),
    }),
  },
);