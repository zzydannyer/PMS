import {
  AlertTriangle,
  ArrowRight,
  CheckCircle2,
  CircleDot,
  FolderKanban,
  MessageSquare,
  Plus,
  ShieldAlert,
  Target,
  Users,
} from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { metricCards, navigation, priorityTone, projectViewLabels, statusLabel, statusTone } from "./dashboard-data";
import type { DashboardNotice, DashboardProject, DashboardWorkItem, FocusItem, NavKey, ProjectViewKey } from "./dashboard-types";
import type { Iteration, Milestone } from "@pms/domain";

type DashboardViewProps = {
  activeKey: NavKey;
  project: DashboardProject;
  projects: DashboardProject[];
  workItems: DashboardWorkItem[];
  iterations: Iteration[];
  milestones: Milestone[];
  focusItems: FocusItem[];
  notices: DashboardNotice[];
  projectView: ProjectViewKey;
  onProjectChange: (projectId: string) => void;
  onProjectViewChange: (view: ProjectViewKey) => void;
  onToggleFocus: (itemId: string) => void;
  onCreateTask: () => void;
  onCompleteWorkItem: (item: DashboardWorkItem) => void;
  onOpenAi: () => void;
  onOpenNotice: (notice: string) => void;
};

function WorkItemRow({
  item,
  onCompleteWorkItem,
}: {
  item: DashboardWorkItem;
  onCompleteWorkItem: (item: DashboardWorkItem) => void;
}) {
  return <div className="theme-inset grid gap-3 rounded-xl border border-slate-200 p-4 md:grid-cols-[minmax(0,1fr)_100px_100px_170px_auto] md:items-center"><div className="min-w-0"><div className="flex items-center gap-2"><CircleDot className="size-4 shrink-0 text-cyan-500" /><p className="truncate text-sm font-medium text-slate-800">{item.title}</p></div><p className="mt-2 text-xs text-slate-500">{item.type} · {item.owner} · 截止 {item.due}</p></div><Badge tone={priorityTone[item.priority]}>{item.priority}优先级</Badge><Badge tone={statusTone[item.status]}>{statusLabel[item.status]}</Badge><div className="flex items-center gap-3"><Progress value={item.progress} className="flex-1" /><span className="w-8 text-right text-xs text-slate-500">{item.progress}%</span></div>{item.status !== "DONE" && <button type="button" onClick={() => onCompleteWorkItem(item)} className="rounded-lg border border-emerald-200 px-2.5 py-1.5 text-xs font-medium text-emerald-700 hover:bg-emerald-50">完成</button>}</div>;
}

