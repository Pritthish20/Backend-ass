import { describe, expect, it } from "vitest";

import { hashPassword, verifyPassword } from "../src/lib/password.js";

describe("password helpers", () => {
  it("hashes and verifies passwords", async () => {
    const password = "Admin@12345";
    const passwordHash = await hashPassword(password);

    expect(passwordHash).not.toBe(password);
    await expect(verifyPassword(password, passwordHash)).resolves.toBe(true);
    await expect(verifyPassword("wrong-password", passwordHash)).resolves.toBe(false);
  });
});
