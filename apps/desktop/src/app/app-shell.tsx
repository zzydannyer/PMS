import { useEffect, useMemo, useState, type FormEvent } from "react";
import { Bell, LogOut, Moon, PanelLeftClose, PanelLeftOpen, Plus, Search, Sun } from "lucide-react";

import { Button, cn } from "@pms/ui";
import type { Defect, DeliveryMetrics, Iteration, Milestone, PortfolioSummary } from "@pms/domain";
import { allowsMemberChange, allowsPlanChange, allowsTaskChange, loadWorkspace, navigation, navKeys, saveWorkspace, severityLabel, statusLabel } from "@/features/dashboard/dashboard-data";
import { AiDialog, LoginScreen, ProjectDialog, SearchDialog, TaskDialog } from "@/features/dashboard/dashboard-dialogs";
import type { DashboardComment, DashboardNotice, DashboardProject, DashboardWorkItem, MemberRole, MoveStatus, NavKey, ProjectDraft, ProjectViewKey, TaskDraft, ThemeMode, WorkStatus, WorkspaceMember } from "@/features/dashboard/dashboard-types";
import { DashboardView } from "@/features/dashboard/dashboard-view";

const localToken = "local-demo";
const themeStorageKey = "pms_desktop_theme";
const memberStorageKey = "pms_member_id";

function nowText(): string {
  return new Date().toISOString().slice(0, 16).replace("T", " ");
}

function todayText(): string {
  return new Date().toISOString().slice(0, 10);
}

function createNotice(title: string, description: string): DashboardNotice {
  return { id: `notice-${Date.now()}`, title, description, time: nowText(), tone: "info", read: false };
}

function progressFor(status: WorkStatus, current: number): number {
  if (status === "DONE") return 100;
  if (status === "IN_REVIEW") return 80;
  if (status === "IN_PROGRESS") return 50;
  if (status === "BACKLOG") return 0;
  return current;
}

function emptyTaskDraft(ownerId: string): TaskDraft {
  return { title: "", description: "", type: "任务", iterationId: "", ownerId, due: todayText(), status: "BACKLOG", priority: "中" };
}

function emptyProjectDraft(owner: string): ProjectDraft {
  return { name: "", description: "", status: "规划中", due: "", owner };
}

