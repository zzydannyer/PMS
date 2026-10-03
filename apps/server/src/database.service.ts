import {
  ForbiddenException,
  Injectable,
  NotFoundException,
  OnModuleDestroy,
  OnModuleInit,
} from "@nestjs/common";
import { ConfigService } from "@nestjs/config";
import { Pool, type QueryResultRow } from "pg";
import type {
  Project,
  ProjectMember,
  Defect,
  DeliveryMetrics,
  AiUsageSummary,
  IntegrationEvent,
  IntegrationProvider,
  PortfolioSummary,
  TeamCapacity,
  WorkspaceGovernancePolicy,
  Iteration,
  Milestone,
  Release,
  WorkItem,
  WorkItemDependency,
  WorkItemPriority,
  WorkItemStatus,
  WorkItemType,
} from "@pms/domain";

import type {
  Notification,
  SearchResult,
  WorkItemComment,
  WorkspaceMember,
} from "./pms.service";
import { RealtimeService } from "./realtime.service";

type CreateProjectInput = {
  workspaceId: string;
  name: string;
  description: string;
  ownerId: string;
};

type CreateWorkItemInput = {
  workspaceId: string;
  projectId: string;
  title: string;
  description: string;
  type: WorkItemType;
  priority: WorkItemPriority;
  reporterId: string;
};

type UpdateWorkItemInput = {
  status: WorkItemStatus;
  priority: WorkItemPriority;
  assigneeId: string;
  dueDate: string;
};

type CreateIterationInput = {
  projectId: string;
  name: string;
  goal: string;
  startDate: string;
  endDate: string;
};

type CreateMilestoneInput = {
  projectId: string;
  name: string;
  description: string;
  dueDate: string;
};

type CreateReleaseInput = {
  projectId: string;
  name: string;
  version: string;
  releaseDate: string;
};

type CreateDefectInput = {
  workItemId: string;
  severity: Defect["severity"];
  environment: string;
  reproduction: string;
};

export type AutomationRule = {
  id: string;
  workspaceId: string;
  name: string;
  triggerEvent: string;
  actionType: string;
  enabled: boolean;
  createdBy: string;
  createdAt: string;
};

export type AgentRun = {
  id: string;
  workspaceId: string;
  ruleId: string;
  status: "SUCCEEDED" | "FAILED";
  result: string;
  startedAt: string;
  finishedAt: string;
};

export type AiAuditRecord = {
  id: string;
  proposalId: string;
  workspaceId: string;
  requesterId: string;
  action: string;
  status: string;
  changes: string[];
  createdAt: string;
};

type ProjectRow = QueryResultRow & {
  id: string;
  workspace_id: string;
  name: string;
  description: string;
  owner_id: string;
  status: Project["status"];
  visibility: Project["visibility"];
  start_date: string;
  target_date: string;
  created_at: Date;
  updated_at: Date;
  version: number;
};

type WorkItemRow = QueryResultRow & {
  id: string;
  workspace_id: string;
  project_id: string;
  parent_id: string;
  iteration_id: string;
  title: string;
  description: string;
  type: WorkItemType;
  status: WorkItemStatus;
  priority: WorkItemPriority;
  assignee_id: string;
  reporter_id: string;
  estimate_points: number;
  due_date: string;
  label_ids: string[];
  created_at: Date;
  updated_at: Date;
  version: number;
};

@Injectable()
export class DatabaseService implements OnModuleInit, OnModuleDestroy {
  private readonly pool: Pool;

  public constructor(
    configService: ConfigService,
    private readonly realtimeService: RealtimeService,
  ) {
    this.pool = new Pool({
      host: configService.get<string>("POSTGRES_HOST", "localhost"),
      port: configService.get<number>("POSTGRES_PORT", 5432),
      database: configService.get<string>("POSTGRES_DATABASE", "postgres"),
      user: configService.get<string>("POSTGRES_USER", "postgres"),
      password: configService.get<string>("POSTGRES_PASSWORD", "postgres"),
      max: 10,
    });
  }

