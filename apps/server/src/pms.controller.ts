import {
  Body,
  Controller,
  Get,
  Headers,
  Param,
  Patch,
  Post,
  Query,
  Sse,
  UnauthorizedException,
} from "@nestjs/common";
import { map, type Observable } from "rxjs";
import type {
  Defect,
  DeliveryMetrics,
  IntegrationEvent,
  IntegrationProvider,
  PortfolioSummary,
  TeamCapacity,
  Iteration,
  Milestone,
  Project,
  ProjectMember,
  Release,
  WorkItem,
  WorkItemDependency,
  WorkItemPriority,
  WorkItemStatus,
  WorkItemType,
  WorkspaceGovernancePolicy,
} from "@pms/domain";

import {
  type Notification,
  type SearchResult,
  type WorkItemComment,
  type WorkspaceMember,
} from "./pms.service";
import {
  DatabaseService,
  type AiAuditRecord,
  type AgentRun,
  type AutomationRule,
} from "./database.service";
import { RealtimeService, type PmsEvent } from "./realtime.service";
import { AuthService } from "./auth.service";

type ApiResponse<Data> = {
  data: Data;
  requestId: string;
};

type CreateProjectBody = {
  workspaceId: string;
  name: string;
  description: string;
  ownerId: string;
};

type CreateWorkItemBody = {
  workspaceId: string;
  projectId: string;
  title: string;
  description: string;
  type: WorkItemType;
  priority: WorkItemPriority;
  reporterId: string;
};

type UpdateWorkItemBody = {
  status: WorkItemStatus;
  priority: WorkItemPriority;
  assigneeId: string;
  dueDate: string;
};

type CreateCommentBody = {
  authorId: string;
  content: string;
};

type CreateIterationBody = {
  name: string;
  goal: string;
  startDate: string;
  endDate: string;
};

type CreateMilestoneBody = {
  name: string;
  description: string;
  dueDate: string;
};

type CreateReleaseBody = {
  name: string;
  version: string;
  releaseDate: string;
};

type CreateDefectBody = {
  severity: Defect["severity"];
  environment: string;
  reproduction: string;
};

type IntegrationEventBody = {
  eventType: string;
  externalId: string;
  payload: Record<string, string>;
};

type CreateAutomationRuleBody = {
  name: string;
  triggerEvent: string;
  actionType: string;
};

type CreateDependencyBody = {
  targetId: string;
  type: WorkItemDependency["type"];
};

type UpdateGovernanceBody = {
  retentionDays: number;
  backupEnabled: boolean;
  ssoEnabled: boolean;
};

type ServerSentEvent = {
  data: PmsEvent;
};

type DeliveryResponse = {
  iterations: Iteration[];
  milestones: Milestone[];
  releases: Release[];
  defects: Defect[];
};

@Controller("api")
export class PmsController {
  public constructor(
    private readonly databaseService: DatabaseService,
    private readonly realtimeService: RealtimeService,
    private readonly authService: AuthService,
  ) {}

  @Sse("events")
  events(): Observable<ServerSentEvent> {
    return this.realtimeService.stream().pipe(map((data) => ({ data })));
  }

  @Get("projects")
  listProjects(
    @Query("workspaceId") workspaceId: string,
  ): Promise<ApiResponse<Project[]>> {
    return this.databaseService
      .listProjects(workspaceId)
      .then((data) => this.response(data));
  }

  @Get("projects/:projectId/members")
  listProjectMembers(
    @Param("projectId") projectId: string,
  ): Promise<ApiResponse<ProjectMember[]>> {
    return this.databaseService
      .listProjectMembers(projectId)
      .then((data) => this.response(data));
  }

  @Post("projects")
  async createProject(
    @Body() body: CreateProjectBody,
    @Headers("x-member-id") memberId: string,
    @Headers("authorization") authorization: string,
  ): Promise<ApiResponse<Project>> {
    const actorId = this.resolveMemberId(authorization, memberId);
    await this.databaseService.assertMemberCanWrite(body.workspaceId, actorId);
    return this.response(await this.databaseService.createProject(body));
  }

