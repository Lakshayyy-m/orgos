export function buildVerificationUrl(
  applicationUrl: string,
  rawToken: string,
): string {
  if (rawToken.length === 0) {
    throw new Error("Cannot build a verification URL without a token.");
  }

  const verificationUrl = new URL("/verify-email", applicationUrl);
  verificationUrl.hash = new URLSearchParams({ token: rawToken }).toString();

  return verificationUrl.toString();
}
