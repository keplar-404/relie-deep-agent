import { PutObjectCommand } from "@aws-sdk/client-s3";
import { s3, BUCKET } from "./index";
import { env } from "@/lib/utils/env";

export interface FileInput {
  key: string;
  buffer: Buffer | Uint8Array;
  contentType?: string;
}

export async function uploadFiles(files: FileInput[]): Promise<string[]> {
  const endpoint = (env.AWS_ENDPOINT_URL_S3 || "").replace(/\/+$/, "");

  return Promise.all(
    files.map(async (file) => {
      const cleanKey = file.key.replace(/^\/+/, "");
      await s3.send(
        new PutObjectCommand({
          Bucket: BUCKET,
          Key: cleanKey,
          Body: file.buffer,
          ContentType: file.contentType || "image/png",
        }),
      );
      return `${endpoint}/${BUCKET}/${cleanKey}`;
    }),
  );
}