  async onModuleInit(): Promise<void> {
    await this.pool.query(`
      CREATE TABLE IF NOT EXISTS pms_projects (
        id TEXT PRIMARY KEY,
        workspace_id TEXT NOT NULL,
        name TEXT NOT NULL,
        description TEXT NOT NULL,
        owner_id TEXT NOT NULL,
        status TEXT NOT NULL,
        visibility TEXT NOT NULL,
        start_date TEXT NOT NULL,
        target_date TEXT NOT NULL,
        created_at TIMESTAMPTZ NOT NULL,
        updated_at TIMESTAMPTZ NOT NULL,
        version INTEGER NOT NULL
      );

      CREATE TABLE IF NOT EXISTS pms_work_items (
        id TEXT PRIMARY KEY,
        workspace_id TEXT NOT NULL,
        project_id TEXT NOT NULL REFERENCES pms_projects(id),
        parent_id TEXT NOT NULL,
        iteration_id TEXT NOT NULL,
        title TEXT NOT NULL,
        description TEXT NOT NULL,
        type TEXT NOT NULL,
        status TEXT NOT NULL,
        priority TEXT NOT NULL,
        assignee_id TEXT NOT NULL,
        reporter_id TEXT NOT NULL,
        estimate_points INTEGER NOT NULL,
        due_date TEXT NOT NULL,
        label_ids JSONB NOT NULL,
        created_at TIMESTAMPTZ NOT NULL,
        updated_at TIMESTAMPTZ NOT NULL,
        version INTEGER NOT NULL
      );

      CREATE TABLE IF NOT EXISTS pms_project_members (
        project_id TEXT NOT NULL REFERENCES pms_projects(id),
        member_id TEXT NOT NULL,
        role TEXT NOT NULL,
        joined_at TIMESTAMPTZ NOT NULL,
        PRIMARY KEY (project_id, member_id)
      );

      CREATE TABLE IF NOT EXISTS pms_workspace_members (
        workspace_id TEXT NOT NULL,
        member_id TEXT NOT NULL,
        display_name TEXT NOT NULL,
        role TEXT NOT NULL,
        PRIMARY KEY (workspace_id, member_id)
      );

      CREATE TABLE IF NOT EXISTS pms_work_item_comments (
        id TEXT PRIMARY KEY,
        work_item_id TEXT NOT NULL REFERENCES pms_work_items(id),
        author_id TEXT NOT NULL,
        content TEXT NOT NULL,
        created_at TIMESTAMPTZ NOT NULL
      );

      CREATE TABLE IF NOT EXISTS pms_notifications (
        id TEXT PRIMARY KEY,
        member_id TEXT NOT NULL,
        title TEXT NOT NULL,
        content TEXT NOT NULL,
        is_read BOOLEAN NOT NULL DEFAULT FALSE,
        created_at TIMESTAMPTZ NOT NULL
      );

      CREATE TABLE IF NOT EXISTS pms_iterations (
        id TEXT PRIMARY KEY,
        project_id TEXT NOT NULL REFERENCES pms_projects(id),
        name TEXT NOT NULL,
        goal TEXT NOT NULL,
        status TEXT NOT NULL,
        start_date TEXT NOT NULL,
        end_date TEXT NOT NULL,
        created_at TIMESTAMPTZ NOT NULL
      );

      CREATE TABLE IF NOT EXISTS pms_milestones (
        id TEXT PRIMARY KEY,
        project_id TEXT NOT NULL REFERENCES pms_projects(id),
        name TEXT NOT NULL,
        description TEXT NOT NULL,
        status TEXT NOT NULL,
        due_date TEXT NOT NULL,
        created_at TIMESTAMPTZ NOT NULL
      );

      CREATE TABLE IF NOT EXISTS pms_releases (
        id TEXT PRIMARY KEY,
        project_id TEXT NOT NULL REFERENCES pms_projects(id),
        name TEXT NOT NULL,
        version TEXT NOT NULL,
        status TEXT NOT NULL,
        release_date TEXT NOT NULL,
        created_at TIMESTAMPTZ NOT NULL
      );

      CREATE TABLE IF NOT EXISTS pms_defects (
        id TEXT PRIMARY KEY,
        work_item_id TEXT NOT NULL REFERENCES pms_work_items(id),
        severity TEXT NOT NULL,
        environment TEXT NOT NULL,
        reproduction TEXT NOT NULL,
        resolved_at TEXT NOT NULL
      );

      CREATE TABLE IF NOT EXISTS pms_work_item_dependencies (
        source_id TEXT NOT NULL REFERENCES pms_work_items(id),
        target_id TEXT NOT NULL REFERENCES pms_work_items(id),
        dependency_type TEXT NOT NULL,
        created_at TIMESTAMPTZ NOT NULL,
        PRIMARY KEY (source_id, target_id, dependency_type),
        CHECK (source_id <> target_id)
      );

      CREATE TABLE IF NOT EXISTS pms_integration_events (
        id TEXT PRIMARY KEY,
        provider TEXT NOT NULL,
        event_type TEXT NOT NULL,
        external_id TEXT NOT NULL,
        payload JSONB NOT NULL,
        received_at TIMESTAMPTZ NOT NULL,
        UNIQUE (provider, external_id)
      );

      CREATE TABLE IF NOT EXISTS pms_ai_audits (
        id TEXT PRIMARY KEY,
        proposal_id TEXT NOT NULL,
        workspace_id TEXT NOT NULL,
        requester_id TEXT NOT NULL,
        action TEXT NOT NULL,
        status TEXT NOT NULL,
        changes JSONB NOT NULL,
        created_at TIMESTAMPTZ NOT NULL
      );

      CREATE TABLE IF NOT EXISTS pms_ai_usage (
        id TEXT PRIMARY KEY,
        workspace_id TEXT NOT NULL,
        requester_id TEXT NOT NULL,
        model TEXT NOT NULL,
        prompt_tokens INTEGER NOT NULL,
        completion_tokens INTEGER NOT NULL,
        created_at TIMESTAMPTZ NOT NULL
      );

      CREATE TABLE IF NOT EXISTS pms_automation_rules (
        id TEXT PRIMARY KEY,
        workspace_id TEXT NOT NULL,
        name TEXT NOT NULL,
        trigger_event TEXT NOT NULL,
        action_type TEXT NOT NULL,
        enabled BOOLEAN NOT NULL DEFAULT TRUE,
        created_by TEXT NOT NULL,
        created_at TIMESTAMPTZ NOT NULL
      );

      CREATE TABLE IF NOT EXISTS pms_agent_runs (
        id TEXT PRIMARY KEY,
        workspace_id TEXT NOT NULL,
        rule_id TEXT NOT NULL,
        status TEXT NOT NULL,
        result TEXT NOT NULL,
        started_at TIMESTAMPTZ NOT NULL,
        finished_at TIMESTAMPTZ NOT NULL
      );

      CREATE TABLE IF NOT EXISTS pms_workspace_governance (
        workspace_id TEXT PRIMARY KEY,
        retention_days INTEGER NOT NULL DEFAULT 365,
        backup_enabled BOOLEAN NOT NULL DEFAULT FALSE,
        sso_enabled BOOLEAN NOT NULL DEFAULT FALSE,
        updated_at TIMESTAMPTZ NOT NULL
      );

      CREATE INDEX IF NOT EXISTS pms_work_items_workspace_project_idx
        ON pms_work_items(workspace_id, project_id);

      CREATE INDEX IF NOT EXISTS pms_comments_work_item_idx
        ON pms_work_item_comments(work_item_id, created_at);

      CREATE INDEX IF NOT EXISTS pms_notifications_member_idx
        ON pms_notifications(member_id, is_read, created_at);
    `);
    await this.pool.query(`
      INSERT INTO pms_projects (
        id, workspace_id, name, description, owner_id, status, visibility,
        start_date, target_date, created_at, updated_at, version
      ) VALUES (
        'project-pms', 'workspace-demo', 'PMS 产品工作台',
        '项目管理与 AI 协作平台', 'member-demo', 'ACTIVE', 'WORKSPACE',
        '2026-10-01', '2026-12-31', '2026-10-01T09:00:00.000Z',
        '2026-10-03T06:00:00.000Z', 1
      ) ON CONFLICT (id) DO NOTHING;

      INSERT INTO pms_workspace_members (
        workspace_id, member_id, display_name, role
      ) VALUES (
        'workspace-demo', 'member-demo', '演示用户', 'OWNER'
      ) ON CONFLICT (workspace_id, member_id) DO NOTHING;

      INSERT INTO pms_project_members (
        project_id, member_id, role, joined_at
      ) VALUES (
        'project-pms', 'member-demo', 'OWNER', '2026-10-01T09:00:00.000Z'
      ) ON CONFLICT (project_id, member_id) DO NOTHING;

      INSERT INTO pms_work_items (
        id, workspace_id, project_id, parent_id, iteration_id, title,
        description, type, status, priority, assignee_id, reporter_id,
        estimate_points, due_date, label_ids, created_at, updated_at, version
      ) VALUES (
        'workitem-dashboard', 'workspace-demo', 'project-pms', '', '',
        '完善 PMS 工作台', '完成项目管理核心工作流', 'REQUIREMENT',
        'IN_PROGRESS', 'HIGH', 'member-demo', 'member-demo', 8,
        '2026-10-16', '["label-core"]', '2026-10-01T09:00:00.000Z',
        '2026-10-03T06:00:00.000Z', 1
      ) ON CONFLICT (id) DO NOTHING;

      INSERT INTO pms_notifications (
        id, member_id, title, content, is_read, created_at
      ) VALUES (
        'notification-welcome', 'member-demo', '欢迎使用 PMS',
        '你已进入 PMS 产品工作台。', FALSE, '2026-10-03T06:00:00.000Z'
      ) ON CONFLICT (id) DO NOTHING;
    `);
  }

