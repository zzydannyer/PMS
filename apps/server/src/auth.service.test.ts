import { describe, expect, it } from "vitest";

import { AuthService } from "./auth.service";

describe("AuthService", () => {
  it("creates a session for the demo account", () => {
    const service = new AuthService();
    const result = service.login("demo", "demo");

    expect(result.memberId).toBe("member-demo");
    expect(service.resolveMemberId(`Bearer ${result.accessToken}`)).toBe(
      "member-demo",
    );
  });

  it("rejects invalid credentials", () => {
    const service = new AuthService();

    expect(() => service.login("demo", "invalid")).toThrow("账号或密码错误");
  });
});
