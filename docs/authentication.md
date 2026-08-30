# Authentication

## Problem

Phase 2 binds a browser request to a user without persisting passwords or reusable browser secrets in plaintext.

## Data model

- `users.email_verified_at` records whether email ownership is confirmed.
- `password_credentials` has one Argon2id password hash per password-enabled user.
- `email_verification_tokens` stores a unique SHA-256 token hash, expiry, and single-use consumption timestamp.
- `sessions` stores a unique SHA-256 token hash, lifecycle timestamps, and request metadata.

Credential, verification-token, and session records delete when their user is deleted. Raw password, verification, and session secrets are never database values.

## Cryptographic primitives

Passwords use the maintained `argon2` package with Argon2id (`19,456 KiB` memory, two iterations, one lane). Opaque tokens are 32 random bytes encoded as base64url; the database lookup value is a SHA-256 hex digest.

These use vetted package or platform cryptography. OrgOS does not implement password hashing, random-number generation, or hash algorithms itself.

## Request lifecycle

Registration creates the user, password credential, and a short-lived verification token. The browser or email receives only the raw verification secret.

Login verifies the password hash and creates a session. The response receives the raw session secret in a secure cookie; later requests hash that value and load a non-expired, non-revoked session.

## Threat model

- Database disclosure should not reveal usable passwords or session/token secrets.
- Expired, consumed, and revoked records must never authenticate a request.
- A login must issue a new session secret rather than reusing one supplied by the browser.
- Error messages should not reveal whether an email exists where that creates an enumeration risk.

## Decisions and tradeoffs

Opaque sessions make server-side revocation and session inspection straightforward, at the cost of a database lookup per authenticated request. We choose that tradeoff over JWT-only browser authentication for clear revocation semantics.

`password_credentials` is separate from `users`, avoiding a nullable password column and preparing for future SSO-only users. The initial token-hash column width matches a SHA-256 hex digest; implementation uses standard platform cryptography, not custom algorithms.
