import { Image, Daytona } from "@daytona/sdk";
import { env } from "@/lib/utils/env";

export const daytona = new Daytona({ apiKey: env.DAYTONA_API_KEY });
const SNAPSHOT = "react-vite-bun-v2";

async function createSnapShot() {
  try {
    await daytona.snapshot.create({
      name: SNAPSHOT,
      image: Image.base("oven/bun:1-debian").runCommands(
        "apt-get update && apt-get install -y curl git",
        "git clone https://github.com/keplar-404/template-react-project.git /home/daytona/app",
        "cd /home/daytona/app && bun install",
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
  } catch (e: any) {
    if (e?.statusCode !== 409) throw e; // ponytail: 409 = already exists, swallowed on purpose
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
  } catch {
    await createSnapShot();
    return await sandBoxInit();
  }
}
