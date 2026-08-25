# Zbot 架构

> 本文是 Zbot 侧的架构导读：仓库结构、桌面端进程模型、agent 编排、本地库，以及
> **本地 / 云会话模型**这个 Zbot 与上游 Cindy 最大的分歧点。功能定位的逐目录说明以
> `docs/dev-rules/repo-map.md`（上游地图，尽量不改）为准；**依赖方向与解耦不变量**
> 见 `docs/dev-rules/architecture-invariants.md`，改动前必须读。

## 1. 仓库顶层结构

| 路径 | 说明 |
|---|---|
| `apps/desktop` | 唯一终端产品——Electron + Vite 桌面客户端（Windows / macOS 简体中文版）。移动端已从本 fork 移除。 |
| `apps/*-bin` | 随桌面端分发的预编译 CLI（claude-code / codex / ripgrep / pi）。不入 git，`pnpm install` postinstall 或 `pnpm install:agent-binaries` 按平台拉取；Android platform-tools 也在此。 |
| `packages/*` | 客户端共享能力包，与 main / renderer 解耦（详见 §4）。 |
| `config/` | 运行期端点清单（`endpoint.json` / `endpoint.global.json` / `endpoint.dev.json.example`）。这是**未来接入我们自己的服务端 / 中控系统的接入点**。 |
| `scripts/` | 仓库级工程脚本：dev 启动包装、agent 二进制拉取、i18n／endpoint／品牌等校验 guard、worktree 管理。 |
| `tools/` | claude／codex／ripgrep／pi 四个 runtime 的版本 pin（`latest.json`）与更新器。 |
| `docs/` | 上游规则文档（`dev-rules/` 工程、`product-rules/` 产品、`design-rules/` 设计、`legal/`）与 Zbot 自有文档（`zbot/`）。 |
| `drizzle/`（在 `apps/desktop/` 内） | 本地 SQLite 库的 migration（`apps/desktop/drizzle/`）。 |

## 2. 桌面端进程模型

Electron 单实例，源码分四个部分：

| 部分 | 路径 | 职责 |
|---|---|---|
| main | `apps/desktop/src/main/` | 业务逻辑主进程：agent 编排、localDb、设备链路、MCP 集成、IPC 注册、生命周期、更新服务、心跳、session 状态机等。**禁止运行时动态 `import()`**（只允许顶层静态 import）。 |
| preload | `apps/desktop/src/preload/` | 最小桥接层，向 renderer 暴露受限 `window.electronAPI`。 |
| renderer | `apps/desktop/src/renderer/` | 纯渲染 UI：features、panels、themes、i18n、hooks、components、lib。 |
| shared | `apps/desktop/src/shared/` | 主 / 渲染共享类型与常量（如布局树 `layoutTree.ts`、区域代号、登录方式）。 |

进程职责与信任边界（CSP、WebView、导航、IPC、Electron 特权能力）见
`docs/dev-rules/electron-security-and-process-boundaries.md`。

### 2.1 agent 编排与「本地 agent 工作客户端」

Zbot 的核心价值是把多个 harness 收进一个客户端。编排在 main 侧：

- **maker-host / maker-ipc**（`apps/desktop/src/main/maker-host/`、`maker-ipc/`）：
  与跨 Agent 执行、工具暴露、IPC 会话相关的宿主层。
- **agent 实现**（`packages/maker-core/src/agents/`，如 `claude-code`、`codex`、`pi`）：
  BaseAgent 抽象与各 harness 的适配。改动前必读
  `docs/dev-rules/maker-core-and-agent-behavior.md`。
- **maker-orchestration / goal-host / scheduler-host / learn-host / reviewer**：
  任务编排、目标执行、定时调度、学习、复核等能力，均为纯 host 层，不写业务逻辑。
- **local-model-runtime / model-access / model-providers**：本地模型与网关路由。

### 2.2 本地库

- `apps/desktop/src/main/localDb/`：本地 SQLite（Drizzle，migration 在
  `apps/desktop/drizzle/`）。数据库 schema、migration、运行期访问见
  `docs/dev-rules/database-and-migrations.md` 与 `docs/dev-rules/multi-account-database-architecture.md`。
- `apps/desktop/src/main/regionUserData.ts`：按区域（cn）派生 userData 目录。

