# Deploying to Vercel

The same `index.html` runs in two places and picks its storage at boot:

| Where | Detected by | State lives in |
|---|---|---|
| Claude artifact | `window.claude.use("artifact")` resolves | the published artifact |
| Your own domain | `/api/state` responds | Supabase, via `/api` |

If neither answers, the page still renders and says saving is off.

## One-time setup

**1. Supabase** — the `tournament` table and `save_tournament` function are
already created (see the SQL in the project history). The row id is `pga2026`.

**2. Vercel** — import `koodychan/phoenix-2026`, no build step (static + `/api`).
Set two environment variables:

```
SUPABASE_URL = https://xmodiyuitsfsizcdfzgf.supabase.co
SUPABASE_KEY = <the project's anon key>
```

`SUPABASE_KEY` takes the anon key (the `eyJ...` JWT with `"role":"anon"`, from
Settings → API). The newer `sb_publishable_...` key works against PostgREST too;
either is fine, but only the anon key is used here.

Both are read only by the serverless functions in `api/`. **Neither is committed
to the repo, and neither reaches the browser** — the page talks only to
`/api/state` and `/api/save` on its own origin. This matters because the
project is shared with another site: a leaked anon key would be a handle to
that whole project, bounded only by its RLS policies.

**3. Domain** — point the subdomain at the Vercel project.

## How writes are gated

`/api/save` passes the password to `save_tournament`, which checks it **in the
database** and raises if it is wrong. The browser cannot authorise its own
write. A viewer without the password gets a read-only board with the entry
fields disabled; the scorekeeper unlocks once under Setup and the password is
remembered on that device.

Concurrency is compare-and-set on `rev`: a save built on a stale revision comes
back `409`, and the page re-reads, replays the pending edit and saves again.

## Testing without Supabase

`tools/mockserver.js` serves `index.html` plus stand-ins for both routes with
the same status codes, including bad-password and conflict paths:

```
node tools/mockserver.js &
node tools/httptest.js
```
