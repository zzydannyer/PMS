import { Inbox, LayoutGrid, ListChecks, Settings2, Users } from "lucide-react";
import type { Defect, Iteration, Milestone } from "@pms/domain";

import type {
  DashboardComment,
  DashboardNotice,
  DashboardProject,
  DashboardWorkItem,
  FocusItem,
  MemberRole,
  NavItem,
  NavKey,
  WorkspaceMember,
} from "./dashboard-types";

const workspaceStorageKey = "pms_desktop_workspace";

export type LocalWorkspace = {
  projects: DashboardProject[];
  workItems: DashboardWorkItem[];
  iterations: Iteration[];
  milestones: Milestone[];
  defects: Defect[];
  comments: DashboardComment[];
  notices: DashboardNotice[];
  focusItems: FocusItem[];
  selectedProjectId: string;
  members: WorkspaceMember[];
};

export const navigation: Record<NavKey, NavItem> = {
  home: { label: "工作台", icon: LayoutGrid },
  "my-work": { label: "我的工作", icon: ListChecks },
  projects: { label: "项目", icon: Users },
  inbox: { label: "通知", icon: Inbox },
  settings: { label: "管理设置", icon: Settings2 },
};

export const navKeys: NavKey[] = ["home", "my-work", "projects", "inbox", "settings"];

export const initialProjects: DashboardProject[] = [
  {
    id: "project-pms",
    name: "PMS 项目管理系统",
    description: "面向小团队的项目协作与交付平台",
    status: "进行中",
    progress: 68,
    due: "2026年10月30日",
    owner: "产品",
    colorClassName: "bg-cyan-400",
  },
  {
    id: "project-launch",
    name: "秋季版本发布",
    description: "完成核心功能、验收和发布准备",
    status: "进行中",
    progress: 42,
    due: "2026年10月18日",
    owner: "产品",
    colorClassName: "bg-violet-400",
  },
  {
    id: "project-research",
    name: "客户需求探索",
    description: "整理客户反馈并确定下一阶段方向",
    status: "规划中",
    progress: 18,
    due: "2026年11月12日",
    owner: "产品",
    colorClassName: "bg-amber-400",
  },
];

export const initialWorkItems: DashboardWorkItem[] = [
  {
    id: "launch",
    title: "确定秋季版本发布范围",
    description: "",
    type: "需求",
    projectId: "project-launch",
    iterationId: "",
    owner: "产品",
    ownerId: "member-product",
    due: "今天",
    status: "IN_REVIEW",
    priority: "高",
    progress: 82,
  },
  {
    id: "billing",
    title: "完成工作项详情页",
    description: "",
    type: "任务",
    projectId: "project-pms",
    iterationId: "",
    owner: "开发",
    ownerId: "member-dev",
    due: "10月08日",
    status: "IN_PROGRESS",
    priority: "高",
    progress: 46,
  },
  {
    id: "research",
    title: "整理客户调研结论",
    description: "",
    type: "需求",
    projectId: "project-research",
    iterationId: "",
    owner: "产品",
    ownerId: "member-product",
    due: "10月14日",
    status: "IN_PROGRESS",
    priority: "中",
    progress: 68,
  },
  {
    id: "migration",
    title: "接入 PostgreSQL 数据持久化",
    description: "",
    type: "技术任务",
    projectId: "project-pms",
    iterationId: "",
    owner: "开发",
    ownerId: "member-dev",
    due: "10月21日",
    status: "BLOCKED",
    priority: "中",
    progress: 24,
  },
];

export const initialFocusItems: FocusItem[] = [
  {
    id: "scope",
    title: "确认秋季版本发布范围",
    context: "秋季版本发布 · 产品",
    due: "今天到期",
    priority: "高",
    done: false,
    workItemId: "launch",
  },
  {
    id: "review",
    title: "完成工作项详情页评审",
    context: "PMS 项目管理系统 · 开发",
    due: "明天到期",
    priority: "中",
    done: false,
    workItemId: "billing",
  },
  {
    id: "migration",
    title: "解除数据库迁移阻塞",
    context: "PMS 项目管理系统 · 开发",
    due: "10月07日到期",
    priority: "高",
    done: false,
    workItemId: "migration",
  },
  {
    id: "brief",
    title: "发布客户调研结论",
    context: "客户需求探索 · 产品",
    due: "10月06日到期",
    priority: "低",
    done: true,
    workItemId: "research",
  },
];

