import { Daytona } from "@daytona/sdk";
import { env } from "@/lib/utils/env";

export default async function getSandboxPreviewURL(
  sandBoxId: string,
): Promise<string> {
  const daytona = new Daytona({ apiKey: env.DAYTONA_API_KEY });
  const sb = await daytona.get(sandBoxId);

  if (sb.state === "stopped") {
    await sb.start();
  }

  const preview = await sb.getSignedPreviewUrl(3000, 3600);
  return preview.url;
}
