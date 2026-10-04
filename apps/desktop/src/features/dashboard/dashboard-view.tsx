import { useState, type FormEvent } from "react";
import { CheckCircle2 } from "lucide-react";
import type { Defect, DeliveryMetrics, Iteration, Milestone, PortfolioSummary } from "@pms/domain";
import { Badge, Button, Card, CardContent, CardDescription, CardHeader, CardTitle, Input, Label, Progress, Select, Table, TableBody, TableCell, TableHead, TableHeader, TableRow, Tabs, TabsList, TabsTrigger } from "@pms/ui";
import { memberName, memberRoles, navigation, priorityTone, projectViewLabels, severityLabel, statusLabel, statusTone } from "./dashboard-data";
import type { DashboardComment, DashboardNotice, DashboardProject, DashboardWorkItem, FocusItem, MemberRole, MoveStatus, NavKey, ProjectViewKey, WorkStatus, WorkspaceMember } from "./dashboard-types";

type DashboardViewProps = {
  activeKey: NavKey;
  project: DashboardProject;
  projects: DashboardProject[];
  workItems: DashboardWorkItem[];
  iterations: Iteration[];
  milestones: Milestone[];
  defects: Defect[];
  metrics: DeliveryMetrics;
  portfolio: PortfolioSummary;
  comments: DashboardComment[];
  discussionWorkItemId: string;
  focusItems: FocusItem[];
  notices: DashboardNotice[];
  projectView: ProjectViewKey;
  members: WorkspaceMember[];
  currentMemberId: string;
  canWrite: boolean;
  canPlan: boolean;
  canManage: boolean;
  onProjectChange: (projectId: string) => void;
  onProjectViewChange: (view: ProjectViewKey) => void;
  onToggleFocus: (itemId: string) => void;
  onAddFocus: (workItemId: string) => void;
  onRemoveFocus: (itemId: string) => void;
  onMoveWorkItem: (item: DashboardWorkItem, status: MoveStatus) => void;
  onEditWorkItem: (item: DashboardWorkItem) => void;
  onReadNotice: (noticeId: string) => void;
  onDiscussionWorkItemChange: (workItemId: string) => void;
  onCreateIteration: (input: { name: string; goal: string; startDate: string; endDate: string }) => void;
  onUpdateIteration: (iterationId: string, status: Iteration["status"]) => void;
  onCreateMilestone: (input: { name: string; description: string; dueDate: string }) => void;
  onUpdateMilestone: (milestoneId: string, status: Milestone["status"]) => void;
  onCreateDefect: (input: { workItemId: string; severity: Defect["severity"]; environment: string; reproduction: string }) => void;
  onCloseDefect: (defectId: string) => void;
  onCreateComment: (input: { workItemId: string; content: string }) => void;
  onOpenCreateProject: () => void;
  onOpenEditProject: () => void;
  onCreateMember: (input: { name: string; login: string; password: string; role: MemberRole }) => void;
  onUpdateMember: (member: WorkspaceMember) => void;
  onDeleteMember: (memberId: string) => void;
  onFeedback: (message: string) => void;
};

const projectViews: ProjectViewKey[] = ["overview", "tasks", "board", "iterations", "milestones", "risks", "discussion"];
const boardStatuses: WorkStatus[] = ["BACKLOG", "IN_PROGRESS", "IN_REVIEW", "BLOCKED", "DONE"];

function today(): string {
  return new Date().toISOString().slice(0, 10);
}

function nextMove(status: WorkStatus): { label: string; status: MoveStatus } | "" {
  if (status === "BACKLOG") return { label: "开始", status: "IN_PROGRESS" };
  if (status === "IN_PROGRESS") return { label: "提交验收", status: "IN_REVIEW" };
  if (status === "IN_REVIEW") return { label: "完成", status: "DONE" };
  if (status === "BLOCKED") return { label: "解除阻塞", status: "IN_PROGRESS" };
  return "";
}

function blockMove(status: WorkStatus): { label: string; status: MoveStatus } | "" {
  if (status === "BACKLOG" || status === "IN_PROGRESS" || status === "IN_REVIEW") return { label: "标记阻塞", status: "BLOCKED" };
  return "";
}

function iterationTitle(iterations: Iteration[], iterationId: string): string {
  if (iterationId === "") return "";
  const found = iterations.filter((item) => item.id === iterationId)[0];
  if (!found) return "";
  return found.name;
}