  async listProjects(workspaceId: string): Promise<Project[]> {
    const result = await this.pool.query<ProjectRow>(
      "SELECT * FROM pms_projects WHERE workspace_id = $1 ORDER BY created_at",
      [workspaceId],
    );
    return result.rows.map((row) => this.toProject(row));
  }

  async assertMemberCanWrite(
    workspaceId: string,
    memberId: string,
  ): Promise<void> {
    const result = await this.pool.query<{ role: WorkspaceMember["role"] }>(
      `SELECT role FROM pms_workspace_members
       WHERE workspace_id = $1 AND member_id = $2`,
      [workspaceId, memberId],
    );
    const member = result.rows[0];
    if (!member) {
      throw new ForbiddenException("成员无权修改此工作区");
    }
    if (member.role === "GUEST") {
      throw new ForbiddenException("访客无权执行写操作");
    }
  }

  async assertMemberCanRead(
    workspaceId: string,
    memberId: string,
  ): Promise<void> {
    const result = await this.pool.query<{ role: WorkspaceMember["role"] }>(
      `SELECT role FROM pms_workspace_members
       WHERE workspace_id = $1 AND member_id = $2`,
      [workspaceId, memberId],
    );
    if (!result.rows[0]) {
      throw new ForbiddenException("成员无权访问此工作区");
    }
  }

  async assertWorkItemCanWrite(
    workItemId: string,
    memberId: string,
  ): Promise<void> {
    const result = await this.pool.query<{ workspace_id: string }>(
      "SELECT workspace_id FROM pms_work_items WHERE id = $1",
      [workItemId],
    );
    const workItem = result.rows[0];
    if (!workItem) {
      throw new NotFoundException("工作项不存在");
    }
    await this.assertMemberCanWrite(workItem.workspace_id, memberId);
  }

  async assertNotificationOwner(
    notificationId: string,
    memberId: string,
  ): Promise<void> {
    const result = await this.pool.query<{ member_id: string }>(
      "SELECT member_id FROM pms_notifications WHERE id = $1",
      [notificationId],
    );
    const notification = result.rows[0];
    if (!notification) {
      throw new NotFoundException("通知不存在");
    }
    if (notification.member_id !== memberId) {
      throw new ForbiddenException("无权修改此通知");
    }
  }

  async listProjectMembers(projectId: string): Promise<ProjectMember[]> {
    const result = await this.pool.query<{
      project_id: string;
      member_id: string;
      role: ProjectMember["role"];
      joined_at: Date;
    }>(
      "SELECT * FROM pms_project_members WHERE project_id = $1 ORDER BY joined_at",
      [projectId],
    );
    return result.rows.map((row) => ({
      projectId: row.project_id,
      memberId: row.member_id,
      role: row.role,
      joinedAt: row.joined_at.toISOString(),
    }));
  }

  async createProject(input: CreateProjectInput): Promise<Project> {
    const now = new Date().toISOString();
    const id = `project-${Date.now()}`;
    const result = await this.pool.query<ProjectRow>(
      `INSERT INTO pms_projects (
        id, workspace_id, name, description, owner_id, status, visibility,
        start_date, target_date, created_at, updated_at, version
      ) VALUES ($1, $2, $3, $4, $5, 'PLANNING', 'WORKSPACE', $6, $6, $7, $7, 1)
      RETURNING *`,
      [id, input.workspaceId, input.name, input.description, input.ownerId, now.slice(0, 10), now],
    );
    await this.pool.query(
      `INSERT INTO pms_project_members (project_id, member_id, role, joined_at)
       VALUES ($1, $2, 'OWNER', $3)`,
      [id, input.ownerId, now],
    );
    this.realtimeService.publish("PROJECT_CHANGED", id);
    return this.toProject(result.rows[0]);
  }

