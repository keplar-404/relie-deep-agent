import { daytona } from "../index";
import { resolvePath } from "./resolvePath";

/** Retrieves metadata details for a specified file or directory in the sandbox. */
export async function getFileDetails({
  path,
  sandBoxId,
}: {
  path?: string;
  sandBoxId: string;
}) {
  try {
    const sandbox = await daytona.get(sandBoxId);
    const fileData = await sandbox.fs.getFileDetails(resolvePath(path));
    return `File Name:${fileData.name}\n File Size: ${fileData.size} bytes\n File Modified time: ${fileData.modTime}\n File modified at: ${fileData.modifiedAt}`;
  } catch (error) {
    console.error("[fsOperations: getFileDetails] Error:", error);
    throw error;
  }
}