function CleanDashboardView({
  activeKey,
  project,
  projects,
  workItems,
  iterations,
  milestones,
  focusItems,
  notices,
  projectView,
  onProjectChange,
  onProjectViewChange,
  onToggleFocus,
  onCreateTask,
  onCompleteWorkItem,
  onOpenAi,
  onOpenNotice,
}: DashboardViewProps) {
  const projectItems = workItems.filter((item) => item.projectId === project.id);
  const projectViews: ProjectViewKey[] = [
    "overview",
    "tasks",
    "board",
    "iterations",
    "milestones",
    "risks",
    "discussion",
  ];

  return (
    <div className="mx-auto max-w-375 space-y-6 p-7">
      <div className="flex items-end justify-between gap-4">
        <div>
          <p className="text-xs font-semibold uppercase tracking-[0.18em] text-cyan-600">
            {activeKey === "home" ? "工作区总览" : navigation[activeKey].label}
          </p>
          <h2 className="mt-2 text-3xl font-bold tracking-tight text-slate-900">
            {activeKey === "home"
              ? "今天，团队要推进什么？"
              : activeKey === "projects"
                ? project.name
                : navigation[activeKey].label}
          </h2>
          <p className="mt-2 text-sm text-slate-500">
            {activeKey === "home"
              ? "项目、任务、风险和团队协作都在这里。"
              : "围绕目标推进工作，及时处理需要你确认的事项。"}
          </p>
        </div>
        <Button variant="primary" onClick={onCreateTask}>
          <Plus className="size-4" />
          新建任务
        </Button>
      </div>

      {activeKey === "home" && (
        <>
          <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
            {metricCards.map(({ label, value, note, icon: Icon, iconClassName }) => (
              <Card key={label}>
                <CardContent className="flex items-start justify-between pt-5">
                  <div>
                    <p className="text-xs text-slate-500">{label}</p>
                    <p className="mt-2 text-3xl font-bold text-slate-900">{value}</p>
                    <p className="mt-2 text-[11px] text-slate-500">{note}</p>
                  </div>
                  <div className={`flex size-9 items-center justify-center rounded-xl ${iconClassName}`}>
                    <Icon className="size-4.5" />
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
          <div className="grid gap-6 xl:grid-cols-[minmax(0,1.5fr)_minmax(320px,0.8fr)]">
            <Card>
              <CardHeader>
                <p className="text-base font-semibold text-slate-900">我的待办</p>
                <p className="mt-1 text-xs text-slate-500">优先处理今天到期和待验收的任务。</p>
              </CardHeader>
              <CardContent className="space-y-2">
                {workItems.slice(0, 4).map((item) => (
                  <WorkItemRow key={item.id} item={item} onCompleteWorkItem={onCompleteWorkItem} />
                ))}
              </CardContent>
            </Card>
            <Card>
              <CardHeader>
                <p className="text-base font-semibold text-slate-900">今日重点</p>
                <p className="mt-1 text-xs text-slate-500">完成这些事项，项目才能继续向前。</p>
              </CardHeader>
              <CardContent className="space-y-2">
                {focusItems.map((item) => (
                  <button
                    key={item.id}
                    type="button"
                    onClick={() => onToggleFocus(item.id)}
                    className="theme-focus-item flex w-full items-start gap-3 rounded-xl p-3 text-left"
                  >
                    <CheckCircle2 className={`mt-0.5 size-4 ${item.done ? "text-emerald-500" : "text-slate-300"}`} />
                    <span className="min-w-0 flex-1">
                      <span className={`block text-sm ${item.done ? "text-slate-400 line-through" : "text-slate-700"}`}>
                        {item.title}
                      </span>
                      <span className="mt-1 block text-[11px] text-slate-500">{item.context} · {item.due}</span>
                    </span>
                    <Badge tone={priorityTone[item.priority]}>{item.priority}</Badge>
                  </button>
                ))}
              </CardContent>
            </Card>
          </div>
          <Card>
            <CardHeader className="flex flex-row items-center justify-between">
              <div>
                <p className="text-base font-semibold text-slate-900">项目</p>
                <p className="mt-1 text-xs text-slate-500">选择项目进入详情空间。</p>
              </div>
              <Button variant="secondary" size="sm" onClick={() => onOpenAi()}>AI 项目助手</Button>
            </CardHeader>
            <CardContent className="grid gap-3 lg:grid-cols-3">
              {projects.map((item) => (
                <button
                  key={item.id}
                  type="button"
                  onClick={() => onProjectChange(item.id)}
                  className={`theme-inset rounded-xl border p-4 text-left transition-colors hover:border-cyan-400/60 ${
                    item.id === project.id ? "border-cyan-400/60" : "border-slate-200"
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <span className={`size-2.5 rounded-full ${item.colorClassName}`} />
                    <Badge tone={item.status === "进行中" ? "cyan" : "slate"}>{item.status}</Badge>
                  </div>
                  <p className="mt-4 text-sm font-semibold text-slate-800">{item.name}</p>
                  <p className="mt-1 text-xs leading-5 text-slate-500">{item.description}</p>
                  <Progress value={item.progress} className="mt-4" />
                </button>
              ))}
            </CardContent>
          </Card>
        </>
      )}

      {activeKey === "projects" && (
        <>
          <div className="flex flex-wrap gap-1 rounded-xl border border-slate-200 bg-white p-1">
            {projectViews.map((view) => (
              <button
                key={view}
                type="button"
                onClick={() => onProjectViewChange(view)}
                className={`rounded-lg px-3 py-2 text-xs font-medium ${
                  projectView === view ? "bg-cyan-500 text-white" : "text-slate-500 hover:bg-slate-100"
                }`}
              >
                {projectViewLabels[view]}
              </button>
            ))}
          </div>
          {projectView === "overview" && (
            <div className="grid gap-6 lg:grid-cols-3">
              <Card>
                <CardHeader><p className="text-sm font-semibold text-slate-900">项目进度</p></CardHeader>
                <CardContent><p className="text-4xl font-bold text-slate-900">{project.progress}%</p><Progress value={project.progress} className="mt-4" /><p className="mt-3 text-xs text-slate-500">负责人：{project.owner} · 目标日期：{project.due}</p></CardContent>
              </Card>
              <Card>
                <CardHeader><p className="text-sm font-semibold text-slate-900">当前迭代</p></CardHeader>
                <CardContent><p className="text-lg font-semibold text-slate-900">第 42 个迭代</p><p className="mt-2 text-sm text-slate-500">完成核心功能并准备产品验收。</p></CardContent>
              </Card>
              <Card>
                <CardHeader><p className="text-sm font-semibold text-slate-900">风险与阻塞</p></CardHeader>
                <CardContent><p className="flex items-center gap-2 text-lg font-semibold text-amber-600"><AlertTriangle className="size-5" />1 个待处理</p><p className="mt-2 text-sm text-slate-500">有技术任务被阻塞，需要团队决策。</p></CardContent>
              </Card>
            </div>
          )}
          {projectView === "tasks" && (
            <Card>
              <CardHeader><p className="text-base font-semibold text-slate-900">项目任务</p><p className="mt-1 text-xs text-slate-500">需求、任务和缺陷统一在这里推进。</p></CardHeader>
              <CardContent className="space-y-2">{projectItems.map((item) => <WorkItemRow key={item.id} item={item} onCompleteWorkItem={onCompleteWorkItem} />)}</CardContent>
            </Card>
          )}
          {projectView === "board" && (
            <div className="grid gap-4 lg:grid-cols-4">
              {(["BACKLOG", "IN_PROGRESS", "IN_REVIEW", "DONE"] as const).map((status) => (
                <Card key={status}>
                  <CardHeader><p className="text-sm font-semibold text-slate-900">{statusLabel[status]}</p></CardHeader>
                  <CardContent className="space-y-2">{projectItems.filter((item) => item.status === status).map((item) => <div key={item.id} className="theme-inset rounded-xl border border-slate-200 p-3"><p className="text-sm text-slate-700">{item.title}</p><p className="mt-2 text-xs text-slate-500">{item.type} · {item.owner}</p></div>)}</CardContent>
                </Card>
              ))}
            </div>
          )}
          {projectView !== "overview" && projectView !== "tasks" && projectView !== "board" && (
            <Card><CardContent className="min-h-64"><div className="flex items-center gap-3"><Target className="size-5 text-cyan-500" /><div><p className="text-base font-semibold text-slate-900">{projectViewLabels[projectView]}</p><p className="mt-1 text-sm text-slate-500">这个项目空间将集中管理{projectViewLabels[projectView]}。</p></div></div>{projectView === "iterations" && <div className="mt-6 space-y-2">{iterations.length === 0 && <p className="text-sm text-slate-500">当前项目还没有迭代。</p>}{iterations.map((item) => <div key={item.id} className="theme-inset rounded-xl border border-slate-200 p-4"><div className="flex items-center justify-between"><p className="text-sm font-medium text-slate-800">{item.name}</p><Badge tone={item.status === "ACTIVE" ? "cyan" : "slate"}>{item.status === "ACTIVE" ? "进行中" : item.status === "COMPLETED" ? "已完成" : "计划中"}</Badge></div><p className="mt-2 text-xs text-slate-500">{item.goal} · {item.startDate} 至 {item.endDate}</p></div>)}</div>}{projectView === "milestones" && <div className="mt-6 space-y-2">{milestones.length === 0 && <p className="text-sm text-slate-500">当前项目还没有里程碑。</p>}{milestones.map((item) => <div key={item.id} className="theme-inset rounded-xl border border-slate-200 p-4"><div className="flex items-center justify-between"><p className="text-sm font-medium text-slate-800">{item.name}</p><Badge tone={item.status === "COMPLETED" ? "green" : item.status === "AT_RISK" ? "amber" : "slate"}>{item.status === "COMPLETED" ? "已完成" : item.status === "AT_RISK" ? "有风险" : "计划中"}</Badge></div><p className="mt-2 text-xs text-slate-500">{item.description} · 截止 {item.dueDate}</p></div>)}</div>}{projectView !== "iterations" && projectView !== "milestones" && <div className="mt-6 flex flex-col items-center justify-center text-center"><p className="text-sm text-slate-500">暂无数据。</p><Button className="mt-5" variant="secondary" onClick={onCreateTask}>新建任务</Button></div>}</CardContent></Card>
          )}
        </>
      )}

      {activeKey === "my-work" && (
        <Card><CardHeader><p className="text-base font-semibold text-slate-900">分配给我的任务</p><p className="mt-1 text-xs text-slate-500">包括需要执行、验收和跟进的工作。</p></CardHeader><CardContent className="space-y-2">{workItems.map((item) => <WorkItemRow key={item.id} item={item} onCompleteWorkItem={onCompleteWorkItem} />)}</CardContent></Card>
      )}

      {activeKey === "inbox" && (
        <Card><CardContent className="divide-y divide-slate-200 pt-1">{notices.map((item) => <button key={item.id} type="button" onClick={() => onOpenNotice(item.title)} className="flex w-full gap-4 py-5 text-left"><Bell className="mt-1 size-4 shrink-0 text-cyan-500" /><span className="min-w-0 flex-1"><span className="block text-sm font-medium text-slate-800">{item.title}</span><span className="mt-1 block text-xs text-slate-500">{item.description}</span></span><span className="text-xs text-slate-400">{item.time}</span></button>)}</CardContent></Card>
      )}

      {activeKey === "settings" && (
        <div className="grid gap-4 md:grid-cols-2"><Card><CardHeader><p className="text-sm font-semibold text-slate-900">成员与角色</p></CardHeader><CardContent><p className="text-sm text-slate-500">产品、开发、访客、管理四类角色。</p><Button variant="secondary" className="mt-4">管理成员 <Users className="size-4" /></Button></CardContent></Card><Card><CardHeader><p className="text-sm font-semibold text-slate-900">项目设置</p></CardHeader><CardContent><p className="text-sm text-slate-500">状态、权限和通知策略。</p><Button variant="secondary" className="mt-4">打开设置 <FolderKanban className="size-4" /></Button></CardContent></Card></div>
      )}
    </div>
  );
}

export function DashboardView(props: DashboardViewProps) {
  return <CleanDashboardView {...props} />;
}
