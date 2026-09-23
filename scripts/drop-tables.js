// Drops every table the app manages. Safe to re-run.
// Usage: bun run db:drop

import "dotenv/config";
import { neon } from "@neondatabase/serverless";

const TABLES = ["llm_executions", "chat_history", "projects", "users"];
const ENUMS = ["chat_role", "project_status"];

const url = process.env.DATABASE_URL;
if (!url) {
  console.error("❌ DATABASE_URL is not set");
  process.exit(1);
}

const sql = neon(url);

try {
  for (const t of TABLES) {
    await sql.query(`DROP TABLE IF EXISTS "${t}" CASCADE`);
    console.log(`✓ dropped ${t}`);
  }
  for (const e of ENUMS) {
    await sql.query(`DROP TYPE IF EXISTS "${e}"`);
    console.log(`✓ dropped type ${e}`);
  }
  console.log("\nAll tables dropped.");
} catch (err) {
  console.error("❌", err.message);
  process.exit(1);
}