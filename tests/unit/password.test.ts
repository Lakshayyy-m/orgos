import { describe, expect, it } from "vitest";
import { hashPassword, verifyPassword } from "@/src/auth/password";

describe("password hashing", () => {
  it("creates an Argon2id hash that verifies the original password", async () => {
    const password = "correct horse battery staple";
    const passwordHash = await hashPassword(password);

    expect(passwordHash).not.toContain(password);
    await expect(verifyPassword(password, passwordHash)).resolves.toBe(true);
  });

  it("rejects an incorrect password and malformed hash", async () => {
    const passwordHash = await hashPassword("correct horse battery staple");

    await expect(verifyPassword("incorrect password", passwordHash)).resolves.toBe(
      false,
    );
    await expect(verifyPassword("any password", "not-a-valid-hash")).resolves.toBe(
      false,
    );
  });
});