export const statusLabel = {
  BACKLOG: "待处理",
  IN_PROGRESS: "进行中",
  IN_REVIEW: "待验收",
  DONE: "已完成",
  BLOCKED: "已阻塞",
};

export const statusTone = {
  BACKLOG: "secondary",
  IN_PROGRESS: "default",
  IN_REVIEW: "outline",
  DONE: "secondary",
  BLOCKED: "destructive",
} as const;

export const priorityTone = {
  高: "destructive",
  中: "outline",
  低: "secondary",
} as const;

export const severityLabel = {
  CRITICAL: "紧急",
  MAJOR: "严重",
  MINOR: "一般",
  TRIVIAL: "轻微",
} as const;

export const memberRoles: MemberRole[] = ["管理", "产品", "开发", "访客"];

export function seedMembers(): WorkspaceMember[] {
  return [
    { id: "member-demo", name: "演示用户", login: "demo", password: "demo", role: "管理" },
    { id: "member-product", name: "产品", login: "product", password: "product", role: "产品" },
    { id: "member-dev", name: "开发", login: "dev", password: "dev", role: "开发" },
    { id: "member-guest", name: "访客", login: "guest", password: "guest", role: "访客" },
  ];
}

export function allowsTaskChange(role: MemberRole): boolean {
  return role === "管理" || role === "产品" || role === "开发";
}

export function allowsPlanChange(role: MemberRole): boolean {
  return role === "管理" || role === "产品";
}

export function allowsMemberChange(role: MemberRole): boolean {
  return role === "管理";
}

export function memberName(members: WorkspaceMember[], ownerId: string, owner: string): string {
  const member = members.find((item) => item.id === ownerId);
  if (member) return member.name;
  if (owner !== "") return owner;
  return "未分配";
}

export const projectViewLabels = {
  overview: "概览",
  tasks: "任务",
  board: "看板",
  iterations: "迭代",
  milestones: "里程碑",
  risks: "风险与问题",
  discussion: "讨论",
};

function seedWorkspace(): LocalWorkspace {
  return {
    projects: initialProjects,
    workItems: initialWorkItems,
    iterations: [],
    milestones: [],
    defects: [],
    comments: [],
    notices: [
      {
        id: "notice-local",
        title: "本地工作区已就绪",
        description: "项目和任务保存在这台电脑上，不需要连接服务器。",
        time: "刚刚",
        tone: "info",
        read: false,
      },
    ],
    focusItems: initialFocusItems,
    selectedProjectId: "project-pms",
    members: seedMembers(),
  };
}

const focusTaskIds: Record<string, string> = { scope: "launch", review: "billing", migration: "migration", brief: "research" };

function ownerIdFromName(owner: string): string {
  if (owner === "产品") return "member-product";
  if (owner === "开发") return "member-dev";
  if (owner === "演示用户") return "member-demo";
  if (owner === "访客") return "member-guest";
  return "";
}

export function loadWorkspace(): LocalWorkspace {
  const raw = localStorage.getItem(workspaceStorageKey) || "";
  if (!raw.includes("\"projects\"") || !raw.includes("\"workItems\"")) return seedWorkspace();
  const workspace = JSON.parse(raw) as LocalWorkspace;
  if (!workspace.projects || !workspace.workItems || !workspace.notices || !workspace.focusItems) return seedWorkspace();
  const workItems = workspace.workItems.map((item) => ({
    ...item,
    description: item.description || "",
    iterationId: item.iterationId || "",
    ownerId: item.ownerId || ownerIdFromName(item.owner),
  }));
  const members = workspace.members && workspace.members.length > 0 ? workspace.members.map((item) => ({ ...item, password: item.password || "demo" })) : seedMembers();
  return {
    projects: workspace.projects,
    workItems,
    iterations: workspace.iterations || [],
    milestones: workspace.milestones || [],
    defects: workspace.defects || [],
    comments: workspace.comments || [],
    notices: workspace.notices,
    focusItems: workspace.focusItems.map((item) => {
      const matched = workItems.filter((workItem) => workItem.title === item.title)[0];
      return { ...item, workItemId: item.workItemId || focusTaskIds[item.id] || (matched ? matched.id : "") };
    }),
    selectedProjectId: workspace.selectedProjectId || "project-pms",
    members,
  };
}

export function saveWorkspace(workspace: LocalWorkspace) {
  localStorage.setItem(workspaceStorageKey, JSON.stringify(workspace));
}
