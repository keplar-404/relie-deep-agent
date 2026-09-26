import { S3Client } from "@aws-sdk/client-s3";
import { env } from "@/lib/utils/env";

/**
 * Neon Object Storage S3 Client.
 * Configured per official Neon documentation:
 * https://neon.com/docs/storage/get-started#configure-your-client
 */
export const s3 = new S3Client({
  region: env.AWS_REGION,
  endpoint: env.AWS_ENDPOINT_URL_S3,
  credentials:
    env.AWS_ACCESS_KEY_ID && env.AWS_SECRET_ACCESS_KEY
      ? {
          accessKeyId: env.AWS_ACCESS_KEY_ID,
          secretAccessKey: env.AWS_SECRET_ACCESS_KEY,
        }
      : undefined,
  forcePathStyle: true,
  requestChecksumCalculation: "WHEN_REQUIRED",
});

export const BUCKET = env.S3_BUCKET || env.NEON_STORAGE_BUCKET || "project-assets";

export * from "./uploadFiles";
export * from "./deleteFiles";
