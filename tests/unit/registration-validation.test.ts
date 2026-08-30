import { describe, expect, it } from "vitest";
import {
  maximumPasswordLength,
  minimumPasswordLength,
  validateRegistration,
} from "@/src/auth/validation";

describe("validateRegistration", () => {
  it("normalizes email and display name before registration", () => {
    expect(
      validateRegistration({
        email: "  Alice@Example.test  ",
        displayName: "  Alice  ",
        password: "secure-password",
      }),
    ).toEqual({
      isValid: true,
      value: {
        email: "alice@example.test",
        displayName: "Alice",
        password: "secure-password",
      },
    });
  });

  it("rejects an invalid email and a short password", () => {
    expect(
      validateRegistration({
        email: "not-an-email",
        displayName: "Alice",
        password: "secure-password",
      }),
    ).toMatchObject({ isValid: false });

    expect(
      validateRegistration({
        email: "alice@example.test",
        displayName: "Alice",
        password: "a".repeat(minimumPasswordLength - 1),
      }),
    ).toMatchObject({ isValid: false });
  });

  it("rejects non-text input and oversized passwords", () => {
    expect(
      validateRegistration({
        email: 123,
        displayName: "Alice",
        password: "secure-password",
      }),
    ).toMatchObject({ isValid: false });

    expect(
      validateRegistration({
        email: "alice@example.test",
        displayName: "Alice",
        password: "a".repeat(maximumPasswordLength + 1),
      }),
    ).toMatchObject({ isValid: false });
  });
});
