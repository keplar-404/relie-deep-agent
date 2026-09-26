import { daytona } from "./index";
import { uploadFiles } from "@/lib/objectStorage";

const VIEWPORTS = [
  { label: "desktop", width: 1920, height: 1080 },
  { label: "laptop", width: 1440, height: 900 },
  { label: "tablet", width: 820, height: 1180 },
  { label: "mobile", width: 390, height: 844 },
] as const;

export interface ScreenshotResult {
  label: (typeof VIEWPORTS)[number]["label"];
  width: number;
  height: number;
  url: string;
}

export async function captureResponsiveScreenshots({
  sandBoxId,
  url,
}: {
  sandBoxId: string;
  url: string;
}): Promise<ScreenshotResult[]> {
  const sandbox = await daytona.get(sandBoxId);

  const script = `
import { chromium } from "playwright";

const url = ${JSON.stringify(url)};
const viewports = ${JSON.stringify(VIEWPORTS)};

const browser = await chromium.launch({ headless: true });
const ctx = await browser.newContext();
const out = [];

for (const vp of viewports) {
  const page = await ctx.newPage();
  await page.setViewportSize({ width: vp.width, height: vp.height });
  await page.goto(url, { waitUntil: "networkidle" });
  await page.waitForLoadState("load");
  await page.evaluate(() => document.fonts && document.fonts.ready);
  const path = "/tmp/" + vp.label + ".png";
  await page.screenshot({ fullPage: true, type: "png", path });
  out.push({ label: vp.label, width: vp.width, height: vp.height, path });
  await page.close();
}

await browser.close();
console.log(JSON.stringify(out));
`.trim();

  await sandbox.fs.uploadFile(Buffer.from(script, "utf-8"), "/tmp/cap.ts");
  const exec = await sandbox.process.executeCommand("bun run /tmp/cap.ts", "/home/daytona/app");
  if (exec.exitCode !== 0) throw new Error(exec.result ?? "playwright script failed");

  const line = (exec.result ?? "").split("\n").reverse().find((l) => l.trim().startsWith("["))!;
  const local: Array<{ label: string; width: number; height: number; path: string }> = JSON.parse(line);

  const downloaded = await Promise.all(
    local.map(async (r) => ({
      label: r.label as ScreenshotResult["label"],
      width: r.width,
      height: r.height,
      key: `screenshots/${sandBoxId}/${r.label}.png`,
      buffer: Buffer.from(await sandbox.fs.downloadFile(r.path)),
      contentType: "image/png",
    })),
  );

  const urls = await uploadFiles(downloaded);

  return downloaded.map((d, i) => ({
    label: d.label,
    width: d.width,
    height: d.height,
    url: urls[i]!,
  }));
}

export default captureResponsiveScreenshots;
