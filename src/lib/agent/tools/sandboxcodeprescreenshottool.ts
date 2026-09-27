import { tool } from "@langchain/core/tools";
import { z } from "zod";
import { captureResponsiveScreenshots } from "@/lib/sandbox/captureResponsiveScreenshots";

/**
 * Deep-agent tool that captures full-page responsive screenshots (desktop, laptop, tablet, mobile)
 * of the live web application running in the Daytona sandbox.
 */
export const sandboxcodeprescreenshottool = tool(
  async ({ url, path, sandBoxId: sandBoxIdInput }, config) => {
    const sandBoxId =
      (config?.configurable?.sandBoxId as string) || sandBoxIdInput;

    if (!sandBoxId) {
      throw new Error(
        "Missing sandBoxId in tool configuration or input arguments"
      );
    }

    const targetUrl =
      url ||
      (path
        ? `http://localhost:3000${path.startsWith("/") ? path : `/${path}`}`
        : "http://localhost:3000");

    const screenshots = await captureResponsiveScreenshots({
      sandBoxId,
      url: targetUrl,
    });

    return JSON.stringify(screenshots, null, 2);
  },
  {
    name: "sandboxcodeprescreenshottool",
    description: `Tool Name: sandboxcodeprescreenshottool
What it does: Captures full-page responsive screenshots across 4 viewports (desktop: 1920x1080, laptop: 1440x900, tablet: 820x1180, mobile: 390x844) of the live website running in the sandbox, uploads them to object storage, and returns their public URLs.
When to use: Use to visually verify the rendered website, check for responsive design defects, inspect layout bugs, verify mobile/tablet breakpoints, or confirm that UI components render properly.
Input Format: JSON object { url?: string, path?: string, sandBoxId?: string }
  - url: Full URL to capture (defaults to "http://localhost:3000").
  - path: Relative route path to capture (e.g. "/" or "/pricing" or "/about").
  - sandBoxId: Optional sandbox ID override.
Output Format:
  JSON array: [{ "label": "desktop"|"laptop"|"tablet"|"mobile", "width": number, "height": number, "url": string }]
Rules / Constraints:
  - Vite dev server runs on port 3000 in the sandbox.
  - Returns public CDN image URLs for each viewport to inspect responsive layout and visual correctness.`,
    schema: z.object({
      url: z
        .string()
        .optional()
        .describe(
          "Full URL to capture (defaults to 'http://localhost:3000')."
        ),
      path: z
        .string()
        .optional()
        .describe(
          "Relative route path to capture (e.g. '/' or '/pricing' or '/about'). Defaults to '/' if url is omitted."
        ),
      sandBoxId: z
        .string()
        .optional()
        .describe(
          "Optional sandbox ID override if not provided in tool configuration."
        ),
    }),
  }
);

export const sandboxCodePreScreenshotTool = sandboxcodeprescreenshottool;
export default sandboxcodeprescreenshottool;
