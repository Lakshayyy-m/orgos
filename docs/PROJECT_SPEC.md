# OrgOS — Master Project Specification

## Purpose

OrgOS is an educational, production-quality miniature B2B identity and authorization platform. It is not a commercial PropelAuth clone. Its goal is to build the ability to reason about authentication, multi-tenancy, RBAC, sessions, API keys, enterprise provisioning, impersonation, auditability, and MCP authorization.

The customer application is **AcmeBoard**, a fictional project-management SaaS. A separate OrgOS admin dashboard will eventually support internal staff workflows.

## Engineering principles

1. Build one milestone at a time. Do not add future-phase behavior without an explicit request.
2. Teach before implementing a new subsystem: concept, threat model, data model, request lifecycle, then the smallest useful implementation.
3. The server is the authorization boundary. UI checks are only user-experience helpers.
4. Use established cryptographic and protocol libraries; never invent crypto.
5. Prefer explicit TypeScript types; avoid `any`.
6. Treat security failures as bugs. Add validation, security-focused tests, and audit events where appropriate.
7. Record meaningful architecture decisions in `docs/architecture.md`.

## Architecture

Use a Next.js application with TypeScript and Tailwind CSS. Begin with Next.js route handlers and server-side domain modules; do not introduce microservices prematurely.

Use PostgreSQL and Drizzle ORM for durable relational data. Introduce Redis only for concrete ephemeral-state requirements, such as rate limiting, challenges, session revocation, OAuth state, or short-lived impersonation state.

Target structure:

```text
app/                         routes and UI
src/
  auth/ users/ organizations/ authorization/ sessions/
  invitations/ api-keys/ audit/ impersonation/ security/
  scim/ sso/ mcp/
db/schema/                   Drizzle schema
db/migrations/               generated migrations
db/seed/                     deterministic seed data
packages/orgos-sdk/          SDK (later phase)
tests/unit/ tests/e2e/       Vitest and Playwright suites
docs/                        architecture and security documentation
```

### Feature module conventions

Keep code local to its domain until it is genuinely shared. Apply this separation to every domain with request-boundary validation or server-side data access:

```text
src/projects/
  contracts.ts      types shared across the Server Action/client boundary only
  validation.ts     pure Zod validation and shared field limits
  service.ts        server-only database operations
app/(customer-app)/projects/
  page.tsx          project workspace route
  _components/      UI owned only by the project workspace

src/organizations/
  contracts.ts      organization Server Action/client types
  validation.ts     pure Zod validation
  service.ts        server-only database operations
app/(customer-app)/organization/
  page.tsx          organization workspace route
  _components/      UI owned only by the organization workspace
```

Route groups organize application areas without changing the URL, so the workspace is available at `/projects`. Do not create `src/projects/lib` as a catch-all. Reserve a future `src/lib` for utilities shared across domains. Browser constraints improve usability; Zod validation in Server Actions remains authoritative at application request boundaries.

## Delivery phases

1. **Application foundation** — unauthenticated AcmeBoard, relational data model, organization/projects/project-member CRUD, deterministic seed data.
2. **Authentication** — registration, email verification, Argon2id password hashes, opaque hashed session identifiers, logout and revocation.
3. **Organizations** — many-to-many membership, active organization context, membership-validated tenant scoping.
4. **RBAC** — configurable roles, permissions, role assignments; permissions rather than role-name checks.
5. **Authorization middleware** — reusable authentication, membership, and permission guards.
6. **Invitations** — hashed invitation tokens with expiration, acceptance, rejection, revocation, and resend.
7. **MFA/security policies** — organization-level security settings and changing effective requirements.
8. **API keys** — personal/organization keys, one-time secret display, hashes, expiration, revocation, and scopes.
9. **Audit logs** — append-only security event store with filtering and pagination.
10. **Internal roles** — staff authorization kept separate from customer authorization.
11. **Impersonation** — short-lived, revocable, audited support sessions that identify actor and target.
12. **SCIM** — standards-compatible provisioning API and simulator; disabling a user must revoke effective access.
13. **OIDC study flow** — authorization code flow, validation, and documentation; study SAML separately.
14. **MCP authentication** — OAuth-style scopes plus organization membership and application permission checks.
15. **SDK** — `packages/orgos-sdk` for core operations.
16. **React SDK** — providers, hooks, and UX-oriented permission components.
17. **Rate limiting** — sensitive endpoint protection with documented keys and tradeoffs.
18. **Security review** — adversarial tests and documented fixes.

## Non-negotiable security invariants

- Passwords are never stored or logged in plaintext or reversible form.
- Session and invitation secrets are opaque, high-entropy values; their hashes are persisted.
- Every organization-owned operation validates membership and scopes queries to the resolved organization. Client-supplied organization IDs are never trusted by themselves.
- A role is a collection of permissions. Server code authorizes permissions, not UI state or role names.
- API-key scopes constrain but never override application authorization.
- Audit events are append-only.
- Impersonation records both employee and customer identity, expires quickly, is revocable, and is visible in the UI.
- MCP authorization requires token scope, user identity, organization context, membership, and application permissions.

## Phase ceremony

At the beginning of each phase, document:

```text
PHASE — what is being built
WHY — product value
CONCEPTS — prerequisites
DATA MODEL — tables and relationships
REQUEST FLOW — request lifecycle
THREAT MODEL — attack surfaces and mitigations
IMPLEMENTATION PLAN — small tasks
ACCEPTANCE TESTS — proof of behavior
LEARNING CHECK — questions to answer before advancing
```

After every task, report what changed, why it works, security considerations, tests added and run, and the single suggested next task. Stop before beginning that next task unless explicitly asked.

## Documentation

Maintain `architecture.md` for material design choices. As each subsystem is implemented, add focused documents for authentication, authorization, sessions, organizations, API keys, impersonation, SCIM, OIDC, MCP, and threat modeling. Each should cover the problem, data model, request lifecycle, threats, decisions, alternatives, and tradeoffs.
