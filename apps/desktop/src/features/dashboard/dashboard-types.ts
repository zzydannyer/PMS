import type { LucideIcon } from "lucide-react";

export type NavKey = "overview" | "work" | "roadmap" | "team";

export type WorkStatus = "On track" | "At risk" | "Blocked" | "Complete";

export type FilterKey = "All" | WorkStatus;

export type ThemeMode = "dark" | "light";

export type NavItem = {
  label: string;
  icon: LucideIcon;
};

export type DashboardWorkItem = {
  id: string;
  title: string;
  stream: string;
  owner: string;
  due: string;
  status: WorkStatus;
  progress: number;
};

export type FocusItem = {
  id: string;
  title: string;
  context: string;
  due: string;
  priority: "High" | "Medium" | "Low";
  done: boolean;
};

export type MetricCard = {
  label: string;
  value: string;
  note: string;
  icon: LucideIcon;
  iconClassName: string;
};
