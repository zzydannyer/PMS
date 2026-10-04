import { Module } from "@nestjs/common";
import { ConfigModule } from "@nestjs/config";
import { ScheduleModule } from "@nestjs/schedule";

import { HealthController } from "./health.controller.js";
import { PmsController } from "./pms.controller.js";
import { DatabaseService } from "./database.service.js";
import { RealtimeService } from "./realtime.service.js";
import { AuthController } from "./auth.controller.js";
import { AuthService } from "./auth.service.js";
import { ProposalController } from "./proposal.controller.js";
import { ProposalService } from "./proposal.service.js";
import { AiGatewayService } from "./ai-gateway.service.js";
import { McpController } from "./mcp.controller.js";
import { GovernanceWorker } from "./governance.worker.js";

@Module({
  imports: [
    ScheduleModule.forRoot(),
    ConfigModule.forRoot({
      isGlobal: true,
    }),
  ],
  controllers: [
    HealthController,
    PmsController,
    AuthController,
    ProposalController,
    McpController,
  ],
  providers: [
    DatabaseService,
    RealtimeService,
    AuthService,
    ProposalService,
    AiGatewayService,
    GovernanceWorker,
  ],
})
export class AppModule {}
