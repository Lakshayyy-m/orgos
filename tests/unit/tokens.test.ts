import { describe, expect, it } from "vitest";
import { generateOpaqueToken, hashOpaqueToken } from "@/src/auth/tokens";

describe("opaque tokens", () => {
  it("generates a raw token with a matching fixed-length hash", () => {
    const token = generateOpaqueToken();

    expect(token.value).toHaveLength(43);
    expect(token.hash).toMatch(/^[a-f0-9]{64}$/);
    expect(hashOpaqueToken(token.value)).toBe(token.hash);
  });

  it("generates independent token secrets", () => {
    const first = generateOpaqueToken();
    const second = generateOpaqueToken();

    expect(first.value).not.toBe(second.value);
    expect(first.hash).not.toBe(second.hash);
  });
});
