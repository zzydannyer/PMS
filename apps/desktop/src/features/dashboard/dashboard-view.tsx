import {
  Activity,
  ArrowUpRight,
  Check,
  CheckCircle2,
  ChevronDown,
  CircleDot,
  MoreHorizontal,
} from "lucide-react";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";

import {
  filterLabel,
  metricCards,
  priorityLabel,
  priorityTone,
  statusLabel,
  statusTone,
  workFilters,
} from "./dashboard-data";
import type {
  DashboardWorkItem,
  FilterKey,
  FocusItem,
} from "./dashboard-types";

type DashboardViewProps = {
  workItems: DashboardWorkItem[];
  filteredWorkItems: DashboardWorkItem[];
  focusItems: FocusItem[];
  filter: FilterKey;
  notice: string;
  onFilterChange: (filter: FilterKey) => void;
  onToggleFocus: (itemId: string) => void;
  onNoticeChange: (notice: string) => void;
};

export function DashboardView({
  workItems,
  filteredWorkItems,
  focusItems,
  filter,
  notice,
  onFilterChange,
  onToggleFocus,
  onNoticeChange,
}: DashboardViewProps) {
  const completedFocus = focusItems.filter((item) => item.done).length;

  return (
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
              <div
                className={`flex size-9 items-center justify-center rounded-xl ${iconClassName}`}
              >
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
              onClick={() => onNoticeChange("交付脉搏已刷新。")}
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
                      item.status === "At risk" ? "bg-amber-400" : ""
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
              onClick={() => onNoticeChange("已打开重点事项操作。")}
            >
              <MoreHorizontal className="size-[18px]" />
            </Button>
          </CardHeader>
          <CardContent className="space-y-2">
            {focusItems.map((item) => (
              <button
                key={item.id}
                type="button"
                onClick={() => onToggleFocus(item.id)}
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
              onClick={() => onNoticeChange("所有重点事项已经展示。")}
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
              {workFilters.map((key) => (
                <button
                  key={key}
                  type="button"
                  onClick={() => onFilterChange(key)}
                  className={`rounded-md px-3 py-1.5 text-xs transition-colors ${
                    filter === key
                      ? "bg-slate-800 text-white"
                      : "text-slate-500 hover:text-slate-300"
                  }`}
                >
                  {filterLabel[key]}
                </button>
              ))}
            </div>
          </CardHeader>
          <CardContent className="space-y-2">
            {filteredWorkItems.map((item) => (
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
                      item.status === "Blocked" ? "bg-rose-400" : ""
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
            {filteredWorkItems.length === 0 && (
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
  );
}
