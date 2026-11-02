// @vitest-environment node
import { describe, expect, it } from "vitest";

import { verifyPassword } from "@/lib/admin-password";

describe("admin password gate", () => {
  it("rejects a wrong password", async () => {
    expect(await verifyPassword("definitely-wrong", "my-secret-pw")).toBe(false);
  });

  it("accepts the exact password", async () => {
    expect(await verifyPassword("my-secret-pw", "my-secret-pw")).toBe(true);
  });

  it("rejects an empty password", async () => {
    expect(await verifyPassword("", "my-secret-pw")).toBe(false);
  });

  it("locks everyone out when no password is configured", async () => {
    expect(await verifyPassword("", "")).toBe(false);
    expect(await verifyPassword("anything", undefined)).toBe(false);
  });
});
