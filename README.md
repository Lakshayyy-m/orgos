# OrgOS

An educational B2B identity and authorization platform that explores the engineering challenges behind modern multi-tenant authentication systems.

Built to understand:

- Authentication and sessions
- Multi-tenancy and organizations
- RBAC and server-side authorization
- API keys and audit logging
- Enterprise provisioning and SSO concepts
- Secure impersonation
- MCP authorization
- SDK design

The product is deliberately built in small, security-focused phases. The canonical scope and workflow live in [`docs/PROJECT_SPEC.md`](docs/PROJECT_SPEC.md).

## Why I built this

I want to understand what happens beneath a B2B authentication platform rather than only learning how to integrate one.

## Getting started

```bash
npm install
npm run dev
```

Open [http://localhost:3000](http://localhost:3000).

## Current phase

**Phase 1 — Application Foundation**

The Next.js foundation, PostgreSQL/Drizzle schema, and repeatable Acme Corp seed are in place. The next explicitly requested task will expose this data through a minimal read-only project list.

## Local database

Copy the example environment values, start PostgreSQL, then apply migrations:

```bash
cp .env.example .env.local
docker compose up -d
npm run db:migrate
npm run db:seed
```

This requires a running Docker daemon and the Docker Compose v2 plugin.

## Project documentation

- [Master specification](docs/PROJECT_SPEC.md)
- [Architecture decisions](docs/architecture.md)