  async listWorkItems(
    workspaceId: string,
    projectId: string,
  ): Promise<WorkItem[]> {
    const result = await this.pool.query<WorkItemRow>(
      `SELECT * FROM pms_work_items
       WHERE workspace_id = $1 AND project_id = $2 ORDER BY created_at`,
      [workspaceId, projectId],
    );
    return result.rows.map((row) => this.toWorkItem(row));
  }

  async listDelivery(projectId: string): Promise<{
    iterations: Iteration[];
    milestones: Milestone[];
    releases: Release[];
    defects: Defect[];
  }> {
    const iterations = await this.pool.query<{
      id: string;
      project_id: string;
      name: string;
      goal: string;
      status: Iteration["status"];
      start_date: string;
      end_date: string;
      created_at: Date;
    }>(
      "SELECT * FROM pms_iterations WHERE project_id = $1 ORDER BY start_date",
      [projectId],
    );
    const milestones = await this.pool.query<{
      id: string;
      project_id: string;
      name: string;
      description: string;
      status: Milestone["status"];
      due_date: string;
      created_at: Date;
    }>(
      "SELECT * FROM pms_milestones WHERE project_id = $1 ORDER BY due_date",
      [projectId],
    );
    const releases = await this.pool.query<{
      id: string;
      project_id: string;
      name: string;
      version: string;
      status: Release["status"];
      release_date: string;
      created_at: Date;
    }>(
      "SELECT * FROM pms_releases WHERE project_id = $1 ORDER BY release_date",
      [projectId],
    );
    const defects = await this.pool.query<{
      id: string;
      work_item_id: string;
      severity: Defect["severity"];
      environment: string;
      reproduction: string;
      resolved_at: string;
    }>(
      `SELECT d.* FROM pms_defects d
       INNER JOIN pms_work_items w ON w.id = d.work_item_id
       WHERE w.project_id = $1 ORDER BY d.resolved_at`,
      [projectId],
    );
    return {
      iterations: iterations.rows.map((row) => ({
        id: row.id,
        projectId: row.project_id,
        name: row.name,
        goal: row.goal,
        status: row.status,
        startDate: row.start_date,
        endDate: row.end_date,
        createdAt: row.created_at.toISOString(),
      })),
      milestones: milestones.rows.map((row) => ({
        id: row.id,
        projectId: row.project_id,
        name: row.name,
        description: row.description,
        status: row.status,
        dueDate: row.due_date,
        createdAt: row.created_at.toISOString(),
      })),
      releases: releases.rows.map((row) => ({
        id: row.id,
        projectId: row.project_id,
        name: row.name,
        version: row.version,
        status: row.status,
        releaseDate: row.release_date,
        createdAt: row.created_at.toISOString(),
      })),
      defects: defects.rows.map((row) => ({
        id: row.id,
        workItemId: row.work_item_id,
        severity: row.severity,
        environment: row.environment,
        reproduction: row.reproduction,
        resolvedAt: row.resolved_at,
      })),
    };
  }

  async getDeliveryMetrics(projectId: string): Promise<DeliveryMetrics> {
    const workItems = await this.pool.query<{ total: string; completed: string }>(
      `SELECT COUNT(*)::text AS total,
              COUNT(*) FILTER (WHERE status = 'DONE')::text AS completed
       FROM pms_work_items WHERE project_id = $1`,
      [projectId],
    );
    const defects = await this.pool.query<{ open: string }>(
      `SELECT COUNT(*)::text AS open FROM pms_defects d
       INNER JOIN pms_work_items w ON w.id = d.work_item_id
       WHERE w.project_id = $1 AND d.resolved_at = ''`,
      [projectId],
    );
    const iterations = await this.pool.query<{ active: string }>(
      `SELECT COUNT(*)::text AS active FROM pms_iterations
       WHERE project_id = $1 AND status = 'ACTIVE'`,
      [projectId],
    );
    const releases = await this.pool.query<{ released: string }>(
      `SELECT COUNT(*)::text AS released FROM pms_releases
       WHERE project_id = $1 AND status = 'RELEASED'`,
      [projectId],
    );
    const totalWorkItems = parseInt(workItems.rows[0].total, 10);
    const completedWorkItems = parseInt(workItems.rows[0].completed, 10);
    return {
      totalWorkItems,
      completedWorkItems,
      openDefects: parseInt(defects.rows[0].open, 10),
      activeIterations: parseInt(iterations.rows[0].active, 10),
      releasedVersions: parseInt(releases.rows[0].released, 10),
      completionRate:
        totalWorkItems === 0
          ? 0
          : Math.round((completedWorkItems / totalWorkItems) * 100),
    };
  }

  async createIteration(input: CreateIterationInput): Promise<Iteration> {
    const now = new Date().toISOString();
    const iteration: Iteration = {
      id: `iteration-${Date.now()}`,
      projectId: input.projectId,
      name: input.name,
      goal: input.goal,
      status: "PLANNED",
      startDate: input.startDate,
      endDate: input.endDate,
      createdAt: now,
    };
    await this.pool.query(
      `INSERT INTO pms_iterations
       (id, project_id, name, goal, status, start_date, end_date, created_at)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8)`,
      [
        iteration.id,
        iteration.projectId,
        iteration.name,
        iteration.goal,
        iteration.status,
        iteration.startDate,
        iteration.endDate,
        iteration.createdAt,
      ],
    );
    this.realtimeService.publish("PROJECT_CHANGED", input.projectId);
    return iteration;
  }

