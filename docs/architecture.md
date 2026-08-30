# Architecture Decisions

## Decision log

### 2026-08-20 — Start as a modular monolith

**Decision:** OrgOS begins as one Next.js application with route handlers and server-side domain modules.

**Why:** The learning objective is to understand correct authorization and data boundaries first. Splitting authentication, projects, and administration into networked services now would add distributed-systems complexity before those boundaries are understood.

**Alternative:** Microservices for auth, application, and administration.

**Tradeoff:** A modular monolith does not independently scale or deploy domains. Clear module boundaries in `src/` preserve a future extraction path without prematurely accepting that cost.

### 2026-08-20 — Initialize a UI-only Phase 1 foundation

**Decision:** Bootstrap Next.js, TypeScript, Tailwind, linting, and project documentation before adding database dependencies or domain behavior.

**Why:** This is the smallest independently verifiable Phase 1 task. PostgreSQL, Drizzle, schemas, migrations, and seed data are the next focused increment.

**Security posture:** There is no authentication, authorization, or sensitive data in this increment. It must not imply an authorization boundary; the landing page is informational only.

## Planned Phase 1 data model

The next task will model the following UUID-backed tables with foreign keys and tenant-safe uniqueness constraints:

```text
users
organizations
organization_members
projects
project_members
```

`organization_members` represents membership independently of `users`; a person can belong to several organizations. `projects` will belong to exactly one organization. Every project query in later authenticated phases must be scoped through verified organization context.

### 2026-08-23 — Enforce project-member tenancy with composite foreign keys

**Decision:** `project_members` stores `organization_id` alongside `project_id` and `user_id`. Composite foreign keys require that the project belongs to that organization and that the user is a member of it.

**Why:** Two independent foreign keys (`project_id → projects`, `user_id → users`) would allow a direct database write to add an Acme user to a Globex project. The redundant organization identifier allows PostgreSQL to reject that invalid cross-organization association.

**Alternative:** Rely on application services to check organization membership before inserts.

**Tradeoff:** The table stores a value derivable from the project, and mutations are more complex. The database-level tenant invariant is worth that cost for a learning-focused authorization system.

### 2026-08-23 — Make development seed data idempotent

**Decision:** The Acme Corp seed uses stable fixture UUIDs, natural conflict targets, and one database transaction.

**Why:** Re-running local setup must leave one Acme Corp, Alice, Bob, Carol, Website, and Mobile App rather than duplicate records. Upserts return persisted IDs, so existing users with the same email are linked correctly.

**Tradeoff:** A seed is intentionally not a production provisioning workflow. It is restricted to local development and uses `.test` email addresses.

### 2026-08-23 — Route project reads through a server-side service

**Decision:** The Phase 1 project page calls `listProjectsForOrganization` from a server component. The page supplies the fixed Acme Corp demo organization ID on the server rather than receiving it from the browser.

**Why:** It gives project access a single server-side boundary before authentication exists. The web-only database entrypoint and project service are marked `server-only`, so importing them into a client component fails the build. The shared database client remains usable by CLI scripts such as the development seed. Phase 3 can replace the fixed ID with a membership-validated active organization without spreading database queries through UI components.

**Tradeoff:** This is intentionally a demo-only organization context. It is not authorization and must never be reused for an API that accepts a client-provided organization ID.

### 2026-08-23 — Scope Phase 1 project creation on the server

**Decision:** The project creation action reads only `name` and `description` from the form. It supplies the Acme Corp demo organization ID on the server, validates both fields, and relies on the database uniqueness constraint for duplicate names.

**Why:** Browser constraints can be bypassed with a direct POST. Server validation and a fixed server-side organization scope prevent malformed input and tenant selection from entering the project service.

**Tradeoff:** The action is deliberately unauthenticated during Phase 1. Before authentication ships, it is usable only as local demo behavior; Phase 3/4 must resolve membership and permissions before calling the project service.

### 2026-08-23 — Use Zod for request-boundary validation

**Decision:** Project form input is parsed with a Zod schema at the server-action boundary. The inferred type is shared with the project service input contract.

**Why:** One schema now defines runtime validation, trimming, length limits, user-facing validation messages, and the validated TypeScript type. The server action still validates direct POSTs; browser constraints remain usability enhancements only.

**Tradeoff:** Zod does not replace Drizzle schema constraints, database uniqueness, or future authentication and authorization checks. It is used for untrusted application input, not as a database-model generator.

### 2026-08-23 — Use concise feature-local module names

**Decision:** Project code is organized under `src/projects` as `service.ts`, `validation.ts`, and `contracts.ts`. A contract contains only types shared across the client/server action boundary. Route-owned UI and local state live under `app/(customer-app)/projects/_components`.

**Why:** A feature-local `lib` directory and names such as `project-validation.ts` repeat context already supplied by the folder path. A root-level `app/_components` would become a cross-route bucket, while route-owned components scale with their route. The `(customer-app)` route group organizes the application area without changing the `/projects` URL.

**Tradeoff:** Feature folders need clear boundaries. General-purpose utilities belong in a future shared `src/lib` module only when they are used across multiple domains.

### 2026-08-23 — Read project members through a scoped join

**Decision:** The project service fetches projects, project memberships, and member names in one organization-scoped query, then groups the joined rows for the UI.

**Why:** It avoids N+1 member queries and keeps the organization filter at the database access boundary. The UI receives only the project members associated with the fixed Phase 1 Acme Corp context.

**Tradeoff:** The view, assignment, and removal flows remain limited to the Phase 1 demo organization. Phase 3 will replace the demo context with a membership-validated active organization.

### 2026-08-23 — Validate both sides of project-member assignment

