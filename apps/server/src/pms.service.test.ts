import { describe, expect, it } from "vitest";

import { PmsService } from "./pms.service.js";

describe("PmsService", () => {
  it("lists only projects in the requested workspace", () => {
    const service = new PmsService();

    expect(service.listProjects("workspace-demo")).toHaveLength(1);
    expect(service.listProjects("workspace-other")).toHaveLength(0);
  });

  it("creates a project and assigns its owner", () => {
    const service = new PmsService();

    const project = service.createProject({
      workspaceId: "workspace-demo",
      name: "新项目",
      description: "项目描述",
      ownerId: "member-new",
    });

    expect(project.status).toBe("PLANNING");
    expect(service.listProjectMembers(project.id)).toEqual([
      expect.objectContaining({
        memberId: "member-new",
        role: "OWNER",
      }),
    ]);
  });

  it("creates and updates a work item in an existing project", () => {
    const service = new PmsService();

    const workItem = service.createWorkItem({
      workspaceId: "workspace-demo",
      projectId: "project-pms",
      title: "新增工作项",
      description: "工作项描述",
      type: "TASK",
      priority: "MEDIUM",
      reporterId: "member-demo",
    });
    const updated = service.updateWorkItem(workItem.id, {
      status: "DONE",
      priority: "HIGH",
      assigneeId: "member-demo",
      dueDate: "2026-10-20",
    });

    expect(updated.status).toBe("DONE");
    expect(updated.priority).toBe("HIGH");
    expect(updated.version).toBe(2);
  });

  it("rejects work items for an unknown project", () => {
    const service = new PmsService();

    expect(() =>
      service.createWorkItem({
        workspaceId: "workspace-demo",
        projectId: "project-missing",
        title: "无效工作项",
        description: "不应创建",
        type: "TASK",
        priority: "LOW",
        reporterId: "member-demo",
      }),
    ).toThrow("项目不存在");
  });

  it("supports comments, search, and notification read state", () => {
    const service = new PmsService();

    const comment = service.createComment(
      "workitem-dashboard",
      "member-demo",
      "请在本周完成评审。",
    );

    expect(service.listComments(comment.workItemId)).toHaveLength(1);
    expect(service.search("workspace-demo", "工作台")).toEqual([
      expect.objectContaining({
        entityId: "project-pms",
        entityType: "PROJECT",
      }),
      expect.objectContaining({
        entityId: "workitem-dashboard",
        entityType: "WORK_ITEM",
      }),
    ]);

    const notification = service.markNotificationRead("notification-welcome");
    expect(notification.read).toBe(true);
  });
});
