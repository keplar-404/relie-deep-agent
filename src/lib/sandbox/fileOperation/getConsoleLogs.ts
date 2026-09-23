import type { SessionCommandLogsResponse } from "@daytona/sdk";
import { daytona } from "../index";

/** Fetches entrypoint/server console logs from the Daytona sandbox. */
export async function getConsoleLogs({
  sandBoxId,
}: {
  sandBoxId: string;
}): Promise<SessionCommandLogsResponse> {
  try {
    const sandbox = await daytona.get(sandBoxId);
    return await sandbox.process.getEntrypointLogs();
  } catch (error) {
    console.error("[fsOperations: getConsoleLogs] Error:", error);
    throw error;
  }
}