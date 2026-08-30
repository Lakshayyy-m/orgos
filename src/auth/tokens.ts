import { createHash, randomBytes } from "node:crypto";

const opaqueTokenByteLength = 32;

export type OpaqueToken = {
  value: string;
  hash: string;
};

export function hashOpaqueToken(token: string): string {
  return createHash("sha256").update(token, "utf8").digest("hex");
}

export function generateOpaqueToken(): OpaqueToken {
  const value = randomBytes(opaqueTokenByteLength).toString("base64url");

  return {
    value,
    hash: hashOpaqueToken(value),
  };
}
