import { Module } from "@nestjs/common";
import { ConfigModule } from "@nestjs/config";
import { ScheduleModule } from "@nestjs/schedule";

import { HealthController } from "./health.controller";
import { PmsController } from "./pms.controller";
import { DatabaseService } from "./database.service";
import { RealtimeService } from "./realtime.service";
import { AuthController } from "./auth.controller";
import { AuthService } from "./auth.service";
import { ProposalController } from "./proposal.controller";
import { ProposalService } from "./proposal.service";
import { AiGatewayService } from "./ai-gateway.service";
import { McpController } from "./mcp.controller";
import { GovernanceWorker } from "./governance.worker";

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
