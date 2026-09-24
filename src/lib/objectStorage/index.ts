import { S3Client, PutObjectCommand } from "@aws-sdk/client-s3";
import { env } from "@/lib/utils/env";

/**
 * Neon Object Storage S3 Client.
 *
 * Configured strictly per Neon documentation:
 * - Credentials, endpoint, and region are read from the standard AWS environment chain.
 * - `forcePathStyle: true` is required because Neon uses path-style addressing.
 */
export const s3 = new S3Client({
  forcePathStyle: true,
});

export const BUCKET = env.NEON_STORAGE_BUCKET;

/**
 * Uploads an asset buffer to Neon Object Storage using PutObjectCommand.
 *
 * Per Neon documentation:
 * A public_read object is read at `${AWS_ENDPOINT_URL_S3}/<bucket>/<object-key>`.
 */
export async function uploadAsset(
  key: string,
  buffer: Buffer | Uint8Array,
  contentType = "image/png"
): Promise<string> {
  const cleanKey = key.replace(/^\/+/, "");

  await s3.send(
    new PutObjectCommand({
      Bucket: BUCKET,
      Key: cleanKey,
      Body: buffer,
      ContentType: contentType,
    })
  );

  const endpoint = (env.AWS_ENDPOINT_URL_S3 || "").replace(/\/+$/, "");
  return `${endpoint}/${BUCKET}/${cleanKey}`;
}
