import path from "node:path";

const APP_DIR = "/home/daytona/app";

export function resolvePath(targetPath?: string) {
  if (!targetPath) return APP_DIR;
  let trimmed = targetPath.trim();
  if (trimmed === "" || trimmed === ".") return APP_DIR;

  trimmed = trimmed
    .replace(/^~(?=\/|$)/, "")
    .replace(/^\$\{?[A-Z_]+\}?(?=\/|$)/, "");

  if (trimmed === "" || trimmed === ".") return APP_DIR;
  if (trimmed.startsWith("/") || trimmed.startsWith("\\")) {
    throw new Error(`Unauthorized path access: absolute paths are not permitted (${targetPath})`);
  }

  const resolved = path.posix.normalize(`${APP_DIR}/${trimmed}`);

  if (resolved !== APP_DIR && !resolved.startsWith(`${APP_DIR}/`)) {
    throw new Error(`Unauthorized path access: path traversal outside workspace (${targetPath})`);
  }

  return resolved;
}
