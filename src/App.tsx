import { useMemo, useState, type FormEvent } from "react";
import type { LucideIcon } from "lucide-react";
import {
  Activity,
  ArrowUpRight,
  Bell,
  Check,
  CheckCircle2,
  ChevronDown,
  ChevronRight,
  CircleDot,
  ClipboardCheck,
  FolderKanban,
  Gauge,
  LayoutGrid,
  MoreHorizontal,
  PanelLeftClose,
  PanelLeftOpen,
  Plus,
  Search,
  Settings2,
  Sun,
  Target,
  Users,
  X,
  Moon,
} from "lucide-react";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";

type NavKey = "overview" | "work" | "roadmap" | "team";
type WorkStatus = "On track" | "At risk" | "Blocked" | "Complete";
type FilterKey = "All" | WorkStatus;
type ThemeMode = "dark" | "light";

type NavItem = {
  label: string;
  icon: LucideIcon;
};

type WorkItem = {
  id: string;
  title: string;
  stream: string;
  owner: string;
  due: string;
  status: WorkStatus;
  progress: number;
};

type FocusItem = {
  id: string;
  title: string;
  context: string;
  due: string;
  priority: "High" | "Medium" | "Low";
  done: boolean;
};

type MetricCard = {
  label: string;
  value: string;
  note: string;
  icon: LucideIcon;
  iconClassName: string;
};

const navigation: Record<NavKey, NavItem> = {
  overview: { label: "工作台", icon: LayoutGrid },
  work: { label: "我的工作", icon: ClipboardCheck },
  roadmap: { label: "路线图", icon: Target },
  team: { label: "团队负载", icon: Users },
};

const navKeys: NavKey[] = ["overview", "work", "roadmap", "team"];