function WorkItemTable({ items, iterations, members, focusedWorkItemIds, canWrite, emptyText, onMoveWorkItem, onEditWorkItem, onToggleFocusWorkItem }: { items: DashboardWorkItem[]; iterations: Iteration[]; members: WorkspaceMember[]; focusedWorkItemIds: string[]; canWrite: boolean; emptyText: string; onMoveWorkItem: (item: DashboardWorkItem, status: MoveStatus) => void; onEditWorkItem: (item: DashboardWorkItem) => void; onToggleFocusWorkItem: (workItemId: string) => void }) {
  return (
    <div className="rounded-md border">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>标题</TableHead>
            <TableHead>类型</TableHead>
            <TableHead>负责人</TableHead>
            <TableHead>截止</TableHead>
            <TableHead>优先级</TableHead>
            <TableHead>状态</TableHead>
            <TableHead>进度</TableHead>
            <TableHead>操作</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {items.length === 0 && (
            <TableRow>
              <TableCell colSpan={8} className="h-20 text-center text-muted-foreground">{emptyText}</TableCell>
            </TableRow>
          )}
          {items.map((item) => {
            const move = nextMove(item.status);
            const block = blockMove(item.status);
            const iteration = iterationTitle(iterations, item.iterationId);
            const focused = focusedWorkItemIds.includes(item.id);
            return (
              <TableRow key={item.id}>
                <TableCell className="font-medium">
                  {item.title}
                  {iteration !== "" && <p className="mt-1 text-xs font-normal text-muted-foreground">{iteration}</p>}
                </TableCell>
                <TableCell>{item.type}</TableCell>
                <TableCell>{memberName(members, item.ownerId, item.owner)}</TableCell>
                <TableCell>{item.due}</TableCell>
                <TableCell><Badge variant={priorityTone[item.priority]}>{item.priority}</Badge></TableCell>
                <TableCell>
                  <div className="flex flex-wrap gap-1">
                    <Badge variant={statusTone[item.status]}>{statusLabel[item.status]}</Badge>
                    {focused && <Badge>重点</Badge>}
                  </div>
                </TableCell>
                <TableCell>
                  <div className="flex items-center gap-2">
                    <Progress value={item.progress} className="w-16" />
                    <span className="text-xs text-muted-foreground">{item.progress}%</span>
                  </div>
                </TableCell>
                <TableCell>
                  {canWrite && (
                    <div className="flex flex-wrap gap-2">
                      {move !== "" && <Button type="button" variant="outline" size="sm" onClick={() => onMoveWorkItem(item, move.status)}>{move.label}</Button>}
                      {block !== "" && <Button type="button" variant="outline" size="sm" onClick={() => onMoveWorkItem(item, block.status)}>{block.label}</Button>}
                      <Button type="button" variant="outline" size="sm" onClick={() => onEditWorkItem(item)}>编辑</Button>
                      <Button type="button" variant={focused ? "secondary" : "outline"} size="sm" aria-pressed={focused} onClick={() => onToggleFocusWorkItem(item.id)}>{focused ? "移出重点" : "设为重点"}</Button>
                    </div>
                  )}
                </TableCell>
              </TableRow>
            );
          })}
        </TableBody>
      </Table>
    </div>
  );
}

function TextField({ label, value, onChange, type }: { label: string; value: string; onChange: (value: string) => void; type: string }) {
  return (
    <Label className="flex flex-col items-stretch gap-2">
      {label}
      <Input type={type} value={value} onChange={(event) => onChange(event.target.value)} />
    </Label>
  );
}

function IterationForm({ onCreate, onFeedback }: { onCreate: DashboardViewProps["onCreateIteration"]; onFeedback: (message: string) => void }) {
  const [name, setName] = useState("");
  const [goal, setGoal] = useState("");
  const [startDate, setStartDate] = useState(today);
  const [endDate, setEndDate] = useState(today);
  function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (name.trim() === "" || goal.trim() === "") { onFeedback("请填写迭代名称和目标。"); return; }
    onCreate({ name: name.trim(), goal: goal.trim(), startDate, endDate });
    setName("");
    setGoal("");
  }
  return (
    <form onSubmit={submit} className="grid gap-3 md:grid-cols-2">
      <TextField label="迭代名称" value={name} onChange={setName} type="text" />
      <TextField label="目标" value={goal} onChange={setGoal} type="text" />
      <TextField label="开始日期" value={startDate} onChange={setStartDate} type="date" />
      <TextField label="结束日期" value={endDate} onChange={setEndDate} type="date" />
      <Button type="submit" variant="outline" className="md:col-span-2 md:justify-self-start">创建迭代</Button>
    </form>
  );
}

