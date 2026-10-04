import { useState, type FormEventHandler } from "react";
import { ChevronRight, Search } from "lucide-react";
import type { Iteration } from "@pms/domain";

import { Button, Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, Input, Label, Select, Textarea } from "@pms/ui";

import type { DashboardWorkItem, ProjectDraft, TaskDraft, WorkStatus, WorkType, WorkspaceMember } from "./dashboard-types";
import { statusLabel } from "./dashboard-data";

type SearchDialogProps = {
  open: boolean;
  query: string;
  results: DashboardWorkItem[];
  onQueryChange: (query: string) => void;
  onClose: () => void;
  onSelect: (item: DashboardWorkItem) => void;
};

export function SearchDialog({ open, query, results, onQueryChange, onClose, onSelect }: SearchDialogProps) {
  return (
    <Dialog open={open} onOpenChange={(next) => { if (!next) onClose(); }}>
      <DialogContent className="top-24 max-w-xl translate-y-0">
        <DialogHeader>
          <DialogTitle>搜索</DialogTitle>
          <DialogDescription>在本地数据中查找任务。</DialogDescription>
        </DialogHeader>
        <div className="flex items-center gap-2">
          <Search className="size-4 text-muted-foreground" />
          <Input autoFocus value={query} onChange={(event) => onQueryChange(event.currentTarget.value)} placeholder="任务、类型或负责人" />
        </div>
        <div className="flex flex-col gap-1">
          {query.trim() !== "" && results.length === 0 && <p className="py-6 text-center text-sm text-muted-foreground">没有找到匹配的任务。</p>}
          {results.map((item) => (
            <button key={item.id} type="button" onClick={() => onSelect(item)} className="flex w-full items-center justify-between rounded-md px-3 py-2 text-left hover:bg-muted">
              <span>
                <span className="block text-sm">{item.title}</span>
                <span className="mt-1 block text-xs text-muted-foreground">{item.type} · {item.owner}</span>
              </span>
              <ChevronRight className="size-4 text-muted-foreground" />
            </button>
          ))}
          {query.trim() === "" && <p className="py-6 text-center text-sm text-muted-foreground">输入关键字开始搜索。</p>}
        </div>
      </DialogContent>
    </Dialog>
  );
}

const workTypes: WorkType[] = ["需求", "任务", "缺陷", "技术任务"];
const workStatuses: WorkStatus[] = ["BACKLOG", "IN_PROGRESS", "IN_REVIEW", "BLOCKED", "DONE"];
const priorities = ["高", "中", "低"] as const;

type TaskDialogProps = {
  open: boolean;
  editing: boolean;
  draft: TaskDraft;
  members: WorkspaceMember[];
  iterations: Iteration[];
  onDraftChange: (draft: TaskDraft) => void;
  onClose: () => void;
  onSubmit: FormEventHandler<HTMLFormElement>;
  onDelete: () => void;
};

