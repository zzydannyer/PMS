import { useEffect, useMemo, useState, type FormEvent } from "react";
import {
  Bell,
  ChevronDown,
  Moon,
  PanelLeftClose,
  PanelLeftOpen,
  Plus,
  Search,
  Settings2,
  Sparkles,
  Sun,
} from "lucide-react";

import { Button } from "@/components/ui/button";
import { subscribeRealtime } from "@pms/api-client";
import type { ApiResponse } from "@pms/api-client";
import type { WorkItem } from "@pms/domain";
import {
  initialFocusItems,
  initialWorkItems,
  navigation,
  navKeys,
  projectShortcuts,
} from "@/features/dashboard/dashboard-data";
import {
  AiDialog,
  CreateWorkDialog,
  LoginScreen,
  SearchDialog,
} from "@/features/dashboard/dashboard-dialogs";
import type {
  DashboardWorkItem,
  FilterKey,
  NavKey,
  ThemeMode,
} from "@/features/dashboard/dashboard-types";
import { DashboardView } from "@/features/dashboard/dashboard-view";

const apiBaseUrl =
  import.meta.env.VITE_API_BASE_URL || "http://localhost:3100";

type LoginResponse = {
  accessToken: string;
};

type AiResponse = {
  answer: string;
};

type AiUsageResponse = {
  requestCount: number;
  totalTokens: number;
};

type ProposalResponse = {
  id: string;
  status: string;
  changes: {
    id: string;
    after: {
      title: string;
    };
  }[];
};

function toDashboardWorkItem(item: WorkItem): DashboardWorkItem {
  const status =
    item.status === "DONE"
      ? "Complete"
      : item.status === "IN_PROGRESS" || item.status === "IN_REVIEW"
        ? "On track"
        : item.status === "CANCELLED"
          ? "Blocked"
          : "At risk";
  const progress =
    item.status === "DONE"
      ? 100
      : item.status === "IN_PROGRESS"
        ? 50
        : 0;
  return {
    id: item.id,
    title: item.title,
    stream: item.type,
    owner: item.assigneeId || "未分配",
    due: item.dueDate,
    status,
    progress,
  };
}

