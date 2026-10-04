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
  type: WorkType;
  projectId: string;
  owner: string;
  due: string;
  status: WorkStatus;
  priority: "高" | "中" | "低";
  progress: number;
};

export type DashboardNotice = {
  id: string;
  title: string;
  description: string;
  time: string;
  tone: "info" | "warning" | "success";
};

export type FocusItem = {
  id: string;
  title: string;
  context: string;
  due: string;
  priority: "高" | "中" | "低";
  done: boolean;
};

export type MetricCard = {
  label: string;
  value: string;
  note: string;
  icon: LucideIcon;
  iconClassName: string;
};
