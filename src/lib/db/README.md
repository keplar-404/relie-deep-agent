# Database

PostgreSQL schema defined with **Drizzle ORM** + **Zod** validators.
Managed through `drizzle-kit` migrations (`./drizzle`).

---

## Models at a glance

```
            ┌──────────────┐
            │   USERS      │
            └──────┬───────┘
                   │ 1
                   │
                   │ N
            ┌──────▼───────┐         ┌───────────────────┐
            │  PROJECTS    │ 1──────N │  CHAT_HISTORY     │
            └──────┬───────┘         └─────────┬─────────┘
                   │ 1                         │ 1
                   │                           │
                   │                           │ N
                   │ N              ┌───────────▼─────────┐
                   └────────────────│  LLM_EXECUTIONS     │
                                    └─────────────────────┘
```

- **users** ──< **projects** ──< **chat_history** ──< **llm_executions**
- All FKs cascade on delete.
- `llm_executions` also holds a direct FK to `projects` (denormalized for fast project-level queries).

---

## `users`

| Column      | Type           | Notes                |
|-------------|----------------|----------------------|
| `id`        | `UUID` PK      | `defaultRandom()`    |
| `name`      | `VARCHAR(255)` | NOT NULL             |
| `email`     | `VARCHAR(255)` | NOT NULL, UNIQUE     |
| `image`     | `TEXT`         | nullable (avatar URL)|
| `createdAt` | `TIMESTAMP`    | NOT NULL, `defaultNow()` |

```ts
CreateUser = { name, email, image? }
```

---

## `projects`

| Column        | Type           | Notes                                |
|---------------|----------------|--------------------------------------|
| `id`          | `UUID` PK      | `defaultRandom()`                    |
| `userId`      | `UUID` FK      | → `users.id`, cascade delete         |
| `name`        | `VARCHAR(255)` | NOT NULL                             |
| `description` | `TEXT`         | nullable                             |
| `sandboxId`   | `VARCHAR(255)` | nullable (Daytona sandbox reference) |
| `createdAt`   | `TIMESTAMP`    | NOT NULL, `defaultNow()`             |

```ts
CreateProject = { userId, name, description?, sandboxId? }
```

---

## `chat_history`

| Column        | Type        | Notes                                         |
|---------------|-------------|-----------------------------------------------|
| `id`          | `UUID` PK   | `defaultRandom()`                             |
| `projectId`   | `UUID` FK   | → `projects.id`, cascade delete               |
| `userId`      | `UUID` FK   | → `users.id`, cascade delete                 |
| `role`        | `VARCHAR`   | enum: `system │ user │ assistant │ tool`     |
| `content`     | `TEXT`      | nullable                                      |
| `attachments` | `JSONB`     | `Attachment[]`, default `[]`, NOT NULL       |
| `createdAt`   | `TIMESTAMP` | NOT NULL, `defaultNow()`                      |

**Attachment shape** (validated by `attachmentSchema` in `validators.ts`):

```ts
{
  id: string,
  type: "image" | "file",
  name: string,
  url: string,        // must be a valid URL
  mimeType: string,
  size: number,       // bytes
}
```

```ts
CreateChatHistory = { projectId, userId, role, content?, attachments? }
```

---

## `llm_executions`

Each row = one LLM call or tool invocation inside a chat turn.

| Column          | Type           | Notes                                       |
|-----------------|----------------|---------------------------------------------|
| `id`            | `UUID` PK      | `defaultRandom()`                           |
| `chatHistoryId` | `UUID` FK      | → `chat_history.id`, cascade delete         |
| `projectId`     | `UUID` FK      | → `projects.id`, cascade delete             |
| `sequence`      | `INTEGER`      | NOT NULL (ordering within a turn)           |
| `type`          | `VARCHAR(255)` | NOT NULL (e.g. `"llm_call"`, `"tool_call"`) |
| `toolName`      | `VARCHAR(255)` | nullable                                    |
| `input`         | `JSONB`        | nullable (request payload)                  |
| `output`        | `JSONB`        | nullable (response payload)                 |
| `attachments`   | `JSONB`        | nullable (`Attachment[]`)                   |
| `createdAt`     | `TIMESTAMP`    | NOT NULL, `defaultNow()`                    |

```ts
CreateLlmExecution = { chatHistoryId, projectId, sequence, type, toolName?, input?, output?, attachments? }
```