export function AppShell() {
  const [activeKey, setActiveKey] = useState<NavKey>("home");
  const [selectedProjectId, setSelectedProjectId] = useState(() => loadWorkspace().selectedProjectId);
  const [projectView, setProjectView] = useState<ProjectViewKey>("overview");
  const [sidebarExpanded, setSidebarExpanded] = useState(true);
  const [accountOpen, setAccountOpen] = useState(false);
  const [projects, setProjects] = useState(() => loadWorkspace().projects);
  const [workItems, setWorkItems] = useState(() => loadWorkspace().workItems);
  const [iterations, setIterations] = useState(() => loadWorkspace().iterations);
  const [milestones, setMilestones] = useState(() => loadWorkspace().milestones);
  const [defects, setDefects] = useState(() => loadWorkspace().defects);
  const [comments, setComments] = useState(() => loadWorkspace().comments);
  const [discussionWorkItemId, setDiscussionWorkItemId] = useState("");
  const [focusItems, setFocusItems] = useState(() => loadWorkspace().focusItems);
  const [notices, setNotices] = useState(() => loadWorkspace().notices);
  const [members, setMembers] = useState(() => loadWorkspace().members);
  const [searchOpen, setSearchOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [taskOpen, setTaskOpen] = useState(false);
  const [editingTaskId, setEditingTaskId] = useState("");
  const [taskDraft, setTaskDraft] = useState<TaskDraft>(() => emptyTaskDraft(""));
  const [projectOpen, setProjectOpen] = useState(false);
  const [editingProjectId, setEditingProjectId] = useState("");
  const [projectDraft, setProjectDraft] = useState<ProjectDraft>(() => emptyProjectDraft(""));
  const [notice, setNotice] = useState("准备好开始今天的工作。");
  const [themeMode, setThemeMode] = useState<ThemeMode>(() => localStorage.getItem(themeStorageKey) === "dark" ? "dark" : "light");
  const [accessToken, setAccessToken] = useState(() => localStorage.getItem("pms_access_token") || "");
  const [authenticated, setAuthenticated] = useState(() => localStorage.getItem("pms_access_token") !== null);
  const [memberId, setMemberId] = useState(() => localStorage.getItem(memberStorageKey) || "member-demo");
  const [login, setLogin] = useState("demo");
  const [password, setPassword] = useState("demo");
  const [loginNotice, setLoginNotice] = useState("");
  const [aiOpen, setAiOpen] = useState(false);
  const [aiMessage, setAiMessage] = useState("");
  const [aiAnswer, setAiAnswer] = useState("");
  const [proposalId, setProposalId] = useState("");
  const [proposalTitle, setProposalTitle] = useState("");
  const [proposalStatus, setProposalStatus] = useState("");
  const [aiUsage, setAiUsage] = useState("");

  useEffect(() => {
    if (!accountOpen) return;
    function closeAccount() { setAccountOpen(false); }
    window.addEventListener("pointerdown", closeAccount);
    return () => window.removeEventListener("pointerdown", closeAccount);
  }, [accountOpen]);

  const project = projects.find((item) => item.id === selectedProjectId) || projects[0];
  const currentMember = members.find((item) => item.id === memberId) || members[0];
  const canWrite = allowsTaskChange(currentMember.role);
  const canPlan = allowsPlanChange(currentMember.role);
  const canManage = allowsMemberChange(currentMember.role);
  const searchResults = useMemo(() => {
    const query = searchQuery.trim().toLowerCase();
    if (query === "") return [];
    return workItems.filter((item) => `${item.title} ${item.type} ${item.owner} ${item.description}`.toLowerCase().includes(query));
  }, [searchQuery, workItems]);

  const projectItems = workItems.filter((item) => item.projectId === project.id);
  const projectItemIds = projectItems.map((item) => item.id);
  const projectIterations = iterations.filter((item) => item.projectId === project.id);
  const projectDefects = defects.filter((item) => projectItemIds.includes(item.workItemId));
  const editingTask = workItems.find((item) => item.id === editingTaskId);
  const taskProjectId = editingTask ? editingTask.projectId : project.id;
  const taskIterations = iterations.filter((item) => item.projectId === taskProjectId);
  const metrics = useMemo<DeliveryMetrics>(() => {
    const completedWorkItems = projectItems.filter((item) => item.status === "DONE").length;
    return {
      totalWorkItems: projectItems.length,
      completedWorkItems,
      openDefects: projectDefects.filter((item) => item.resolvedAt === "").length,
      activeIterations: projectIterations.filter((item) => item.status === "ACTIVE").length,
      releasedVersions: 0,
      completionRate: projectItems.length === 0 ? 0 : Math.round((completedWorkItems / projectItems.length) * 100),
    };
  }, [projectDefects, projectItems, projectIterations]);
  const portfolio = useMemo<PortfolioSummary>(() => {
    const completedWorkItemCount = workItems.filter((item) => item.status === "DONE").length;
    return {
      projectCount: projects.length,
      activeProjectCount: projects.filter((item) => item.status === "进行中").length,
      workItemCount: workItems.length,
      completedWorkItemCount,
      openDefectCount: defects.filter((item) => item.resolvedAt === "").length,
      deliveryRate: workItems.length === 0 ? 0 : Math.round((completedWorkItemCount / workItems.length) * 100),
    };
  }, [defects, projects, workItems]);
  const unreadCount = notices.filter((item) => !item.read).length;

  useEffect(() => {
    saveWorkspace({ projects, workItems, iterations, milestones, defects, comments, notices, focusItems, selectedProjectId, members });
  }, [comments, defects, focusItems, iterations, members, milestones, notices, projects, selectedProjectId, workItems]);

  useEffect(() => {
    document.documentElement.classList.toggle("dark", themeMode === "dark");
    localStorage.setItem(themeStorageKey, themeMode);
  }, [themeMode]);

  function refuse(allowed: boolean): boolean {
    if (allowed) return false;
    setNotice("当前角色不能执行这个操作。");
    return true;
  }

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

  function openCreateTask() {
    if (refuse(canWrite)) return;
    setEditingTaskId("");
    setTaskDraft(emptyTaskDraft(currentMember.id));
    setTaskOpen(true);
  }

  function openEditTask(item: DashboardWorkItem) {
    if (refuse(canWrite)) return;
    setEditingTaskId(item.id);
    setTaskDraft({ title: item.title, description: item.description, type: item.type, iterationId: item.iterationId, ownerId: item.ownerId, due: item.due, status: item.status, priority: item.priority });
    setTaskOpen(true);
  }

  function saveTask(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const title = taskDraft.title.trim();
    if (title === "") { setNotice("请输入任务名称。"); return; }
    if (refuse(canWrite)) return;
    const ownerMember = members.find((item) => item.id === taskDraft.ownerId);
    const owner = ownerMember ? ownerMember.name : "未分配";
    if (editingTaskId === "") {
      const item: DashboardWorkItem = { id: `workitem-${Date.now()}`, title, description: taskDraft.description.trim(), type: taskDraft.type, projectId: project.id, iterationId: taskDraft.iterationId, owner, ownerId: taskDraft.ownerId, due: taskDraft.due.trim(), status: "BACKLOG", priority: taskDraft.priority, progress: 0 };
      setWorkItems((items) => [item, ...items]);
      setNotices((items) => [createNotice("新任务已创建", `“${title}”已加入${project.name}。`), ...items]);
      setActiveKey("projects");
      setProjectView("tasks");
      setNotice(`“${title}”已创建，等待开始。`);
    } else {
      setWorkItems((items) => items.map((item) => item.id === editingTaskId ? { ...item, title, description: taskDraft.description.trim(), type: taskDraft.type, iterationId: taskDraft.iterationId, owner, ownerId: taskDraft.ownerId, due: taskDraft.due.trim(), priority: taskDraft.priority, status: taskDraft.status, progress: taskDraft.status === item.status ? item.progress : progressFor(taskDraft.status, item.progress) } : item));
      setNotices((items) => [createNotice("任务已更新", `“${title}”已更新。`), ...items]);
      setNotice(`“${title}”已更新。`);
    }
    setTaskOpen(false);
  }

  function deleteTask() {
    if (refuse(canWrite)) return;
    const current = workItems.find((item) => item.id === editingTaskId);
    if (!current) return;
    setWorkItems((items) => items.filter((item) => item.id !== editingTaskId));
    setDefects((items) => items.filter((item) => item.workItemId !== editingTaskId));
    setComments((items) => items.filter((item) => item.workItemId !== editingTaskId));
    setFocusItems((items) => items.filter((item) => item.workItemId !== editingTaskId));
    setNotices((items) => [createNotice("任务已删除", `“${current.title}”已删除。`), ...items]);
    setTaskOpen(false);
    setNotice(`“${current.title}”已删除。`);
  }

  function moveWorkItem(item: DashboardWorkItem, status: MoveStatus) {
    if (refuse(canWrite)) return;
    setWorkItems((items) => items.map((current) => current.id === item.id ? { ...current, status, progress: progressFor(status, current.progress) } : current));
    setNotices((items) => [createNotice("任务状态已更新", `“${item.title}”已改为${statusLabel[status]}。`), ...items]);
    setNotice(`“${item.title}”状态已更新。`);
  }

  function createIteration(input: { name: string; goal: string; startDate: string; endDate: string }) {
    if (refuse(canPlan)) return;
    const iteration: Iteration = { id: `iteration-${Date.now()}`, projectId: project.id, name: input.name, goal: input.goal, status: "PLANNED", startDate: input.startDate, endDate: input.endDate, createdAt: new Date().toISOString() };
    setIterations((items) => [iteration, ...items]);
    setNotices((items) => [createNotice("迭代已创建", `“${iteration.name}”已加入${project.name}。`), ...items]);
    setNotice(`迭代“${iteration.name}”已创建。`);
  }

  function updateIteration(iterationId: string, status: Iteration["status"]) {
    if (refuse(canPlan)) return;
    if (status === "ACTIVE" && iterations.some((item) => item.projectId === project.id && item.status === "ACTIVE" && item.id !== iterationId)) {
      setNotice("当前项目已有进行中的迭代，请先完成它。");
      return;
    }
    setIterations((items) => items.map((item) => item.id === iterationId ? { ...item, status } : item));
    setNotice(status === "ACTIVE" ? "迭代已开始。" : "迭代已完成。");
  }

  function createMilestone(input: { name: string; description: string; dueDate: string }) {
    if (refuse(canPlan)) return;
    const milestone: Milestone = { id: `milestone-${Date.now()}`, projectId: project.id, name: input.name, description: input.description, status: "PLANNED", dueDate: input.dueDate, createdAt: new Date().toISOString() };
    setMilestones((items) => [milestone, ...items]);
    setNotices((items) => [createNotice("里程碑已创建", `“${milestone.name}”已加入${project.name}。`), ...items]);
    setNotice(`里程碑“${milestone.name}”已创建。`);
  }

  function updateMilestone(milestoneId: string, status: Milestone["status"]) {
    if (refuse(canPlan)) return;
    setMilestones((items) => items.map((item) => item.id === milestoneId ? { ...item, status } : item));
    setNotice(status === "COMPLETED" ? "里程碑已完成。" : "里程碑已标为有风险。");
  }

  function createDefect(input: { workItemId: string; severity: Defect["severity"]; environment: string; reproduction: string }) {
    if (refuse(canWrite)) return;
    const defect: Defect = { id: `defect-${Date.now()}`, workItemId: input.workItemId, severity: input.severity, environment: input.environment, reproduction: input.reproduction, resolvedAt: "" };
    setDefects((items) => [defect, ...items]);
    setNotices((items) => [createNotice("缺陷已记录", `${severityLabel[input.severity]}：${input.environment}`), ...items]);
    setNotice("缺陷已记录。");
  }

  function closeDefect(defectId: string) {
    if (refuse(canWrite)) return;
    setDefects((items) => items.map((item) => item.id === defectId ? { ...item, resolvedAt: new Date().toISOString() } : item));
    setNotices((items) => [createNotice("缺陷已关闭", "一条缺陷已关闭。"), ...items]);
    setNotice("缺陷已关闭。");
  }

  function createComment(input: { workItemId: string; content: string }) {
    if (refuse(canWrite)) return;
    const target = workItems.find((item) => item.id === input.workItemId);
    const comment: DashboardComment = { id: `comment-${Date.now()}`, workItemId: input.workItemId, authorId: currentMember.name, content: input.content, createdAt: new Date().toISOString() };
    setComments((items) => [...items, comment]);
    setNotices((items) => [createNotice("新的讨论", `“${target ? target.title : "任务"}”有新讨论。`), ...items]);
    setNotice("讨论已发送。");
  }

  function readNotice(noticeId: string) {
    setNotices((items) => items.map((item) => item.id === noticeId ? { ...item, read: true, tone: "success" } : item));
    setNotice("通知已读。");
  }

  function toggleFocus(itemId: string) {
    if (refuse(canWrite)) return;
    setFocusItems((items) => items.map((item) => item.id === itemId ? { ...item, done: !item.done } : item));
    setNotice("重点事项状态已更新。");
  }

  function addFocus(workItemId: string) {
    if (refuse(canWrite)) return;
    const current = workItems.find((item) => item.id === workItemId);
    if (!current) return;
    if (focusItems.some((item) => item.workItemId === workItemId)) return;
    const ownerProject = projects.find((item) => item.id === current.projectId);
    setFocusItems((items) => [{ id: `focus-${Date.now()}`, title: current.title, context: `${ownerProject ? ownerProject.name : ""} · ${current.owner}`, due: current.due, priority: current.priority, done: false, workItemId }, ...items]);
    setNotice(`“${current.title}”已加入今日重点。`);
  }

  function removeFocus(itemId: string) {
    if (refuse(canWrite)) return;
    setFocusItems((items) => items.filter((item) => item.id !== itemId));
    setNotice("已移出今日重点。");
  }

  function openCreateProject() {
    if (refuse(canPlan)) return;
    setEditingProjectId("");
    setProjectDraft(emptyProjectDraft(currentMember.name));
    setProjectOpen(true);
  }

  function openEditProject() {
    if (refuse(canPlan)) return;
    setEditingProjectId(project.id);
    setProjectDraft({ name: project.name, description: project.description, status: project.status, due: project.due, owner: project.owner });
    setProjectOpen(true);
  }

  function saveProject(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const name = projectDraft.name.trim();
    if (name === "") { setNotice("请填写项目名称。"); return; }
    if (refuse(canPlan)) return;
    const description = projectDraft.description.trim();
    const due = projectDraft.due.trim();
    const owner = projectDraft.owner.trim() || currentMember.name;
    if (editingProjectId === "") {
      const item: DashboardProject = { id: `project-${Date.now()}`, name, description, status: projectDraft.status, progress: 0, due, owner, colorClassName: "bg-muted" };
      setProjects((items) => [...items, item]);
      setSelectedProjectId(item.id);
      setActiveKey("projects");
      setProjectView("overview");
      setNotice(`项目“${name}”已创建。`);
    } else {
      setProjects((items) => items.map((item) => item.id === editingProjectId ? { ...item, name, description, status: projectDraft.status, due, owner } : item));
      setNotice(`项目“${name}”已更新。`);
    }
    setProjectOpen(false);
  }

  function createMember(input: { name: string; login: string; password: string; role: MemberRole }) {
    if (refuse(canManage)) return;
    if (members.some((item) => item.login === input.login)) { setNotice("账号已存在。"); return; }
    const member: WorkspaceMember = { id: `member-${Date.now()}`, name: input.name, login: input.login, password: input.password, role: input.role };
    setMembers((items) => [...items, member]);
    setNotice(`已添加成员“${input.name}”。`);
  }

  function updateMember(member: WorkspaceMember) {
    if (refuse(canManage)) return;
    const current = members.find((item) => item.id === member.id);
    const managerCount = members.filter((item) => item.role === "管理").length;
    if (current && current.role === "管理" && member.role !== "管理" && managerCount === 1) { setNotice("至少保留一名管理。"); return; }
    setMembers((items) => items.map((item) => item.id === member.id ? member : item));
    setNotice("成员已更新。");
  }

  function deleteMember(targetId: string) {
    if (refuse(canManage)) return;
    if (targetId === currentMember.id) { setNotice("不能删除当前登录成员。"); return; }
    const target = members.find((item) => item.id === targetId);
    const managerCount = members.filter((item) => item.role === "管理").length;
    if (target && target.role === "管理" && managerCount === 1) { setNotice("至少保留一名管理。"); return; }
    setMembers((items) => items.filter((item) => item.id !== targetId));
    setNotice("成员已删除。");
  }

  function logout() {
    localStorage.removeItem("pms_access_token");
    localStorage.removeItem(memberStorageKey);
    setAccessToken("");
    setAuthenticated(false);
    setAccountOpen(false);
    setLoginNotice("已退出登录。");
  }

  function submitLogin(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const member = members.find((item) => item.login === login.trim() && item.password === password);
    if (!member) { setLoginNotice("账号或密码错误。"); return; }
    localStorage.setItem("pms_access_token", localToken);
    localStorage.setItem(memberStorageKey, member.id);
    setAccessToken(localToken);
    setMemberId(member.id);
    setAuthenticated(true);
    setNotice(`已进入本地工作区，当前角色是${member.role}。`);
  }

  function askAi(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const question = aiMessage.trim();
    if (question === "") { setNotice("请输入问题后再开始分析。"); return; }
    const blocked = projectItems.filter((item) => item.status === "BLOCKED").map((item) => item.title);
    const openDefects = projectDefects.filter((item) => item.resolvedAt === "").length;
    const blockedText = blocked.length === 0 ? "没有阻塞任务" : `阻塞任务：${blocked.join("、")}`;
    setAiAnswer(`已根据本地数据查看「${question}」。${project.name}完成率 ${metrics.completionRate}%，未关闭缺陷 ${openDefects} 个，${blockedText}。`);
    setAiUsage("本地整理，未连接模型。");
    setNotice("已根据本地数据完成分析。");
  }

  function createProposal() {
    const title = aiMessage.trim();
    if (title === "") { setNotice("请先输入要生成的工作项。"); return; }
    setProposalId(`proposal-${Date.now()}`);
    setProposalTitle(title);
    setProposalStatus("WAITING_APPROVAL");
    setNotice("已生成工作项提议，确认后才会创建。");
  }

  function confirmProposal() {
    if (proposalStatus !== "WAITING_APPROVAL" || proposalTitle.trim() === "") { setNotice("没有待确认的提议。"); return; }
    if (refuse(canWrite)) return;
    const title = proposalTitle.trim();
    const item: DashboardWorkItem = { id: `workitem-${Date.now()}`, title, description: "", type: "任务", projectId: project.id, iterationId: "", owner: currentMember.name, ownerId: currentMember.id, due: todayText(), status: "BACKLOG", priority: "中", progress: 0 };
    setWorkItems((items) => [item, ...items]);
    setNotices((items) => [createNotice("提议已执行", `“${title}”已加入${project.name}。`), ...items]);
    setProposalStatus("已执行");
    setActiveKey("projects");
    setProjectView("tasks");
    setNotice(`“${title}”已创建。`);
  }

  if (!authenticated || accessToken === "") return <LoginScreen login={login} password={password} notice={loginNotice} onLoginChange={setLogin} onPasswordChange={setPassword} onSubmit={submitLogin} />;

  return (
    <div className="flex h-svh overflow-hidden bg-background text-foreground">
      <aside className={`flex h-full shrink-0 flex-col border-r bg-sidebar text-sidebar-foreground transition-[width] duration-200 ${sidebarExpanded ? "w-60" : "w-14"}`}>
        <div className="flex h-12 items-center gap-2 border-b px-3">
          <div className="flex size-8 shrink-0 items-center justify-center rounded-md border text-sm font-semibold">P</div>
          {sidebarExpanded && <p className="text-sm font-semibold">PMS</p>}
        </div>
        <div className="flex-1 overflow-y-auto px-2 py-3">
          {sidebarExpanded && <p className="px-2 pb-2 text-xs text-muted-foreground">工作区</p>}
          <nav className="flex flex-col gap-1">
            {navKeys.map((key) => {
              const item = navigation[key];
              const Icon = item.icon;
              return (
                <button key={key} type="button" title={item.label} onClick={() => selectNav(key)} className={cn("flex h-8 items-center gap-2 rounded-md px-2 text-sm", activeKey === key ? "bg-sidebar-accent font-medium text-sidebar-accent-foreground" : "hover:bg-sidebar-accent", sidebarExpanded ? "" : "justify-center")}>
                  <Icon className="size-4" />
                  {sidebarExpanded && <span>{item.label}</span>}
                </button>
              );
            })}
          </nav>
          {sidebarExpanded && <p className="mt-6 px-2 pb-2 text-xs text-muted-foreground">项目</p>}
          <div className="mt-1 flex flex-col gap-1">
            {projects.map((item) => (
              <button key={item.id} type="button" title={item.name} onClick={() => selectProject(item.id)} className={cn("flex h-8 items-center gap-2 rounded-md px-2 text-left text-sm", selectedProjectId === item.id && activeKey === "projects" ? "bg-sidebar-accent font-medium" : "hover:bg-sidebar-accent", sidebarExpanded ? "" : "justify-center")}>
                <span className="flex size-5 shrink-0 items-center justify-center rounded bg-muted text-[11px]">{item.name.slice(0, 1)}</span>
                {sidebarExpanded && <span className="truncate">{item.name}</span>}
              </button>
            ))}
          </div>
        </div>
        <div className="relative border-t p-2" onPointerDown={(event) => event.stopPropagation()}>
          {accountOpen && (
            <button type="button" onClick={logout} className="absolute bottom-full left-2 z-20 mb-1 flex h-8 min-w-28 items-center gap-2 rounded-md border bg-popover px-2 text-sm shadow-sm hover:bg-accent">
              <LogOut className="size-4" />
              <span>退出登录</span>
            </button>
          )}
          <button type="button" title={currentMember.name} onClick={() => setAccountOpen((open) => !open)} className={cn("flex w-full items-center gap-2 rounded-md px-2 py-1.5 text-left hover:bg-sidebar-accent", sidebarExpanded ? "" : "justify-center")}>
            <span className="flex size-6 shrink-0 items-center justify-center rounded-full bg-muted text-xs">{currentMember.name.slice(0, 1)}</span>
            {sidebarExpanded && (
              <span className="min-w-0">
                <span className="block truncate text-sm">{currentMember.name}</span>
                <span className="block truncate text-xs text-muted-foreground">{currentMember.login} · {currentMember.role}</span>
              </span>
            )}
          </button>
        </div>
      </aside>
      <main className="min-w-0 flex-1 overflow-y-auto">
        <header className="sticky top-0 z-10 flex h-12 items-center justify-between border-b bg-background px-4">
          <div className="flex items-center gap-2">
            <Button variant="ghost" size="icon" aria-label="切换导航" onClick={() => setSidebarExpanded((expanded) => !expanded)}>{sidebarExpanded ? <PanelLeftClose /> : <PanelLeftOpen />}</Button>
            <h1 className="text-sm font-semibold">{navigation[activeKey].label}</h1>
          </div>
          <div className="flex items-center gap-2">
            <Button variant="outline" size="sm" onClick={() => setSearchOpen(true)}><Search />搜索</Button>
            <Button variant="outline" size="sm" onClick={() => setAiOpen(true)}>助手</Button>
            <Button variant="ghost" size="icon" aria-label="切换主题" onClick={() => setThemeMode((mode) => mode === "dark" ? "light" : "dark")}>{themeMode === "dark" ? <Sun /> : <Moon />}</Button>
            <Button variant="ghost" size="icon" className="relative" aria-label={unreadCount === 0 ? "通知" : `通知 ${unreadCount}`} onClick={() => selectNav("inbox")}>
              <Bell />
              {unreadCount > 0 && <span className="absolute -top-1 -right-1 flex h-4 min-w-4 items-center justify-center rounded-full bg-destructive px-1 text-[10px] text-white">{unreadCount}</span>}
            </Button>
            {canWrite && <Button size="sm" onClick={openCreateTask}><Plus />新建任务</Button>}
          </div>
        </header>
        <div className="border-b px-4 py-2 text-sm text-muted-foreground">{notice}</div>
        <DashboardView activeKey={activeKey} project={project} projects={projects} workItems={workItems} iterations={iterations} milestones={milestones} defects={defects} metrics={metrics} portfolio={portfolio} comments={comments} discussionWorkItemId={discussionWorkItemId} focusItems={focusItems} notices={notices} projectView={projectView} members={members} currentMemberId={currentMember.id} canWrite={canWrite} canPlan={canPlan} canManage={canManage} onProjectChange={selectProject} onProjectViewChange={setProjectView} onToggleFocus={toggleFocus} onAddFocus={addFocus} onRemoveFocus={removeFocus} onMoveWorkItem={moveWorkItem} onEditWorkItem={openEditTask} onReadNotice={readNotice} onDiscussionWorkItemChange={setDiscussionWorkItemId} onCreateIteration={createIteration} onUpdateIteration={updateIteration} onCreateMilestone={createMilestone} onUpdateMilestone={updateMilestone} onCreateDefect={createDefect} onCloseDefect={closeDefect} onCreateComment={createComment} onOpenCreateProject={openCreateProject} onOpenEditProject={openEditProject} onCreateMember={createMember} onUpdateMember={updateMember} onDeleteMember={deleteMember} onFeedback={setNotice} />
      </main>
      <SearchDialog open={searchOpen} query={searchQuery} results={searchResults} onQueryChange={setSearchQuery} onClose={() => setSearchOpen(false)} onSelect={(item) => { setSelectedProjectId(item.projectId); setActiveKey("projects"); setProjectView("tasks"); setSearchOpen(false); setNotice(`已打开“${item.title}”。`); }} />
      <TaskDialog open={taskOpen} editing={editingTaskId !== ""} draft={taskDraft} members={members} iterations={taskIterations} onDraftChange={setTaskDraft} onClose={() => setTaskOpen(false)} onSubmit={saveTask} onDelete={deleteTask} />
      <ProjectDialog open={projectOpen} editing={editingProjectId !== ""} draft={projectDraft} members={members} onDraftChange={setProjectDraft} onClose={() => setProjectOpen(false)} onSubmit={saveProject} />
      <AiDialog open={aiOpen} message={aiMessage} answer={aiAnswer} proposalId={proposalId} proposalTitle={proposalTitle} proposalStatus={proposalStatus} usage={aiUsage} loading={false} onMessageChange={setAiMessage} onClose={() => setAiOpen(false)} onSubmit={askAi} onCreateProposal={createProposal} onConfirmProposal={confirmProposal} />
    </div>
  );
}
