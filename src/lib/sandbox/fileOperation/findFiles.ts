import { daytona } from "../index";
import { resolvePath } from "./resolvePath";

/** Searches file contents for a matching text pattern in the sandbox workspace. */
export async function findFiles({
  pattern,
  path,
  sandBoxId,
}: {
  pattern: string;
  path?: string;
  sandBoxId: string;
}) {
  try {
    const sandbox = await daytona.get(sandBoxId);
    return await sandbox.fs.findFiles(resolvePath(path), pattern);
  } catch (error) {
    console.error("[fsOperations: findFiles] Error:", error);
    throw error;
  }
}