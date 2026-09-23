import { daytona } from "../index";

/** Runs TypeScript type checking ('npx tsc --noEmit') inside the Daytona sandbox. */
export async function runTypecheck({
  sandBoxId,
  cwd = ".",
}: {
  sandBoxId: string;
  cwd?: string;
}) {
  try {
    const sandbox = await daytona.get(sandBoxId);
    return await sandbox.process.executeCommand("npx tsc --noEmit", cwd);
  } catch (error) {
    console.error("[fsOperations: runTypecheck] Error:", error);
    throw error;
  }
}