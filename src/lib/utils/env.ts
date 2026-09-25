import "dotenv/config";
import { z } from "zod";

const envSchema = z.object({
  OPENROUTER_API_KEY: z.string().min(4, "OPENROUTER_API_KEY is required"),
  DAYTONA_API_KEY: z.string().min(4, "DAYTONA_API_KEY is required"),
  DATABASE_URL: z.string().min(4, "DATABASE_URL is required"),
  NODE_ENV: z
    .enum(["development", "production", "test"])
    .default("development"),
  DATABASE_URL_POOLED: z.string().optional(),
  NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY: z.string().optional(),
  CLERK_SECRET_KEY: z.string().optional(),
  AWS_ACCESS_KEY_ID: z.string().optional(),
  AWS_SECRET_ACCESS_KEY: z.string().optional(),
  AWS_ENDPOINT_URL_S3: z.string().optional(),
  AWS_REGION: z.string().default("us-east-2"),
  S3_BUCKET: z.string().optional(),
  NEON_STORAGE_BUCKET: z.string().default("project-assets"),
  TYPESAFE: z.string().optional(),
});


const parsed = envSchema.safeParse(process.env);

if (!parsed.success) {
  console.error("❌ Invalid environment variables:");
  console.error(JSON.stringify(parsed.error.flatten().fieldErrors, null, 2));
  throw new Error(
    "Invalid environment variables. Check your .env configuration.",
  );
}

export const env = {
  ...parsed.data
};