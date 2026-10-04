import { useEffect, useState, type FormEvent } from "react";
import type { ApiResponse } from "@pms/api-client";
import type { Defect, DeliveryMetrics, Iteration, Milestone, PortfolioSummary, Project, WorkItem } from "@pms/domain";
import { Badge, Button, Card, CardContent, CardDescription, CardHeader, CardTitle, cn, Input, Label, Select, Table, TableBody, TableCell, TableHead, TableHeader, TableRow, Tabs, TabsList, TabsTrigger } from "@pms/ui";

const apiBaseUrl = "http://localhost:3100";
const memberId = "member-demo";
const emptyMetrics: DeliveryMetrics = { totalWorkItems: 0, completedWorkItems: 0, openDefects: 0, activeIterations: 0, releasedVersions: 0, completionRate: 0 };
const emptyPortfolio: PortfolioSummary = { projectCount: 0, activeProjectCount: 0, workItemCount: 0, completedWorkItemCount: 0, openDefectCount: 0, deliveryRate: 0 };

type LoginResponse = { accessToken: string };
type WebView = "tasks" | "board" | "iterations" | "milestones" | "risks" | "discussion" | "inbox";
type WebComment = { id: string; workItemId: string; authorId: string; content: string; createdAt: string };
type WebNotice = { id: string; title: string; content: string; read: boolean; createdAt: string };
type MoveStatus = "IN_PROGRESS" | "IN_REVIEW" | "DONE";

const viewLabels: { key: WebView; label: string }[] = [
  { key: "tasks", label: "任务" },
  { key: "board", label: "看板" },
  { key: "iterations", label: "迭代" },
  { key: "milestones", label: "里程碑" },
  { key: "risks", label: "风险" },
  { key: "discussion", label: "讨论" },
  { key: "inbox", label: "通知" },
];
const boardStatuses: WorkItem["status"][] = ["BACKLOG", "IN_PROGRESS", "IN_REVIEW", "DONE"];
const statusLabel: Record<WorkItem["status"], string> = { BACKLOG: "待处理", READY: "待处理", IN_PROGRESS: "进行中", IN_REVIEW: "待验收", DONE: "已完成", CANCELLED: "已取消" };
const statusVariant = { BACKLOG: "secondary", READY: "secondary", IN_PROGRESS: "default", IN_REVIEW: "outline", DONE: "secondary", CANCELLED: "destructive" } as const;
const priorityLabel = { URGENT: "紧急", HIGH: "高", MEDIUM: "中", LOW: "低" } as const;
const priorityVariant = { URGENT: "destructive", HIGH: "destructive", MEDIUM: "outline", LOW: "secondary" } as const;
const typeLabel = { REQUIREMENT: "需求", TASK: "任务", BUG: "缺陷", SUBTASK: "子任务" } as const;
const projectStatusLabel = { PLANNING: "规划中", ACTIVE: "进行中", AT_RISK: "有风险", BLOCKED: "已阻塞", COMPLETED: "已完成", ARCHIVED: "已归档" } as const;
const iterationStatusLabel = { PLANNED: "计划中", ACTIVE: "进行中", COMPLETED: "已完成" } as const;
const milestoneStatusLabel = { PLANNED: "计划中", AT_RISK: "有风险", COMPLETED: "已完成" } as const;
const severityLabel = { CRITICAL: "紧急", MAJOR: "严重", MINOR: "一般", TRIVIAL: "轻微" } as const;

function today(): string {
  return new Date().toISOString().slice(0, 10);
}

function nextMove(status: WorkItem["status"]): { label: string; status: MoveStatus } | "" {
  if (status === "BACKLOG" || status === "READY") return { label: "开始", status: "IN_PROGRESS" };
  if (status === "IN_PROGRESS") return { label: "提交验收", status: "IN_REVIEW" };
  if (status === "IN_REVIEW") return { label: "完成", status: "DONE" };
  return "";
}

