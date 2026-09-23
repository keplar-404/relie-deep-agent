# Auth

Bridge between **Clerk** (identity provider) and your `users` table.

```
src/lib/auth/
├── index.ts          ← re-exports currentUser
├── currentUser.ts    ← Clerk session → users row (lazy insert on first hit)
└── README.md
```

## Usage

```ts
// any server action / route handler / page
import { currentUser } from "@/lib/auth";

const me = await currentUser();      // null if signed out, row otherwise
if (!me) return;                     // or redirect to sign-in

await createProject({ userId: me.id, name: "Store" });
```

`proxy.ts` already redirects unauth'd requests to sign-in, so when this runs,
the session is guaranteed valid — `me` will be the row (after lazy sync).

## How sync works (lazy, on first request)

1. Clerk sets a session cookie after sign-in/up.
2. `currentUser()` calls Clerk's `auth()` → gets `userId` (Clerk's id, e.g. `user_abc`).
3. SELECT your `users` table by `clerkId`.
4. If not found, fetch the Clerk profile, INSERT into `users`.
5. Return the row — `user.id` is your internal UUID.

No webhooks. No extra infra. ~1 extra Clerk API call on first request per user.

## When to upgrade to a Clerk webhook

Add `app/api/webhooks/clerk/route.ts` when you need any of:
- Real-time analytics on signup
- Org-invite flows
- Audit log of every `user.*` event
- Slack/email notification on signup

Lazy is enough for everything else.