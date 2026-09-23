import type { UploadSource, UploadStreamOptions } from "@daytona/sdk";
import { daytona } from "../index";
import { resolvePath } from "./resolvePath";

/** Uploads a binary or large file via streaming to avoid loading large files into memory. */
export async function uploadFileStream({
  source,
  path,
  sandBoxId,
  options,
}: {
  source: UploadSource;
  path?: string;
  sandBoxId: string;
  options?: UploadStreamOptions;
}) {
  try {
    const sandbox = await daytona.get(sandBoxId);
    const resolvedPath = resolvePath(path);
    await sandbox.fs.uploadFileStream(source, resolvedPath, options);
    return `File stream uploaded successfully to ${resolvedPath}`;
  } catch (error) {
    console.error("[fsOperations: uploadFileStream] Error:", error);
    throw error;
  }
}