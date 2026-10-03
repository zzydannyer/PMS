import {
  Bell,
  ClipboardCheck,
  FolderKanban,
  Gauge,
  LayoutGrid,
  Target,
  Users,
} from "lucide-react";

import type {
  DashboardWorkItem,
  FilterKey,
  FocusItem,
  MetricCard,
  NavItem,
  NavKey,
  WorkStatus,
} from "./dashboard-types";

export const navigation: Record<NavKey, NavItem> = {
  overview: { label: "工作台", icon: LayoutGrid },
  work: { label: "我的工作", icon: ClipboardCheck },
  roadmap: { label: "路线图", icon: Target },
  team: { label: "团队负载", icon: Users },
};

export const navKeys: NavKey[] = [
  "overview",
  "work",
  "roadmap",
  "team",
];

export const initialWorkItems: DashboardWorkItem[] = [
  {
    id: "launch",
    title: "春季版本发布准备",
    stream: "平台",
    owner: "AM",
    due: "今天",
    status: "On track",
    progress: 82,
  },
  {
    id: "billing",
    title: "账单体验升级",
    stream: "增长",
    owner: "MC",
    due: "10月08日",
    status: "At risk",
    progress: 46,
  },
  {
    id: "research",
    title: "客户调研结论整理",
    stream: "探索",
    owner: "SR",
    due: "10月14日",
    status: "On track",
    progress: 68,
  },
  {
    id: "migration",
    title: "数据迁移演练",
    stream: "平台",
    owner: "JL",
    due: "10月21日",
    status: "Blocked",
    progress: 24,
  },
];

export const initialFocusItems: FocusItem[] = [
  {
    id: "scope",
    title: "确认版本发布范围",
    context: "春季版本 · 产品",
    due: "今天到期",
    priority: "High",
    done: false,
  },
  {
    id: "review",
    title: "与财务评审账单原型",
    context: "账单升级 · 增长",
    due: "明天到期",
    priority: "Medium",
    done: false,
  },
  {
    id: "brief",
    title: "发布客户调研结论",
    context: "客户调研 · 探索",
    due: "10月06日到期",
    priority: "Low",
    done: true,
  },
];

export const statusTone: Record<
  WorkStatus,
  "cyan" | "amber" | "rose" | "green"
> = {
  "On track": "cyan",
  "At risk": "amber",
  Blocked: "rose",
  Complete: "green",
};

export const priorityTone: Record<
  FocusItem["priority"],
  "rose" | "amber" | "slate"
> = {
  High: "rose",
  Medium: "amber",
  Low: "slate",
};

export const statusLabel: Record<WorkStatus, string> = {
  "On track": "正常",
  "At risk": "有风险",
  Blocked: "已阻塞",
  Complete: "已完成",
};

export const priorityLabel: Record<FocusItem["priority"], string> = {
  High: "高",
  Medium: "中",
  Low: "低",
};

export const filterLabel: Record<FilterKey, string> = {
  All: "全部",
  "On track": "正常",
  "At risk": "有风险",
  Blocked: "已阻塞",
  Complete: "已完成",
};

export const metricCards: MetricCard[] = [
  {
    label: "交付健康度",
    value: "86%",
    note: "较上个迭代 ↑ 8%",
    icon: Gauge,
    iconClassName: "bg-cyan-400/10 text-cyan-300",
  },
  {
    label: "进行中的工作流",
    value: "08",
    note: "本周新增 2 个",
    icon: FolderKanban,
    iconClassName: "bg-violet-400/10 text-violet-300",
  },
  {
    label: "风险事项",
    value: "03",
    note: "1 个需要决策",
    icon: Bell,
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

export const projectShortcuts = [
  { label: "平台", colorClassName: "bg-cyan-400" },
  { label: "增长", colorClassName: "bg-violet-400" },
  { label: "探索", colorClassName: "bg-amber-400" },
];

export const workFilters: FilterKey[] = [
  "All",
  "On track",
  "At risk",
  "Blocked",
];