  @Get("workspaces/:workspaceId/members")
  listWorkspaceMembers(
    @Param("workspaceId") workspaceId: string,
  ): Promise<ApiResponse<WorkspaceMember[]>> {
    return this.databaseService
      .listWorkspaceMembers(workspaceId)
      .then((data) => this.response(data));
  }

  @Get("work-items")
  listWorkItems(
    @Query("workspaceId") workspaceId: string,
    @Query("projectId") projectId: string,
  ): Promise<ApiResponse<WorkItem[]>> {
    return this.databaseService
      .listWorkItems(workspaceId, projectId)
      .then((data) => this.response(data));
  }

  @Get("projects/:projectId/delivery")
  listDelivery(
    @Param("projectId") projectId: string,
  ): Promise<ApiResponse<DeliveryResponse>> {
    return this.databaseService
      .listDelivery(projectId)
      .then((data) => this.response(data));
  }

  @Get("projects/:projectId/metrics")
  getDeliveryMetrics(
    @Param("projectId") projectId: string,
  ): Promise<ApiResponse<DeliveryMetrics>> {
    return this.databaseService
      .getDeliveryMetrics(projectId)
      .then((data) => this.response(data));
  }

  @Post("projects/:projectId/iterations")
  async createIteration(
    @Param("projectId") projectId: string,
    @Body() body: CreateIterationBody,
    @Headers("x-member-id") memberId: string,
    @Headers("authorization") authorization: string,
  ): Promise<ApiResponse<Iteration>> {
    const actorId = this.resolveMemberId(authorization, memberId);
    await this.databaseService.assertMemberCanWrite("workspace-demo", actorId);
    return this.response(
      await this.databaseService.createIteration({ projectId, ...body }),
    );
  }

  @Post("projects/:projectId/milestones")
  async createMilestone(
    @Param("projectId") projectId: string,
    @Body() body: CreateMilestoneBody,
    @Headers("x-member-id") memberId: string,
    @Headers("authorization") authorization: string,
  ): Promise<ApiResponse<Milestone>> {
    const actorId = this.resolveMemberId(authorization, memberId);
    await this.databaseService.assertMemberCanWrite("workspace-demo", actorId);
    return this.response(
      await this.databaseService.createMilestone({ projectId, ...body }),
    );
  }

  @Post("projects/:projectId/releases")
  async createRelease(
    @Param("projectId") projectId: string,
    @Body() body: CreateReleaseBody,
    @Headers("x-member-id") memberId: string,
    @Headers("authorization") authorization: string,
  ): Promise<ApiResponse<Release>> {
    const actorId = this.resolveMemberId(authorization, memberId);
    await this.databaseService.assertMemberCanWrite("workspace-demo", actorId);
    return this.response(
      await this.databaseService.createRelease({ projectId, ...body }),
    );
  }

  @Post("work-items/:workItemId/defects")
  async createDefect(
    @Param("workItemId") workItemId: string,
    @Body() body: CreateDefectBody,
    @Headers("x-member-id") memberId: string,
    @Headers("authorization") authorization: string,
  ): Promise<ApiResponse<Defect>> {
    const actorId = this.resolveMemberId(authorization, memberId);
    await this.databaseService.assertWorkItemCanWrite(workItemId, actorId);
    return this.response(
      await this.databaseService.createDefect({ workItemId, ...body }),
    );
  }

  @Get("work-items/:workItemId/dependencies")
  listDependencies(
    @Param("workItemId") workItemId: string,
    @Headers("authorization") authorization: string,
  ): Promise<ApiResponse<WorkItemDependency[]>> {
    this.resolveMemberId(authorization, "");
    return this.databaseService
      .listDependencies(workItemId)
      .then((data) => this.response(data));
  }

  @Post("work-items/:workItemId/dependencies")
  async createDependency(
    @Param("workItemId") workItemId: string,
    @Body() body: CreateDependencyBody,
    @Headers("authorization") authorization: string,
  ): Promise<ApiResponse<WorkItemDependency>> {
    this.resolveMemberId(authorization, "");
    return this.response(
      await this.databaseService.createDependency(
        workItemId,
        body.targetId,
        body.type,
      ),
    );
  }