export function TaskDialog({ open, editing, draft, members, iterations, onDraftChange, onClose, onSubmit, onDelete }: TaskDialogProps) {
  const [deleteArmed, setDeleteArmed] = useState(false);
  return (
    <Dialog open={open} onOpenChange={(next) => { if (!next) { setDeleteArmed(false); onClose(); } }}>
      <DialogContent>
        <form onSubmit={onSubmit} className="flex flex-col gap-4">
          <DialogHeader>
            <DialogTitle>{editing ? "编辑任务" : "新建任务"}</DialogTitle>
            <DialogDescription>{editing ? "修改任务信息，或删除这条任务。" : "加入当前项目。"}</DialogDescription>
          </DialogHeader>
          <Label className="flex flex-col items-stretch gap-2" htmlFor="workstream-title">
            任务名称
            <Input id="workstream-title" autoFocus value={draft.title} onChange={(event) => onDraftChange({ ...draft, title: event.target.value })} placeholder="任务名称" />
          </Label>
          <Label className="flex flex-col items-stretch gap-2" htmlFor="workstream-description">
            说明
            <Textarea id="workstream-description" value={draft.description} onChange={(event) => onDraftChange({ ...draft, description: event.target.value })} placeholder="补充说明" />
          </Label>
          <div className="grid gap-3 sm:grid-cols-2">
            <Label className="flex flex-col items-stretch gap-2">
              类型
              <Select value={draft.type} onChange={(event) => onDraftChange({ ...draft, type: event.target.value as WorkType })}>
                {workTypes.map((item) => <option key={item} value={item}>{item}</option>)}
              </Select>
            </Label>
            <Label className="flex flex-col items-stretch gap-2">
              优先级
              <Select value={draft.priority} onChange={(event) => onDraftChange({ ...draft, priority: event.target.value as TaskDraft["priority"] })}>
                {priorities.map((item) => <option key={item} value={item}>{item}</option>)}
              </Select>
            </Label>
            <Label className="flex flex-col items-stretch gap-2">
              负责人
              <Select value={draft.ownerId} onChange={(event) => onDraftChange({ ...draft, ownerId: event.target.value })}>
                <option value="">未分配</option>
                {members.map((item) => <option key={item.id} value={item.id}>{item.name}</option>)}
              </Select>
            </Label>
            <Label className="flex flex-col items-stretch gap-2">
              截止日期
              <Input value={draft.due} onChange={(event) => onDraftChange({ ...draft, due: event.target.value })} placeholder="2026-10-30" />
            </Label>
            <Label className="flex flex-col items-stretch gap-2">
              迭代
              <Select value={draft.iterationId} onChange={(event) => onDraftChange({ ...draft, iterationId: event.target.value })}>
                <option value="">未加入迭代</option>
                {iterations.map((item) => <option key={item.id} value={item.id}>{item.name}</option>)}
              </Select>
            </Label>
            {editing && (
              <Label className="flex flex-col items-stretch gap-2">
                状态
                <Select value={draft.status} onChange={(event) => onDraftChange({ ...draft, status: event.target.value as WorkStatus })}>
                  {workStatuses.map((item) => <option key={item} value={item}>{statusLabel[item]}</option>)}
                </Select>
              </Label>
            )}
          </div>
          <DialogFooter>
            {editing && <Button type="button" variant="destructive" onClick={() => { if (!deleteArmed) { setDeleteArmed(true); return; } onDelete(); }}>{deleteArmed ? "再点一次确认删除" : "删除"}</Button>}
            <Button type="button" variant="outline" onClick={onClose}>取消</Button>
            <Button type="submit">{editing ? "保存" : "创建任务"}</Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}

type ProjectDialogProps = {
  open: boolean;
  editing: boolean;
  draft: ProjectDraft;
  members: WorkspaceMember[];
  onDraftChange: (draft: ProjectDraft) => void;
  onClose: () => void;
  onSubmit: FormEventHandler<HTMLFormElement>;
};

export function ProjectDialog({ open, editing, draft, members, onDraftChange, onClose, onSubmit }: ProjectDialogProps) {
  return (
    <Dialog open={open} onOpenChange={(next) => { if (!next) onClose(); }}>
      <DialogContent>
        <form onSubmit={onSubmit} className="flex flex-col gap-4">
          <DialogHeader>
            <DialogTitle>{editing ? "编辑项目" : "新建项目"}</DialogTitle>
            <DialogDescription>{editing ? "更新当前项目信息。" : "创建一个本地项目。"}</DialogDescription>
          </DialogHeader>
          <Label className="flex flex-col items-stretch gap-2">
            项目名称
            <Input autoFocus value={draft.name} onChange={(event) => onDraftChange({ ...draft, name: event.target.value })} placeholder="项目名称" />
          </Label>
          <Label className="flex flex-col items-stretch gap-2">
            说明
            <Textarea value={draft.description} onChange={(event) => onDraftChange({ ...draft, description: event.target.value })} placeholder="项目说明" />
          </Label>
          <div className="grid gap-3 sm:grid-cols-2">
            <Label className="flex flex-col items-stretch gap-2">
              状态
              <Select value={draft.status} onChange={(event) => onDraftChange({ ...draft, status: event.target.value as ProjectDraft["status"] })}>
                <option value="规划中">规划中</option>
                <option value="进行中">进行中</option>
                <option value="已完成">已完成</option>
              </Select>
            </Label>
            <Label className="flex flex-col items-stretch gap-2">
              负责人
              <Select value={draft.owner} onChange={(event) => onDraftChange({ ...draft, owner: event.target.value })}>
                {draft.owner !== "" && !members.some((item) => item.name === draft.owner) && <option value={draft.owner}>{draft.owner}</option>}
                {members.map((item) => <option key={item.id} value={item.name}>{item.name}</option>)}
              </Select>
            </Label>
            <Label className="flex flex-col items-stretch gap-2 sm:col-span-2">
              目标日期
              <Input value={draft.due} onChange={(event) => onDraftChange({ ...draft, due: event.target.value })} placeholder="2026-10-30" />
            </Label>
          </div>
          <DialogFooter>
            <Button type="button" variant="outline" onClick={onClose}>取消</Button>
            <Button type="submit">{editing ? "保存" : "创建项目"}</Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}

type AiDialogProps = {
  open: boolean;
  message: string;
  answer: string;
  proposalId: string;
  proposalTitle: string;
  proposalStatus: string;
  usage: string;
  loading: boolean;
  onMessageChange: (message: string) => void;
  onClose: () => void;
  onSubmit: FormEventHandler<HTMLFormElement>;
  onCreateProposal: () => void;
  onConfirmProposal: () => void;
};

export function AiDialog({ open, message, answer, proposalId, proposalTitle, proposalStatus, usage, loading, onMessageChange, onClose, onSubmit, onCreateProposal, onConfirmProposal }: AiDialogProps) {
  return (
    <Dialog open={open} onOpenChange={(next) => { if (!next) onClose(); }}>
      <DialogContent className="max-w-xl">
        <form onSubmit={onSubmit} className="flex flex-col gap-4">
          <DialogHeader>
            <DialogTitle>助手</DialogTitle>
            <DialogDescription>写入操作需要确认后才会执行。</DialogDescription>
          </DialogHeader>
          <Label className="flex flex-col items-stretch gap-2" htmlFor="ai-message">
            问题
            <Textarea id="ai-message" autoFocus value={message} onChange={(event) => onMessageChange(event.currentTarget.value)} placeholder="例如：总结当前项目的风险" />
          </Label>
          {answer !== "" && <div className="rounded-md border bg-muted px-3 py-2 text-sm">{answer}</div>}
          {usage !== "" && <p className="text-xs text-muted-foreground">{usage}</p>}
          {proposalId !== "" && (
            <div className="rounded-md border p-3">
              <p className="text-sm font-medium">待确认的变更</p>
              <p className="mt-2 text-sm">创建工作项：{proposalTitle}</p>
              <p className="mt-1 text-xs text-muted-foreground">当前状态：{proposalStatus}</p>
              <div className="mt-3 flex gap-2">
                <Button type="button" variant="outline" onClick={onConfirmProposal} disabled={loading || proposalStatus !== "WAITING_APPROVAL"}>确认执行</Button>
                <Button type="button" variant="ghost" onClick={onCreateProposal} disabled={loading}>重新生成</Button>
              </div>
            </div>
          )}
          <DialogFooter>
            <Button type="button" variant="outline" onClick={onClose}>关闭</Button>
            <Button type="submit" disabled={loading}>{loading ? "分析中…" : "开始分析"}</Button>
            {proposalId === "" && <Button type="button" variant="outline" onClick={onCreateProposal} disabled={loading || message.trim() === ""}>生成工作项提议</Button>}
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}

type LoginScreenProps = {
  login: string;
  password: string;
  notice: string;
  onLoginChange: (login: string) => void;
  onPasswordChange: (password: string) => void;
  onSubmit: FormEventHandler<HTMLFormElement>;
};

export function LoginScreen({ login, password, notice, onLoginChange, onPasswordChange, onSubmit }: LoginScreenProps) {
  return (
    <div className="flex h-svh items-center justify-center bg-background">
      <form onSubmit={onSubmit} className="flex w-full max-w-sm flex-col gap-4 rounded-lg border bg-card p-6 shadow-xs">
        <div>
          <h1 className="text-base font-semibold">登录</h1>
          <p className="mt-1 text-sm text-muted-foreground">PMS</p>
        </div>
        <Label className="flex flex-col items-stretch gap-2" htmlFor="login-name">
          账号
          <Input id="login-name" value={login} onChange={(event) => onLoginChange(event.currentTarget.value)} />
        </Label>
        <Label className="flex flex-col items-stretch gap-2" htmlFor="login-password">
          密码
          <Input id="login-password" type="password" value={password} onChange={(event) => onPasswordChange(event.currentTarget.value)} />
        </Label>
        {notice !== "" && <p className="text-sm text-destructive">{notice}</p>}
        <Button type="submit">登录</Button>
        <p className="text-center text-xs text-muted-foreground">demo / demo 管理，product / product 产品，dev / dev 开发，guest / guest 访客</p>
      </form>
    </div>
  );
}