---

## Relationships

```
users (1) ──< projects (N) ──< chat_history (N) ──< llm_executions (N)
                                  ▲                                  │
                                  │                                  │
                                  └────────── chatHistoryId ─────────┘
llm_executions.projectId  ──► projects.id  (denormalized shortcut)
```

All FKs use `onDelete: "cascade"` — deleting a user removes their projects,
chats, and execution logs in one shot.

---

## File layout

```
src/lib/db/
├── README.md                  ← this file
├── index.ts                   ← barrel re-export of every table
├── drizzle.ts                 ← drizzle client (neon-http)
├── validators.ts              ← Zod schemas + inferred TS types
├── action/
│   ├── index.ts               ← re-exports
│   ├── user.ts                ← createUser()
│   ├── project.ts             ← createProject()
│   ├── chatHistory.ts         ← createChatMessage()
│   └── llmExecution.ts        ← createLlmExecution()
└── schema/
    ├── user.ts                ← users table
    ├── project.ts              ← projects table
    ├── chatHistory.ts         ← chat_history table + chat_role enum
    └── llmExecution.ts        ← llm_executions table
```

## Usage

```ts
import {
  createUser,
  createProject,
  createChatMessage,
  createLlmExecution,
} from "@/lib/db/action";

const user    = await createUser({ name: "John", email: "j@x.com" });
const project = await createProject({ userId: user.id, name: "Store" });
const msg     = await createChatMessage({
  projectId: project.id,
  userId: user.id,
  role: "user",
  content: "Build me a homepage",
});
const exec    = await createLlmExecution({
  chatHistoryId: msg.id,
  projectId: project.id,
  sequence: 0,
  type: "llm_call",
});
```

Every helper runs input through Zod → returns the full inserted row
(with `id` and `createdAt` populated).

---

## Migrations

When you change a schema file, never just delete data. Use migrations.

| Script | What it does |
|--------|--------------|
| `bun run db:push` | Syncs the live DB to match schema files. Fast for prototyping, **risky on existing data** — type/column conflicts may drop or fail. |
| `bun run db:generate` | Diffs your schema against `./drizzle` and writes a new `.sql` migration file. **Does not touch the DB.** |
| `bun run db:migrate` | Applies pending migrations in order. **Safe on existing data.** |
| `bun run db:studio` | Opens a local Drizzle Studio UI against your DB. |
| `bun run db:reset` | `db:drop` + `db:push`. **Wipes everything.** Dev only. |

### Recommended workflow when a table already has data

```bash
# 1. edit a schema file (rename a column, change a type, etc.)
# 2. generate the SQL — does not apply yet
bun run db:generate

# 3. open the new file under ./drizzle/ and READ IT.
#    Look for any DROP COLUMN / DROP TABLE statements.
#    If Drizzle would drop a column you want to keep, edit the SQL:
#      DROP COLUMN "clerkId"          →  ALTER TABLE "users" RENAME COLUMN "clerkId" TO "name";
#      ALTER COLUMN "id" TYPE uuid    →  add USING "id"::uuid if the cast is safe
#    For new NOT NULL columns without defaults, add a backfill in the same file.

# 4. apply it
bun run db:migrate
```

### Renaming a table or column

Drizzle-kit tries to detect renames by name. When it can't, it emits
`DROP` + `ADD`, which **loses data**. Always open the generated SQL
before running `db:migrate`. The fix is one line per rename:

```sql
-- generated (bad — drops the column)
ALTER TABLE "users" DROP COLUMN "clerkId";
ALTER TABLE "users" ADD COLUMN "name" varchar(255);

-- hand-edited (preserves data)
ALTER TABLE "users" RENAME COLUMN "clerkId" TO "name";

-- table rename
ALTER TABLE "user" RENAME TO "users";
```

### Type changes that need a USING clause

```sql
-- generated
ALTER TABLE "users" ALTER COLUMN "id" SET DATA TYPE uuid;

-- if it errors "cannot cast type integer to uuid", add USING:
ALTER TABLE "users" ALTER COLUMN "id" SET DATA TYPE uuid USING "id"::uuid;
```

### Rule of thumb

- **Greenfield / no data** → `db:push`
- **Existing data** → `db:generate` → read `.sql` → fix renames → `db:migrate`