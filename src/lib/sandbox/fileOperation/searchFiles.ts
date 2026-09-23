import { daytona } from "../index";
import { resolvePath } from "./resolvePath";

/** Searches for file names matching a glob pattern in the sandbox workspace. */
export async function searchFiles({
  pattern = "*",
  path,
  sandBoxId,
}: {
  pattern?: string;
  path?: string;
  sandBoxId: string;
}) {
  try {
    const sandbox = await daytona.get(sandBoxId);
    return await sandbox.fs.searchFiles(resolvePath(path), pattern);
  } catch (error) {
    console.error("[fsOperations: searchFiles] Error:", error);
    throw error;
  }
}