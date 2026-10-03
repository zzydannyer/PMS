import { Injectable } from "@nestjs/common";
import { Cron } from "@nestjs/schedule";

import { DatabaseService } from "./database.service";

@Injectable()
export class GovernanceWorker {
  public constructor(private readonly databaseService: DatabaseService) {}

  @Cron("0 30 2 * * *")
  async applyRetentionPolicies(): Promise<void> {
    await this.databaseService.applyRetentionPolicies();
  }
}