export function AppShell() {
  const [activeKey, setActiveKey] = useState<NavKey>("overview");
  const [sidebarExpanded, setSidebarExpanded] = useState(true);
  const [workItems, setWorkItems] =
    useState<DashboardWorkItem[]>(initialWorkItems);
  const [focusItems, setFocusItems] = useState(initialFocusItems);
  const [filter, setFilter] = useState<FilterKey>("All");
  const [searchOpen, setSearchOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [createOpen, setCreateOpen] = useState(false);
  const [newWorkTitle, setNewWorkTitle] = useState("");
  const [notice, setNotice] = useState("所有系统均按计划推进。");
  const [workspaceOpen, setWorkspaceOpen] = useState(true);
  const [themeMode, setThemeMode] = useState<ThemeMode>("dark");
  const [accessToken, setAccessToken] = useState(
    () => localStorage.getItem("pms_access_token") || "",
  );
  const [authenticated, setAuthenticated] = useState(
    () => localStorage.getItem("pms_access_token") !== null,
  );
  const [login, setLogin] = useState("demo");
  const [password, setPassword] = useState("demo");
  const [loginNotice, setLoginNotice] = useState("");
  const [aiOpen, setAiOpen] = useState(false);
  const [aiMessage, setAiMessage] = useState("");
  const [aiAnswer, setAiAnswer] = useState("");
  const [aiLoading, setAiLoading] = useState(false);
  const [proposalId, setProposalId] = useState("");
  const [proposalChangeId, setProposalChangeId] = useState("");
  const [proposalTitle, setProposalTitle] = useState("");
  const [proposalStatus, setProposalStatus] = useState("");
  const [aiUsage, setAiUsage] = useState("");

  useEffect(
    () => {
      if (!authenticated) {
        return;
      }
      return subscribeRealtime(apiBaseUrl, (event) => {
        setNotice(`已同步远端变更：${event.entityId}`);
      });
    },
    [authenticated],
  );

  useEffect(() => {
    if (!authenticated) {
      return;
    }
    fetch(
      `${apiBaseUrl}/api/work-items?workspaceId=workspace-demo&projectId=project-pms`,
      {
        headers: { Authorization: `Bearer ${accessToken}` },
      },
    ).then(async (response) => {
      if (!response.ok) {
        setNotice("云端工作项加载失败，当前显示本地数据。");
        return;
      }
      const result = (await response.json()) as ApiResponse<WorkItem[]>;
      setWorkItems(result.data.map(toDashboardWorkItem));
      setNotice("已加载云端工作项。");
    });
  }, [accessToken, authenticated]);

  const activeNav = navigation[activeKey];
  const ActiveIcon = activeNav.icon;
  const filteredWorkItems = useMemo(
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
      `${item.title} ${item.stream} ${item.owner}`
        .toLowerCase()
        .includes(query),
    );
  }, [searchQuery, workItems]);

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

    const item: DashboardWorkItem = {
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

  async function askAi(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const message = aiMessage.trim();
    if (message === "") {
      setNotice("请输入问题后再开始分析。");
      return;
    }
    setAiLoading(true);
    if (accessToken === "") {
      setAiLoading(false);
      setNotice("请先登录。");
      return;
    }
    const response = await fetch(`${apiBaseUrl}/api/agent/ask`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${accessToken}`,
      },
      body: JSON.stringify({
        workspaceId: "workspace-demo",
        projectId: "project-pms",
        message,
      }),
    });
    if (!response.ok) {
      setAiLoading(false);
      setNotice("AI 服务暂时不可用，请检查服务端模型配置。");
      return;
    }
    const result = (await response.json()) as AiResponse;
    setAiAnswer(result.answer);
    const usageResponse = await fetch(
      `${apiBaseUrl}/api/agent/usage?workspaceId=workspace-demo`,
      {
        headers: {
          Authorization: `Bearer ${accessToken}`,
        },
      },
    );
    if (usageResponse.ok) {
      const usage = (await usageResponse.json()) as AiUsageResponse;
      setAiUsage(
        `本工作区 AI 用量：${usage.requestCount} 次调用 · ${usage.totalTokens} Tokens`,
      );
    }
    setAiLoading(false);
    setNotice("AI 分析已完成。");
  }

  async function submitLogin(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const response = await fetch(`${apiBaseUrl}/api/auth/login`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ login, password }),
    });
    if (!response.ok) {
      setLoginNotice("账号或密码错误，或服务端尚未启动。");
      return;
    }
    setLoginNotice("");
    const result = (await response.json()) as LoginResponse;
    localStorage.setItem("pms_access_token", result.accessToken);
    setAccessToken(result.accessToken);
    setAuthenticated(true);
  }

  async function createProposal() {
    if (aiMessage.trim() === "") {
      setNotice("请输入问题后再生成提议。");
      return;
    }
    setAiLoading(true);
    if (accessToken === "") {
      setAiLoading(false);
      setNotice("请先登录。");
      return;
    }
    const response = await fetch(`${apiBaseUrl}/api/agent/proposals`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${accessToken}`,
      },
      body: JSON.stringify({
        workspaceId: "workspace-demo",
        projectId: "project-pms",
        message: aiMessage.trim(),
      }),
    });
    if (!response.ok) {
      setAiLoading(false);
      setNotice("提议生成失败。");
      return;
    }
    const proposal = (await response.json()) as ProposalResponse;
    setProposalId(proposal.id);
    setProposalStatus(proposal.status);
    setProposalChangeId(proposal.changes[0].id);
    setProposalTitle(proposal.changes[0].after.title);
    setAiLoading(false);
    setNotice("提议已生成，请确认后执行。");
  }

  async function confirmProposal() {
    setAiLoading(true);
    if (accessToken === "") {
      setAiLoading(false);
      setNotice("请先登录。");
      return;
    }
    const response = await fetch(
      `${apiBaseUrl}/api/agent/proposals/${proposalId}/confirm`,
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${accessToken}`,
        },
        body: JSON.stringify({ acceptedChangeIds: [proposalChangeId] }),
      },
    );
    if (!response.ok) {
      setAiLoading(false);
      setNotice("提议执行失败。");
      return;
    }
    setProposalStatus("EXECUTED");
    setAiLoading(false);
    setNotice("提议已确认并创建工作项。");
  }

  function selectSearchResult(item: DashboardWorkItem) {
    setNotice(`已选择“${item.title}”。`);
    setSearchOpen(false);
  }

  if (!authenticated) {
    return (
      <LoginScreen
        login={login}
        password={password}
        notice={loginNotice}
        onLoginChange={setLogin}
        onPasswordChange={setPassword}
        onSubmit={submitLogin}
      />
    );
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
              <p className="truncate text-[11px] text-slate-500">
                项目管理中心
              </p>
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
                {projectShortcuts.map(({ label, colorClassName }) => (
                  <button
                    key={label}
                    type="button"
                    onClick={() => setNotice(`已选择${label}项目。`)}
                    title={label}
                    className={`theme-project-item flex h-9 w-full items-center gap-3 rounded-lg px-3 text-sm text-slate-400 hover:bg-slate-800/70 hover:text-slate-100 ${
                      sidebarExpanded ? "" : "justify-center"
                    }`}
                  >
                    <span
                      className={`size-2 rounded-full ${colorClassName}`}
                    />
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
            onClick={() => {
              localStorage.removeItem("pms_access_token");
              setAccessToken("");
              setAuthenticated(false);
              setNotice("已退出登录。");
            }}
            title="工作区设置"
            className={`flex h-10 w-full items-center gap-3 rounded-lg px-3 text-sm text-slate-400 hover:bg-slate-800/70 hover:text-slate-100 ${
              sidebarExpanded ? "" : "justify-center"
            }`}
          >
            <Settings2 className="size-[18px] shrink-0" />
            {sidebarExpanded && <span>退出登录</span>}
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
                <p className="truncate text-[10px] text-slate-500">
                  产品负责人
                </p>
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
              aria-label="打开 AI 助手"
              title="AI 助手"
              onClick={() => setAiOpen(true)}
            >
              <Sparkles className="size-[18px]" />
            </Button>
            <Button
              variant="ghost"
              size="icon"
              aria-label={
                themeMode === "dark" ? "切换到白天模式" : "切换到夜间模式"
              }
              title={
                themeMode === "dark" ? "切换到白天模式" : "切换到夜间模式"
              }
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
            <Button
              variant="primary"
              size="sm"
              onClick={() => setCreateOpen(true)}
            >
              <Plus className="size-4" />
              <span className="hidden sm:inline">新建工作流</span>
            </Button>
          </div>
        </header>

        <DashboardView
          workItems={workItems}
          filteredWorkItems={filteredWorkItems}
          focusItems={focusItems}
          filter={filter}
          notice={notice}
          onFilterChange={setFilter}
          onToggleFocus={toggleFocus}
          onNoticeChange={setNotice}
        />
      </main>

      <SearchDialog
        open={searchOpen}
        query={searchQuery}
        results={searchResults}
        onQueryChange={setSearchQuery}
        onClose={() => setSearchOpen(false)}
        onSelect={selectSearchResult}
      />
      <CreateWorkDialog
        open={createOpen}
        title={newWorkTitle}
        onTitleChange={setNewWorkTitle}
        onClose={() => setCreateOpen(false)}
        onSubmit={createWorkItem}
      />
      <AiDialog
        open={aiOpen}
        message={aiMessage}
        answer={aiAnswer}
        proposalId={proposalId}
        proposalTitle={proposalTitle}
        proposalStatus={proposalStatus}
        usage={aiUsage}
        loading={aiLoading}
        onMessageChange={setAiMessage}
        onClose={() => setAiOpen(false)}
        onSubmit={askAi}
        onCreateProposal={createProposal}
        onConfirmProposal={confirmProposal}
      />
    </div>
  );
}