const initialWorkItems: WorkItem[] = [
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

const initialFocusItems: FocusItem[] = [
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

const statusTone: Record<WorkStatus, "cyan" | "amber" | "rose" | "green"> = {
  "On track": "cyan",
  "At risk": "amber",
  Blocked: "rose",
  Complete: "green",
};

const priorityTone: Record<FocusItem["priority"], "rose" | "amber" | "slate"> = {
  High: "rose",
  Medium: "amber",
  Low: "slate",
};

const statusLabel: Record<WorkStatus, string> = {
  "On track": "正常",
  "At risk": "有风险",
  Blocked: "已阻塞",
  Complete: "已完成",
};

const priorityLabel: Record<FocusItem["priority"], string> = {
  High: "高",
  Medium: "中",
  Low: "低",
};

const filterLabel: Record<FilterKey, string> = {
  All: "全部",
  "On track": "正常",
  "At risk": "有风险",
  Blocked: "已阻塞",
  Complete: "已完成",
};

const metricCards: MetricCard[] = [
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

function App() {
  const [activeKey, setActiveKey] = useState<NavKey>("overview");
  const [sidebarExpanded, setSidebarExpanded] = useState(true);
  const [workItems, setWorkItems] = useState<WorkItem[]>(initialWorkItems);
  const [focusItems, setFocusItems] = useState<FocusItem[]>(initialFocusItems);
  const [filter, setFilter] = useState<FilterKey>("All");
  const [searchOpen, setSearchOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [createOpen, setCreateOpen] = useState(false);
  const [newWorkTitle, setNewWorkTitle] = useState("");
  const [notice, setNotice] = useState("所有系统均按计划推进。");
  const [workspaceOpen, setWorkspaceOpen] = useState(true);
  const [themeMode, setThemeMode] = useState<ThemeMode>("dark");

  const activeNav = navigation[activeKey];
  const ActiveIcon = activeNav.icon;
  const filteredWork = useMemo(
    () =>
      filter === "All"
        ? workItems
        : workItems.filter((item) => item.status === filter),
    [filter, workItems],
  );
  const searchResults = useMemo(() => {
    const query = searchQuery.trim().toLowerCase();
    if (query === "") {
      return [];
    }
    return workItems.filter((item) =>
      `${item.title} ${item.stream} ${item.owner}`.toLowerCase().includes(query),
    );
  }, [searchQuery, workItems]);
  const completedFocus = focusItems.filter((item) => item.done).length;

  function selectNav(key: NavKey) {
    setActiveKey(key);
    setNotice(`已切换到${navigation[key].label}。`);
  }

  function toggleFocus(itemId: string) {
    setFocusItems((items) =>
      items.map((item) =>
        item.id === itemId ? { ...item, done: !item.done } : item,
      ),
    );
    setNotice("重点事项状态已更新。");
  }

  function createWorkItem(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const title = newWorkTitle.trim();
    if (title === "") {
      setNotice("请输入工作流名称后再创建。");
      return;
    }
    const item: WorkItem = {
      id: `work-${workItems.length + 1}`,
      title,
      stream: "新工作流",
      owner: "你",
      due: "本周",
      status: "On track",
      progress: 0,
    };
    setWorkItems((items) => [item, ...items]);
    setNewWorkTitle("");
    setCreateOpen(false);
    setNotice(`“${title}”已加入交付看板。`);
  }

  return (
    <div
      data-theme={themeMode}
      className="theme-shell flex h-svh min-h-[700px] min-w-[1120px] overflow-hidden bg-[#07111f] text-slate-100"
    >
      <aside
        className={`theme-sidebar relative flex h-full shrink-0 flex-col border-r border-slate-800/80 bg-[#0a1728] transition-[width] duration-200 ${
          sidebarExpanded ? "w-64" : "w-[72px]"
        }`}
      >
        <div className="flex h-20 items-center gap-3 border-b border-slate-800/80 px-4">
          <div className="flex size-9 shrink-0 items-center justify-center rounded-xl bg-cyan-400 text-sm font-black text-slate-950">
            P
          </div>
          {sidebarExpanded && (
            <div className="min-w-0">
              <p className="truncate text-sm font-bold tracking-wide">PMS</p>
              <p className="truncate text-[11px] text-slate-500">项目管理中心</p>
            </div>
          )}
        </div>

        <div className="flex-1 overflow-y-auto px-3 py-5">
          {sidebarExpanded && (
            <p className="mb-3 px-2 text-[10px] font-semibold uppercase tracking-[0.18em] text-slate-600">
              工作区
            </p>
          )}
          <nav className="space-y-1">
            {navKeys.map((key) => {
              const item = navigation[key];
              const Icon = item.icon;
              return (
                <button
                  key={key}
                  type="button"
                  title={item.label}
                  onClick={() => selectNav(key)}
                  className={`theme-nav-item flex h-10 w-full items-center gap-3 rounded-lg px-3 text-left text-sm transition-colors ${
                    activeKey === key
                      ? "theme-nav-active bg-cyan-400/10 text-cyan-300"
                      : "text-slate-400 hover:bg-slate-800/70 hover:text-slate-100"
                  } ${sidebarExpanded ? "" : "justify-center"}`}
                >
                  <Icon className="size-[18px] shrink-0" />
                  {sidebarExpanded && <span>{item.label}</span>}
                  {sidebarExpanded && activeKey === key && (
                    <span className="ml-auto size-1.5 rounded-full bg-cyan-300" />
                  )}
                </button>
              );
            })}
          </nav>

          <div className="mt-8">
            {sidebarExpanded && (
              <button
                type="button"
                onClick={() => setWorkspaceOpen((open) => !open)}
                className="mb-3 flex w-full items-center justify-between px-2 text-[10px] font-semibold uppercase tracking-[0.18em] text-slate-600"
              >
                项目
                <ChevronDown
                  className={`size-3 transition-transform ${
                    workspaceOpen ? "" : "-rotate-90"
                  }`}
                />
              </button>
            )}
            {(workspaceOpen || !sidebarExpanded) && (
              <div className="space-y-1">
                {[
                  ["平台", "bg-cyan-400"],
                  ["增长", "bg-violet-400"],
                  ["探索", "bg-amber-400"],
                ].map(([label, color]) => (
                  <button
                    key={label}
                    type="button"
                    onClick={() => setNotice(`已选择${label}项目。`)}
                    title={label}
                    className={`theme-project-item flex h-9 w-full items-center gap-3 rounded-lg px-3 text-sm text-slate-400 hover:bg-slate-800/70 hover:text-slate-100 ${
                      sidebarExpanded ? "" : "justify-center"
                    }`}
                  >
                    <span className={`size-2 rounded-full ${color}`} />
                    {sidebarExpanded && <span>{label}</span>}
                  </button>
                ))}
              </div>
            )}
          </div>
        </div>

        <div className="border-t border-slate-800/80 p-3">
          <button
            type="button"
            onClick={() => setNotice("已选择工作区设置。")}
            title="工作区设置"
            className={`flex h-10 w-full items-center gap-3 rounded-lg px-3 text-sm text-slate-400 hover:bg-slate-800/70 hover:text-slate-100 ${
              sidebarExpanded ? "" : "justify-center"
            }`}
          >
            <Settings2 className="size-[18px] shrink-0" />
            {sidebarExpanded && <span>工作区设置</span>}
          </button>
          <div
            className={`mt-2 flex items-center gap-3 rounded-lg bg-slate-900/70 p-2 ${
              sidebarExpanded ? "" : "justify-center"
            }`}
          >
            <div className="flex size-8 shrink-0 items-center justify-center rounded-full bg-violet-400 text-xs font-bold text-slate-950">
              ZY
            </div>
            {sidebarExpanded && (
              <div className="min-w-0">
                <p className="truncate text-xs font-semibold">Zzydannyer</p>
                <p className="truncate text-[10px] text-slate-500">产品负责人</p>
              </div>
            )}
          </div>
        </div>
      </aside>

      <main className="min-w-0 flex-1 overflow-y-auto">
        <header className="theme-header sticky top-0 z-10 flex h-20 items-center justify-between border-b border-slate-800/80 bg-[#07111f]/90 px-7 backdrop-blur-xl">
          <div className="flex items-center gap-3">
            <Button
              variant="ghost"
              size="icon"
              className="text-slate-400"
              aria-label="切换导航"
              onClick={() => setSidebarExpanded((expanded) => !expanded)}
            >
              {sidebarExpanded ? <PanelLeftClose /> : <PanelLeftOpen />}
            </Button>
            <div className="hidden h-6 w-px bg-slate-800 sm:block" />
            <div>
              <div className="flex items-center gap-2">
                <ActiveIcon className="size-4 text-cyan-300" />
                <h1 className="text-sm font-semibold">{activeNav.label}</h1>
              </div>
              <p className="mt-1 text-xs text-slate-500">
                2026年10月1日，星期四 · 第42个迭代
              </p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <Button
              variant="secondary"
              size="sm"
              className="hidden text-slate-400 sm:flex"
              onClick={() => setSearchOpen(true)}
            >
              <Search className="size-4" />
              搜索
              <kbd className="ml-4 rounded border border-slate-700 px-1.5 py-0.5 text-[10px] text-slate-500">
                ⌘ K
              </kbd>
            </Button>
            <Button
              variant="ghost"
              size="icon"
              aria-label={themeMode === "dark" ? "切换到白天模式" : "切换到夜间模式"}
              title={themeMode === "dark" ? "切换到白天模式" : "切换到夜间模式"}
              onClick={() =>
                setThemeMode((mode) => (mode === "dark" ? "light" : "dark"))
              }
            >
              {themeMode === "dark" ? (
                <Sun className="size-[18px]" />
              ) : (
                <Moon className="size-[18px]" />
              )}
            </Button>
            <Button
              variant="ghost"
              size="icon"
              aria-label="通知"
              onClick={() => setNotice("你有 3 条更新等待处理。")}
            >
              <Bell className="size-[18px]" />
            </Button>
            <Button variant="primary" size="sm" onClick={() => setCreateOpen(true)}>
              <Plus className="size-4" />
              <span className="hidden sm:inline">新建工作流</span>
            </Button>
          </div>
        </header>

        <div className="mx-auto max-w-[1500px] space-y-6 p-7">
          <section className="flex flex-col justify-between gap-5 lg:flex-row lg:items-end">
            <div>
              <Badge tone="cyan" className="mb-3">
                <Activity className="mr-1.5 size-3" />
                实时交付视图
              </Badge>
              <h2 className="max-w-2xl text-3xl font-bold tracking-tight text-white">
                让重要工作持续推进。
              </h2>
              <p className="mt-2 max-w-2xl text-sm leading-6 text-slate-400">
                在一个工作台查看进度、暴露风险，并让团队清晰知道下一步决策。
              </p>
            </div>
            <div className="flex items-center gap-2 text-xs text-slate-500">
              <span className="size-2 rounded-full bg-emerald-400 shadow-[0_0_12px_rgb(52_211_153)]" />
              {notice}
            </div>
          </section>

          <section className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
            {metricCards.map(({ label, value, note, icon: Icon, iconClassName }) => (
              <Card key={label} className="bg-slate-900/50">
                <CardContent className="flex items-start justify-between pt-5">
                  <div>
                    <p className="text-xs text-slate-500">{label}</p>
                    <p className="mt-2 text-3xl font-bold tracking-tight text-white">
                      {value}
                    </p>
                    <p className="mt-2 text-[11px] text-slate-500">{note}</p>
                  </div>
                  <div className={`flex size-9 items-center justify-center rounded-xl ${iconClassName}`}>
                    <Icon className="size-[18px]" />
                  </div>
                </CardContent>
              </Card>
            ))}
          </section>

          <section className="grid gap-6 xl:grid-cols-[minmax(0,1.55fr)_minmax(330px,0.8fr)]">
            <Card>
              <CardHeader className="flex flex-row items-start justify-between gap-4">
                <div>
                    <p className="text-base font-semibold text-white">交付脉搏</p>
                  <p className="mt-1 text-xs text-slate-500">
                    查看本迭代关键承诺的推进情况。
                  </p>
                </div>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => setNotice("交付脉搏已刷新。")}
                >
                  本迭代
                  <ChevronDown className="size-4" />
                </Button>
              </CardHeader>
              <CardContent className="space-y-4">
                {workItems.slice(0, 3).map((item) => (
                  <div
                    key={item.id}
                    className="theme-inset rounded-xl border border-slate-800 bg-slate-950/50 p-4"
                  >
                    <div className="flex items-start justify-between gap-4">
                      <div className="flex min-w-0 items-start gap-3">
                        <div className="mt-1 flex size-8 shrink-0 items-center justify-center rounded-lg bg-slate-800 text-slate-400">
                          <CircleDot className="size-4" />
                        </div>
                        <div className="min-w-0">
                          <p className="truncate text-sm font-medium text-slate-100">
                            {item.title}
                          </p>
                          <p className="mt-1 text-xs text-slate-500">
                            {item.stream} · 负责人 {item.owner} · {item.due}
                          </p>
                        </div>
                      </div>
                      <Badge tone={statusTone[item.status]}>
                        {statusLabel[item.status]}
                      </Badge>
                    </div>
                    <div className="mt-4 flex items-center gap-3">
                      <Progress
                        value={item.progress}
                        className="flex-1"
                        indicatorClassName={
                          item.status === "At risk" ? "bg-amber-400" : undefined
                        }
                      />
                      <span className="w-9 text-right text-xs font-semibold text-slate-400">
                        {item.progress}%
                      </span>
                    </div>
                  </div>
                ))}
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-start justify-between">
                <div>
                  <p className="text-base font-semibold text-white">重点事项</p>
                  <p className="mt-1 text-xs text-slate-500">
                    已完成 {completedFocus} / {focusItems.length} 项
                  </p>
                </div>
                <Button
                  variant="ghost"
                  size="icon"
                  aria-label="重点事项操作"
                  onClick={() => setNotice("已打开重点事项操作。")}
                >
                  <MoreHorizontal className="size-[18px]" />
                </Button>
              </CardHeader>
              <CardContent className="space-y-2">
                {focusItems.map((item) => (
                  <button
                    key={item.id}
                    type="button"
                    onClick={() => toggleFocus(item.id)}
                    className="theme-focus-item flex w-full items-start gap-3 rounded-xl p-3 text-left transition-colors hover:bg-slate-800/60"
                  >
                    <span
                      className={`mt-0.5 flex size-5 shrink-0 items-center justify-center rounded-full border ${
                        item.done
                          ? "border-emerald-400 bg-emerald-400 text-slate-950"
                          : "border-slate-700 text-transparent"
                      }`}
                    >
                      <Check className="size-3" />
                    </span>
                    <span className="min-w-0 flex-1">
                      <span
                        className={`block text-sm ${
                          item.done
                            ? "text-slate-600 line-through"
                            : "text-slate-200"
                        }`}
                      >
                        {item.title}
                      </span>
                      <span className="mt-1 block text-[11px] text-slate-500">
                        {item.context} · {item.due}
                      </span>
                    </span>
                    <Badge tone={priorityTone[item.priority]}>
                      {priorityLabel[item.priority]}
                    </Badge>
                  </button>
                ))}
                <Button
                  variant="secondary"
                  className="mt-2 w-full"
                  onClick={() => setNotice("所有重点事项已经展示。")}
                >
                  查看全部重点事项
                  <ArrowUpRight className="size-4" />
                </Button>
              </CardContent>
            </Card>
          </section>

          <section>
            <Card>
              <CardHeader className="flex flex-col justify-between gap-4 md:flex-row md:items-center">
                <div>
                  <p className="text-base font-semibold text-white">工作流</p>
                  <p className="mt-1 text-xs text-slate-500">
                    以决策为中心查看所有进行中的工作。
                  </p>
                </div>
                <div className="theme-control flex items-center gap-1 rounded-lg bg-slate-950 p-1">
                  {(["All", "On track", "At risk", "Blocked"] as FilterKey[]).map(
                    (key) => (
                      <button
                        key={key}
                        type="button"
                        onClick={() => setFilter(key)}
                        className={`rounded-md px-3 py-1.5 text-xs transition-colors ${
                          filter === key
                            ? "bg-slate-800 text-white"
                            : "text-slate-500 hover:text-slate-300"
                        }`}
                      >
                        {filterLabel[key]}
                      </button>
                    ),
                  )}
                </div>
              </CardHeader>
              <CardContent className="space-y-2">
                {filteredWork.map((item) => (
                  <div
                    key={item.id}
                    className="theme-inset grid gap-3 rounded-xl border border-slate-800/80 bg-slate-950/40 p-4 md:grid-cols-[minmax(220px,1.6fr)_0.7fr_0.7fr_minmax(150px,1fr)_auto] md:items-center"
                  >
                    <div className="min-w-0">
                      <p className="truncate text-sm font-medium text-slate-100">
                        {item.title}
                      </p>
                      <p className="mt-1 text-xs text-slate-500">
                        {item.stream}工作流
                      </p>
                    </div>
                    <div>
                      <p className="text-[10px] uppercase tracking-wide text-slate-600">
                        负责人
                      </p>
                      <p className="mt-1 text-xs text-slate-300">{item.owner}</p>
                    </div>
                    <div>
                      <p className="text-[10px] uppercase tracking-wide text-slate-600">
                        目标日期
                      </p>
                      <p className="mt-1 text-xs text-slate-300">{item.due}</p>
                    </div>
                    <div className="flex items-center gap-3">
                      <Progress
                        value={item.progress}
                        className="flex-1"
                        indicatorClassName={
                          item.status === "Blocked" ? "bg-rose-400" : undefined
                        }
                      />
                      <span className="w-8 text-right text-xs text-slate-500">
                        {item.progress}%
                      </span>
                    </div>
                    <Badge tone={statusTone[item.status]}>
                      {statusLabel[item.status]}
                    </Badge>
                  </div>
                ))}
                {filteredWork.length === 0 && (
                  <div className="rounded-xl border border-dashed border-slate-700 p-8 text-center text-sm text-slate-500">
                    没有符合当前筛选条件的工作流。
                  </div>
                )}
              </CardContent>
            </Card>
          </section>

          <footer className="flex flex-wrap items-center justify-between gap-3 pb-2 text-xs text-slate-600">
            <span>本地演示工作区 · 修改仅保存在当前会话</span>
            <span className="flex items-center gap-1.5">
              <CheckCircle2 className="size-3.5 text-emerald-400" />
              刚刚同步
            </span>
          </footer>
        </div>
      </main>

      {searchOpen && (
        <div className="fixed inset-0 z-30 flex items-start justify-center bg-slate-950/75 px-4 pt-[14vh] backdrop-blur-sm">
          <div className="theme-modal w-full max-w-xl rounded-2xl border border-slate-700 bg-[#0b192b] p-4 shadow-2xl">
            <div className="flex items-center gap-3 border-b border-slate-800 pb-3">
              <Search className="size-5 text-slate-500" />
              <input
                autoFocus
                value={searchQuery}
                onChange={(event) => setSearchQuery(event.currentTarget.value)}
                placeholder="搜索工作流、负责人或项目……"
                className="min-w-0 flex-1 bg-transparent text-sm text-white outline-none placeholder:text-slate-600"
              />
              <button
                type="button"
                aria-label="关闭搜索"
                onClick={() => setSearchOpen(false)}
                className="rounded-md p-1 text-slate-500 hover:bg-slate-800 hover:text-white"
              >
                <X className="size-4" />
              </button>
            </div>
            <div className="mt-3 space-y-1">
              {searchQuery.trim() !== "" && searchResults.length === 0 && (
                <p className="p-4 text-center text-sm text-slate-500">
                  没有找到匹配的工作流。
                </p>
              )}
              {searchResults.map((item) => (
                <button
                  key={item.id}
                  type="button"
                  onClick={() => {
                    setNotice(`已选择“${item.title}”。`);
                    setSearchOpen(false);
                  }}
                  className="theme-search-result flex w-full items-center justify-between rounded-lg p-3 text-left hover:bg-slate-800"
                >
                  <span>
                    <span className="block text-sm text-slate-200">{item.title}</span>
                    <span className="mt-1 block text-xs text-slate-500">
                      {item.stream} · {item.owner}
                    </span>
                  </span>
                  <ChevronRight className="size-4 text-slate-600" />
                </button>
              ))}
              {searchQuery.trim() === "" && (
                <p className="p-4 text-center text-xs text-slate-600">
                  搜索范围仅限当前本地演示数据。
                </p>
              )}
            </div>
          </div>
        </div>
      )}

      {createOpen && (
        <div className="fixed inset-0 z-30 flex items-center justify-center bg-slate-950/75 px-4 backdrop-blur-sm">
          <form
            onSubmit={createWorkItem}
            className="theme-modal w-full max-w-md rounded-2xl border border-slate-700 bg-[#0b192b] p-6 shadow-2xl"
          >
            <div className="flex items-start justify-between">
              <div>
                <p className="text-lg font-semibold text-white">新建工作流</p>
                <p className="mt-1 text-sm text-slate-500">
                  将一项工作承诺加入交付看板。
                </p>
              </div>
              <button
                type="button"
                aria-label="关闭新建工作流"
                onClick={() => setCreateOpen(false)}
                className="rounded-md p-1 text-slate-500 hover:bg-slate-800 hover:text-white"
              >
                <X className="size-4" />
              </button>
            </div>
            <label className="mt-6 block text-xs font-medium text-slate-400" htmlFor="workstream-title">
              工作流名称
            </label>
            <input
              id="workstream-title"
              autoFocus
              value={newWorkTitle}
              onChange={(event) => setNewWorkTitle(event.currentTarget.value)}
              placeholder="例如：合作伙伴上线清单"
              className="theme-field mt-2 h-11 w-full rounded-lg border border-slate-700 bg-slate-950 px-3 text-sm text-white outline-none placeholder:text-slate-600 focus:border-cyan-400"
            />
            <div className="mt-6 flex justify-end gap-2">
              <Button type="button" variant="ghost" onClick={() => setCreateOpen(false)}>
                取消
              </Button>
              <Button type="submit" variant="primary">
                <Plus className="size-4" />
                添加工作流
              </Button>
            </div>
          </form>
        </div>
      )}

    </div>
  );
}

export default App;
