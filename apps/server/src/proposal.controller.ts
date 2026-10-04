import {
  Body,
  Controller,
  Get,
  Headers,
  Param,
  Post,
  Query,
  UnauthorizedException,
} from "@nestjs/common";
import type { AiUsageSummary, Proposal, WorkItem } from "@pms/domain";

import { AuthService } from "./auth.service.js";
import { ProposalService } from "./proposal.service.js";
import { AiGatewayService } from "./ai-gateway.service.js";
import { DatabaseService } from "./database.service.js";

type CreateProposalBody = {
  workspaceId: string;
  projectId: string;
  message: string;
};

type ConfirmProposalBody = {
  acceptedChangeIds: string[];
};

type AskAgentBody = {
  workspaceId: string;
  projectId: string;
  message: string;
};

type AgentCitation = {
  entityType: string;
  entityId: string;
  title: string;
};

type AgentTool = {
  name: string;
  description: string;
  access: "READ_ONLY" | "PROPOSAL_ONLY";
};

type ProposalResponse = {
  proposal: Proposal;
  workItem: WorkItem;
};

@Controller("api/agent")
export class ProposalController {
  public constructor(
    private readonly proposalService: ProposalService,
    private readonly authService: AuthService,
    private readonly aiGatewayService: AiGatewayService,
    private readonly databaseService: DatabaseService,
  ) {}

  @Post("proposals")
  async create(
    @Body() body: CreateProposalBody,
    @Headers("authorization") authorization: string,
  ): Promise<Proposal> {
    const requesterId = this.resolveMemberId(authorization);
    return this.proposalService.create({
      ...body,
      requesterId,
    });
  }

  @Get("proposals")
  list(
    @Headers("authorization") authorization: string,
  ): Proposal[] {
    return this.proposalService.list(this.resolveMemberId(authorization));
  }

  @Post("ask")
  async ask(
    @Body() body: AskAgentBody,
    @Headers("authorization") authorization: string,
  ): Promise<{ answer: string; citations: AgentCitation[] }> {
    const memberId = this.resolveMemberId(authorization);
    await this.databaseService.assertMemberCanRead(body.workspaceId, memberId);
    const citations = await this.databaseService.search(
      body.workspaceId,
      body.message,
    );
    const context = citations
      .slice(0, 5)
      .map((item) => `${item.entityType} ${item.title}: ${item.description}`)
      .join("\n");
    const result = await this.aiGatewayService.ask(
      `用户问题：${body.message}\n可引用上下文：\n${context}`,
    );
    await this.databaseService.recordAiUsage(
      body.workspaceId,
      memberId,
      result.model,
      result.promptTokens,
      result.completionTokens,
    );
    return {
      answer: result.content,
      citations: citations.slice(0, 5).map((item) => ({
        entityType: item.entityType,
        entityId: item.entityId,
        title: item.title,
      })),
    };
  }

  @Get("tools")
  tools(
    @Headers("authorization") authorization: string,
  ): AgentTool[] {
    this.resolveMemberId(authorization);
    return [
      {
        name: "search_workspace",
        description: "搜索当前用户有权访问的项目和工作项。",
        access: "READ_ONLY",
      },
      {
        name: "create_work_item_proposal",
        description: "生成创建工作项的待确认提议。",
        access: "PROPOSAL_ONLY",
      },
    ];
  }

  @Get("usage")
  async usage(
    @Query("workspaceId") workspaceId: string,
    @Headers("authorization") authorization: string,
  ): Promise<AiUsageSummary> {
    const memberId = this.resolveMemberId(authorization);
    await this.databaseService.assertMemberCanRead(workspaceId, memberId);
    return this.databaseService.getAiUsageSummary(workspaceId, memberId);
  }

  @Post("proposals/:proposalId/confirm")
  confirm(
    @Param("proposalId") proposalId: string,
    @Body() body: ConfirmProposalBody,
    @Headers("authorization") authorization: string,
  ): Promise<ProposalResponse> {
    const requesterId = this.resolveMemberId(authorization);
    return this.proposalService.confirm(proposalId, body, requesterId);
  }

  @Post("proposals/:proposalId/revoke")
  revoke(
    @Param("proposalId") proposalId: string,
    @Headers("authorization") authorization: string,
  ): Promise<Proposal> {
    return this.proposalService.revoke(
      proposalId,
      this.resolveMemberId(authorization),
    );
  }

  private resolveMemberId(authorization: string): string {
    if ((authorization || "") === "") {
      throw new UnauthorizedException("需要登录");
    }
    return this.authService.resolveMemberId(authorization);
  }
}