### 2.3 端点与本地/云服务调用

- `apps/desktop/src/main/clientEndpointsService.ts`：从运行期端点清单读各服务 base URL
  （auth、device-link、heartbeat、skillhub、plugin、cdn …），供 main 侧跨云服务使用。
- 端点来自 `config/endpoint*.json`，本身是**纯数据 + 后续中控系统接入点**。

## 3. 本地 / 云会话模型（Zbot 关键分歧）

> 这是 Zbot「本地优先」的根基。会话状态机在 `apps/desktop/src/main/authManager.ts`。

会话采用 `AppSessionMode` 三态：

| 模式 | 含义 | 是否联系云端 |
|---|---|---|
| `cloud` | 已登录账号（Cindy/Zbot 云端账号） | ✅ |
| `local` | **无账号**的本地会话（`LOCAL_DATA_OWNER_ID` 作为数据 owner） | ❌ 不向云端上报 |
| `signed-out` | 未登录、未进入应用 | ❌ |

- `ProtectedRoute` 以 `canEnterApp`（`mode !== 'signed-out'`）决定能否进入主界面；
  `GuestRoute` 对 `cloud` / `local` 一律重定向到首页。
- 本地模式下，服务端支撑的能力（账号级 skillhub、云端心跳、账号数据同步等）不可用，
  但**本机 agent（Claude Code / Codex / 本地模型）、本地库、插件、定时、设备链路**等
  均可用。
- 心跳 `heartbeatService.ts` 只在 `mode === 'cloud'` 且已验证时才联系 `heartbeatUrl`；
  local / signed-out 不与其联络（私隐语义见 [`LOCAL_MODE.md`](LOCAL_MODE.md)）。

云端登录代码路径（`authManager.ts`、`auth-client`、登录页、billing、skillhub、device-link
等）**保留完整，但被本地优先默认吸附在一旁**，供未来接入自有服务端时复用（见
[`LOCAL_MODE.md`](LOCAL_MODE.md)）。

## 4. 共享包

「主要使用方」按各 `package.json` 的 workspace 依赖核对；完整表见
`docs/dev-rules/repo-map.md`。Zbot 侧常用几类：

- **品牌/展示层**：`maker-shared`（`branding.ts`、`brandIdentity.ts`、区域代号）。
- **凭证 / 会话**：`auth-client`（auth-server 客户端契约）、`device-link`（跨设备远程控制）。
- **Agent / 编排**：`maker-core`（BaseAgent、session 编排）、`maker-scheduler`、
  `orca-workflow`（多 worker 协同）。
- **工具 / 服务**：`cindy-tools`（Ghost 意识内部工具集）、`browser-control-runtime`、
  `file-browser-core`、`github-client` / `gitlab-client`、`model-providers`、
  `embedding-client`、`voice-input-core`、`heartbeat-client`。
- **协议桥**：`anthropic-compat-proxy`、`anthropic-responses-bridge`、
  `responses-anthropic-bridge`（让 Claude Code SDK 可经网关访问非 Anthropic 后端）。

**安全边界**：package 与 render／main 解耦，不 import Desktop 组件、不反向依赖 main，
通过初始化 / 回调注入运行期配置。

## 5. 配置分层

用户可配置项遵循「系统默认值 + 用户 override」合并，见
`docs/dev-rules/configuration-and-overrides.md`。端点 / 构建身份等关键配置见
[`BRANDING.md`](BRANDING.md) 与 [`LOCAL_MODE.md`](LOCAL_MODE.md)。

## 6. 其它

- **i18n**：四语言 locale 在 `apps/desktop/src/renderer/i18n/locales/`，品牌名统一用
  `{{appName}}` 占位（见 [`BRANDING.md`](BRANDING.md)）。
- **设备链路 / 远程**：`device-link`、`maker-remote-ssh`、`maker-cc-manager`、
  `maker-pi-manager`、`remote-file-service`、`ios-simulator-runtime`。
- **IM / 通知**：`lizi-im`、`wecomGroupNotification`、`telegram` 相关。
- **插件**：`plugin-protocol`、`plugin-market`、`.cindy` 运行时，改动前读
  `docs/dev-rules/plugin-security-and-authoring.md`（存量插件兼容是红线）。
