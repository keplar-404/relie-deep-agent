import { Image, Daytona, DaytonaNotFoundError, DaytonaConflictError, type Sandbox } from "@daytona/sdk";
import { env } from "@/lib/utils/env";

export const daytona = new Daytona({ apiKey: env.DAYTONA_API_KEY });
const SNAPSHOT = "react-vite-bun-v3";

const sandboxCache = new Map<string, { sandbox: Sandbox; expiresAt: number }>();

/** Memoized Sandbox instance retriever: avoids spamming daytona.get() on every tool call */
export async function getSandboxInstance(sandBoxId: string): Promise<Sandbox> {
  const cached = sandboxCache.get(sandBoxId);
  if (cached && Date.now() < cached.expiresAt) {
    return cached.sandbox;
  }
  const sb = await daytona.get(sandBoxId);
  sandboxCache.set(sandBoxId, { sandbox: sb, expiresAt: Date.now() + 5 * 60 * 1000 });
  return sb;
}

function isSnapshotNotFoundError(error: unknown): boolean {
  if (error instanceof DaytonaNotFoundError) {
    return true;
  }
  if (typeof error === "object" && error !== null) {
    const err = error as { statusCode?: number; status?: number; message?: string };
    if (err.statusCode === 404 || err.status === 404) {
      return true;
    }
    if (
      typeof err.message === "string" &&
      (err.message.toLowerCase().includes("snapshot") ||
        err.message.toLowerCase().includes("not found"))
    ) {
      return true;
    }
  }
  return false;
}

async function createSnapShot() {
  try {
    await daytona.snapshot.create({
      name: SNAPSHOT,
      image: Image.base("oven/bun:1-debian").runCommands(
        "apt-get update && apt-get install -y curl git",
        "bun add -g playwright",
        "bunx --bun playwright install --with-deps chromium",
        "git clone https://github.com/keplar-404/template-react-project.git /home/daytona/app",
        "cd /home/daytona/app && bun install"
      ),
      entrypoint: [
        "bun",
        "run",
        "--cwd",
        "/home/daytona/app",
        "dev",
        "--",
        "--host",
        "0.0.0.0",
        "--port",
        "3000",
      ],
    });
  } catch (e: unknown) {
    if (
      e instanceof DaytonaConflictError ||
      (typeof e === "object" && e !== null && "statusCode" in e && (e as { statusCode: number }).statusCode === 409)
    ) {
      return; // ponytail: 409 = already exists, swallowed on purpose
    }
    throw e;
  }
}

async function sandBoxInit() {
  const sb = await daytona.create({
    snapshot: SNAPSHOT,
    ephemeral: false, // set it true if you want to delete the sandbox after 20 min.
    autoStopInterval: 20,
  });
  const preview = await sb.getSignedPreviewUrl(3000, 3600);
  return { previewUrl: preview.url, sandboxId: sb.id };
}

export default async function createSandBox() {
  try {
    return await sandBoxInit();
  } catch (error: unknown) {
    if (isSnapshotNotFoundError(error)) {
      console.warn(`[createSandBox] Snapshot "${SNAPSHOT}" not found. Creating snapshot...`);
      await createSnapShot();
      return await sandBoxInit();
    }
    throw error;
  }
}

