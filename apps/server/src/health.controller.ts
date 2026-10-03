import { Controller, Get } from "@nestjs/common";

type HealthResponse = {
  status: "ok";
  service: "pms-server";
  version: string;
};

@Controller("health")
export class HealthController {
  @Get()
  getHealth(): HealthResponse {
    return {
      status: "ok",
      service: "pms-server",
      version: "0.1.0",
    };
  }
}
