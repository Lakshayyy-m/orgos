# Learnings

One-line revision notes from Q&A. Grouped by topic, not by date.

## Drizzle and PostgreSQL

- Drizzle’s third `pgTable` argument is where table-level constraints and indexes live.
- `unique("name").on(column)` becomes a named PostgreSQL `UNIQUE` constraint.
- A single-column unique *can* be declared on the column; table-level form is required for multi-column uniques and keeps all constraints in one place.
- A unique constraint is the real uniqueness guarantee; app checks can race.
- A migration is versioned SQL that changes a live database to match the schema; editing TypeScript does not alter Postgres by itself.
- `db:generate` writes the SQL file; `db:migrate` applies it and records that it ran.
- Migrations exist so every environment applies the same ordered schema history.
- A connection pool reuses a small set of live Postgres sockets instead of connecting per query.
- Open a pool at process start; connections are created lazily on first use.
- Postgres does not know about pools — it only sees connections. The scarce resource is `max_connections`.
- Usually one pool per process per database; extra pools in the same process waste connections and add no throughput.
- Total connections ≈ app instances × pool size; leave headroom for `psql`, migrations, and monitoring.
- Bigger pools can worsen latency; Postgres CPU, disk, and locks usually saturate before sockets do.
- Long transactions hold a pooled connection the whole time and can stall the app.
- At scale, put a pooler (PgBouncer or a cloud pooler) in front of Postgres, especially on serverless.
- N+1 queries: 1 query to load N parents, then 1 query per parent for children — latency and pool usage grow with list size.
- Your project list avoids N+1 with a JOIN, then groups rows in memory into `ProjectWithMembers`.
- Fixes: JOIN / `IN (...)` batch, DataLoader-style batching, or a single SQL round trip; not a loop of `await db.query`.
- N+1 is an ORM/GraphQL classic because nested `project.members` looks like a field access but may hide a query.
- A JOIN combines rows from two tables on a match condition; “normal join” in SQL is INNER JOIN.
- INNER JOIN: only rows that match on both sides. Empty projects would disappear from the list.
- LEFT JOIN: all left rows, plus right columns or NULL. Your project list uses this so projects with no members still appear.
- RIGHT JOIN: all right rows, plus left columns or NULL. Rare; people swap table order and use LEFT instead.
- FULL OUTER JOIN: rows from either side, NULLs where there is no match. Uncommon in app CRUD.
- CROSS JOIN: every left row × every right row, no match condition. Almost never what you want for relations.
- JOIN type is a product decision: “must have a match” vs “keep the parent even if children are missing.”
- A foreign key blocks orphans; `ON DELETE` decides what happens to children when the parent row is removed.
- `CASCADE`: deleting the parent deletes matching children. `RESTRICT`/`NO ACTION`: reject the delete. `SET NULL`: keep the child, clear the FK.
- Your `deleteOrganization` only deletes the org row; Postgres then cascades to projects, org memberships, and project memberships.
- Users do not cascade from org delete — a user is shared (can belong to many orgs). Deleting a *user* cascades their memberships.
- Cascade is for owned composition (org owns projects). Associations to shared entities should not wipe the shared entity.

## Seeds and idempotency

- Treat seed data as an immutable spec (`const` + `readonly`); mutate the database, not the in-memory fixtures.
- `const` only prevents rebinding the variable; arrays and objects remain mutable.
- `readonly T[]` is a compile-time ban on `push` / index assignment; it does not freeze nested fields or exist at runtime.
- `as const` infers literal types and makes an object deeply readonly.
- Mutating shared fixtures makes seeds and tests non-deterministic.
- `ON CONFLICT … DO NOTHING` makes a retry a no-op when the unique key already exists.
- `ON CONFLICT` `target` must name the unique key Postgres should use.
- Join tables (memberships) are set-membership facts → `DO NOTHING`; entities with attributes → `DO UPDATE`.
- Idempotency: at-least-once execution (re-run seed/CI) must converge on the same end state.

## Node processes, env, and CLIs

- `process.env` only sees variables already in the process; it does not read `.env` files.
- `dotenv` copies `.env` / `.env.local` into `process.env` for that process only.
- Next.js loads env files for `next dev` / `build` / `start`; Drizzle and `tsx` scripts do not, so they need `dotenv`.
- Production should inject secrets via the host environment; `dotenv` is a local convenience, not a vault.
- A CLI must `pool.end()` or Node stays alive on open sockets and the process hangs.
- Shut down process-lifetime resources in `main`’s `finally`, not inside domain functions; run it on success and failure.
- Servers close the pool on `SIGTERM`; one-shot scripts close it when the job is done.
- Exit code `0` = success, non-zero = failure; that is a process’s API to npm/CI/the shell.
- Set `process.exitCode = 1` instead of `process.exit(1)` so `finally` and logs can finish.
- `void main()` discards the Promise at the top level (you cannot `await` there without top-level await).
- `void` tells the typechecker the floating Promise is intentional; `.catch` is what actually handles failure.
- Unhandled rejections make CLI exit codes unreliable.

