import { NextRequest } from "next/server";
import { PutObjectCommand } from "@aws-sdk/client-s3";
import { s3, BUCKET } from "@/lib/objectStorage";
import { currentUser } from "@/lib/auth";
import { env } from "@/lib/utils/env";

/**
 * Upload object to Neon Object Storage.
 * Validates user session on server and namespaces files.
 */
export async function POST(req: NextRequest) {
  // 1. Server-side authentication check
  const user = await currentUser();
  if (!user) {
    return Response.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const formData = await req.formData();
    const file = formData.get("file") as File | null;

    if (!file || !(file instanceof File) || file.size === 0) {
      return Response.json({ error: "No valid file provided" }, { status: 400 });
    }

    const MAX_FILE_SIZE = 20 * 1024 * 1024; // 20MB limit
    if (file.size > MAX_FILE_SIZE) {
      return Response.json({ error: "File size exceeds 20MB limit" }, { status: 413 });
    }

    const sanitizedName = file.name.replace(/[^a-zA-Z0-9._-]/g, "_");
    const key = `uploads/${user.id}/${crypto.randomUUID()}-${sanitizedName}`;
    const buffer = Buffer.from(await file.arrayBuffer());

    await s3.send(
      new PutObjectCommand({
        Bucket: BUCKET,
        Key: key,
        Body: buffer,
        ContentType: file.type || "application/octet-stream",
      })
    );

    // Return accessible app route for streaming the image
    const url = `/api/v1/file?key=${encodeURIComponent(key)}`;

    return Response.json({ url, key });
  } catch (error) {
    console.error("[POST /api/v1/upload error]:", error);
    return Response.json({ error: "Upload failed" }, { status: 500 });
  }
}
