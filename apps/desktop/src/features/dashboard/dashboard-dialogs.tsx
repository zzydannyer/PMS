import type { FormEventHandler } from "react";
import { ChevronRight, Plus, Search, Sparkles, X } from "lucide-react";

import { Button } from "@/components/ui/button";

import type { DashboardWorkItem } from "./dashboard-types";

type SearchDialogProps = {
  open: boolean;
  query: string;
  results: DashboardWorkItem[];
  onQueryChange: (query: string) => void;
  onClose: () => void;
  onSelect: (item: DashboardWorkItem) => void;
};

export function SearchDialog({
  open,
  query,
  results,
  onQueryChange,
  onClose,
  onSelect,
}: SearchDialogProps) {
  if (!open) {
    return <></>;
  }

  return (
    <div className="fixed inset-0 z-30 flex items-start justify-center bg-slate-950/75 px-4 pt-[14vh] backdrop-blur-sm">
      <div className="theme-modal w-full max-w-xl rounded-2xl border border-slate-700 bg-[#0b192b] p-4 shadow-2xl">
        <div className="flex items-center gap-3 border-b border-slate-800 pb-3">
          <Search className="size-5 text-slate-500" />
          <input
            autoFocus
            value={query}
            onChange={(event) => onQueryChange(event.currentTarget.value)}
            placeholder="搜索工作流、负责人或项目……"
            className="min-w-0 flex-1 bg-transparent text-sm text-white outline-none placeholder:text-slate-600"
          />
          <button
            type="button"
            aria-label="关闭搜索"
            onClick={onClose}
            className="rounded-md p-1 text-slate-500 hover:bg-slate-800 hover:text-white"
          >
            <X className="size-4" />
          </button>
        </div>
        <div className="mt-3 space-y-1">
          {query.trim() !== "" && results.length === 0 && (
            <p className="p-4 text-center text-sm text-slate-500">
              没有找到匹配的工作流。
            </p>
          )}
          {results.map((item) => (
            <button
              key={item.id}
              type="button"
              onClick={() => onSelect(item)}
              className="theme-search-result flex w-full items-center justify-between rounded-lg p-3 text-left hover:bg-slate-800"
            >
              <span>
                <span className="block text-sm text-slate-200">
                  {item.title}
                </span>
                <span className="mt-1 block text-xs text-slate-500">
                  {item.stream} · {item.owner}
                </span>
              </span>
              <ChevronRight className="size-4 text-slate-600" />
            </button>
          ))}
          {query.trim() === "" && (
            <p className="p-4 text-center text-xs text-slate-600">
              搜索范围仅限当前本地演示数据。
            </p>
          )}
        </div>
      </div>
    </div>
  );
}

type CreateWorkDialogProps = {
  open: boolean;
  title: string;
  loading: boolean;
  onTitleChange: (title: string) => void;
  onClose: () => void;
  onSubmit: FormEventHandler<HTMLFormElement>;
};

