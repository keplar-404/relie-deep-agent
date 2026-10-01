import { tool } from "@langchain/core/tools";
import { z } from "zod";
import { env } from "@/lib/utils/env";
import { uploadFiles } from "@/lib/objectStorage";
import { uploadFile as uploadToSandbox } from "@/lib/sandbox/fileOperation/uploadFile";

const DEFAULT_IMAGE_MODEL = "google/gemini-3.1-flash-image-preview";

export interface GeneratedImageResult {
  success: boolean;
  url: string;
  localPath: string;
  prompt: string;
  model: string;
}

/**
 * Deep-agent tool that generates high-fidelity visual assets (logos, hero illustrations,
 * product images, banners, icons) from a text prompt via OpenRouter's dedicated Image API.
 * The generated asset is saved to both Neon S3 Object Storage and the sandbox workspace.
 */
export const imageGenerationTool = tool(
  async ({ prompt, aspectRatio = "1:1", filename }, config): Promise<string> => {
    const apiKey = env.OPENROUTER_API_KEY;
    if (!apiKey) {
      throw new Error("OPENROUTER_API_KEY is not configured.");
    }

    const sandBoxId = config?.configurable?.sandBoxId as string | undefined;
    const projectId = (config?.configurable?.projectId || config?.configurable?.thread_id) as string | undefined;

    // 1. Call OpenRouter dedicated Image API per documentation
    const response = await fetch("https://openrouter.ai/api/v1/images", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${apiKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: DEFAULT_IMAGE_MODEL,
        prompt,
        aspect_ratio: aspectRatio,
      }),
    });

    if (!response.ok) {
      const errText = await response.text().catch(() => "");
      throw new Error(`OpenRouter Image API error (${response.status}): ${errText}`);
    }

    const json = await response.json();
    const item = json?.data?.[0];
    const b64 = item?.b64_json;
    if (!b64) {
      throw new Error("No image data returned from image generation model.");
    }

    const buffer = Buffer.from(b64, "base64");
    const sanitizedName =
      (filename || prompt.slice(0, 30).toLowerCase().replace(/[^a-z0-9_-]/g, "_")) +
      `-${Date.now().toString(36)}.png`;

    // 2. Upload to Neon S3 Object Storage under agents/${projectId}/ so deleteProjectFiles cascades it
    const s3Key = projectId
      ? `agents/${projectId}/generated/${crypto.randomUUID()}-${sanitizedName}`
      : `generated/${crypto.randomUUID()}-${sanitizedName}`;

    const [publicUrl] = await uploadFiles([
      {
        buffer,
        contentType: "image/png",
        key: s3Key,
      },
    ]);

    // 3. Write directly into /home/daytona/app/public folder so Vite serves it at /<filename>
    const localPath = `/${sanitizedName}`;
    if (sandBoxId) {
      try {
        await uploadToSandbox({
          sandBoxId,
          path: `public/${sanitizedName}`,
          content: buffer,
        });
      } catch (err) {
        console.warn("[imageGenerationTool] Warning writing to sandbox /public folder:", err);
      }
    }

    const result: GeneratedImageResult = {
      success: true,
      url: publicUrl,
      localPath,
      prompt,
      model: DEFAULT_IMAGE_MODEL,
    };

    return JSON.stringify(result, null, 2);
  },
  {
    name: "generate_image",
    description: `Tool Name: generate_image
What it does: Generates brand new visual assets (hero banners, brand logos, product illustrations, icons, textures) from a descriptive text prompt using OpenRouter's Image API.
When to use: Use when the user requests creating or generating a new image, graphic, logo, or visual element that does not yet exist.
Input Format: JSON object { prompt: string, aspectRatio?: "1:1" | "16:9" | "9:16" | "4:3", filename?: string }
Output Format:
  JSON object: { "success": true, "url": string, "localPath": string, "prompt": string, "model": string }
Rules / Constraints:
  - Provide a descriptive visual prompt for best results.
  - The returned 'url' can be used directly in HTML/React <img> src attributes and markdown.`,
    schema: z.object({
      prompt: z
        .string()
        .min(1)
        .describe("Detailed visual description of the image to generate."),
      aspectRatio: z
        .enum(["1:1", "16:9", "9:16", "4:3"])
        .optional()
        .default("1:1")
        .describe("Aspect ratio for the generated asset."),
      filename: z
        .string()
        .optional()
        .describe("Optional clean filename prefix (e.g. 'hero-banner')."),
    }),
  }
);
