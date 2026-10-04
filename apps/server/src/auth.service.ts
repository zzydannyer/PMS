import { createHmac, timingSafeEqual } from "node:crypto";
import { Injectable, UnauthorizedException } from "@nestjs/common";

export type LoginResult = {
  accessToken: string;
  memberId: string;
  displayName: string;
};

@Injectable()
export class AuthService {
  private readonly secret = process.env.PMS_AUTH_SECRET || "pms-local-auth-secret";
  private readonly tokenLifetimeSeconds = 60 * 60 * 24 * 7;

  login(login: string, password: string): LoginResult {
    if (login !== "demo" || password !== "demo") {
      throw new UnauthorizedException("账号或密码错误");
    }

    const expiresAt = Math.floor(Date.now() / 1000) + this.tokenLifetimeSeconds;
    const payload = `member-demo.${expiresAt}`;
    const signature = this.sign(payload);
    const accessToken = `${payload}.${signature}`;
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
    const parts = token.split(".");
    if (parts.length !== 3) {
      throw new UnauthorizedException("登录已失效");
    }
    const [memberId, expiresAt, signature] = parts;
    const payload = `${memberId}.${expiresAt}`;
    const expectedSignature = this.sign(payload);
    if (signature.length !== expectedSignature.length) {
      throw new UnauthorizedException("登录已失效");
    }
    const signatureMatches = timingSafeEqual(
      Buffer.from(signature),
      Buffer.from(expectedSignature),
    );
    if (!signatureMatches || Number.parseInt(expiresAt, 10) <= Math.floor(Date.now() / 1000)) {
      throw new UnauthorizedException("登录已失效");
    }
    return memberId;
  }

  private sign(payload: string): string {
    return createHmac("sha256", this.secret).update(payload).digest("base64url");
  }
}