function MilestoneForm({ onCreate, onFeedback }: { onCreate: DashboardViewProps["onCreateMilestone"]; onFeedback: (message: string) => void }) {
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [dueDate, setDueDate] = useState(today);
  function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (name.trim() === "") { onFeedback("请填写里程碑名称。"); return; }
    onCreate({ name: name.trim(), description: description.trim(), dueDate });
    setName("");
    setDescription("");
  }
  return (
    <form onSubmit={submit} className="grid gap-3 md:grid-cols-2">
      <TextField label="里程碑名称" value={name} onChange={setName} type="text" />
      <TextField label="截止日期" value={dueDate} onChange={setDueDate} type="date" />
      <TextField label="说明" value={description} onChange={setDescription} type="text" />
      <Button type="submit" variant="outline" className="md:col-span-2 md:justify-self-start">创建里程碑</Button>
    </form>
  );
}

function MemberRow({ member, canManage, onUpdate, onDelete, onFeedback }: { member: WorkspaceMember; canManage: boolean; onUpdate: (member: WorkspaceMember) => void; onDelete: (memberId: string) => void; onFeedback: (message: string) => void }) {
  const [password, setPassword] = useState("");
  return (
    <div className="grid items-center gap-2 border-b py-3 md:grid-cols-[1fr_1fr_8rem_1fr_auto_auto]">
      <span className="text-sm">{member.name}</span>
      <span className="text-sm text-muted-foreground">{member.login}</span>
      {canManage && (
        <Select value={member.role} onChange={(event) => onUpdate({ ...member, role: event.target.value as MemberRole })}>
          {memberRoles.map((role) => <option key={role} value={role}>{role}</option>)}
        </Select>
      )}
      {!canManage && <span className="text-sm">{member.role}</span>}
      {canManage && <Input type="password" value={password} placeholder="新密码" onChange={(event) => setPassword(event.target.value)} />}
      {canManage && <Button type="button" variant="outline" size="sm" onClick={() => { if (password.trim() === "") { onFeedback("请输入新密码。"); return; } onUpdate({ ...member, password: password.trim() }); setPassword(""); }}>重置密码</Button>}
      {canManage && <Button type="button" variant="outline" size="sm" onClick={() => onDelete(member.id)}>删除</Button>}
    </div>
  );
}