  async createMilestone(input: CreateMilestoneInput): Promise<Milestone> {
    const now = new Date().toISOString();
    const milestone: Milestone = {
      id: `milestone-${Date.now()}`,
      projectId: input.projectId,
      name: input.name,
      description: input.description,
      status: "PLANNED",
      dueDate: input.dueDate,
      createdAt: now,
    };
    await this.pool.query(
      `INSERT INTO pms_milestones
       (id, project_id, name, description, status, due_date, created_at)
       VALUES ($1, $2, $3, $4, $5, $6, $7)`,
      [
        milestone.id,
        milestone.projectId,
        milestone.name,
        milestone.description,
        milestone.status,
        milestone.dueDate,
        milestone.createdAt,
      ],
    );
    this.realtimeService.publish("PROJECT_CHANGED", input.projectId);
    return milestone;
  }

  async createRelease(input: CreateReleaseInput): Promise<Release> {
    const now = new Date().toISOString();
    const release: Release = {
      id: `release-${Date.now()}`,
      projectId: input.projectId,
      name: input.name,
      version: input.version,
      status: "PLANNED",
      releaseDate: input.releaseDate,
      createdAt: now,
    };
    await this.pool.query(
      `INSERT INTO pms_releases
       (id, project_id, name, version, status, release_date, created_at)
       VALUES ($1, $2, $3, $4, $5, $6, $7)`,
      [
        release.id,
        release.projectId,
        release.name,
        release.version,
        release.status,
        release.releaseDate,
        release.createdAt,
      ],
    );
    this.realtimeService.publish("PROJECT_CHANGED", input.projectId);
    return release;
  }

  async createDefect(input: CreateDefectInput): Promise<Defect> {
    const workItem = await this.pool.query<{ project_id: string }>(
      "SELECT project_id FROM pms_work_items WHERE id = $1",
      [input.workItemId],
    );
    if (!workItem.rows[0]) {
      throw new NotFoundException("工作项不存在");
    }
    const defect: Defect = {
      id: `defect-${Date.now()}`,
      workItemId: input.workItemId,
      severity: input.severity,
      environment: input.environment,
      reproduction: input.reproduction,
      resolvedAt: "",
    };
    await this.pool.query(
      `INSERT INTO pms_defects
       (id, work_item_id, severity, environment, reproduction, resolved_at)
       VALUES ($1, $2, $3, $4, $5, $6)`,
      [
        defect.id,
        defect.workItemId,
        defect.severity,
        defect.environment,
        defect.reproduction,
        defect.resolvedAt,
      ],
    );
    this.realtimeService.publish("WORK_ITEM_CHANGED", input.workItemId);
    return defect;
  }

  async recordIntegrationEvent(
    provider: IntegrationProvider,
    eventType: string,
    externalId: string,
    payload: Record<string, string>,
  ): Promise<IntegrationEvent> {
    const event: IntegrationEvent = {
      id: `integration-event-${Date.now()}`,
      provider,
      eventType,
      externalId,
      payload,
      receivedAt: new Date().toISOString(),
    };
    await this.pool.query(
      `INSERT INTO pms_integration_events
       (id, provider, event_type, external_id, payload, received_at)
       VALUES ($1, $2, $3, $4, $5, $6)
       ON CONFLICT (provider, external_id) DO NOTHING`,
      [
        event.id,
        event.provider,
        event.eventType,
        event.externalId,
        JSON.stringify(event.payload),
        event.receivedAt,
      ],
    );
    this.realtimeService.publish("PROJECT_CHANGED", event.id);
    return event;
  }

  async recordProposalAudit(
    proposalId: string,
    workspaceId: string,
    requesterId: string,
    action: "CREATED" | "CONFIRMED" | "EXECUTED" | "REVOKED",
    status: string,
    changes: string[],
  ): Promise<void> {
    await this.pool.query(
      `INSERT INTO pms_ai_audits
       (id, proposal_id, workspace_id, requester_id, action, status, changes, created_at)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8)`,
      [
        `audit-${Date.now()}-${action.toLowerCase()}`,
        proposalId,
        workspaceId,
        requesterId,
        action,
        status,
        JSON.stringify(changes),
        new Date().toISOString(),
      ],
    );
  }

  async recordAiUsage(
    workspaceId: string,
    requesterId: string,
    model: string,
    promptTokens: number,
    completionTokens: number,
  ): Promise<void> {
    await this.pool.query(
      `INSERT INTO pms_ai_usage
       (id, workspace_id, requester_id, model, prompt_tokens, completion_tokens, created_at)
       VALUES ($1, $2, $3, $4, $5, $6, $7)`,
      [
        `usage-${Date.now()}`,
        workspaceId,
        requesterId,
        model,
        promptTokens,
        completionTokens,
        new Date().toISOString(),
      ],
    );
  }

  async getAiUsageSummary(
    workspaceId: string,
    requesterId: string,
  ): Promise<AiUsageSummary> {
    const result = await this.pool.query<{
      request_count: string;
      prompt_tokens: string;
      completion_tokens: string;
    }>(
      `SELECT COUNT(*)::text AS request_count,
              COALESCE(SUM(prompt_tokens), 0)::text AS prompt_tokens,
              COALESCE(SUM(completion_tokens), 0)::text AS completion_tokens
       FROM pms_ai_usage
       WHERE workspace_id = $1 AND requester_id = $2`,
      [workspaceId, requesterId],
    );
    const row = result.rows[0];
    const promptTokens = parseInt(row.prompt_tokens, 10);
    const completionTokens = parseInt(row.completion_tokens, 10);
    return {
      requestCount: parseInt(row.request_count, 10),
      promptTokens,
      completionTokens,
      totalTokens: promptTokens + completionTokens,
    };
  }

