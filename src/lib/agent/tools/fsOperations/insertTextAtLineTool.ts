import { tool } from "@langchain/core/tools";
import { z } from "zod";
import { insertTextAtLine } from "@/lib/sandbox/fileOperation/insertTextAtLine";

/**
 * Deep-agent tool that inserts text, code snippets, or line gaps at a specific line number in a file.
 * Preserves the rest of the file and prevents costly full-file rewrites.
 */
export const insertTextAtLineTool = tool(
  async ({ path, line, text, sandBoxId: sandBoxIdInput }, config) => {
    const sandBoxId =
      (config?.configurable?.sandBoxId as string) || sandBoxIdInput;

    if (!sandBoxId) {
      throw new Error(
        "Missing sandBoxId in tool configuration or input arguments"
      );
    }

    return await insertTextAtLine({
      path,
      line,
      text,
      sandBoxId,
    });
  },
  {
    name: "insert_text_at_line",
    description: `Tool Name: insert_text_at_line
What it does: Inserts text, code lines, or empty line gaps at a specific 1-indexed line number in a file in the sandbox workspace (/home/daytona/app), pushing existing lines down without overwriting the rest of the file.
When to use: Use when adding imports, state hooks, JSX elements, helper functions, comments, or line gaps at an exact line position without rewriting the entire file.
Input Format: JSON object { path: string, line: number, text: string, sandBoxId?: string }
  - path: Target file path relative to app root (e.g. "src/App.tsx", "src/components/Navbar.tsx").
  - line: 1-indexed line number where the text should be inserted (e.g. 1 for top of file, 10 to insert at line 10).
  - text: The code, string, or line gap to insert. Can include newlines (\\n).
Output Format:
  String: "Successfully inserted X line(s) at line Y in <path>. File now has Z lines."
Rules / Constraints:
  - Use line 1 to insert at the top of the file (e.g. imports or "use client").
  - If line exceeds total lines, the text is appended at the end of the file.
  - Passing empty lines or "\\n" inserts blank spacing gaps without altering other code.`,
    schema: z.object({
      path: z
        .string()
        .describe(
          "Target file path relative to app root (e.g. 'src/App.tsx')."
        ),
      line: z
        .number()
        .describe(
          "1-indexed line number where text should be inserted (e.g. 1 for top of file, 15 to insert at line 15)."
        ),
      text: z
        .string()
        .describe(
          "The text, code snippet, or newline gap to insert at the specified line number."
        ),
      sandBoxId: z
        .string()
        .optional()
        .describe(
          "Optional sandbox ID override if not configured in runtime context."
        ),
    }),
  }
);

export default insertTextAtLineTool;
