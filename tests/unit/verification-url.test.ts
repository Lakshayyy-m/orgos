import { describe, expect, it } from "vitest";
import { buildVerificationUrl } from "@/src/auth/verification-url";

describe("buildVerificationUrl", () => {
  it("places the raw token in the URL fragment", () => {
    const rawToken = "verification-secret";
    const verificationUrl = new URL(
      buildVerificationUrl("http://localhost:3000", rawToken),
    );

    expect(verificationUrl.pathname).toBe("/verify-email");
    expect(new URLSearchParams(verificationUrl.hash.slice(1)).get("token")).toBe(
      rawToken,
    );
  });

  it("rejects empty tokens", () => {
    expect(() => buildVerificationUrl("http://localhost:3000", "")).toThrow(
      "Cannot build a verification URL without a token.",
    );
  });
});
