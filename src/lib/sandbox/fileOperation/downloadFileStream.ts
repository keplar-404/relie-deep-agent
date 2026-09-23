import type { DownloadStreamOptions } from "@daytona/sdk";
import { daytona } from "../index";
import { resolvePath } from "./resolvePath";

/** Downloads a file as a readable stream from the sandbox workspace. */
export async function downloadFileStream({
  path,
  sandBoxId,
  options,
}: {
  path?: string;
  sandBoxId: string;
  options?: DownloadStreamOptions;
}) {
  try {
    const sandbox = await daytona.get(sandBoxId);
    return await sandbox.fs.downloadFileStream(resolvePath(path), options);
  } catch (error) {
    console.error("[fsOperations: downloadFileStream] Error:", error);
    throw error;
  }
}