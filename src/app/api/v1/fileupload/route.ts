import { NextRequest } from "next/server";
import { currentUser } from "@/lib/auth";
import { uploadFiles, type FileInput } from "@/lib/objectStorage";
import { optimizeServerImage } from "./optimizeImage";

const MAX_FILE_SIZE = 50 * 1024 * 1024; // 50MB safety ceiling

/**
 * POST /api/v1/fileupload — Universal file upload endpoint.
 * Silently validates, downscales, and optimizes images to WebP < 300 KB.
 * Uses the existing uploadFiles S3 storage action.
 */
export async function POST(req: NextRequest) {
  const user = await currentUser();
  if (!user) {
    return Response.json({ error: "Unauthorized" }, { status: 401 });
  }

  let formData: FormData;
  try {
    formData = await req.formData();
  } catch {
    return Response.json({ error: "Invalid form data" }, { status: 400 });
  }

  const rawFiles = formData.getAll("file").concat(formData.getAll("files"));
  const files = rawFiles.filter((f): f is File => f instanceof File && f.size > 0);

  if (files.length === 0) {
    return Response.json({ error: "No valid file(s) provided" }, { status: 400 });
  }

  for (const file of files) {
    if (file.size > MAX_FILE_SIZE) {
      return Response.json(
        { error: `File "${file.name}" exceeds the maximum limit` },
        { status: 413 },
      );
    }
  }

  try {
    const fileInputs: FileInput[] = await Promise.all(
      files.map(async (file) => {
        const rawBuffer = Buffer.from(await file.arrayBuffer());
        const initialType = file.type || "application/octet-stream";

        // Server-side silent image optimization (resizes to 1280x720, WebP < 300 KB)
        const { buffer, contentType, isWebp } = await optimizeServerImage(
          rawBuffer,
          initialType
        );

        let cleanName = file.name.replace(/[^a-zA-Z0-9._-]/g, "_");
        if (isWebp && !cleanName.endsWith(".webp")) {
          cleanName = `${cleanName.replace(/\.[^/.]+$/, "")}.webp`;
        }

        const key = `uploads/${user.id}/${crypto.randomUUID()}-${cleanName}`;
        return {
          key,
          buffer,
          contentType,
        };
      }),
    );

    const s3Urls = await uploadFiles(fileInputs);

    const results = fileInputs.map((input, idx) => ({
      key: input.key,
      url: `/api/v1/file?key=${encodeURIComponent(input.key)}`,
      s3Url: s3Urls[idx],
    }));

    if (results.length === 1) {
      return Response.json(results[0], { status: 201 });
    }

    return Response.json({ files: results }, { status: 201 });
  } catch (error) {
    console.error("[POST /api/v1/fileupload error]:", error);
    return Response.json({ error: "File upload failed" }, { status: 500 });
  }
}
