import { useEffect, useMemo, useState, type FormEvent } from "react";
import { Bell, LayoutGrid, Moon, PanelLeftClose, PanelLeftOpen, Plus, Search, Settings2, Sparkles, Sun } from "lucide-react";

import { Button } from "@/components/ui/button";
import { subscribeRealtime } from "@pms/api-client";
import type { ApiResponse } from "@pms/api-client";
import type { Iteration, Milestone, Project, WorkItem } from "@pms/domain";
import { initialFocusItems, initialNotices, initialProjects, initialWorkItems, navigation, navKeys } from "@/features/dashboard/dashboard-data";
import { AiDialog, CreateWorkDialog, LoginScreen, SearchDialog } from "@/features/dashboard/dashboard-dialogs";
import type { DashboardProject, DashboardWorkItem, NavKey, ProjectViewKey, ThemeMode } from "@/features/dashboard/dashboard-types";
import { DashboardView } from "@/features/dashboard/dashboard-view";

const apiBaseUrl = import.meta.env.VITE_API_BASE_URL || "http://localhost:3100";

type LoginResponse = { accessToken: string };
type AiResponse = { answer: string };
type AiUsageResponse = { requestCount: number; totalTokens: number };
type ProposalResponse = { id: string; status: string; changes: { id: string; after: { title: string } }[] };

function toDashboardWorkItem(item: WorkItem): DashboardWorkItem {
  const type = item.type === "REQUIREMENT" ? "需求" : item.type === "BUG" ? "缺陷" : item.type === "SUBTASK" ? "任务" : "任务";
  const priority = item.priority === "HIGH" || item.priority === "URGENT" ? "高" : item.priority === "MEDIUM" ? "中" : "低";
  const progress = item.status === "DONE" ? 100 : item.status === "IN_PROGRESS" || item.status === "IN_REVIEW" ? 50 : 0;
  return { id: item.id, title: item.title, type, projectId: item.projectId, owner: item.assigneeId || "未分配", due: item.dueDate || "未设置", status: item.status === "READY" ? "BACKLOG" : item.status === "CANCELLED" ? "BLOCKED" : item.status, priority, progress };
}

function toDashboardProject(project: Project): DashboardProject {
  return {
    id: project.id,
    name: project.name,
    description: project.description,
    status:
      project.status === "COMPLETED"
        ? "已完成"
        : project.status === "PLANNING"
          ? "规划中"
          : "进行中",
    progress: 0,
    due: project.targetDate,
    owner: project.ownerId,
    colorClassName: "bg-cyan-400",
  };
}