  async listAutomationRules(workspaceId: string): Promise<AutomationRule[]> {
    const result = await this.pool.query<{
      id: string;
      workspace_id: string;
      name: string;
      trigger_event: string;
      action_type: string;
      enabled: boolean;
      created_by: string;
      created_at: Date;
    }>(
      "SELECT * FROM pms_automation_rules WHERE workspace_id = $1 ORDER BY created_at",
      [workspaceId],
    );
    return result.rows.map((row) => ({
      id: row.id,
      workspaceId: row.workspace_id,
      name: row.name,
      triggerEvent: row.trigger_event,
      actionType: row.action_type,
      enabled: row.enabled,
      createdBy: row.created_by,
      createdAt: row.created_at.toISOString(),
    }));
  }

  async createAutomationRule(
    workspaceId: string,
    createdBy: string,
    name: string,
    triggerEvent: string,
    actionType: string,
  ): Promise<AutomationRule> {
    const rule: AutomationRule = {
      id: `rule-${Date.now()}`,
      workspaceId,
      name,
      triggerEvent,
      actionType,
      enabled: true,
      createdBy,
      createdAt: new Date().toISOString(),
    };
    await this.pool.query(
      `INSERT INTO pms_automation_rules
       (id, workspace_id, name, trigger_event, action_type, enabled, created_by, created_at)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8)`,
      [
        rule.id,
        rule.workspaceId,
        rule.name,
        rule.triggerEvent,
        rule.actionType,
        rule.enabled,
        rule.createdBy,
        rule.createdAt,
      ],
    );
    return rule;
  }

  async runAutomationRule(
    workspaceId: string,
    ruleId: string,
  ): Promise<AgentRun> {
    const rule = await this.pool.query<{ id: string; enabled: boolean }>(
      `SELECT id, enabled FROM pms_automation_rules
       WHERE id = $1 AND workspace_id = $2`,
      [ruleId, workspaceId],
    );
    const storedRule = rule.rows[0];
    if (!storedRule || !storedRule.enabled) {
      throw new NotFoundException("规则不存在或已停用");
    }
    const startedAt = new Date().toISOString();
    const run: AgentRun = {
      id: `run-${Date.now()}`,
      workspaceId,
      ruleId,
      status: "SUCCEEDED",
      result: "规则已执行，等待后续动作扩展。",
      startedAt,
      finishedAt: new Date().toISOString(),
    };
    await this.pool.query(
      `INSERT INTO pms_agent_runs
       (id, workspace_id, rule_id, status, result, started_at, finished_at)
       VALUES ($1, $2, $3, $4, $5, $6, $7)`,
      [
        run.id,
        run.workspaceId,
        run.ruleId,
        run.status,
        run.result,
        run.startedAt,
        run.finishedAt,
      ],
    );
    return run;
  }

  async listAgentRuns(workspaceId: string): Promise<AgentRun[]> {
    const result = await this.pool.query<{
      id: string;
      workspace_id: string;
      rule_id: string;
      status: AgentRun["status"];
      result: string;
      started_at: Date;
      finished_at: Date;
    }>(
      "SELECT * FROM pms_agent_runs WHERE workspace_id = $1 ORDER BY started_at DESC",
      [workspaceId],
    );
    return result.rows.map((row) => ({
      id: row.id,
      workspaceId: row.workspace_id,
      ruleId: row.rule_id,
      status: row.status,
      result: row.result,
      startedAt: row.started_at.toISOString(),
      finishedAt: row.finished_at.toISOString(),
    }));
  }

  async getPortfolioSummary(workspaceId: string): Promise<PortfolioSummary> {
    const result = await this.pool.query<{
      project_count: string;
      active_project_count: string;
      work_item_count: string;
      completed_work_item_count: string;
      open_defect_count: string;
    }>(
      `SELECT
         (SELECT COUNT(*) FROM pms_projects WHERE workspace_id = $1)::text AS project_count,
         (SELECT COUNT(*) FROM pms_projects
          WHERE workspace_id = $1 AND status = 'ACTIVE')::text AS active_project_count,
         (SELECT COUNT(*) FROM pms_work_items WHERE workspace_id = $1)::text AS work_item_count,
         (SELECT COUNT(*) FROM pms_work_items
          WHERE workspace_id = $1 AND status = 'DONE')::text AS completed_work_item_count,
         (SELECT COUNT(*) FROM pms_defects d
          INNER JOIN pms_work_items w ON w.id = d.work_item_id
          WHERE w.workspace_id = $1 AND d.resolved_at = '')::text AS open_defect_count`,
      [workspaceId],
    );
    const row = result.rows[0];
    const workItemCount = parseInt(row.work_item_count, 10);
    const completedWorkItemCount = parseInt(
      row.completed_work_item_count,
      10,
    );
    return {
      projectCount: parseInt(row.project_count, 10),
      activeProjectCount: parseInt(row.active_project_count, 10),
      workItemCount,
      completedWorkItemCount,
      openDefectCount: parseInt(row.open_defect_count, 10),
      deliveryRate:
        workItemCount === 0
          ? 0
          : Math.round((completedWorkItemCount / workItemCount) * 100),
    };
  }

  async getTeamCapacity(workspaceId: string): Promise<TeamCapacity[]> {
    const result = await this.pool.query<{
      assignee_id: string;
      assigned_count: string;
      completed_count: string;
    }>(
      `SELECT assignee_id,
              COUNT(*)::text AS assigned_count,
              COUNT(*) FILTER (WHERE status = 'DONE')::text AS completed_count
       FROM pms_work_items
       WHERE workspace_id = $1 AND assignee_id <> ''
       GROUP BY assignee_id
       ORDER BY assigned_count DESC`,
      [workspaceId],
    );
    return result.rows.map((row) => {
      const assignedWorkItems = parseInt(row.assigned_count, 10);
      const completedWorkItems = parseInt(row.completed_count, 10);
      return {
        memberId: row.assignee_id,
        assignedWorkItems,
        completedWorkItems,
        loadRate: Math.min(100, assignedWorkItems * 10),
      };
    });
  }