function ConnectedWebApp() {
  const [accessToken, setAccessToken] = useState(() => localStorage.getItem("pms_access_token") || "");
  const [login, setLogin] = useState("demo");
  const [password, setPassword] = useState("demo");
  const [notice, setNotice] = useState("准备好开始今天的工作。");
  const [projects, setProjects] = useState<Project[]>([]);
  const [workItems, setWorkItems] = useState<WorkItem[]>([]);
  const [iterations, setIterations] = useState<Iteration[]>([]);
  const [milestones, setMilestones] = useState<Milestone[]>([]);
  const [defects, setDefects] = useState<Defect[]>([]);
  const [metrics, setMetrics] = useState<DeliveryMetrics>(emptyMetrics);
  const [portfolio, setPortfolio] = useState<PortfolioSummary>(emptyPortfolio);
  const [comments, setComments] = useState<WebComment[]>([]);
  const [notices, setNotices] = useState<WebNotice[]>([]);
  const [selectedProjectId, setSelectedProjectId] = useState("");
  const [discussionWorkItemId, setDiscussionWorkItemId] = useState("");
  const [view, setView] = useState<WebView>("tasks");
  const [taskTitle, setTaskTitle] = useState("");
  const [iterationName, setIterationName] = useState("");
  const [iterationGoal, setIterationGoal] = useState("");
  const [iterationStart, setIterationStart] = useState(today);
  const [iterationEnd, setIterationEnd] = useState(today);
  const [milestoneName, setMilestoneName] = useState("");
  const [milestoneDescription, setMilestoneDescription] = useState("");
  const [milestoneDue, setMilestoneDue] = useState(today);
  const [defectWorkItemId, setDefectWorkItemId] = useState("");
  const [severity, setSeverity] = useState<Defect["severity"]>("MAJOR");
  const [environment, setEnvironment] = useState("");
  const [reproduction, setReproduction] = useState("");
  const [comment, setComment] = useState("");

  const selectedProject = projects.find((project) => project.id === selectedProjectId);
  const discussionItem = workItems.find((item) => item.id === discussionWorkItemId) || workItems[0];
  const selectedDefectWorkItemId = defectWorkItemId || (workItems[0] ? workItems[0].id : "");

  function clearSession(message: string) {
    localStorage.removeItem("pms_access_token");
    setAccessToken("");
    setNotice(message);
  }

  useEffect(() => {
    if (accessToken === "") return;
    fetch(`${apiBaseUrl}/api/projects?workspaceId=workspace-demo`, { headers: { Authorization: `Bearer ${accessToken}` } }).then(async (response) => {
      if (response.status === 401) { clearSession("登录已失效，请重新登录。"); return; }
      if (!response.ok) { setNotice("项目加载失败。"); return; }
      const result = (await response.json()) as ApiResponse<Project[]>;
      setProjects(result.data);
      setSelectedProjectId((current) => current || (result.data[0] ? result.data[0].id : ""));
    });
    fetch(`${apiBaseUrl}/api/portfolio/summary?workspaceId=workspace-demo`, { headers: { Authorization: `Bearer ${accessToken}` } }).then(async (response) => {
      if (!response.ok) return;
      const result = (await response.json()) as ApiResponse<PortfolioSummary>;
      setPortfolio(result.data);
    });
    fetch(`${apiBaseUrl}/api/notifications?memberId=${memberId}`, { headers: { Authorization: `Bearer ${accessToken}` } }).then(async (response) => {
      if (!response.ok) return;
      const result = (await response.json()) as ApiResponse<WebNotice[]>;
      setNotices(result.data);
    });
  }, [accessToken]);

  useEffect(() => {
    if (accessToken === "" || selectedProjectId === "") return;
    fetch(`${apiBaseUrl}/api/work-items?workspaceId=workspace-demo&projectId=${selectedProjectId}`, { headers: { Authorization: `Bearer ${accessToken}` } }).then(async (response) => {
      if (response.status === 401) { clearSession("登录已失效，请重新登录。"); return; }
      if (!response.ok) { setNotice("任务加载失败。"); return; }
      const result = (await response.json()) as ApiResponse<WorkItem[]>;
      setWorkItems(result.data);
      setDiscussionWorkItemId((current) => result.data.some((item) => item.id === current) ? current : (result.data[0] ? result.data[0].id : ""));
    });
    fetch(`${apiBaseUrl}/api/projects/${selectedProjectId}/delivery`, { headers: { Authorization: `Bearer ${accessToken}` } }).then(async (response) => {
      if (!response.ok) return;
      const result = (await response.json()) as ApiResponse<{ iterations: Iteration[]; milestones: Milestone[]; defects: Defect[] }>;
      setIterations(result.data.iterations);
      setMilestones(result.data.milestones);
      setDefects(result.data.defects);
    });
    fetch(`${apiBaseUrl}/api/projects/${selectedProjectId}/metrics`, { headers: { Authorization: `Bearer ${accessToken}` } }).then(async (response) => {
      if (!response.ok) return;
      const result = (await response.json()) as ApiResponse<DeliveryMetrics>;
      setMetrics(result.data);
    });
  }, [accessToken, selectedProjectId]);

  useEffect(() => {
    if (accessToken === "" || discussionWorkItemId === "") return;
    fetch(`${apiBaseUrl}/api/work-items/${discussionWorkItemId}/comments`, { headers: { Authorization: `Bearer ${accessToken}` } }).then(async (response) => {
      if (!response.ok) return;
      const result = (await response.json()) as ApiResponse<WebComment[]>;
      setComments(result.data);
    });
  }, [accessToken, discussionWorkItemId]);

  async function submitLogin(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const response = await fetch(`${apiBaseUrl}/api/auth/login`, { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ login, password }) });
    if (!response.ok) { setNotice("账号或密码错误，或服务端尚未启动。"); return; }
    const result = (await response.json()) as LoginResponse;
    localStorage.setItem("pms_access_token", result.accessToken);
    setAccessToken(result.accessToken);
    setNotice("已进入工作区。");
  }

  async function createTask(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (taskTitle.trim() === "" || selectedProjectId === "") { setNotice("请选择项目并输入任务名称。"); return; }
    const response = await fetch(`${apiBaseUrl}/api/work-items`, { method: "POST", headers: { "Content-Type": "application/json", Authorization: `Bearer ${accessToken}` }, body: JSON.stringify({ workspaceId: "workspace-demo", projectId: selectedProjectId, title: taskTitle.trim(), description: "", type: "TASK", priority: "MEDIUM", reporterId: memberId }) });
    if (response.status === 401) { clearSession("登录已失效，请重新登录。"); return; }
    if (!response.ok) { setNotice("任务创建失败。"); return; }
    const result = (await response.json()) as ApiResponse<WorkItem>;
    setWorkItems((items) => [result.data, ...items]);
    setTaskTitle("");
    setNotice(`“${result.data.title}”已创建。`);
  }

  async function moveTask(item: WorkItem, status: MoveStatus) {
    const response = await fetch(`${apiBaseUrl}/api/work-items/${item.id}`, { method: "PATCH", headers: { "Content-Type": "application/json", Authorization: `Bearer ${accessToken}` }, body: JSON.stringify({ status, priority: item.priority, assigneeId: item.assigneeId || memberId, dueDate: item.dueDate || today() }) });
    if (!response.ok) { setNotice("任务状态更新失败。"); return; }
    const result = (await response.json()) as ApiResponse<WorkItem>;
    setWorkItems((items) => items.map((current) => current.id === result.data.id ? result.data : current));
    if (status === "DONE") {
      setMetrics((current) => {
        const completedWorkItems = current.completedWorkItems + 1;
        const completionRate = current.totalWorkItems === 0 ? 0 : Math.round((completedWorkItems / current.totalWorkItems) * 100);
        return { ...current, completedWorkItems, completionRate };
      });
    }
    setNotice(`“${result.data.title}”状态已更新。`);
  }

  async function createIteration(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (iterationName.trim() === "" || iterationGoal.trim() === "") { setNotice("请填写迭代名称和目标。"); return; }
    const response = await fetch(`${apiBaseUrl}/api/projects/${selectedProjectId}/iterations`, { method: "POST", headers: { "Content-Type": "application/json", Authorization: `Bearer ${accessToken}` }, body: JSON.stringify({ name: iterationName.trim(), goal: iterationGoal.trim(), startDate: iterationStart, endDate: iterationEnd }) });
    if (!response.ok) { setNotice("迭代创建失败。"); return; }
    const result = (await response.json()) as ApiResponse<Iteration>;
    setIterations((items) => [result.data, ...items]);
    setIterationName("");
    setIterationGoal("");
    setNotice(`迭代“${result.data.name}”已创建。`);
  }

  async function createMilestone(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (milestoneName.trim() === "") { setNotice("请填写里程碑名称。"); return; }
    const response = await fetch(`${apiBaseUrl}/api/projects/${selectedProjectId}/milestones`, { method: "POST", headers: { "Content-Type": "application/json", Authorization: `Bearer ${accessToken}` }, body: JSON.stringify({ name: milestoneName.trim(), description: milestoneDescription.trim(), dueDate: milestoneDue }) });
    if (!response.ok) { setNotice("里程碑创建失败。"); return; }
    const result = (await response.json()) as ApiResponse<Milestone>;
    setMilestones((items) => [result.data, ...items]);
    setMilestoneName("");
    setMilestoneDescription("");
    setNotice(`里程碑“${result.data.name}”已创建。`);
  }

  async function createDefect(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (selectedDefectWorkItemId === "" || environment.trim() === "" || reproduction.trim() === "") { setNotice("请选择任务并填写缺陷环境和复现步骤。"); return; }
    const response = await fetch(`${apiBaseUrl}/api/work-items/${selectedDefectWorkItemId}/defects`, { method: "POST", headers: { "Content-Type": "application/json", Authorization: `Bearer ${accessToken}` }, body: JSON.stringify({ severity, environment: environment.trim(), reproduction: reproduction.trim() }) });
    if (!response.ok) { setNotice("缺陷记录失败。"); return; }
    const result = (await response.json()) as ApiResponse<Defect>;
    setDefects((items) => [result.data, ...items]);
    setMetrics((current) => ({ ...current, openDefects: current.openDefects + 1 }));
    setEnvironment("");
    setReproduction("");
    setNotice("缺陷已记录。");
  }

  async function createComment(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!discussionItem || comment.trim() === "") { setNotice("请选择任务并填写讨论内容。"); return; }
    const response = await fetch(`${apiBaseUrl}/api/work-items/${discussionItem.id}/comments`, { method: "POST", headers: { "Content-Type": "application/json", Authorization: `Bearer ${accessToken}` }, body: JSON.stringify({ authorId: memberId, content: comment.trim() }) });
    if (!response.ok) { setNotice("讨论发送失败。"); return; }
    const result = (await response.json()) as ApiResponse<WebComment>;
    setComments((items) => [...items, result.data]);
    setComment("");
    setNotice("讨论已发送。");
  }

  async function readNotice(noticeId: string) {
    const response = await fetch(`${apiBaseUrl}/api/notifications/${noticeId}/read`, { method: "PATCH", headers: { Authorization: `Bearer ${accessToken}` } });
    if (!response.ok) { setNotice("通知更新失败。"); return; }
    const result = (await response.json()) as ApiResponse<WebNotice>;
    setNotices((items) => items.map((item) => item.id === result.data.id ? result.data : item));
    setNotice("通知已读。");
  }

  const discussionComments = comments.filter((item) => discussionItem && item.workItemId === discussionItem.id);
  const noticeIsError = notice.includes("错误") || notice.includes("失败") || notice.includes("失效");
  const summary = [
    { label: "项目", value: String(portfolio.projectCount) },
    { label: "当前项目任务", value: String(metrics.totalWorkItems) },
    { label: "完成率", value: `${metrics.completionRate}%` },
    { label: "未关闭缺陷", value: String(portfolio.openDefectCount) },
  ];

  function selectView(value: string) {
    const next = viewLabels.find((item) => item.key === value);
    if (!next) return;
    setView(next.key);
  }

  if (accessToken === "") {
    return (
      <main className="flex min-h-svh items-center justify-center bg-background p-6">
        <Card className="w-full max-w-sm">
          <CardHeader>
            <CardTitle>登录</CardTitle>
            <CardDescription className={noticeIsError ? "text-destructive" : ""}>{notice}</CardDescription>
          </CardHeader>
          <CardContent>
            <form className="flex flex-col gap-4" onSubmit={submitLogin}>
              <Label className="flex flex-col items-stretch gap-2">账号<Input value={login} onChange={(event) => setLogin(event.target.value)} /></Label>
              <Label className="flex flex-col items-stretch gap-2">密码<Input type="password" value={password} onChange={(event) => setPassword(event.target.value)} /></Label>
              <Button type="submit">进入工作区</Button>
              <p className="text-center text-xs text-muted-foreground">演示账号 demo / demo</p>
            </form>
          </CardContent>
        </Card>
      </main>
    );
  }

  return (
    <main className="flex h-svh min-w-[960px] bg-background text-foreground">
      <aside className="flex w-56 shrink-0 flex-col border-r bg-sidebar">
        <div className="flex h-12 items-center border-b px-4 text-sm font-semibold">PMS</div>
        <div className="flex-1 overflow-y-auto p-2">
          <p className="px-2 py-2 text-xs text-muted-foreground">项目</p>
          {projects.length === 0 && <p className="px-2 text-sm text-muted-foreground">没有项目。</p>}
          {projects.map((project) => (
            <button key={project.id} type="button" onClick={() => setSelectedProjectId(project.id)} className={cn("flex h-8 w-full items-center rounded-md px-2 text-left text-sm", project.id === selectedProjectId ? "bg-sidebar-accent font-medium" : "hover:bg-sidebar-accent")}>
              <span className="truncate">{project.name}</span>
            </button>
          ))}
        </div>
        <div className="border-t p-2">
          <Button variant="ghost" className="w-full justify-start" onClick={() => clearSession("已退出登录。")}>退出登录</Button>
        </div>
      </aside>
      <section className="flex min-w-0 flex-1 flex-col">
        <header className="flex h-12 items-center justify-between border-b px-6">
          <div className="flex items-center gap-2">
            <h1 className="text-sm font-semibold">{selectedProject ? selectedProject.name : "项目工作台"}</h1>
            {selectedProject && <Badge variant="secondary">{projectStatusLabel[selectedProject.status]}</Badge>}
          </div>
        </header>
        <p className={`border-b px-6 py-2 text-sm ${noticeIsError ? "text-destructive" : "text-muted-foreground"}`}>{notice}</p>
        <div className="flex-1 overflow-auto p-6">
          <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
            {summary.map((item) => (
              <Card key={item.label}>
                <CardHeader>
                  <CardDescription>{item.label}</CardDescription>
                  <CardTitle className="text-2xl">{item.value}</CardTitle>
                </CardHeader>
              </Card>
            ))}
          </div>
          <Tabs className="mt-6" value={view} onValueChange={selectView}>
            <TabsList className="h-auto flex-wrap">
              {viewLabels.map((item) => <TabsTrigger key={item.key} value={item.key}>{item.label}</TabsTrigger>)}
            </TabsList>
          </Tabs>

          {view === "tasks" && (
            <div className="mt-4 flex flex-col gap-4">
              <form className="flex gap-2" onSubmit={createTask}>
                <Input value={taskTitle} onChange={(event) => setTaskTitle(event.target.value)} placeholder="任务名称" />
                <Button type="submit">新建任务</Button>
              </form>
              <div className="rounded-md border">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>标题</TableHead>
                      <TableHead>类型</TableHead>
                      <TableHead>优先级</TableHead>
                      <TableHead>截止</TableHead>
                      <TableHead>状态</TableHead>
                      <TableHead>操作</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {workItems.length === 0 && <TableRow><TableCell colSpan={6} className="h-20 text-center text-muted-foreground">当前项目还没有任务。</TableCell></TableRow>}
                    {workItems.map((item) => {
                      const move = nextMove(item.status);
                      return (
                        <TableRow key={item.id}>
                          <TableCell className="font-medium">{item.title}</TableCell>
                          <TableCell>{typeLabel[item.type]}</TableCell>
                          <TableCell><Badge variant={priorityVariant[item.priority]}>{priorityLabel[item.priority]}</Badge></TableCell>
                          <TableCell>{item.dueDate || "未设置"}</TableCell>
                          <TableCell><Badge variant={statusVariant[item.status]}>{statusLabel[item.status]}</Badge></TableCell>
                          <TableCell>{move !== "" && <Button type="button" variant="outline" size="sm" onClick={() => moveTask(item, move.status)}>{move.label}</Button>}</TableCell>
                        </TableRow>
                      );
                    })}
                  </TableBody>
                </Table>
              </div>
            </div>
          )}

          {view === "board" && (
            <div className="mt-4 grid gap-4 lg:grid-cols-4">
              {boardStatuses.map((status) => (
                <Card key={status}>
                  <CardHeader><CardTitle>{statusLabel[status]}</CardTitle></CardHeader>
                  <CardContent className="flex flex-col gap-2">
                    {workItems.filter((item) => item.status === status || (status === "BACKLOG" && item.status === "READY")).map((item) => {
                      const move = nextMove(item.status);
                      return (
                        <div key={item.id} className="rounded-md border p-3">
                          <p className="text-sm font-medium">{item.title}</p>
                          <p className="mt-1 text-xs text-muted-foreground">{item.assigneeId || "未分配"}</p>
                          {move !== "" && <Button type="button" variant="outline" size="sm" className="mt-3" onClick={() => moveTask(item, move.status)}>{move.label}</Button>}
                        </div>
                      );
                    })}
                  </CardContent>
                </Card>
              ))}
            </div>
          )}

          {view === "iterations" && (
            <div className="mt-4 flex flex-col gap-4">
              <form className="grid gap-3 md:grid-cols-2" onSubmit={createIteration}>
                <Input value={iterationName} onChange={(event) => setIterationName(event.target.value)} placeholder="迭代名称" />
                <Input value={iterationGoal} onChange={(event) => setIterationGoal(event.target.value)} placeholder="目标" />
                <Input value={iterationStart} onChange={(event) => setIterationStart(event.target.value)} />
                <Input value={iterationEnd} onChange={(event) => setIterationEnd(event.target.value)} />
                <Button type="submit" variant="outline" className="md:col-span-2 md:justify-self-start">创建迭代</Button>
              </form>
              <div className="rounded-md border">
                <Table>
                  <TableHeader><TableRow><TableHead>名称</TableHead><TableHead>目标</TableHead><TableHead>时间</TableHead><TableHead>状态</TableHead></TableRow></TableHeader>
                  <TableBody>
                    {iterations.length === 0 && <TableRow><TableCell colSpan={4} className="h-20 text-center text-muted-foreground">当前项目还没有迭代。</TableCell></TableRow>}
                    {iterations.map((item) => (
                      <TableRow key={item.id}>
                        <TableCell className="font-medium">{item.name}</TableCell>
                        <TableCell>{item.goal}</TableCell>
                        <TableCell>{item.startDate} 至 {item.endDate}</TableCell>
                        <TableCell><Badge variant={item.status === "ACTIVE" ? "default" : "secondary"}>{iterationStatusLabel[item.status]}</Badge></TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            </div>
          )}

          {view === "milestones" && (
            <div className="mt-4 flex flex-col gap-4">
              <form className="grid gap-3 md:grid-cols-2" onSubmit={createMilestone}>
                <Input value={milestoneName} onChange={(event) => setMilestoneName(event.target.value)} placeholder="里程碑名称" />
                <Input value={milestoneDescription} onChange={(event) => setMilestoneDescription(event.target.value)} placeholder="说明" />
                <Input value={milestoneDue} onChange={(event) => setMilestoneDue(event.target.value)} />
                <Button type="submit" variant="outline" className="md:col-span-2 md:justify-self-start">创建里程碑</Button>
              </form>
              <div className="rounded-md border">
                <Table>
                  <TableHeader><TableRow><TableHead>名称</TableHead><TableHead>说明</TableHead><TableHead>截止</TableHead><TableHead>状态</TableHead></TableRow></TableHeader>
                  <TableBody>
                    {milestones.length === 0 && <TableRow><TableCell colSpan={4} className="h-20 text-center text-muted-foreground">当前项目还没有里程碑。</TableCell></TableRow>}
                    {milestones.map((item) => (
                      <TableRow key={item.id}>
                        <TableCell className="font-medium">{item.name}</TableCell>
                        <TableCell>{item.description}</TableCell>
                        <TableCell>{item.dueDate}</TableCell>
                        <TableCell><Badge variant={item.status === "AT_RISK" ? "destructive" : "secondary"}>{milestoneStatusLabel[item.status]}</Badge></TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            </div>
          )}

          {view === "risks" && (
            <div className="mt-4 flex flex-col gap-4">
              <form className="grid gap-3 md:grid-cols-2" onSubmit={createDefect}>
                <Select value={selectedDefectWorkItemId} onChange={(event) => setDefectWorkItemId(event.target.value)}>{workItems.map((item) => <option key={item.id} value={item.id}>{item.title}</option>)}</Select>
                <Select value={severity} onChange={(event) => setSeverity(event.target.value as Defect["severity"])}>
                  <option value="CRITICAL">紧急</option>
                  <option value="MAJOR">严重</option>
                  <option value="MINOR">一般</option>
                  <option value="TRIVIAL">轻微</option>
                </Select>
                <Input value={environment} onChange={(event) => setEnvironment(event.target.value)} placeholder="环境" />
                <Input value={reproduction} onChange={(event) => setReproduction(event.target.value)} placeholder="复现步骤" />
                <Button type="submit" variant="outline" className="md:col-span-2 md:justify-self-start">记录缺陷</Button>
              </form>
              {defects.length === 0 && <p className="text-sm text-muted-foreground">当前项目没有未关闭缺陷。</p>}
              {defects.length > 0 && (
                <div className="rounded-md border">
                  <Table>
                    <TableHeader><TableRow><TableHead>严重程度</TableHead><TableHead>环境</TableHead><TableHead>复现</TableHead></TableRow></TableHeader>
                    <TableBody>
                      {defects.map((item) => (
                        <TableRow key={item.id}>
                          <TableCell>{severityLabel[item.severity]}</TableCell>
                          <TableCell>{item.environment}</TableCell>
                          <TableCell>{item.reproduction}</TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>
              )}
            </div>
          )}

          {view === "discussion" && (
            <div className="mt-4 flex flex-col gap-4">
              <Select value={discussionItem ? discussionItem.id : ""} onChange={(event) => setDiscussionWorkItemId(event.target.value)}>{workItems.map((item) => <option key={item.id} value={item.id}>{item.title}</option>)}</Select>
              {discussionComments.length === 0 && <p className="text-sm text-muted-foreground">这条任务还没有讨论。</p>}
              {discussionComments.map((item) => (
                <div key={item.id} className="rounded-md border px-3 py-2">
                  <p className="text-sm">{item.content}</p>
                  <p className="mt-1 text-xs text-muted-foreground">{item.authorId} · {item.createdAt.slice(0, 16).replace("T", " ")}</p>
                </div>
              ))}
              <form className="flex gap-2" onSubmit={createComment}>
                <Input value={comment} onChange={(event) => setComment(event.target.value)} placeholder="写下讨论内容" />
                <Button type="submit">发送</Button>
              </form>
            </div>
          )}

          {view === "inbox" && (
            <div className="mt-4 divide-y rounded-md border">
              {notices.length === 0 && <p className="px-4 py-8 text-sm text-muted-foreground">没有新的通知。</p>}
              {notices.map((item) => (
                <button key={item.id} type="button" onClick={() => readNotice(item.id)} className="flex w-full items-start gap-3 px-4 py-3 text-left hover:bg-muted">
                  <span className="min-w-0 flex-1">
                    <span className={`block text-sm ${item.read ? "text-muted-foreground" : "font-medium"}`}>{item.title}</span>
                    <span className="mt-1 block text-xs text-muted-foreground">{item.content}</span>
                  </span>
                  <span className="text-xs text-muted-foreground">{item.read ? "已读" : "未读"}</span>
                </button>
              ))}
            </div>
          )}
        </div>
      </section>
    </main>
  );
}

export default function App() {
  return <ConnectedWebApp />;
}