## Linting and formatting

- `npm run lint` runs ESLint: static checks for bugs and bad patterns, not runtime tests and not formatting.
- Modern ESLint config lives in `eslint.config.mjs`; start from `eslint-config-next`, then add a few rules with a reason.
- `@typescript-eslint/no-explicit-any` as `error` stops untyped values from bypassing TypeScript, which matters in auth/tenancy code.
- `no-console` as `warn` (off in seed scripts) keeps accidental logging out of app code.
- Use `"error"` for merge-blockers and `"warn"` for guidance; scope exceptions by path.
- A linter asks “is this a bug?”; a formatter asks “does this look like the rest of the repo?”; `tsc` asks “do the types work?”
- `eslint --fix` can rewrite some code, but ESLint is a poor formatter; stylistic ESLint rules fight Prettier.
- Prettier: default JS/TS formatter. Biome: fast Rust linter+formatter, fewer plugins. OXC/`oxlint`: very fast ESLint-shaped linter, weaker plugin long tail.
- Do not run two formatters. Keep ESLint here because of `eslint-config-next`; add Prettier or Biome only when style noise appears.
- Add lint rules only when they prevent a real class of bug (`no-floating-promises`, `eqeqeq`, `no-eval`); skip giant style packs.

## Runtime validation (Zod and friends)

- TypeScript types are erased at runtime; `CreateProjectInput` does not check a JSON body.
- Validate at the trust boundary: parse untrusted input into a known shape before domain code sees it.
- Prefer parse-or-throw over “check then keep `unknown`” — a successful parse should return a typed value.
- A validator is not an authorization check: a UUID-shaped `organizationId` can still belong to another tenant.
- DB constraints (unique, FK, length) still matter; Zod cannot win a race or enforce tenancy.
- Zod: default TS-first choice; schema infers the type; huge ecosystem (forms, tRPC, OpenAPI).
- Valibot: Zod-like API, tree-shaken modules, smaller client bundles.
- ArkType: schemas look like TypeScript; very fast; smaller ecosystem.
- Yup: older form-validation library; weaker TypeScript inference; Formik-era.
- Joi: Hapi/Node API validation; JS-first; still common in Express.
- Ajv / TypeBox: JSON Schema world (OpenAPI, contracts between services).
- class-validator: NestJS decorator style; types live on classes, not inferred from schemas.
- io-ts / Superstruct / Runtypes: older or niche; you will see them, rarely start a new app with them.
- Standard Schema is a shared interface so tools can accept Zod, Valibot, or ArkType without locking in.
- Pick one schema library and reuse it at HTTP, forms, and env parsing; do not maintain two conflicting shapes.

## Forms: react-hook-form vs useActionState

- A form is two problems: client field state (typing, errors, dirty) and a server command (create/update).
- Native `<form>` is uncontrolled: the DOM holds values until submit; React state per keystroke is the expensive alternative.
- react-hook-form wraps uncontrolled inputs, tracks touched/dirty/errors, and re-renders little while typing.
- RHF + Zod (`zodResolver`) is client UX validation; it is not the security boundary.
- `useActionState(action, initialState)` wires a React 19 Server Action to UI: last result, submit dispatcher, pending flag.
- Your create-project form already uses this: `createProjectAction` returns `{ status, message }`, the form displays it.
- `useActionState` replaced `useFormState`; the action signature is `(prevState, formData) => nextState`.
- `useFormStatus()` reads pending from a parent `<form>` without prop-drilling; useful on nested Submit buttons.
- `useOptimistic` shows a temporary UI result before the server confirms; roll back if the action fails.
- `useTransition` marks an update as non-urgent; Server Actions already run inside a transition, which is why `pending` works.
- Simple server-mutated forms: `useActionState` is enough. Complex field arrays, live validation, multi-step wizards: add RHF (it can still post to a Server Action).
- Client validation improves UX; the server action + DB constraints remain the source of truth.

## React concurrent rendering: useTransition and use

- React 18+ can interrupt a render: urgent updates (typing, clicks) outrank transition updates (heavy next screen).
- `useTransition()` returns `[isPending, startTransition]`; wrap a `setState` in `startTransition` to mark it non-urgent.
- A transition does not make the async work faster; it keeps the old UI interactive until the new render is ready.
- If the user types again mid-transition, React can abandon the in-progress render and start over — that is the point.
- Server Actions already run inside a transition; `useActionState`'s `pending` is that flag.
- `useDeferredValue(value)` is the other half: keep showing the previous value while a dependent heavy UI catches up (search input vs filtered list).
- `use(promise)` suspends the component until the promise resolves; a parent `<Suspense fallback>` shows loading.
- `use(context)` reads context and, unlike `useContext`, may be called behind `if` / loops.
- Rejected promises from `use(promise)` go to the nearest Error Boundary, not a `catch` in the component.
- System shape: `useTransition` = “this state update can wait”; `use` + Suspense = “this render needs data; pause this subtree.”
- Do not `use(fetch())` created during render in a Client Component — that refetch loop has no cache key. Unwrap a promise the server (or a cache) already started.

