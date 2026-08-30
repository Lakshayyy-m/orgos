import "server-only";
import { and, eq, gt, isNull } from "drizzle-orm";
import { getDatabase } from "@/db/server";
import {
  emailVerificationTokens,
  passwordCredentials,
  users,
} from "@/db/schema";
import { hashPassword } from "./password";
import { generateOpaqueToken, hashOpaqueToken } from "./tokens";
import type { ValidatedRegistration } from "./validation";

const verificationTokenLifetimeMilliseconds = 24 * 60 * 60 * 1_000;

export type RegistrationResult = {
  userId: string;
  email: string;
  rawVerificationToken: string;
  verificationExpiresAt: Date;
};

export type EmailVerificationResult = {
  status: "verified" | "invalid_or_expired";
};

export class DuplicateEmailError extends Error {
  constructor() {
    super("A user with this email address already exists.");
  }
}

function isUniqueConstraintViolation(error: unknown): boolean {
  return (
    typeof error === "object" &&
    error !== null &&
    "code" in error &&
    error.code === "23505"
  );
}

export async function registerUser(
  input: ValidatedRegistration,
): Promise<RegistrationResult> {
  const passwordHash = await hashPassword(input.password);
  const verificationToken = generateOpaqueToken();
  const verificationExpiresAt = new Date(
    Date.now() + verificationTokenLifetimeMilliseconds,
  );

  try {
    return await getDatabase().transaction(async (transaction) => {
      const [user] = await transaction
        .insert(users)
        .values({
          email: input.email,
          displayName: input.displayName,
        })
        .returning({
          id: users.id,
          email: users.email,
        });

      if (!user) {
        throw new Error("User registration did not return a user.");
      }

      await transaction.insert(passwordCredentials).values({
        userId: user.id,
        passwordHash,
      });

      await transaction.insert(emailVerificationTokens).values({
        userId: user.id,
        tokenHash: verificationToken.hash,
        expiresAt: verificationExpiresAt,
      });

      return {
        userId: user.id,
        email: user.email,
        rawVerificationToken: verificationToken.value,
        verificationExpiresAt,
      };
    });
  } catch (error: unknown) {
    if (isUniqueConstraintViolation(error)) {
      throw new DuplicateEmailError();
    }

    throw error;
  }
}

export async function verifyEmailVerificationToken(
  rawToken: string,
): Promise<EmailVerificationResult> {
  if (rawToken.length === 0) {
    return { status: "invalid_or_expired" };
  }

  const now = new Date();
  const tokenHash = hashOpaqueToken(rawToken);

  return getDatabase().transaction(async (transaction) => {
    const [verificationToken] = await transaction
      .update(emailVerificationTokens)
      .set({ consumedAt: now })
      .where(
        and(
          eq(emailVerificationTokens.tokenHash, tokenHash),
          isNull(emailVerificationTokens.consumedAt),
          gt(emailVerificationTokens.expiresAt, now),
        ),
      )
      .returning({ userId: emailVerificationTokens.userId });

    if (!verificationToken) {
      return { status: "invalid_or_expired" };
    }

    const [user] = await transaction
      .update(users)
      .set({
        emailVerifiedAt: now,
        updatedAt: now,
      })
      .where(eq(users.id, verificationToken.userId))
      .returning({ id: users.id });

    if (!user) {
      throw new Error("Verification token references a missing user.");
    }

    return { status: "verified" };
  });
}
