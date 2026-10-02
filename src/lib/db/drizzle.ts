import { drizzle } from "drizzle-orm/neon-http";
import { Pool } from "@neondatabase/serverless";
import { env } from "../utils/env";

export const db = drizzle(env.DATABASE_URL);
export const pgPool = new Pool({ connectionString: env.DATABASE_URL });