  @Post("integrations/:provider/events")
  async recordIntegrationEvent(
    @Param("provider") provider: IntegrationProvider,
    @Body() body: IntegrationEventBody,
  ): Promise<ApiResponse<IntegrationEvent>> {
    return this.response(
      await this.databaseService.recordIntegrationEvent(
        provider,
        body.eventType,
        body.externalId,
        body.payload,
      ),
    );
  }

  @Get("automation/rules")
  async listAutomationRules(
    @Query("workspaceId") workspaceId: string,
    @Headers("authorization") authorization: string,
  ): Promise<ApiResponse<AutomationRule[]>> {
    const memberId = this.resolveMemberId(authorization, "");
    await this.databaseService.assertMemberCanRead(workspaceId, memberId);
    return this.response(
      await this.databaseService.listAutomationRules(workspaceId),
    );
  }

  @Post("automation/rules")
  async createAutomationRule(
    @Body() body: CreateAutomationRuleBody,
    @Query("workspaceId") workspaceId: string,
    @Headers("authorization") authorization: string,
  ): Promise<ApiResponse<AutomationRule>> {
    const memberId = this.resolveMemberId(authorization, "");
    await this.databaseService.assertMemberCanWrite(workspaceId, memberId);
    return this.response(
      await this.databaseService.createAutomationRule(
        workspaceId,
        memberId,
        body.name,
        body.triggerEvent,
        body.actionType,
      ),
    );
  }

  @Post("automation/rules/:ruleId/run")
  async runAutomationRule(
    @Param("ruleId") ruleId: string,
    @Query("workspaceId") workspaceId: string,
    @Headers("authorization") authorization: string,
  ): Promise<ApiResponse<AgentRun>> {
    const memberId = this.resolveMemberId(authorization, "");
    await this.databaseService.assertMemberCanWrite(workspaceId, memberId);
    return this.response(
      await this.databaseService.runAutomationRule(workspaceId, ruleId),
    );
  }

  @Get("automation/runs")
  async listAgentRuns(
    @Query("workspaceId") workspaceId: string,
    @Headers("authorization") authorization: string,
  ): Promise<ApiResponse<AgentRun[]>> {
    const memberId = this.resolveMemberId(authorization, "");
    await this.databaseService.assertMemberCanRead(workspaceId, memberId);
    return this.response(await this.databaseService.listAgentRuns(workspaceId));
  }

  @Get("portfolio/summary")
  async getPortfolioSummary(
    @Query("workspaceId") workspaceId: string,
    @Headers("authorization") authorization: string,
  ): Promise<ApiResponse<PortfolioSummary>> {
    const memberId = this.resolveMemberId(authorization, "");
    await this.databaseService.assertMemberCanRead(workspaceId, memberId);
    return this.response(
      await this.databaseService.getPortfolioSummary(workspaceId),
    );
  }

  @Get("portfolio/capacity")
  async getTeamCapacity(
    @Query("workspaceId") workspaceId: string,
    @Headers("authorization") authorization: string,
  ): Promise<ApiResponse<TeamCapacity[]>> {
    const memberId = this.resolveMemberId(authorization, "");
    await this.databaseService.assertMemberCanRead(workspaceId, memberId);
    return this.response(
      await this.databaseService.getTeamCapacity(workspaceId),
    );
  }

  @Get("governance/ai-audits")
  async listAiAudits(
    @Query("workspaceId") workspaceId: string,
    @Headers("authorization") authorization: string,
  ): Promise<ApiResponse<AiAuditRecord[]>> {
    const memberId = this.resolveMemberId(authorization, "");
    await this.databaseService.assertMemberCanRead(workspaceId, memberId);
    return this.response(await this.databaseService.listAiAudits(workspaceId));
  }

  @Get("governance/policy")
  async getGovernancePolicy(
    @Query("workspaceId") workspaceId: string,
    @Headers("authorization") authorization: string,
  ): Promise<ApiResponse<WorkspaceGovernancePolicy>> {
    const memberId = this.resolveMemberId(authorization, "");
    await this.databaseService.assertMemberCanRead(workspaceId, memberId);
    return this.response(
      await this.databaseService.getGovernancePolicy(workspaceId),
    );
  }

