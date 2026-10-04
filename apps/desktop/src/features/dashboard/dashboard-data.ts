import { Gauge, Inbox, LayoutGrid, ListChecks, Settings2, ShieldCheck, Users } from "lucide-react";

import type {
  DashboardNotice,
  DashboardProject,
  DashboardWorkItem,
  FocusItem,
  MetricCard,
  NavItem,
  NavKey,
} from "./dashboard-types";

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
    type: "需求",
    projectId: "project-launch",
    owner: "产品",
    due: "今天",
    status: "IN_REVIEW",
    priority: "高",
    progress: 82,
  },
  {
    id: "billing",
    title: "完成工作项详情页",
    type: "任务",
    projectId: "project-pms",
    owner: "开发",
    due: "10月08日",
    status: "IN_PROGRESS",
    priority: "高",
    progress: 46,
  },
  {
    id: "research",
    title: "整理客户调研结论",
    type: "需求",
    projectId: "project-research",
    owner: "产品",
    due: "10月14日",
    status: "IN_PROGRESS",
    priority: "中",
    progress: 68,
  },
  {
    id: "migration",
    title: "接入 PostgreSQL 数据持久化",
    type: "技术任务",
    projectId: "project-pms",
    owner: "开发",
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
  },
  {
    id: "review",
    title: "完成工作项详情页评审",
    context: "PMS 项目管理系统 · 开发",
    due: "明天到期",
    priority: "中",
    done: false,
  },
  {
    id: "migration",
    title: "解除数据库迁移阻塞",
    context: "PMS 项目管理系统 · 开发",
    due: "10月07日到期",
    priority: "高",
    done: false,
  },
  {
    id: "brief",
    title: "发布客户调研结论",
    context: "客户需求探索 · 产品",
    due: "10月06日到期",
    priority: "低",
    done: true,
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
  BACKLOG: "slate",
  IN_PROGRESS: "cyan",
  IN_REVIEW: "violet",
  DONE: "green",
  BLOCKED: "rose",
};

export const priorityTone = {
  高: "rose",
  中: "amber",
  低: "slate",
};

export const metricCards: MetricCard[] = [
  {
    label: "我的待办",
    value: "08",
    note: "3 项今天到期",
    icon: ListChecks,
    iconClassName: "bg-cyan-400/10 text-cyan-300",
  },
  {
    label: "进行中项目",
    value: "02",
    note: "1 个项目有风险",
    icon: Gauge,
    iconClassName: "bg-violet-400/10 text-violet-300",
  },
  {
    label: "待验收",
    value: "03",
    note: "需要产品确认",
    icon: ShieldCheck,
    iconClassName: "bg-amber-400/10 text-amber-300",
  },
  {
    label: "团队负载",
    value: "74%",
    note: "各小组分配均衡",
    icon: Users,
    iconClassName: "bg-emerald-400/10 text-emerald-300",
  },
];

export const initialNotices: DashboardNotice[] = [
  {
    id: "notice-1",
    title: "有 3 项工作需要你处理",
    description: "包括 1 项待验收、1 项即将到期和 1 项被阻塞任务。",
    time: "刚刚",
    tone: "warning",
  },
  {
    id: "notice-2",
    title: "开发更新了工作项",
    description: "“完成工作项详情页”已进入待验收。",
    time: "今天 14:20",
    tone: "info",
  },
  {
    id: "notice-3",
    title: "秋季版本完成了一个里程碑",
    description: "版本范围已完成产品评审。",
    time: "昨天 18:05",
    tone: "success",
  },
];

export const projectViewLabels = {
  overview: "概览",
  tasks: "任务",
  board: "看板",
  iterations: "迭代",
  milestones: "里程碑",
  risks: "风险与问题",
  discussion: "讨论",
};
