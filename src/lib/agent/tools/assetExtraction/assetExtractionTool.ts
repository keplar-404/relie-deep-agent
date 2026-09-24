import { tool } from "@langchain/core/tools";
import { z } from "zod";
import { extractAssets } from "./engine";

/**
 * Deep-agent tool that locates and crops visual assets from input image URLs.
 */
export const assetExtractionTool = tool(
  async ({ imageUrls, labels }) => {
    const assets = await extractAssets(imageUrls, labels);
    return JSON.stringify(assets, null, 2);
  },
  {
    name: "extract_website_assets",
    description: `Tool Name: extract_website_assets
What it does: Locates and crops visual assets (e.g. logos, hero images, banners, icons, buttons) from screenshot or design mockup images using AI vision, and returns the cropped assets.
When to use: Use when given image URLs (mockups, screenshots, design inspirations) and you need to extract specific visual assets to incorporate into the website or web application.
Input Format: JSON object { imageUrls: string[], labels: string[] }
  - imageUrls: Array of public HTTP/HTTPS URLs or base64 data URLs of the source images.
  - labels: Array of descriptive labels for the visual assets to locate and crop.
Output Format:
  JSON array: [{ "label": string, "url": string | null }]
Rules / Constraints:
  - Be specific with labels (e.g. "brand logo in header", "hero banner image", "feature icon").
  - All processing is done in-memory — no files are written to local disk.`,
    schema: z.object({
      imageUrls: z
        .array(z.string())
        .min(1)
        .describe("One or more image URLs (HTTP/HTTPS or data URLs) to inspect."),
      labels: z
        .array(z.string())
        .min(1)
        .describe("List of asset labels/descriptions to locate and crop."),
    }),
  }
);

