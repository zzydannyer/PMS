import { randomBytes } from "node:crypto";
import { Injectable, UnauthorizedException } from "@nestjs/common";

export type LoginResult = {
  accessToken: string;
  memberId: string;
  displayName: string;
};

@Injectable()
export class AuthService {
  private readonly sessions = new Map<string, string>();

  login(login: string, password: string): LoginResult {
    if (login !== "demo" || password !== "demo") {
      throw new UnauthorizedException("账号或密码错误");
    }

    const accessToken = randomBytes(32).toString("base64url");
    this.sessions.set(accessToken, "member-demo");
    return {
      accessToken,
      memberId: "member-demo",
      displayName: "演示用户",
    };
  }

  resolveMemberId(authorization: string): string {
    const token = authorization.startsWith("Bearer ")
      ? authorization.slice(7)
      : "";
    const memberId = this.sessions.get(token);
    if (!memberId) {
      throw new UnauthorizedException("登录已失效");
    }
    return memberId;
  }
}
