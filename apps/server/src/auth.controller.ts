import { Body, Controller, Post } from "@nestjs/common";

import { AuthService, type LoginResult } from "./auth.service";

type LoginBody = {
  login: string;
  password: string;
};

@Controller("api/auth")
export class AuthController {
  public constructor(private readonly authService: AuthService) {}

  @Post("login")
  login(@Body() body: LoginBody): LoginResult {
    return this.authService.login(body.login, body.password);
  }
}
