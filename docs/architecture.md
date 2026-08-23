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