export function DashboardView(props: DashboardViewProps) {
  const { activeKey, project, projects, workItems, iterations, milestones, defects, metrics, portfolio, comments, discussionWorkItemId, focusItems, notices, projectView, members, currentMemberId, canWrite, canPlan, canManage, onProjectChange, onProjectViewChange, onToggleFocus, onAddFocus, onRemoveFocus, onMoveWorkItem, onEditWorkItem, onReadNotice, onDiscussionWorkItemChange, onCreateIteration, onUpdateIteration, onCreateMilestone, onUpdateMilestone, onCreateDefect, onCloseDefect, onCreateComment, onOpenCreateProject, onOpenEditProject, onCreateMember, onUpdateMember, onDeleteMember, onFeedback } = props;
  const projectItems = workItems.filter((item) => item.projectId === project.id);
  const projectIterations = iterations.filter((item) => item.projectId === project.id);
  const projectMilestones = milestones.filter((item) => item.projectId === project.id);
  const projectItemIds = projectItems.map((item) => item.id);
  const projectDefects = defects.filter((item) => projectItemIds.includes(item.workItemId));
  const myWorkItems = workItems.filter((item) => item.ownerId === currentMemberId);
  const activeIteration = projectIterations.filter((item) => item.status === "ACTIVE")[0];
  const plannedIterationCount = projectIterations.filter((item) => item.status === "PLANNED").length;
  const blockedItems = projectItems.filter((item) => item.status === "BLOCKED");
  const discussionItem = projectItems.filter((item) => item.id === discussionWorkItemId)[0] || projectItems[0];
  const discussionComments = comments.filter((item) => discussionItem && item.workItemId === discussionItem.id);
  const [defectWorkItemId, setDefectWorkItemId] = useState("");
  const [severity, setSeverity] = useState<Defect["severity"]>("MAJOR");
  const [environment, setEnvironment] = useState("");
  const [reproduction, setReproduction] = useState("");
  const [comment, setComment] = useState("");
  const [memberNameInput, setMemberNameInput] = useState("");
  const [memberLogin, setMemberLogin] = useState("");
  const [memberPassword, setMemberPassword] = useState("");
  const [memberRole, setMemberRole] = useState<MemberRole>("开发");
  const focusedWorkItemIds = focusItems.map((item) => item.workItemId);
  const defectInProject = projectItems.some((item) => item.id === defectWorkItemId);
  const selectedDefectWorkItemId = defectInProject ? defectWorkItemId : (projectItems[0] ? projectItems[0].id : "");
  const homeCards = [
    { label: "工作项", value: String(portfolio.workItemCount), note: `${portfolio.completedWorkItemCount} 项已完成` },
    { label: "进行中项目", value: String(portfolio.activeProjectCount), note: `共 ${portfolio.projectCount} 个项目` },
    { label: "未关闭缺陷", value: String(portfolio.openDefectCount), note: "来自项目交付记录" },
    { label: "交付率", value: `${portfolio.deliveryRate}%`, note: "按已完成工作项计算" },
  ];
  const pageTitle = activeKey === "projects" ? project.name : navigation[activeKey].label;
  const pageDescription = {
    home: "项目、待办和通知。",
    projects: project.description,
    "my-work": "分配给你的任务。",
    inbox: "工作区通知。",
    settings: "成员、权限和项目配置。",
  }[activeKey];

  function submitDefect(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (selectedDefectWorkItemId === "" || environment.trim() === "" || reproduction.trim() === "") { onFeedback("请选择任务并填写缺陷环境和复现步骤。"); return; }
    onCreateDefect({ workItemId: selectedDefectWorkItemId, severity, environment: environment.trim(), reproduction: reproduction.trim() });
    setEnvironment("");
    setReproduction("");
  }

  function submitComment(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!discussionItem || comment.trim() === "") { onFeedback("请选择任务并填写讨论内容。"); return; }
    onCreateComment({ workItemId: discussionItem.id, content: comment.trim() });
    setComment("");
  }

  function submitMember(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (memberNameInput.trim() === "" || memberLogin.trim() === "" || memberPassword.trim() === "") { onFeedback("请填写姓名、账号和密码。"); return; }
    onCreateMember({ name: memberNameInput.trim(), login: memberLogin.trim(), password: memberPassword, role: memberRole });
    setMemberNameInput("");
    setMemberLogin("");
    setMemberPassword("");
    setMemberRole("开发");
  }

  function toggleWorkItemFocus(workItemId: string) {
    const current = focusItems.filter((item) => item.workItemId === workItemId)[0];
    if (current) { onRemoveFocus(current.id); return; }
    onAddFocus(workItemId);
  }

  function selectProjectView(value: string) {
    const next = projectViews.find((view) => view === value);
    if (!next) return;
    onProjectViewChange(next);
  }

  return (
    <div className="flex flex-col gap-6 p-6">
      <div>
        <h2 className="text-lg font-semibold">{pageTitle}</h2>
        <p className="mt-1 text-sm text-muted-foreground">{pageDescription}</p>
      </div>

      {activeKey === "home" && (
        <>
          <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
            {homeCards.map((item) => (
              <Card key={item.label}>
                <CardHeader>
                  <CardDescription>{item.label}</CardDescription>
                  <CardTitle className="text-2xl">{item.value}</CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-xs text-muted-foreground">{item.note}</p>
                </CardContent>
              </Card>
            ))}
          </div>
          <Card>
            <CardHeader>
              <CardTitle>待办</CardTitle>
              <CardDescription>当前项目中尚未完成的任务。</CardDescription>
            </CardHeader>
            <CardContent>
              <WorkItemTable items={projectItems.filter((item) => item.status !== "DONE").slice(0, 4)} iterations={iterations} members={members} focusedWorkItemIds={focusedWorkItemIds} canWrite={canWrite} emptyText="没有未完成的任务。" onMoveWorkItem={onMoveWorkItem} onEditWorkItem={onEditWorkItem} onToggleFocusWorkItem={toggleWorkItemFocus} />
            </CardContent>
          </Card>
          <Card>
            <CardHeader>
              <CardTitle>今日重点</CardTitle>
              <CardDescription>待办里标为重点的任务会列在这里。勾选表示已处理。</CardDescription>
            </CardHeader>
            <CardContent className="flex flex-col gap-3">
              {focusItems.length === 0 && <p className="text-sm text-muted-foreground">还没有重点事项。</p>}
              {focusItems.map((item) => {
                const linked = workItems.filter((workItem) => workItem.id === item.workItemId)[0];
                return (
                  <div key={item.id} className="flex items-start gap-3 rounded-md px-2 py-2 hover:bg-muted">
                    <button type="button" onClick={() => onToggleFocus(item.id)} className="flex min-w-0 flex-1 items-start gap-3 text-left">
                      <CheckCircle2 className={`mt-0.5 size-4 ${item.done ? "text-foreground" : "text-muted-foreground"}`} />
                      <span className="min-w-0 flex-1">
                        <span className={`block text-sm ${item.done ? "text-muted-foreground line-through" : ""}`}>{linked ? linked.title : item.title}</span>
                        <span className="mt-1 block text-xs text-muted-foreground">{item.context} · {item.due}</span>
                      </span>
                      <Badge variant={priorityTone[item.priority]}>{item.priority}</Badge>
                    </button>
                    {canWrite && <Button type="button" variant="outline" size="sm" onClick={() => onRemoveFocus(item.id)}>移出</Button>}
                  </div>
                );
              })}
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="flex flex-row items-center justify-between">
              <div>
                <CardTitle>项目</CardTitle>
                <CardDescription>选择项目进入详情。</CardDescription>
              </div>
              {canPlan && <Button type="button" variant="outline" size="sm" onClick={onOpenCreateProject}>新建项目</Button>}
            </CardHeader>
            <CardContent>
              <div className="rounded-md border">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>名称</TableHead>
                      <TableHead>状态</TableHead>
                      <TableHead>负责人</TableHead>
                      <TableHead>目标日期</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {projects.map((item) => (
                      <TableRow key={item.id} className={item.id === project.id ? "bg-muted/60" : ""}>
                        <TableCell>
                          <button type="button" className="font-medium" onClick={() => onProjectChange(item.id)}>{item.name}</button>
                          <p className="mt-1 text-xs text-muted-foreground">{item.description}</p>
                        </TableCell>
                        <TableCell><Badge variant={item.status === "进行中" ? "default" : "secondary"}>{item.status}</Badge></TableCell>
                        <TableCell>{item.owner}</TableCell>
                        <TableCell>{item.due}</TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            </CardContent>
          </Card>
        </>
      )}

      {activeKey === "projects" && (
        <>
          <Tabs value={projectView} onValueChange={selectProjectView}>
            <TabsList className="h-auto flex-wrap">
              {projectViews.map((view) => <TabsTrigger key={view} value={view}>{projectViewLabels[view]}</TabsTrigger>)}
            </TabsList>
          </Tabs>
          {projectView === "overview" && (
            <div className="grid gap-4 lg:grid-cols-3">
              <Card>
                <CardHeader><CardTitle>项目进度</CardTitle></CardHeader>
                <CardContent>
                  <p className="text-2xl font-semibold">{metrics.completionRate}%</p>
                  <Progress value={metrics.completionRate} className="mt-3" />
                  <p className="mt-3 text-sm text-muted-foreground">{metrics.completedWorkItems}/{metrics.totalWorkItems} 项已完成 · 负责人 {project.owner}</p>
                  {canPlan && <Button type="button" variant="outline" size="sm" className="mt-3" onClick={onOpenEditProject}>编辑项目</Button>}
                </CardContent>
              </Card>
              <Card>
                <CardHeader><CardTitle>当前迭代</CardTitle></CardHeader>
                <CardContent>
                  {activeIteration && <p className="font-medium">{activeIteration.name}</p>}
                  {activeIteration && <p className="mt-2 text-sm text-muted-foreground">{activeIteration.goal}</p>}
                  {activeIteration && <p className="mt-2 text-xs text-muted-foreground">{activeIteration.startDate} 至 {activeIteration.endDate}</p>}
                  {!activeIteration && <p className="text-sm text-muted-foreground">当前项目没有进行中的迭代。计划中的迭代有 {plannedIterationCount} 个。</p>}
                </CardContent>
              </Card>
              <Card>
                <CardHeader><CardTitle>风险与阻塞</CardTitle></CardHeader>
                <CardContent>
                  <p className="text-2xl font-semibold">{metrics.openDefects + blockedItems.length}</p>
                  <p className="mt-2 text-sm text-muted-foreground">{metrics.openDefects} 个未关闭缺陷，{blockedItems.length} 个阻塞任务。</p>
                </CardContent>
              </Card>
            </div>
          )}
          {projectView === "tasks" && (
            <Card>
              <CardHeader>
                <CardTitle>任务</CardTitle>
                <CardDescription>需求、任务和缺陷。</CardDescription>
              </CardHeader>
              <CardContent>
                <WorkItemTable items={projectItems} iterations={iterations} members={members} focusedWorkItemIds={focusedWorkItemIds} canWrite={canWrite} emptyText="当前项目还没有任务。" onMoveWorkItem={onMoveWorkItem} onEditWorkItem={onEditWorkItem} onToggleFocusWorkItem={toggleWorkItemFocus} />
              </CardContent>
            </Card>
          )}
          {projectView === "board" && (
            <div className="grid gap-4 xl:grid-cols-5">
              {boardStatuses.map((status) => (
                <Card key={status}>
                  <CardHeader><CardTitle>{statusLabel[status]}</CardTitle></CardHeader>
                  <CardContent className="flex flex-col gap-2">
                    {projectItems.filter((item) => item.status === status).length === 0 && <p className="text-sm text-muted-foreground">没有任务。</p>}
                    {projectItems.filter((item) => item.status === status).map((item) => {
                      const move = nextMove(item.status);
                      const block = blockMove(item.status);
                      const focused = focusedWorkItemIds.includes(item.id);
                      return (
                        <div key={item.id} className="rounded-md border p-3">
                          <div className="flex items-start justify-between gap-2">
                            <p className="text-sm font-medium">{item.title}</p>
                            {focused && <Badge>重点</Badge>}
                          </div>
                          <p className="mt-1 text-xs text-muted-foreground">{item.type} · {memberName(members, item.ownerId, item.owner)}</p>
                          {canWrite && (
                            <div className="mt-3 flex flex-wrap gap-2">
                              {move !== "" && <Button type="button" variant="outline" size="sm" onClick={() => onMoveWorkItem(item, move.status)}>{move.label}</Button>}
                              {block !== "" && <Button type="button" variant="outline" size="sm" onClick={() => onMoveWorkItem(item, block.status)}>{block.label}</Button>}
                              <Button type="button" variant={focused ? "secondary" : "outline"} size="sm" aria-pressed={focused} onClick={() => toggleWorkItemFocus(item.id)}>{focused ? "移出重点" : "设为重点"}</Button>
                            </div>
                          )}
                        </div>
                      );
                    })}
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
          {projectView === "iterations" && (
            <Card>
              <CardHeader>
                <CardTitle>迭代</CardTitle>
                <CardDescription>开始后成为当前迭代，任务可在编辑时加入。</CardDescription>
              </CardHeader>
              <CardContent className="flex flex-col gap-4">
                {canPlan && <IterationForm onCreate={onCreateIteration} onFeedback={onFeedback} />}
                <div className="rounded-md border">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>名称</TableHead>
                        <TableHead>目标</TableHead>
                        <TableHead>时间</TableHead>
                        <TableHead>状态</TableHead>
                        <TableHead>操作</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {projectIterations.length === 0 && <TableRow><TableCell colSpan={5} className="h-20 text-center text-muted-foreground">当前项目还没有迭代。</TableCell></TableRow>}
                      {projectIterations.map((item) => (
                        <TableRow key={item.id}>
                          <TableCell className="font-medium">{item.name}</TableCell>
                          <TableCell>{item.goal}</TableCell>
                          <TableCell>{item.startDate} 至 {item.endDate}</TableCell>
                          <TableCell><Badge variant={item.status === "ACTIVE" ? "default" : "secondary"}>{item.status === "ACTIVE" ? "进行中" : item.status === "COMPLETED" ? "已完成" : "计划中"}</Badge></TableCell>
                          <TableCell>
                            {canPlan && item.status === "PLANNED" && <Button type="button" variant="outline" size="sm" onClick={() => onUpdateIteration(item.id, "ACTIVE")}>开始</Button>}
                            {canPlan && item.status === "ACTIVE" && <Button type="button" variant="outline" size="sm" onClick={() => onUpdateIteration(item.id, "COMPLETED")}>完成</Button>}
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>
              </CardContent>
            </Card>
          )}
          {projectView === "milestones" && (
            <Card>
              <CardHeader>
                <CardTitle>里程碑</CardTitle>
                <CardDescription>项目必须到达的节点。</CardDescription>
              </CardHeader>
              <CardContent className="flex flex-col gap-4">
                {canPlan && <MilestoneForm onCreate={onCreateMilestone} onFeedback={onFeedback} />}
                <div className="rounded-md border">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>名称</TableHead>
                        <TableHead>说明</TableHead>
                        <TableHead>截止</TableHead>
                        <TableHead>状态</TableHead>
                        <TableHead>操作</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {projectMilestones.length === 0 && <TableRow><TableCell colSpan={5} className="h-20 text-center text-muted-foreground">当前项目还没有里程碑。</TableCell></TableRow>}
                      {projectMilestones.map((item) => (
                        <TableRow key={item.id}>
                          <TableCell className="font-medium">{item.name}</TableCell>
                          <TableCell>{item.description}</TableCell>
                          <TableCell>{item.dueDate}</TableCell>
                          <TableCell><Badge variant={item.status === "AT_RISK" ? "destructive" : "secondary"}>{item.status === "COMPLETED" ? "已完成" : item.status === "AT_RISK" ? "有风险" : "计划中"}</Badge></TableCell>
                          <TableCell>
                            {canPlan && item.status !== "COMPLETED" && (
                              <div className="flex flex-wrap gap-2">
                                {item.status === "PLANNED" && <Button type="button" variant="outline" size="sm" onClick={() => onUpdateMilestone(item.id, "AT_RISK")}>标为有风险</Button>}
                                <Button type="button" variant="outline" size="sm" onClick={() => onUpdateMilestone(item.id, "COMPLETED")}>完成</Button>
                              </div>
                            )}
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>
              </CardContent>
            </Card>
          )}
          {projectView === "risks" && (
            <Card>
              <CardHeader>
                <CardTitle>风险与问题</CardTitle>
                <CardDescription>缺陷和被阻塞的任务。</CardDescription>
              </CardHeader>
              <CardContent className="flex flex-col gap-4">
                {canWrite && (
                  <form onSubmit={submitDefect} className="grid gap-3 md:grid-cols-2">
                    <Label className="flex flex-col items-stretch gap-2">
                      关联任务
                      <Select value={selectedDefectWorkItemId} onChange={(event) => setDefectWorkItemId(event.target.value)}>
                        {projectItems.map((item) => <option key={item.id} value={item.id}>{item.title}</option>)}
                      </Select>
                    </Label>
                    <Label className="flex flex-col items-stretch gap-2">
                      严重程度
                      <Select value={severity} onChange={(event) => setSeverity(event.target.value as Defect["severity"])}>
                        <option value="CRITICAL">紧急</option>
                        <option value="MAJOR">严重</option>
                        <option value="MINOR">一般</option>
                        <option value="TRIVIAL">轻微</option>
                      </Select>
                    </Label>
                    <TextField label="环境" value={environment} onChange={setEnvironment} type="text" />
                    <TextField label="复现步骤" value={reproduction} onChange={setReproduction} type="text" />
                    <Button type="submit" variant="outline" className="md:col-span-2 md:justify-self-start">记录缺陷</Button>
                  </form>
                )}
                {projectDefects.length === 0 && blockedItems.length === 0 && <p className="text-sm text-muted-foreground">当前项目没有未处理的风险。</p>}
                {(projectDefects.length > 0 || blockedItems.length > 0) && <div className="rounded-md border">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>严重程度</TableHead>
                        <TableHead>任务</TableHead>
                        <TableHead>环境</TableHead>
                        <TableHead>复现</TableHead>
                        <TableHead>状态</TableHead>
                        <TableHead>操作</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {projectDefects.map((item) => {
                        const related = projectItems.filter((workItem) => workItem.id === item.workItemId)[0];
                        return (
                          <TableRow key={item.id}>
                            <TableCell>{severityLabel[item.severity]}</TableCell>
                            <TableCell>{related ? related.title : ""}</TableCell>
                            <TableCell>{item.environment}</TableCell>
                            <TableCell>{item.reproduction}</TableCell>
                            <TableCell>{item.resolvedAt === "" ? "未关闭" : "已关闭"}</TableCell>
                            <TableCell>{canWrite && item.resolvedAt === "" && <Button type="button" variant="outline" size="sm" onClick={() => onCloseDefect(item.id)}>关闭</Button>}</TableCell>
                          </TableRow>
                        );
                      })}
                      {blockedItems.map((item) => (
                        <TableRow key={item.id}>
                          <TableCell><Badge variant="destructive">阻塞</Badge></TableCell>
                          <TableCell>{item.title}</TableCell>
                          <TableCell>{item.owner}</TableCell>
                          <TableCell>{item.due}</TableCell>
                          <TableCell>未解除</TableCell>
                          <TableCell>{canWrite && <Button type="button" variant="outline" size="sm" onClick={() => onMoveWorkItem(item, "IN_PROGRESS")}>解除阻塞</Button>}</TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>}
              </CardContent>
            </Card>
          )}
          {projectView === "discussion" && (
            <Card>
              <CardHeader>
                <CardTitle>讨论</CardTitle>
                <CardDescription>围绕具体任务同步信息，发送后写入通知。</CardDescription>
              </CardHeader>
              <CardContent className="flex flex-col gap-4">
                <Label className="flex flex-col items-stretch gap-2">
                  任务
                  <Select value={discussionItem ? discussionItem.id : ""} onChange={(event) => onDiscussionWorkItemChange(event.target.value)}>
                    {projectItems.map((item) => <option key={item.id} value={item.id}>{item.title}</option>)}
                  </Select>
                </Label>
                {discussionComments.length === 0 && <p className="text-sm text-muted-foreground">这条任务还没有讨论。</p>}
                <div className="flex flex-col gap-2">
                  {discussionComments.map((item) => (
                    <div key={item.id} className="rounded-md border px-3 py-2">
                      <p className="text-sm">{item.content}</p>
                      <p className="mt-1 text-xs text-muted-foreground">{item.authorId} · {item.createdAt.slice(0, 16).replace("T", " ")}</p>
                    </div>
                  ))}
                </div>
                {canWrite && (
                  <form onSubmit={submitComment} className="flex gap-2">
                    <Input value={comment} onChange={(event) => setComment(event.target.value)} placeholder="写下讨论内容" />
                    <Button type="submit">发送</Button>
                  </form>
                )}
              </CardContent>
            </Card>
          )}
        </>
      )}

      {activeKey === "my-work" && (
        <Card>
          <CardHeader>
            <CardTitle>任务</CardTitle>
            <CardDescription>负责人是你的任务，不限当前项目。</CardDescription>
          </CardHeader>
          <CardContent>
            <WorkItemTable items={myWorkItems} iterations={iterations} members={members} focusedWorkItemIds={focusedWorkItemIds} canWrite={canWrite} emptyText="没有分配给你的任务。" onMoveWorkItem={onMoveWorkItem} onEditWorkItem={onEditWorkItem} onToggleFocusWorkItem={toggleWorkItemFocus} />
          </CardContent>
        </Card>
      )}

      {activeKey === "inbox" && (
        <div className="divide-y rounded-md border">
          {notices.length === 0 && <p className="px-4 py-8 text-sm text-muted-foreground">没有新的通知。</p>}
          {notices.map((item) => (
            <button key={item.id} type="button" onClick={() => onReadNotice(item.id)} className="flex w-full items-start gap-3 px-4 py-3 text-left hover:bg-muted">
              <span className={`mt-2 size-1.5 shrink-0 rounded-full ${item.read ? "bg-transparent" : "bg-foreground"}`} />
              <span className="min-w-0 flex-1">
                <span className={`block text-sm ${item.read ? "text-muted-foreground" : "font-medium"}`}>{item.title}</span>
                <span className="mt-1 block text-xs text-muted-foreground">{item.description}</span>
              </span>
              <span className="text-xs text-muted-foreground">{item.read ? "已读" : item.time}</span>
            </button>
          ))}
        </div>
      )}

      {activeKey === "settings" && (
        <div className="grid gap-4">
          <Card>
            <CardHeader>
              <CardTitle>成员与角色</CardTitle>
              <CardDescription>管理可以改成员。产品可以改项目和计划。开发可以处理任务。访客只能查看。</CardDescription>
            </CardHeader>
            <CardContent className="flex flex-col gap-4">
              {canManage && (
                <form onSubmit={submitMember} className="grid gap-3 md:grid-cols-2">
                  <TextField label="姓名" value={memberNameInput} onChange={setMemberNameInput} type="text" />
                  <TextField label="账号" value={memberLogin} onChange={setMemberLogin} type="text" />
                  <TextField label="密码" value={memberPassword} onChange={setMemberPassword} type="password" />
                  <Label className="flex flex-col items-stretch gap-2">
                    角色
                    <Select value={memberRole} onChange={(event) => setMemberRole(event.target.value as MemberRole)}>
                      {memberRoles.map((role) => <option key={role} value={role}>{role}</option>)}
                    </Select>
                  </Label>
                  <Button type="submit" variant="outline" className="md:col-span-2 md:justify-self-start">添加成员</Button>
                </form>
              )}
              <div>
                {members.map((item) => <MemberRow key={item.id} member={item} canManage={canManage} onUpdate={onUpdateMember} onDelete={onDeleteMember} onFeedback={onFeedback} />)}
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardHeader><CardTitle>项目设置</CardTitle></CardHeader>
            <CardContent className="flex flex-col items-start gap-3">
              <p className="text-sm font-medium">{project.name}</p>
              <p className="text-sm text-muted-foreground">{project.status} · {project.owner} · {project.due}</p>
              <p className="text-sm text-muted-foreground">{project.description}</p>
              {canPlan && (
                <div className="flex gap-2">
                  <Button type="button" variant="outline" onClick={onOpenEditProject}>编辑项目</Button>
                  <Button type="button" variant="outline" onClick={onOpenCreateProject}>新建项目</Button>
                </div>
              )}
              {!canPlan && <p className="text-sm text-muted-foreground">当前角色不能修改项目。</p>}
            </CardContent>
          </Card>
        </div>
      )}
    </div>
  );
}
