import { NextRequest } from "next/server";
import { GetObjectCommand } from "@aws-sdk/client-s3";
import { s3, BUCKET } from "@/lib/objectStorage";

/**
 * Public file streaming endpoint for objects stored in Neon S3.
 * Serves uploaded project images and thumbnails with long-term cache headers.
 */
export async function GET(req: NextRequest) {
  const key = req.nextUrl.searchParams.get("key");
  if (!key) {
    return new Response("Missing file key", { status: 400 });
  }

  try {
    const s3Res = await s3.send(
      new GetObjectCommand({
        Bucket: BUCKET,
        Key: key,
      })
    );

    if (!s3Res.Body) {
      return new Response("File not found", { status: 404 });
    }

    const contentType = s3Res.ContentType || "image/jpeg";
    const stream = s3Res.Body.transformToWebStream();

    return new Response(stream, {
      status: 200,
      headers: {
        "Content-Type": contentType,
        "Cache-Control": "public, max-age=31536000, immutable",
      },
    });
  } catch (error) {
    console.error("[GET /api/v1/file error]:", error);
    return new Response("File not found", { status: 404 });
  }
}
