# PMS 项目管理工作台

面向中小型研发与产品团队的项目管理系统，采用 Tauri 2 桌面端与可演进的云端协作架构。

## 目录

```text
apps/desktop        Tauri 桌面端
apps/server         NestJS 云端服务基座
apps/web            独立 Web 端
packages/domain     项目、工作项与 AI 提议领域模型
packages/api-client 云端 API 契约
packages/ai-core    AI 提议状态机与执行前置逻辑
```

## 开发

```bash
pnpm install
pnpm tauri dev
```

## 构建

```bash
pnpm build
pnpm tauri build
pnpm --filter @pms/web dev
```

当前桌面端仍使用演示数据；NestJS 已提供 PostgreSQL 持久化 API，便于联调和验证流程。

## 服务端

```bash
pnpm server:dev
```

服务端提供 `/health` 健康检查，以及以下 MVP 联调接口：

- `GET /api/projects?workspaceId=workspace-demo`
- `POST /api/projects`
- `GET /api/projects/:projectId/members`
- `GET /api/work-items?workspaceId=workspace-demo&projectId=project-pms`
- `POST /api/work-items`
- `PATCH /api/work-items/:workItemId`
- `GET /api/projects/:projectId/delivery`
- `GET /api/projects/:projectId/metrics`
- `POST /api/projects/:projectId/iterations`
- `POST /api/projects/:projectId/milestones`
- `POST /api/projects/:projectId/releases`
- `POST /api/work-items/:workItemId/defects`
- `GET /api/work-items/:workItemId/dependencies`
- `POST /api/work-items/:workItemId/dependencies`
- `POST /api/integrations/:provider/events`
- `GET /api/automation/rules?workspaceId=workspace-demo`
- `POST /api/automation/rules?workspaceId=workspace-demo`
- `POST /api/automation/rules/:ruleId/run?workspaceId=workspace-demo`
- `GET /api/automation/runs?workspaceId=workspace-demo`
- `GET /api/portfolio/summary?workspaceId=workspace-demo`
- `GET /api/portfolio/capacity?workspaceId=workspace-demo`
- `GET /api/governance/ai-audits?workspaceId=workspace-demo`
- `GET /api/governance/policy?workspaceId=workspace-demo`
- `POST /api/governance/policy?workspaceId=workspace-demo`
- `POST /api/agent/proposals`
- `GET /api/agent/proposals`
- `POST /api/agent/proposals/:proposalId/confirm`
- `POST /api/agent/proposals/:proposalId/revoke`
- `POST /api/agent/ask`
- `GET /api/agent/usage?workspaceId=workspace-demo`
- `GET /api/agent/tools`
- `POST /api/mcp`（JSON-RPC MCP 边界）
- `GET /api/events`（SSE 实时事件流）
- `POST /api/auth/login`（演示账号：`demo` / `demo`）

项目、工作项、项目成员、评论和通知 API 已切换为 PostgreSQL 持久化读写；鉴权和 AI Provider 尚未接入。
写操作可使用登录返回的 `Authorization: Bearer <accessToken>`，也可继续使用 `X-Member-Id` 联调；正式用户表和第三方身份接入尚未完成。