**Decision:** The assignment action accepts only a project ID and user ID, validates their UUID format with Zod, then supplies the Acme Corp ID server-side. The service verifies that the project and organization membership both belong to that organization before inserting.

**Why:** A direct POST can change either ID. Validation alone only checks syntax; server-side organization-scoped lookups and the `project_members` composite foreign keys together prevent tenant confusion.

**Tradeoff:** This is not user authorization. Phase 3/4 will resolve an authenticated actor and require the appropriate organization permission before this mutation is allowed.

### 2026-08-29 — Scope project-member removal inside the delete query

**Decision:** The removal action validates the project and user IDs, supplies the organization ID server-side, and deletes only where all three values match.

**Why:** A caller can tamper with hidden form fields. Including the organization scope in the `DELETE` predicate makes a cross-organization membership removal a no-op, even if a valid project and user ID are supplied.

**Tradeoff:** The response distinguishes only assigned from not assigned. This is sufficient for Phase 1; later authorization will decide whether an actor may inspect or change a membership.

### 2026-08-29 — Confirm project-access removal in the UI

**Decision:** Project-member removal uses a native modal dialog with an explicit “Remove access” action and an accessible cancel path.

**Why:** Removing a project member is destructive from the user’s perspective. The visible button hover/focus states communicate interactivity, while the confirmation clarifies that project access—not organization membership—is removed.

**Tradeoff:** Confirmation prevents accidental interaction but is not a security control. Server-side validation and the organization-scoped delete remain authoritative.

### 2026-08-30 — Scope project updates inside the update query

**Decision:** The update action validates the project ID, name, and description, then the service updates only where the project ID and server-supplied organization ID match.

**Why:** A direct POST can modify a hidden project ID or bypass browser length limits. The server validates untrusted input, prevents client-controlled tenant selection, and preserves the per-organization project-name uniqueness constraint.

**Tradeoff:** The Phase 1 edit form has no permission check. Phase 4 will require `projects.update` before the service executes the mutation.

### 2026-08-30 — Cascade project-membership removal on project deletion

**Decision:** Project deletion validates the project ID, scopes the delete by the server-supplied organization ID, and relies on PostgreSQL’s `ON DELETE CASCADE` foreign key to remove associated project memberships.

**Why:** The database performs the project and membership cleanup atomically. The confirmation dialog makes the destructive consequence visible, but a tampered project ID cannot delete a project outside Acme Corp.

**Tradeoff:** Phase 1 permits this local demo mutation without authentication. Phase 4 will require `projects.delete` before it can execute.

### 2026-08-30 — Read organization overview through server-side queries

**Decision:** The organization overview queries Acme Corp, its members, and its project count from a server-only organization service. Member and project counts are fetched separately to avoid inflated aggregates from joining two one-to-many relationships.

**Why:** The browser never supplies an organization ID, and the overview accurately demonstrates the membership and project relationships without N+1 queries.

**Tradeoff:** It is a fixed Phase 1 demo context, not organization switching or authorization. Phase 3 will replace it with active organization resolution and membership checks.

### 2026-08-30 — Scope organization updates to the fixed demo context

**Decision:** The organization update action validates the name with Zod and passes the Acme Corp ID from server code to the organization service.

**Why:** The browser submits only an untrusted name. It cannot select another organization to update, and server validation remains effective if a direct POST bypasses the form.

**Tradeoff:** This demonstrates basic organization CRUD only. Organization creation, membership, and active-context switching stay deferred to Phase 3.

### 2026-08-30 — Cascade organization deletion through Phase 1 data

**Decision:** Organization deletion uses the server-held Acme Corp ID and relies on PostgreSQL foreign-key cascades to remove related organization memberships, projects, and project memberships.

**Why:** A fixed server-side target eliminates client-controlled organization selection. The confirmation dialog exposes the destructive impact, while the database provides atomic cleanup of dependent data.

**Tradeoff:** This local demonstration can remove the entire seeded workspace. Re-running the deterministic seed recreates it; production deletion needs authenticated `organizations.delete` authorization in Phase 4.

### 2026-08-30 — Model credentials and opaque sessions separately

**Decision:** Password credentials, email-verification tokens, and sessions are separate tables. Passwords and browser/email secrets are represented only by hashes; `users.email_verified_at` carries the verified state.

**Why:** Separating credentials avoids a nullable or overloaded password field on users and supports future SSO-only accounts. Opaque session lookup supports immediate revocation, expiration, and metadata inspection.

**Tradeoff:** Authentication requires database lookups and lifecycle cleanup. This is intentionally preferred to JWT-only browser sessions so server-side revocation is easy to reason about.

### 2026-08-30 — Use Argon2id and platform-generated opaque tokens

**Decision:** Passwords use the maintained `argon2` package configured for Argon2id. Session and verification secrets use Node.js cryptographic random bytes, and only their SHA-256 lookup hashes are persisted.

**Why:** Argon2id is memory-hard against offline password cracking. High-entropy opaque secrets cannot be feasibly guessed, and a database disclosure exposes only non-usable hashes.

**Tradeoff:** Argon2id intentionally consumes more resources than a fast hash. Its parameters should be reviewed against deployment hardware as the system grows.

### 2026-08-30 — Register users and verification tokens atomically

**Decision:** Registration validates and normalizes input, computes the Argon2id hash before a database transaction, then creates the user, credential, and hashed verification token together.

**Why:** Hashing outside the transaction avoids holding database locks during the deliberately costly operation. The transaction prevents a partially registered account without its credential or verification record.

**Tradeoff:** A duplicate email still incurs one password-hash computation before the database rejects it. This avoids a race-prone pre-check and keeps email uniqueness authoritative in PostgreSQL.