  async listAiAudits(workspaceId: string): Promise<AiAuditRecord[]> {
    const result = await this.pool.query<{
      id: string;
      proposal_id: string;
      workspace_id: string;
      requester_id: string;
      action: string;
      status: string;
      changes: string[];
      created_at: Date;
    }>(
      `SELECT * FROM pms_ai_audits
       WHERE workspace_id = $1 ORDER BY created_at DESC`,
      [workspaceId],
    );
    return result.rows.map((row) => ({
      id: row.id,
      proposalId: row.proposal_id,
      workspaceId: row.workspace_id,
      requesterId: row.requester_id,
      action: row.action,
      status: row.status,
      changes: row.changes,
      createdAt: row.created_at.toISOString(),
    }));
  }

  async getGovernancePolicy(
    workspaceId: string,
  ): Promise<WorkspaceGovernancePolicy> {
    await this.pool.query(
      `INSERT INTO pms_workspace_governance (workspace_id, updated_at)
       VALUES ($1, $2)
       ON CONFLICT (workspace_id) DO NOTHING`,
      [workspaceId, new Date().toISOString()],
    );
    const result = await this.pool.query<{
      workspace_id: string;
      retention_days: number;
      backup_enabled: boolean;
      sso_enabled: boolean;
      updated_at: Date;
    }>(
      "SELECT * FROM pms_workspace_governance WHERE workspace_id = $1",
      [workspaceId],
    );
    const row = result.rows[0];
    return {
      workspaceId: row.workspace_id,
      retentionDays: row.retention_days,
      backupEnabled: row.backup_enabled,
      ssoEnabled: row.sso_enabled,
      updatedAt: row.updated_at.toISOString(),
    };
  }

  async updateGovernancePolicy(
    workspaceId: string,
    retentionDays: number,
    backupEnabled: boolean,
    ssoEnabled: boolean,
  ): Promise<WorkspaceGovernancePolicy> {
    const result = await this.pool.query<{
      workspace_id: string;
      retention_days: number;
      backup_enabled: boolean;
      sso_enabled: boolean;
      updated_at: Date;
    }>(
      `INSERT INTO pms_workspace_governance
       (workspace_id, retention_days, backup_enabled, sso_enabled, updated_at)
       VALUES ($1, $2, $3, $4, $5)
       ON CONFLICT (workspace_id) DO UPDATE SET
         retention_days = EXCLUDED.retention_days,
         backup_enabled = EXCLUDED.backup_enabled,
         sso_enabled = EXCLUDED.sso_enabled,
         updated_at = EXCLUDED.updated_at
       RETURNING *`,
      [
        workspaceId,
        retentionDays,
        backupEnabled,
        ssoEnabled,
        new Date().toISOString(),
      ],
    );
    const row = result.rows[0];
    return {
      workspaceId: row.workspace_id,
      retentionDays: row.retention_days,
      backupEnabled: row.backup_enabled,
      ssoEnabled: row.sso_enabled,
      updatedAt: row.updated_at.toISOString(),
    };
  }

  async applyRetentionPolicies(): Promise<void> {
    await this.pool.query(`
      DELETE FROM pms_ai_audits audit
      USING pms_workspace_governance policy
      WHERE audit.workspace_id = policy.workspace_id
        AND audit.created_at < CURRENT_TIMESTAMP -
          make_interval(days => policy.retention_days);

      DELETE FROM pms_ai_usage usage
      USING pms_workspace_governance policy
      WHERE usage.workspace_id = policy.workspace_id
        AND usage.created_at < CURRENT_TIMESTAMP -
          make_interval(days => policy.retention_days);
    `);
  }

  async listDependencies(workItemId: string): Promise<WorkItemDependency[]> {
    const result = await this.pool.query<{
      source_id: string;
      target_id: string;
      dependency_type: WorkItemDependency["type"];
      created_at: Date;
    }>(
      `SELECT * FROM pms_work_item_dependencies
       WHERE source_id = $1 OR target_id = $1 ORDER BY created_at`,
      [workItemId],
    );
    return result.rows.map((row) => ({
      sourceId: row.source_id,
      targetId: row.target_id,
      type: row.dependency_type,
      createdAt: row.created_at.toISOString(),
    }));
  }

  async createDependency(
    sourceId: string,
    targetId: string,
    type: WorkItemDependency["type"],
  ): Promise<WorkItemDependency> {
    if (sourceId === targetId) {
      throw new ForbiddenException("工作项不能依赖自身");
    }
    const dependency: WorkItemDependency = {
      sourceId,
      targetId,
      type,
      createdAt: new Date().toISOString(),
    };
    await this.pool.query(
      `INSERT INTO pms_work_item_dependencies
       (source_id, target_id, dependency_type, created_at)
       VALUES ($1, $2, $3, $4)`,
      [sourceId, targetId, type, dependency.createdAt],
    );
    this.realtimeService.publish("WORK_ITEM_CHANGED", sourceId);
    return dependency;
  }

  async createWorkItem(input: CreateWorkItemInput): Promise<WorkItem> {
    const now = new Date().toISOString();
    const id = `workitem-${Date.now()}`;
    const result = await this.pool.query<WorkItemRow>(
      `INSERT INTO pms_work_items (
        id, workspace_id, project_id, parent_id, iteration_id, title,
        description, type, status, priority, assignee_id, reporter_id,
        estimate_points, due_date, label_ids, created_at, updated_at, version
      ) VALUES ($1, $2, $3, '', '', $4, $5, $6, 'BACKLOG', $7, '', $8, 0, $9, '[]', $10, $10, 1)
      RETURNING *`,
      [
        id,
        input.workspaceId,
        input.projectId,
        input.title,
        input.description,
        input.type,
        input.priority,
        input.reporterId,
        now.slice(0, 10),
        now,
      ],
    );
    this.realtimeService.publish("WORK_ITEM_CHANGED", id);
    return this.toWorkItem(result.rows[0]);
  }