  @Post("governance/policy")
  async updateGovernancePolicy(
    @Query("workspaceId") workspaceId: string,
    @Body() body: UpdateGovernanceBody,
    @Headers("authorization") authorization: string,
  ): Promise<ApiResponse<WorkspaceGovernancePolicy>> {
    const memberId = this.resolveMemberId(authorization, "");
    await this.databaseService.assertMemberCanWrite(workspaceId, memberId);
    return this.response(
      await this.databaseService.updateGovernancePolicy(
        workspaceId,
        body.retentionDays,
        body.backupEnabled,
        body.ssoEnabled,
      ),
    );
  }

  @Post("work-items")
  async createWorkItem(
    @Body() body: CreateWorkItemBody,
    @Headers("x-member-id") memberId: string,
    @Headers("authorization") authorization: string,
  ): Promise<ApiResponse<WorkItem>> {
    const actorId = this.resolveMemberId(authorization, memberId);
    await this.databaseService.assertMemberCanWrite(body.workspaceId, actorId);
    return this.response(await this.databaseService.createWorkItem(body));
  }

  @Patch("work-items/:workItemId")
  updateWorkItem(
    @Param("workItemId") workItemId: string,
    @Body() body: UpdateWorkItemBody,
    @Headers("x-member-id") memberId: string,
    @Headers("authorization") authorization: string,
  ): Promise<ApiResponse<WorkItem>> {
    const actorId = this.resolveMemberId(authorization, memberId);
    return this.databaseService
      .assertWorkItemCanWrite(workItemId, actorId)
      .then(() => this.databaseService.updateWorkItem(workItemId, body))
      .then((data) => this.response(data));
  }

  @Get("work-items/:workItemId/comments")
  listComments(
    @Param("workItemId") workItemId: string,
  ): Promise<ApiResponse<WorkItemComment[]>> {
    return this.databaseService
      .listComments(workItemId)
      .then((data) => this.response(data));
  }

  @Post("work-items/:workItemId/comments")
  createComment(
    @Param("workItemId") workItemId: string,
    @Body() body: CreateCommentBody,
    @Headers("x-member-id") memberId: string,
    @Headers("authorization") authorization: string,
  ): Promise<ApiResponse<WorkItemComment>> {
    const actorId = this.resolveMemberId(authorization, memberId);
    return this.databaseService
      .assertWorkItemCanWrite(workItemId, actorId)
      .then(() =>
        this.databaseService.createComment(
          workItemId,
          body.authorId,
          body.content,
        ),
      )
      .then((data) => this.response(data));
  }

  @Get("search")
  search(
    @Query("workspaceId") workspaceId: string,
    @Query("query") query: string,
  ): Promise<ApiResponse<SearchResult[]>> {
    return this.databaseService
      .search(workspaceId, query)
      .then((data) => this.response(data));
  }

  @Get("notifications")
  listNotifications(
    @Query("memberId") memberId: string,
  ): Promise<ApiResponse<Notification[]>> {
    return this.databaseService
      .listNotifications(memberId)
      .then((data) => this.response(data));
  }

  @Patch("notifications/:notificationId/read")
  markNotificationRead(
    @Param("notificationId") notificationId: string,
    @Headers("x-member-id") memberId: string,
    @Headers("authorization") authorization: string,
  ): Promise<ApiResponse<Notification>> {
    const actorId = this.resolveMemberId(authorization, memberId);
    return this.databaseService
      .assertNotificationOwner(notificationId, actorId)
      .then(() => this.databaseService.markNotificationRead(notificationId))
      .then((data) => this.response(data));
  }

  private response<Data>(data: Data): ApiResponse<Data> {
    return {
      data,
      requestId: `req-${Date.now()}`,
    };
  }

  private resolveMemberId(authorization: string, memberId: string): string {
    if ((authorization || "") !== "") {
      return this.authService.resolveMemberId(authorization);
    }
    if ((memberId || "") !== "") {
      return memberId;
    }
    throw new UnauthorizedException("需要登录");
  }
}
