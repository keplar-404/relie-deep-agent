import { NextRequest } from "next/server";
import { currentUser } from "@/lib/auth";
import { uploadAsset } from "@/lib/objectStorage";

/**
 * POST /api/v1/upload
 *
 * Dedicated API route to upload files directly to Neon Object Storage.
 *
 * Request format: `multipart/form-data`
 * Fields:
 * - `file` (required): File to upload
 * - `folder` (optional): Folder prefix in bucket (defaults to "uploads")
 *
 * Returns:
 * {
 *   success: true,
 *   url: string,
 *   key: string,
 *   name: string,
 *   size: number,
 *   type: string
 * }
 */
export async function POST(req: NextRequest) {
  // 1. Authenticate user
  const user = await currentUser();
  if (!user) {
    return Response.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    // 2. Parse multipart form data
    const formData = await req.formData();
    const file = formData.get("file");
    const folderInput = formData.get("folder");

    if (!file || !(file instanceof File)) {
      return Response.json(
        { error: "No file provided. Ensure the form field is named 'file'." },
        { status: 400 }
      );
    }

    // 3. Sanitize folder and filename
    const folder =
      typeof folderInput === "string" && folderInput.trim()
        ? folderInput.trim().replace(/^\/+|\/+$/g, "")
        : "uploads";

    const sanitizedName = file.name
      .replace(/[^a-zA-Z0-9._-]/g, "_")
      .toLowerCase();

    // Unique key with timestamp & random ID to avoid collisions
    const key = `${folder}/${Date.now()}-${crypto.randomUUID().slice(0, 8)}-${sanitizedName}`;

    // 4. Convert File to in-memory Buffer
    const arrayBuffer = await file.arrayBuffer();
    const buffer = Buffer.from(arrayBuffer);
    const contentType = file.type || "application/octet-stream";

    // 5. Upload directly to Neon Object Storage
    const url = await uploadAsset(key, buffer, contentType);

    return Response.json({
      success: true,
      url,
      key,
      name: file.name,
      size: file.size,
      type: contentType,
    });
  } catch (error) {
    console.error("[POST /api/v1/upload error]:", error);
    return Response.json(
      {
        error:
          error instanceof Error
            ? error.message
            : "Failed to upload file to object storage.",
      },
      { status: 500 }
    );
  }
}
