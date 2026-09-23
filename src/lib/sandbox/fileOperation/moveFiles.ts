import { daytona } from "../index";
import { resolvePath } from "./resolvePath";

/** Moves or renames a file or directory in the sandbox workspace. */
export async function moveFiles({
  source,
  destination,
  sandBoxId,
}: {
  source: string;
  destination: string;
  sandBoxId: string;
}) {
  try {
    const sandbox = await daytona.get(sandBoxId);
    const resolvedSource = resolvePath(source);
    const resolvedDest = resolvePath(destination);
    await sandbox.fs.moveFiles(resolvedSource, resolvedDest);
    return `Files moved successfully from ${resolvedSource} to ${resolvedDest}`;
  } catch (error) {
    console.error("[fsOperations: moveFiles] Error:", error);
    throw error;
  }
}