export function CreateWorkDialog({
  open,
  title,
  loading,
  onTitleChange,
  onClose,
  onSubmit,
}: CreateWorkDialogProps) {
  if (!open) {
    return <></>;
  }

  return (
    <div className="fixed inset-0 z-30 flex items-center justify-center bg-slate-950/75 px-4 backdrop-blur-sm">
      <form
        onSubmit={onSubmit}
        className="theme-modal w-full max-w-md rounded-2xl border border-slate-700 bg-[#0b192b] p-6 shadow-2xl"
      >
        <div className="flex items-start justify-between">
          <div>
            <p className="text-lg font-semibold text-white">新建任务</p>
            <p className="mt-1 text-sm text-slate-500">
              把下一项工作加入当前项目。
            </p>
          </div>
          <button
            type="button"
            aria-label="关闭新建任务"
            onClick={onClose}
            className="rounded-md p-1 text-slate-500 hover:bg-slate-800 hover:text-white"
          >
            <X className="size-4" />
          </button>
        </div>
        <label
          className="mt-6 block text-xs font-medium text-slate-400"
          htmlFor="workstream-title"
        >
          任务名称
        </label>
        <input
          id="workstream-title"
          autoFocus
          value={title}
          onChange={(event) => onTitleChange(event.currentTarget.value)}
          placeholder="例如：完成登录页验收"
          className="theme-field mt-2 h-11 w-full rounded-lg border border-slate-700 bg-slate-950 px-3 text-sm text-white outline-none placeholder:text-slate-600 focus:border-cyan-400"
        />
        <div className="mt-6 flex justify-end gap-2">
          <Button type="button" variant="ghost" onClick={onClose}>
            取消
          </Button>
          <Button type="submit" variant="primary" disabled={loading}>
            <Plus className="size-4" />
            {loading ? "创建中…" : "创建任务"}
          </Button>
        </div>
      </form>
    </div>
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

export function AiDialog({
  open,
  message,
  answer,
  proposalId,
  proposalTitle,
  proposalStatus,
  usage,
  loading,
  onMessageChange,
  onClose,
  onSubmit,
  onCreateProposal,
  onConfirmProposal,
}: AiDialogProps) {
  if (!open) {
    return <></>;
  }

  return (
    <div className="fixed inset-0 z-30 flex items-center justify-center bg-slate-950/75 px-4 backdrop-blur-sm">
      <form
        onSubmit={onSubmit}
        className="theme-modal w-full max-w-xl rounded-2xl border border-slate-700 bg-[#0b192b] p-6 shadow-2xl"
      >
        <div className="flex items-start justify-between">
          <div>
            <p className="flex items-center gap-2 text-lg font-semibold text-white">
              <Sparkles className="size-5 text-violet-300" />
              PMS AI 助手
            </p>
            <p className="mt-1 text-sm text-slate-500">
              AI 只提供建议，涉及写入的操作必须由你确认。
            </p>
          </div>
          <button
            type="button"
            aria-label="关闭 AI 助手"
            onClick={onClose}
            className="rounded-md p-1 text-slate-500 hover:bg-slate-800 hover:text-white"
          >
            <X className="size-4" />
          </button>
        </div>
        <label
          className="mt-6 block text-xs font-medium text-slate-400"
          htmlFor="ai-message"
        >
          你的问题
        </label>
        <textarea
          id="ai-message"
          autoFocus
          value={message}
          onChange={(event) => onMessageChange(event.currentTarget.value)}
          placeholder="例如：总结一下当前项目的风险"
          className="theme-field mt-2 min-h-24 w-full resize-none rounded-lg border border-slate-700 bg-slate-950 p-3 text-sm text-white outline-none placeholder:text-slate-600 focus:border-violet-400"
        />
        {answer !== "" && (
          <div className="mt-4 rounded-lg border border-violet-400/20 bg-violet-400/5 p-4 text-sm leading-6 text-slate-300">
            {answer}
          </div>
        )}
        {usage !== "" && (
          <p className="mt-3 text-xs text-slate-500">{usage}</p>
        )}
        {proposalId !== "" && (
          <div className="mt-4 rounded-lg border border-cyan-400/20 bg-cyan-400/5 p-4">
            <p className="text-xs font-semibold text-cyan-200">
              待确认的变更提议
            </p>
            <p className="mt-2 text-sm text-slate-200">
              创建工作项：{proposalTitle}
            </p>
            <p className="mt-1 text-xs text-slate-500">
              当前状态：{proposalStatus}
            </p>
            <div className="mt-3 flex gap-2">
              <Button
                type="button"
                variant="secondary"
                onClick={onConfirmProposal}
                disabled={loading || proposalStatus !== "WAITING_APPROVAL"}
              >
                确认执行
              </Button>
              <Button
                type="button"
                variant="ghost"
                onClick={onCreateProposal}
                disabled={loading}
              >
                重新生成
              </Button>
            </div>
          </div>
        )}
        <div className="mt-6 flex justify-end gap-2">
          <Button type="button" variant="ghost" onClick={onClose}>
            关闭
          </Button>
          <Button type="submit" variant="primary" disabled={loading}>
            <Sparkles className="size-4" />
            {loading ? "分析中…" : "开始分析"}
          </Button>
          {proposalId === "" && (
            <Button
              type="button"
              variant="secondary"
              onClick={onCreateProposal}
              disabled={loading || message.trim() === ""}
            >
              生成工作项提议
            </Button>
          )}
        </div>
      </form>
    </div>
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

export function LoginScreen({
  login,
  password,
  notice,
  onLoginChange,
  onPasswordChange,
  onSubmit,
}: LoginScreenProps) {
  return (
    <div className="flex h-svh min-h-175 min-w-280 items-center justify-center bg-[#07111f] text-slate-100">
      <form
        onSubmit={onSubmit}
        className="w-full max-w-sm rounded-2xl border border-slate-700 bg-[#0b192b] p-7 shadow-2xl"
      >
        <div className="flex items-center gap-3">
          <div className="flex size-10 items-center justify-center rounded-xl bg-cyan-400 font-black text-slate-950">
            P
          </div>
          <div>
            <p className="font-bold">PMS 项目管理中心</p>
            <p className="text-xs text-slate-500">登录你的工作区</p>
          </div>
        </div>
        <label
          className="mt-8 block text-xs font-medium text-slate-400"
          htmlFor="login-name"
        >
          账号
        </label>
        <input
          id="login-name"
          value={login}
          onChange={(event) => onLoginChange(event.currentTarget.value)}
          className="theme-field mt-2 h-11 w-full rounded-lg border border-slate-700 bg-slate-950 px-3 text-sm text-white outline-none focus:border-cyan-400"
        />
        <label
          className="mt-4 block text-xs font-medium text-slate-400"
          htmlFor="login-password"
        >
          密码
        </label>
        <input
          id="login-password"
          type="password"
          value={password}
          onChange={(event) => onPasswordChange(event.currentTarget.value)}
          className="theme-field mt-2 h-11 w-full rounded-lg border border-slate-700 bg-slate-950 px-3 text-sm text-white outline-none focus:border-cyan-400"
        />
        {notice !== "" && (
          <p className="mt-3 text-xs text-rose-300">{notice}</p>
        )}
        <Button type="submit" variant="primary" className="mt-6 w-full">
          登录
        </Button>
        <p className="mt-4 text-center text-xs text-slate-600">
          演示账号：demo / demo
        </p>
      </form>
    </div>
  );
}
