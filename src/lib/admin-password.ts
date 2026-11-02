// Constant-time password check shared by the admin gate server functions.
// Kept separate so the rule can be tested without a running server.
async function sha256(s: string) {
  return new Uint8Array(await crypto.subtle.digest("SHA-256", new TextEncoder().encode(s)));
}

export async function verifyPassword(input: string, expected: string | undefined): Promise<boolean> {
  if (!expected) return false;
  const [a, b] = await Promise.all([sha256(input), sha256(expected)]);
  let diff = 0;
  for (let i = 0; i < a.length; i++) diff |= a[i]! ^ b[i]!;
  return diff === 0;
}
