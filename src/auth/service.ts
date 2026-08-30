import "server-only";
import { getDatabase } from "@/db/server";
import {
  emailVerificationTokens,
  passwordCredentials,
  users,
} from "@/db/schema";
import { hashPassword } from "./password";
import { generateOpaqueToken } from "./tokens";
import type { ValidatedRegistration } from "./validation";

const verificationTokenLifetimeMilliseconds = 24 * 60 * 60 * 1_000;

export type RegistrationResult = {
  userId: string;
  email: string;
  rawVerificationToken: string;
  verificationExpiresAt: Date;
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
