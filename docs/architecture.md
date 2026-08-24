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

**Tradeoff:** This is a display-only membership view. A later task will add assignment and removal through a server action; Phase 3 will replace the demo context with a membership-validated active organization.
