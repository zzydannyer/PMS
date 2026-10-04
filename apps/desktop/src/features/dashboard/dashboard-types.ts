import type { LucideIcon } from "lucide-react";

export type NavKey =
  | "home"
  | "my-work"
  | "projects"
  | "inbox"
  | "settings";

export type ProjectViewKey =
  | "overview"
  | "tasks"
  | "board"
  | "iterations"
  | "milestones"
  | "risks"
  | "discussion";

export type WorkStatus =
  | "BACKLOG"
  | "IN_PROGRESS"
  | "IN_REVIEW"
  | "DONE"
  | "BLOCKED";

export type WorkType = "需求" | "任务" | "缺陷" | "技术任务";

export type MemberRole = "管理" | "产品" | "开发" | "访客";

export type MoveStatus = "IN_PROGRESS" | "IN_REVIEW" | "DONE" | "BLOCKED";

export type ThemeMode = "dark" | "light";

export type NavItem = {
  label: string;
  icon: LucideIcon;
};

export type DashboardProject = {
  id: string;
  name: string;
  description: string;
  status: "进行中" | "规划中" | "已完成";
  progress: number;
  due: string;
  owner: string;
  colorClassName: string;
};

export type DashboardWorkItem = {
  id: string;
  title: string;
  description: string;
  type: WorkType;
  projectId: string;
  iterationId: string;
  owner: string;
  ownerId: string;
  due: string;
  status: WorkStatus;
  priority: "高" | "中" | "低";
  progress: number;
};

export type WorkspaceMember = {
  id: string;
  name: string;
  login: string;
  password: string;
  role: MemberRole;
};

export type TaskDraft = {
  title: string;
  description: string;
  type: WorkType;
  iterationId: string;
  ownerId: string;
  due: string;
  status: WorkStatus;
  priority: "高" | "中" | "低";
};

export type ProjectDraft = {
  name: string;
  description: string;
  status: "进行中" | "规划中" | "已完成";
  due: string;
  owner: string;
};

export type DashboardNotice = {
  id: string;
  title: string;
  description: string;
  time: string;
  tone: "info" | "warning" | "success";
  read: boolean;
};

export type DashboardComment = {
  id: string;
  workItemId: string;
  authorId: string;
  content: string;
  createdAt: string;
};

export type FocusItem = {
  id: string;
  title: string;
  context: string;
  due: string;
  priority: "高" | "中" | "低";
  done: boolean;
  workItemId: string;
};
