import { daytona } from "../index";
import { resolvePath } from "./resolvePath";

/** Replaces occurrences of a text pattern across multiple files in the sandbox workspace. */
export async function replaceInFiles({
  files,
  pattern,
  newValue,
  sandBoxId,
}: {
  files: string[];
  pattern: string;
  newValue: string;
  sandBoxId: string;
}) {
  try {
    const sandbox = await daytona.get(sandBoxId);
    const resolvedFiles = files.map((f) => resolvePath(f));
    const results = await sandbox.fs.replaceInFiles(resolvedFiles, pattern, newValue);
    return `Replaced pattern "${pattern}" with "${newValue}" across ${results.length} files.`;
  } catch (error) {
    console.error("[fsOperations: replaceInFiles] Error:", error);
    throw error;
  }
}