  async updateWorkItem(
    id: string,
    input: UpdateWorkItemInput,
  ): Promise<WorkItem> {
    const result = await this.pool.query<WorkItemRow>(
      `UPDATE pms_work_items
       SET status = $2, priority = $3, assignee_id = $4,
           due_date = $5, updated_at = $6, version = version + 1
       WHERE id = $1
       RETURNING *`,
      [id, input.status, input.priority, input.assigneeId, input.dueDate, new Date().toISOString()],
    );
    this.realtimeService.publish("WORK_ITEM_CHANGED", id);
    return this.toWorkItem(result.rows[0]);
  }

  async listWorkspaceMembers(workspaceId: string): Promise<WorkspaceMember[]> {
    if (workspaceId !== "workspace-demo") {
      return [];
    }
    return [{
      id: "member-demo",
      workspaceId,
      displayName: "演示用户",
      role: "OWNER",
    }];
  }

  async listComments(workItemId: string): Promise<WorkItemComment[]> {
    const result = await this.pool.query<{
      id: string;
      work_item_id: string;
      author_id: string;
      content: string;
      created_at: Date;
    }>(
      "SELECT * FROM pms_work_item_comments WHERE work_item_id = $1 ORDER BY created_at",
      [workItemId],
    );
    return result.rows.map((row) => ({
      id: row.id,
      workItemId: row.work_item_id,
      authorId: row.author_id,
      content: row.content,
      createdAt: row.created_at.toISOString(),
    }));
  }

  async createComment(
    workItemId: string,
    authorId: string,
    content: string,
  ): Promise<WorkItemComment> {
    const comment = {
      id: `comment-${Date.now()}`,
      workItemId,
      authorId,
      content,
      createdAt: new Date().toISOString(),
    };
    await this.pool.query(
      `INSERT INTO pms_work_item_comments
       (id, work_item_id, author_id, content, created_at)
       VALUES ($1, $2, $3, $4, $5)`,
      [comment.id, comment.workItemId, comment.authorId, comment.content, comment.createdAt],
    );
    this.realtimeService.publish("COMMENT_ADDED", comment.id);
    return comment;
  }

  async search(workspaceId: string, query: string): Promise<SearchResult[]> {
    const normalizedQuery = `%${query.trim()}%`;
    if (normalizedQuery === "%%") {
      return [];
    }
    const projects = await this.pool.query<{
      id: string;
      name: string;
      description: string;
    }>(
      `SELECT id, name, description FROM pms_projects
       WHERE workspace_id = $1 AND (name ILIKE $2 OR description ILIKE $2)`,
      [workspaceId, normalizedQuery],
    );
    const workItems = await this.pool.query<{
      id: string;
      title: string;
      description: string;
    }>(
      `SELECT id, title, description FROM pms_work_items
       WHERE workspace_id = $1 AND (title ILIKE $2 OR description ILIKE $2)`,
      [workspaceId, normalizedQuery],
    );
    return [
      ...projects.rows.map((row) => ({
        entityType: "PROJECT" as const,
        entityId: row.id,
        title: row.name,
        description: row.description,
      })),
      ...workItems.rows.map((row) => ({
        entityType: "WORK_ITEM" as const,
        entityId: row.id,
        title: row.title,
        description: row.description,
      })),
    ];
  }

  async listNotifications(memberId: string): Promise<Notification[]> {
    const result = await this.pool.query<{
      id: string;
      member_id: string;
      title: string;
      content: string;
      is_read: boolean;
      created_at: Date;
    }>(
      "SELECT * FROM pms_notifications WHERE member_id = $1 ORDER BY created_at DESC",
      [memberId],
    );
    return result.rows.map((row) => ({
      id: row.id,
      memberId: row.member_id,
      title: row.title,
      content: row.content,
      read: row.is_read,
      createdAt: row.created_at.toISOString(),
    }));
  }

  async markNotificationRead(notificationId: string): Promise<Notification> {
    const result = await this.pool.query<{
      id: string;
      member_id: string;
      title: string;
      content: string;
      is_read: boolean;
      created_at: Date;
    }>(
      `UPDATE pms_notifications SET is_read = TRUE
       WHERE id = $1 RETURNING *`,
      [notificationId],
    );
    this.realtimeService.publish("NOTIFICATION_CHANGED", notificationId);
    const row = result.rows[0];
    return {
      id: row.id,
      memberId: row.member_id,
      title: row.title,
      content: row.content,
      read: row.is_read,
      createdAt: row.created_at.toISOString(),
    };
  }

  private toProject(row: ProjectRow): Project {
    return {
      id: row.id,
      workspaceId: row.workspace_id,
      name: row.name,
      description: row.description,
      ownerId: row.owner_id,
      status: row.status,
      visibility: row.visibility,
      startDate: row.start_date,
      targetDate: row.target_date,
      createdAt: row.created_at.toISOString(),
      updatedAt: row.updated_at.toISOString(),
      version: row.version,
    };
  }

  private toWorkItem(row: WorkItemRow): WorkItem {
    return {
      id: row.id,
      workspaceId: row.workspace_id,
      projectId: row.project_id,
      parentId: row.parent_id,
      iterationId: row.iteration_id,
      title: row.title,
      description: row.description,
      type: row.type,
      status: row.status,
      priority: row.priority,
      assigneeId: row.assignee_id,
      reporterId: row.reporter_id,
      estimatePoints: row.estimate_points,
      dueDate: row.due_date,
      labelIds: row.label_ids,
      createdAt: row.created_at.toISOString(),
      updatedAt: row.updated_at.toISOString(),
      version: row.version,
    };
  }

  async onModuleDestroy(): Promise<void> {
    await this.pool.end();
  }
}
