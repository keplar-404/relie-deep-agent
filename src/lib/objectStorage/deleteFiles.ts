import { ListObjectsV2Command, DeleteObjectsCommand } from "@aws-sdk/client-s3";
import { s3, BUCKET } from "./index";

export async function deleteFiles(prefix: string) {
  const list = await s3.send(
    new ListObjectsV2Command({ Bucket: BUCKET, Prefix: prefix }),
  );
  if (!list.Contents?.length) return;

  await s3.send(
    new DeleteObjectsCommand({
      Bucket: BUCKET,
      Delete: { Objects: list.Contents.map((o) => ({ Key: o.Key! })) },
    }),
  );
}

/**
 * Deletes all object storage files associated with a project.
 */
export async function deleteProjectFiles({
  projectId,
  userId,
  sandboxId,
}: {
  projectId: string;
  userId?: string;
  sandboxId?: string | null;
}) {
  const prefixes = [`agents/${projectId}/`];
  if (userId) prefixes.push(`users/${userId}/${projectId}/`);
  if (sandboxId) prefixes.push(`screenshots/${sandboxId}/`);
  await Promise.allSettled(prefixes.map(deleteFiles));
}
