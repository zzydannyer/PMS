import { Injectable, NotFoundException } from "@nestjs/common";
import type {
  Project,
  ProjectMember,
  WorkItem,
  WorkItemPriority,
  WorkItemStatus,
  WorkItemType,
} from "@pms/domain";

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

export type WorkspaceMember = {
  id: string;
  workspaceId: string;
  displayName: string;
  role: "OWNER" | "ADMIN" | "MEMBER" | "GUEST";
};

export type WorkItemComment = {
  id: string;
  workItemId: string;
  authorId: string;
  content: string;
  createdAt: string;
};

export type Notification = {
  id: string;
  memberId: string;
  title: string;
  content: string;
  read: boolean;
  createdAt: string;
};

export type SearchResult = {
  entityType: "PROJECT" | "WORK_ITEM";
  entityId: string;
  title: string;
  description: string;
};

@Injectable()
export class PmsService {
  private readonly workspaceMembers: WorkspaceMember[] = [
    {
      id: "member-demo",
      workspaceId: "workspace-demo",
      displayName: "演示用户",
      role: "OWNER",
    },
  ];

  private readonly projects: Project[] = [
    {
      id: "project-pms",
      workspaceId: "workspace-demo",
      name: "PMS 产品工作台",
      description: "项目管理与 AI 协作平台",
      ownerId: "member-demo",
      status: "ACTIVE",
      visibility: "WORKSPACE",
      startDate: "2026-10-01",
      targetDate: "2026-12-31",
      createdAt: "2026-10-01T09:00:00.000Z",
      updatedAt: "2026-10-03T06:00:00.000Z",
      version: 1,
    },
  ];

  private readonly projectMembers: ProjectMember[] = [
    {
      projectId: "project-pms",
      memberId: "member-demo",
      role: "OWNER",
      joinedAt: "2026-10-01T09:00:00.000Z",
    },
  ];

  private readonly workItems: WorkItem[] = [
    {
      id: "workitem-dashboard",
      workspaceId: "workspace-demo",
      projectId: "project-pms",
      parentId: "",
      iterationId: "",
      title: "完善 PMS 工作台",
      description: "完成项目管理核心工作流",
      type: "REQUIREMENT",
      status: "IN_PROGRESS",
      priority: "HIGH",
      assigneeId: "member-demo",
      reporterId: "member-demo",
      estimatePoints: 8,
      dueDate: "2026-10-16",
      labelIds: ["label-core"],
      createdAt: "2026-10-01T09:00:00.000Z",
      updatedAt: "2026-10-03T06:00:00.000Z",
      version: 1,
    },
  ];

  private readonly comments: WorkItemComment[] = [];

  private readonly notifications: Notification[] = [
    {
      id: "notification-welcome",
      memberId: "member-demo",
      title: "欢迎使用 PMS",
      content: "你已进入 PMS 产品工作台。",
      read: false,
      createdAt: "2026-10-03T06:00:00.000Z",
    },
  ];

  listWorkspaceMembers(workspaceId: string): WorkspaceMember[] {
    return this.workspaceMembers.filter(
      (member) => member.workspaceId === workspaceId,
    );
  }

  listProjects(workspaceId: string): Project[] {
    return this.projects.filter((project) => project.workspaceId === workspaceId);
  }

  listProjectMembers(projectId: string): ProjectMember[] {
    return this.projectMembers.filter((member) => member.projectId === projectId);
  }

  createProject(input: CreateProjectInput): Project {
    const now = new Date().toISOString();
    const project: Project = {
      id: `project-${this.projects.length + 1}`,
      workspaceId: input.workspaceId,
      name: input.name,
      description: input.description,
      ownerId: input.ownerId,
      status: "PLANNING",
      visibility: "WORKSPACE",
      startDate: now.slice(0, 10),
      targetDate: now.slice(0, 10),
      createdAt: now,
      updatedAt: now,
      version: 1,
    };
    this.projects.push(project);
    this.projectMembers.push({
      projectId: project.id,
      memberId: input.ownerId,
      role: "OWNER",
      joinedAt: now,
    });
    return project;
  }

  listWorkItems(workspaceId: string, projectId: string): WorkItem[] {
    return this.workItems.filter(
      (item) => item.workspaceId === workspaceId && item.projectId === projectId,
    );
  }

  createWorkItem(input: CreateWorkItemInput): WorkItem {
    const projectExists = this.projects.some(
      (project) =>
        project.id === input.projectId && project.workspaceId === input.workspaceId,
    );
    if (!projectExists) {
      throw new NotFoundException("项目不存在");
    }

    const now = new Date().toISOString();
    const workItem: WorkItem = {
      id: `workitem-${this.workItems.length + 1}`,
      workspaceId: input.workspaceId,
      projectId: input.projectId,
      parentId: "",
      iterationId: "",
      title: input.title,
      description: input.description,
      type: input.type,
      status: "BACKLOG",
      priority: input.priority,
      assigneeId: "",
      reporterId: input.reporterId,
      estimatePoints: 0,
      dueDate: now.slice(0, 10),
      labelIds: [],
      createdAt: now,
      updatedAt: now,
      version: 1,
    };
    this.workItems.push(workItem);
    return workItem;
  }

  updateWorkItem(id: string, input: UpdateWorkItemInput): WorkItem {
    const workItem = this.workItems.find((item) => item.id === id);
    if (!workItem) {
      throw new NotFoundException("工作项不存在");
    }

    workItem.status = input.status;
    workItem.priority = input.priority;
    workItem.assigneeId = input.assigneeId;
    workItem.dueDate = input.dueDate;
    workItem.updatedAt = new Date().toISOString();
    workItem.version += 1;
    return workItem;
  }

  listComments(workItemId: string): WorkItemComment[] {
    return this.comments.filter((comment) => comment.workItemId === workItemId);
  }

  createComment(
    workItemId: string,
    authorId: string,
    content: string,
  ): WorkItemComment {
    const workItemExists = this.workItems.some((item) => item.id === workItemId);
    if (!workItemExists) {
      throw new NotFoundException("工作项不存在");
    }

    const comment: WorkItemComment = {
      id: `comment-${this.comments.length + 1}`,
      workItemId,
      authorId,
      content,
      createdAt: new Date().toISOString(),
    };
    this.comments.push(comment);
    return comment;
  }

  search(workspaceId: string, query: string): SearchResult[] {
    const normalizedQuery = query.trim().toLocaleLowerCase();
    if (normalizedQuery.length === 0) {
      return [];
    }

    const projects = this.projects
      .filter(
        (project) =>
          project.workspaceId === workspaceId &&
          `${project.name} ${project.description}`
            .toLocaleLowerCase()
            .includes(normalizedQuery),
      )
      .map((project) => ({
        entityType: "PROJECT" as const,
        entityId: project.id,
        title: project.name,
        description: project.description,
      }));
    const workItems = this.workItems
      .filter(
        (item) =>
          item.workspaceId === workspaceId &&
          `${item.title} ${item.description}`
            .toLocaleLowerCase()
            .includes(normalizedQuery),
      )
      .map((item) => ({
        entityType: "WORK_ITEM" as const,
        entityId: item.id,
        title: item.title,
        description: item.description,
      }));
    return [...projects, ...workItems];
  }

  listNotifications(memberId: string): Notification[] {
    return this.notifications.filter(
      (notification) => notification.memberId === memberId,
    );
  }

  markNotificationRead(notificationId: string): Notification {
    const notification = this.notifications.find(
      (item) => item.id === notificationId,
    );
    if (!notification) {
      throw new NotFoundException("通知不存在");
    }
    notification.read = true;
    return notification;
  }
}
