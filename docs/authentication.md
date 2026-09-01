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

## Verification email delivery

Verification messages use SMTP through Nodemailer. Development uses Mailpit on SMTP port `1025` with its inbox at `http://localhost:8025`; production can provide any SMTP-compatible service through environment variables.

The verification secret is placed in the email URL fragment (`/verify-email#token=...`). Fragments are not sent with the initial HTTP request, reducing accidental token capture in server and proxy request logs. The future verification page will read the fragment and POST it to the server.

## Request lifecycle

Registration normalizes and validates input, hashes the password before opening a database transaction, then creates the user, password credential, and short-lived verification-token hash atomically. The browser or email receives only the raw verification secret.

Email verification hashes the raw secret and conditionally marks its database record consumed only while it is unexpired. In the same transaction, it sets `users.email_verified_at`. Replayed, expired, unknown, or empty tokens all fail with the same result.

Login verifies the password hash and creates a session. The response receives the raw session secret in a secure cookie; later requests hash that value and load a non-expired, non-revoked session.

## Threat model

- Database disclosure should not reveal usable passwords or session/token secrets.
- Expired, consumed, and revoked records must never authenticate a request.
- A login must issue a new session secret rather than reusing one supplied by the browser.
- Error messages should not reveal whether an email exists where that creates an enumeration risk.

## Decisions and tradeoffs

Opaque sessions make server-side revocation and session inspection straightforward, at the cost of a database lookup per authenticated request. We choose that tradeoff over JWT-only browser authentication for clear revocation semantics.

`password_credentials` is separate from `users`, avoiding a nullable password column and preparing for future SSO-only users. The initial token-hash column width matches a SHA-256 hex digest; implementation uses standard platform cryptography, not custom algorithms.

Registration hashes before its transaction so expensive password work does not hold database locks. The transaction prevents partial accounts: a user cannot exist without the corresponding credential and verification-token record when registration succeeds.