export function AppShell() {
  const [activeKey, setActiveKey] = useState<NavKey>("home");
  const [selectedProjectId, setSelectedProjectId] = useState("project-pms");
  const [projectView, setProjectView] = useState<ProjectViewKey>("overview");
  const [sidebarExpanded, setSidebarExpanded] = useState(true);
  const [projects, setProjects] = useState<DashboardProject[]>(initialProjects);
  const [workItems, setWorkItems] = useState<DashboardWorkItem[]>(initialWorkItems);
  const [iterations, setIterations] = useState<Iteration[]>([]);
  const [milestones, setMilestones] = useState<Milestone[]>([]);
  const [focusItems, setFocusItems] = useState(initialFocusItems);
  const [notices] = useState(initialNotices);
  const [searchOpen, setSearchOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [createOpen, setCreateOpen] = useState(false);
  const [newTaskTitle, setNewTaskTitle] = useState("");
  const [taskSubmitting, setTaskSubmitting] = useState(false);
  const [notice, setNotice] = useState("准备好开始今天的工作。");
  const [themeMode, setThemeMode] = useState<ThemeMode>("light");
  const [accessToken, setAccessToken] = useState(() => localStorage.getItem("pms_access_token") || "");
  const [authenticated, setAuthenticated] = useState(() => localStorage.getItem("pms_access_token") !== null);
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

  const project = projects.find((item) => item.id === selectedProjectId) || projects[0];
  const searchResults = useMemo(() => {
    const query = searchQuery.trim().toLowerCase();
    if (query === "") return [];
    return workItems.filter((item) => `${item.title} ${item.type} ${item.owner}`.toLowerCase().includes(query));
  }, [searchQuery, workItems]);

  function handleUnauthorized(response: Response): boolean {
    if (response.status !== 401) {
      return false;
    }
    localStorage.removeItem("pms_access_token");
    setAccessToken("");
    setAuthenticated(false);
    setCreateOpen(false);
    setTaskSubmitting(false);
    setAiLoading(false);
    setLoginNotice("登录已失效，请重新登录。");
    setNotice("登录已失效，请重新登录。");
    return true;
  }

  useEffect(() => {
    if (!authenticated) return;
    return subscribeRealtime(apiBaseUrl, (event) => setNotice(`已同步远端变更：${event.entityId}`));
  }, [authenticated]);

  useEffect(() => {
    if (!authenticated || accessToken === "") return;
    fetch(`${apiBaseUrl}/api/projects?workspaceId=workspace-demo`, { headers: { Authorization: `Bearer ${accessToken}` } }).then(async (response) => {
      if (!response.ok) {
        if (handleUnauthorized(response)) return;
        setNotice("项目加载失败，当前显示本地演示数据。");
        return;
      }
      const result = (await response.json()) as ApiResponse<Project[]>;
      setProjects(result.data.map(toDashboardProject));
    });
  }, [accessToken, authenticated]);

  useEffect(() => {
    if (!authenticated || accessToken === "") return;
    fetch(`${apiBaseUrl}/api/work-items?workspaceId=workspace-demo&projectId=${selectedProjectId}`, { headers: { Authorization: `Bearer ${accessToken}` } }).then(async (response) => {
      if (!response.ok) {
        if (handleUnauthorized(response)) return;
        setNotice("云端工作项加载失败，当前显示本地数据。");
        return;
      }
      const result = (await response.json()) as ApiResponse<WorkItem[]>;
      setWorkItems(result.data.map(toDashboardWorkItem));
      setNotice("已同步云端工作项。");
    });
  }, [accessToken, authenticated, selectedProjectId]);

  useEffect(() => {
    if (!authenticated || accessToken === "") return;
    fetch(`${apiBaseUrl}/api/projects/${selectedProjectId}/delivery`, {
      headers: { Authorization: `Bearer ${accessToken}` },
    }).then(async (response) => {
      if (!response.ok) return;
      const result = (await response.json()) as ApiResponse<{
        iterations: Iteration[];
        milestones: Milestone[];
        releases: [];
        defects: [];
      }>;
      setIterations(result.data.iterations);
      setMilestones(result.data.milestones);
    });
  }, [accessToken, authenticated, selectedProjectId]);

  function selectNav(key: NavKey) {
    setActiveKey(key);
    setNotice(`已打开${navigation[key].label}。`);
  }

  function selectProject(projectId: string) {
    setSelectedProjectId(projectId);
    setActiveKey("projects");
    setProjectView("overview");
    setNotice("已打开项目空间。");
  }

  async function createTask(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (taskSubmitting) return;
    const title = newTaskTitle.trim();
    if (title === "") {
      setNotice("请输入任务名称。");
      return;
    }
    if (accessToken === "") {
      setCreateOpen(false);
      setNotice("登录状态已失效，请重新登录后再创建任务。");
      return;
    }
    setTaskSubmitting(true);
    const response = await fetch(`${apiBaseUrl}/api/work-items`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${accessToken}`,
      },
      body: JSON.stringify({
        workspaceId: "workspace-demo",
        projectId: selectedProjectId,
        title,
        description: "",
        type: "TASK",
        priority: "MEDIUM",
        reporterId: "member-demo",
      }),
    });
    if (!response.ok) {
      if (handleUnauthorized(response)) return;
      setTaskSubmitting(false);
      setCreateOpen(false);
      setNotice("任务创建失败，请检查项目权限和服务端状态。");
      return;
    }
    const result = (await response.json()) as ApiResponse<WorkItem>;
    setWorkItems((items) => [toDashboardWorkItem(result.data), ...items]);
    setTaskSubmitting(false);
    setNewTaskTitle("");
    setCreateOpen(false);
    setActiveKey("projects");
    setProjectView("tasks");
    setNotice(`“${title}”已创建，等待开始。`);
  }

  async function completeWorkItem(item: DashboardWorkItem) {
    const response = await fetch(`${apiBaseUrl}/api/work-items/${item.id}`, {
      method: "PATCH",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${accessToken}`,
      },
      body: JSON.stringify({
        status: "DONE",
        priority: item.priority === "高" ? "HIGH" : item.priority === "中" ? "MEDIUM" : "LOW",
        assigneeId: "member-demo",
        dueDate: item.due === "未设置" ? new Date().toISOString().slice(0, 10) : item.due,
      }),
    });
    if (!response.ok) {
      if (handleUnauthorized(response)) return;
      setNotice("任务状态更新失败。");
      return;
    }
    const result = (await response.json()) as ApiResponse<WorkItem>;
    setWorkItems((items) =>
      items.map((current) =>
        current.id === result.data.id ? toDashboardWorkItem(result.data) : current,
      ),
    );
    setNotice("任务已完成。");
  }

  function toggleFocus(itemId: string) {
    setFocusItems((items) => items.map((item) => item.id === itemId ? { ...item, done: !item.done } : item));
    setNotice("重点事项状态已更新。");
  }

  async function submitLogin(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const response = await fetch(`${apiBaseUrl}/api/auth/login`, { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ login, password }) });
    if (!response.ok) {
      setLoginNotice("账号或密码错误，或服务端尚未启动。");
      return;
    }
    const result = (await response.json()) as LoginResponse;
    localStorage.setItem("pms_access_token", result.accessToken);
    setAccessToken(result.accessToken);
    setAuthenticated(true);
  }

  async function askAi(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const message = aiMessage.trim();
    if (message === "") { setNotice("请输入问题后再开始分析。"); return; }
    if (accessToken === "") { setNotice("请先登录。"); return; }
    setAiLoading(true);
    const response = await fetch(`${apiBaseUrl}/api/agent/ask`, { method: "POST", headers: { "Content-Type": "application/json", Authorization: `Bearer ${accessToken}` }, body: JSON.stringify({ workspaceId: "workspace-demo", projectId: selectedProjectId, message }) });
    if (!response.ok) { setAiLoading(false); setNotice("AI 服务暂时不可用，请检查服务端模型配置。"); return; }
    const result = (await response.json()) as AiResponse;
    setAiAnswer(result.answer);
    const usageResponse = await fetch(`${apiBaseUrl}/api/agent/usage?workspaceId=workspace-demo`, { headers: { Authorization: `Bearer ${accessToken}` } });
    if (usageResponse.ok) { const usage = (await usageResponse.json()) as AiUsageResponse; setAiUsage(`本工作区 AI 用量：${usage.requestCount} 次调用 · ${usage.totalTokens} Tokens`); }
    setAiLoading(false);
    setNotice("AI 分析已完成。");
  }

  async function createProposal() {
    if (aiMessage.trim() === "") { setNotice("请输入问题后再生成提议。"); return; }
    if (accessToken === "") { setNotice("请先登录。"); return; }
    setAiLoading(true);
    const response = await fetch(`${apiBaseUrl}/api/agent/proposals`, { method: "POST", headers: { "Content-Type": "application/json", Authorization: `Bearer ${accessToken}` }, body: JSON.stringify({ workspaceId: "workspace-demo", projectId: selectedProjectId, message: aiMessage.trim() }) });
    if (!response.ok) { setAiLoading(false); setNotice("提议生成失败。"); return; }
    const proposal = (await response.json()) as ProposalResponse;
    setProposalId(proposal.id); setProposalStatus(proposal.status); setProposalChangeId(proposal.changes[0].id); setProposalTitle(proposal.changes[0].after.title); setAiLoading(false); setNotice("提议已生成，请确认后执行。");
  }

  async function confirmProposal() {
    if (accessToken === "") { setNotice("请先登录。"); return; }
    setAiLoading(true);
    const response = await fetch(`${apiBaseUrl}/api/agent/proposals/${proposalId}/confirm`, { method: "POST", headers: { "Content-Type": "application/json", Authorization: `Bearer ${accessToken}` }, body: JSON.stringify({ acceptedChangeIds: [proposalChangeId] }) });
    if (!response.ok) { setAiLoading(false); setNotice("提议执行失败。"); return; }
    setProposalStatus("EXECUTED"); setAiLoading(false); setNotice("提议已确认并创建工作项。");
  }

  if (!authenticated) return <LoginScreen login={login} password={password} notice={loginNotice} onLoginChange={setLogin} onPasswordChange={setPassword} onSubmit={submitLogin} />;

  return (
    <div data-theme={themeMode} className="theme-shell flex h-svh min-h-175 min-w-280 overflow-hidden bg-slate-50 text-slate-900">
      <aside className={`theme-sidebar flex h-full shrink-0 flex-col border-r border-slate-200 bg-white transition-[width] duration-200 ${sidebarExpanded ? "w-64" : "w-18"}`}>
        <div className="flex h-16 items-center gap-3 border-b border-slate-200 px-4">
          <div className="flex size-9 items-center justify-center rounded-xl bg-cyan-500 font-black text-white">P</div>
          {sidebarExpanded && <div><p className="text-sm font-bold">PMS</p><p className="text-[11px] text-slate-500">小团队项目协作</p></div>}
        </div>
        <div className="flex-1 overflow-y-auto px-3 py-5">
          {sidebarExpanded && <p className="mb-2 px-2 text-[10px] font-semibold uppercase tracking-[0.18em] text-slate-400">工作区</p>}
          <nav className="space-y-1">{navKeys.map((key) => { const item = navigation[key]; const Icon = item.icon; return <button key={key} type="button" title={item.label} onClick={() => selectNav(key)} className={`flex h-10 w-full items-center gap-3 rounded-lg px-3 text-left text-sm ${activeKey === key ? "bg-cyan-50 text-cyan-700" : "text-slate-500 hover:bg-slate-100 hover:text-slate-900"} ${sidebarExpanded ? "" : "justify-center"}`}><Icon className="size-4.5" />{sidebarExpanded && <span>{item.label}</span>}</button>; })}</nav>
          {sidebarExpanded && <p className="mb-2 mt-8 px-2 text-[10px] font-semibold uppercase tracking-[0.18em] text-slate-400">项目</p>}
          <div className="space-y-1">{projects.map((item) => <button key={item.id} type="button" title={item.name} onClick={() => selectProject(item.id)} className={`flex h-9 w-full items-center gap-3 rounded-lg px-3 text-left text-sm ${selectedProjectId === item.id && activeKey === "projects" ? "bg-cyan-50 text-cyan-700" : "text-slate-500 hover:bg-slate-100"} ${sidebarExpanded ? "" : "justify-center"}`}><span className={`size-2 rounded-full ${item.colorClassName}`} />{sidebarExpanded && <span className="truncate">{item.name}</span>}</button>)}</div>
        </div>
        <div className="border-t border-slate-200 p-3"><button type="button" onClick={() => { localStorage.removeItem("pms_access_token"); setAccessToken(""); setAuthenticated(false); }} className="flex h-10 w-full items-center gap-3 rounded-lg px-3 text-sm text-slate-500 hover:bg-slate-100"><Settings2 className="size-4.5" />{sidebarExpanded && <span>退出登录</span>}</button></div>
      </aside>
      <main className="min-w-0 flex-1 overflow-y-auto">
        <header className="theme-header sticky top-0 z-10 flex h-16 items-center justify-between border-b border-slate-200 bg-white/90 px-7 backdrop-blur-xl">
          <div className="flex items-center gap-3"><Button variant="ghost" size="icon" aria-label="切换导航" onClick={() => setSidebarExpanded((expanded) => !expanded)}>{sidebarExpanded ? <PanelLeftClose /> : <PanelLeftOpen />}</Button><div><h1 className="text-sm font-semibold">{navigation[activeKey].label}</h1><p className="mt-1 text-xs text-slate-500">周四，2026年10月3日 · PMS 工作区</p></div></div>
          <div className="flex items-center gap-2"><Button variant="secondary" size="sm" onClick={() => setSearchOpen(true)}><Search className="size-4" />搜索任务和项目</Button><Button variant="ghost" size="icon" aria-label="打开 AI 助手" onClick={() => setAiOpen(true)}><Sparkles className="size-4.5" /></Button><Button variant="ghost" size="icon" aria-label="切换主题" onClick={() => setThemeMode((mode) => mode === "dark" ? "light" : "dark")}>{themeMode === "dark" ? <Sun className="size-4.5" /> : <Moon className="size-4.5" />}</Button><Button variant="ghost" size="icon" aria-label="通知" onClick={() => selectNav("inbox")}><Bell className="size-4.5" /></Button><Button variant="primary" size="sm" onClick={() => setCreateOpen(true)}><Plus className="size-4" />新建任务</Button></div>
        </header>
        <div className="border-b border-slate-200 bg-white px-7 py-2 text-xs text-slate-500">{notice}</div>
        <DashboardView activeKey={activeKey} project={project} projects={projects} workItems={workItems} iterations={iterations} milestones={milestones} focusItems={focusItems} notices={notices} projectView={projectView} onProjectChange={selectProject} onProjectViewChange={setProjectView} onToggleFocus={toggleFocus} onCreateTask={() => setCreateOpen(true)} onCompleteWorkItem={completeWorkItem} onOpenAi={() => setAiOpen(true)} onOpenNotice={setNotice} />
      </main>
      <SearchDialog open={searchOpen} query={searchQuery} results={searchResults} onQueryChange={setSearchQuery} onClose={() => setSearchOpen(false)} onSelect={(item) => { setSelectedProjectId(item.projectId); setActiveKey("projects"); setProjectView("tasks"); setSearchOpen(false); setNotice(`已打开“${item.title}”。`); }} />
      <CreateWorkDialog open={createOpen} title={newTaskTitle} loading={taskSubmitting} onTitleChange={setNewTaskTitle} onClose={() => setCreateOpen(false)} onSubmit={createTask} />
      <AiDialog open={aiOpen} message={aiMessage} answer={aiAnswer} proposalId={proposalId} proposalTitle={proposalTitle} proposalStatus={proposalStatus} usage={aiUsage} loading={aiLoading} onMessageChange={setAiMessage} onClose={() => setAiOpen(false)} onSubmit={askAi} onCreateProposal={createProposal} onConfirmProposal={confirmProposal} />
    </div>
  );

}
