import { NextRequest } from "next/server";
import { PutObjectCommand } from "@aws-sdk/client-s3";
import { s3, BUCKET } from "@/lib/objectStorage";
import { env } from "@/lib/utils/env";

/**
 * Upload object to Neon Object Storage.
 * Follows official Neon documentation: https://neon.com/docs/storage/objects#upload
 */
export async function POST(req: NextRequest) {
  try {
    const formData = await req.formData();
    const file = formData.get("file") as File | null;

    if (!file) {
      return Response.json({ error: "No file provided" }, { status: 400 });
    }

    const buffer = Buffer.from(await file.arrayBuffer());

    await s3.send(
      new PutObjectCommand({
        Bucket: BUCKET,
        Key: file.name,
        Body: buffer,
        ContentType: file.type || "application/octet-stream",
      })
    );

    const endpoint = (env.AWS_ENDPOINT_URL_S3 || "").replace(/\/+$/, "");
    const url = `${endpoint}/${BUCKET}/${file.name}`;

    return Response.json({ url, key: file.name });
  } catch (error) {
    return Response.json(
      { error: error instanceof Error ? error.message : "Upload failed" },
      { status: 500 }
    );
  }
}