## Accessibility (ARIA)

- Sighted users notice a new error because it appeared on screen; screen-reader users only hear changes if you mark a live region.
- `aria-live` tells assistive tech: when this node's text changes, announce it without moving focus.
- `polite` waits for a pause in speech (form success/error); `assertive` interrupts (rare; use for urgent errors).
- Your create-project message uses `aria-live="polite"` so “Website was created” / duplicate-name errors are spoken after submit.
- `aria-atomic="true"` announces the whole region, not just the changed fragment; useful for status strings.
- Live regions are for results that do not steal focus; do not use them as a substitute for labels, names, or keyboard access.
- Complement: `role="status"` ≈ polite live region; `role="alert"` ≈ assertive. Prefer the role or `aria-live`, not a pile of both unless you know why.
- `sr-only` (Tailwind) visually hides text but keeps it in the accessibility tree — screen readers still speak it.
- Icon-only buttons need an accessible name: `sr-only` text, `aria-label`, or visible text. A pencil SVG has no name by itself.
- Pair with `aria-hidden="true"` on the decorative SVG so the icon is not announced twice (once as unlabeled graphic, once as the label).

## Authentication data model (Phase 2)

- Identity (`users`) is not a credential: a person can exist without a password (future SSO).
- Store Argon2id hashes in `password_credentials`, never the password; PHC strings already embed algorithm parameters.
- High-entropy secrets (session + verify tokens) are hashed with SHA-256 and stored; the cookie/email carries the raw secret.
- Separate session row `id` from `token_hash` so “revoke this device” can use a UUID, not the secret.
- `email_verified_at` / `consumed_at` / `revoked_at` as timestamps beat booleans: you get state and when.
- Postgres `UNIQUE(email)` is case-sensitive; normalize email to lowercase (or use `citext`) or `Alice@x` and `alice@x` are different users.
- Opaque hashed sessions trade a DB lookup per request for instant revocation; JWTs push revocation to a denylist or short TTL.
- Password reset is not in the Phase 2 spec; do not overload email-verification tokens for it — different lifetime and threat model.
- Table count is not a quality metric; split tables when facts differ in lifecycle, cardinality, or threat model.
- Fewer tables is better when the extra table is 1:1 with no independent meaning (do not split `display_name` into `user_profiles` for sport).
- More tables is better for many-to-many edges, expiring grants (sessions/tokens), and owned subgraphs (org → projects).
- A “god table” with nullable `or` columns (password *or* SSO *or* current cookie) is the usual too-few-tables failure.
- Entropy is unpredictability, measured in bits: ~log2 of how many values an attacker must try.
- User passwords are usually *low* entropy (guessable); that is why they need a slow hash (Argon2id), not SHA-256.
- Session/verify tokens should be *high* entropy: 16–32+ bytes from a CSPRNG, then SHA-256 stored. Fast hash is safe because brute force is infeasible.
- A password with symbols can still be low entropy (`Password1!`); a 6-word diceware phrase or 32 random bytes is high entropy.
- Do not generate “passwords” by hashing usernames or using `Math.random()`; entropy must come from a cryptographic RNG.
- Argon2id is a password KDF: intentionally slow and memory-hard so leaked hashes are expensive to crack.
- `memoryCost` 19456 ≈ 19 MiB RAM per hash (OWASP); `timeCost` 2 = two passes; `parallelism` 1 = one lane (simpler, a bit less GPU-resistant).
- Those costs are the knobs of a work factor: raise them as hardware gets cheaper; the PHC string stores the params so old hashes still verify.
- Login DoS: each guess spends that RAM/CPU on *your* server too — cap attempts; do not set memoryCost to “as high as possible.”
- An opaque token is a random blob with no meaning to the client; the server looks it up (by hash) to learn who/what it grants.
- A JWT is the opposite: a self-describing signed token. The client (or any verifier with the key) can read claims without a DB.
- Opaque: easy revoke (delete/mark the row). JWT: hard revoke unless you add a denylist or keep TTL very short.
- OrgOS sessions are opaque: 32 CSPRNG bytes as base64url in the cookie; SHA-256 hex in `sessions.token_hash`.
- One indexed session lookup per request is normal and cheap next to HTML/SQL work; optimize the store (Redis) only when measured.
- Skipping that lookup (JWT-only) saves a round trip and delays or complicates revocation — pick the invariant you care about.
- A cache in front of sessions reintroduces a revoke delay equal to the cache TTL; that is the same JWT tradeoff in disguise.
