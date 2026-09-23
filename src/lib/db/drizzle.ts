import { drizzle } from 'drizzle-orm/neon-http';
import { Pool } from '@neondatabase/serverless';
import { env } from '../utils/env';

// Drizzle ORM client (HTTP — used for all DB queries via drizzle)
export const db = drizzle(env.DATABASE_URL);

// pg-compatible Pool — required by PostgresSaver (LangGraph checkpointer)
// @neondatabase/serverless Pool is compatible with node-postgres (pg) interface
export const pgPool = new Pool({ connectionString: env.DATABASE_URL });
