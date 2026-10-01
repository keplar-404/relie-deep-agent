import { resolvePath } from "./resolvePath";
import { getSandboxInstance } from "../index";

/** Creates a directory or text based file with default permission mode ('775') in the sandbox workspace. */
export async function createFolder({
  path,
  sandBoxId,
}: {
  path?: string;
  sandBoxId: string;
}) {
  try {
    const sandbox = await getSandboxInstance(sandBoxId);
    const resolvedPath = resolvePath(path);
    await sandbox.fs.createFolder(resolvedPath, "775");
    return `Folder created successfully at ${resolvedPath}`;
  } catch (error) {
    console.error("[fsOperations: createFolder] Error:", error);
    throw error;
  }
}
