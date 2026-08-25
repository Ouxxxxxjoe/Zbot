# 本地模式（Local Mode）

> 本文说明 Zbot「本地优先」的会话模型：何为无账号本地会话、如何进入、本地与云端的边界、
> 私隐语义，以及把云端登录保留为**未来服务端 / 中控系统接入点**的设计。
> 会话状态机权威代码在 `apps/desktop/src/main/authManager.ts`；相关门禁见
> `docs/dev-rules/credentials-and-local-storage.md` 与 `electron-security-and-process-boundaries.md`。

## 1. 为什么本地优先

Zbot 是一个**完整的本地 Agent 工作客户端**：它在本机运行真实的 Claude Code / Codex / 本地模型，
用你自己的文件与已登录的应用干活。账号登录不是使用前提——未登录也能跑全部本机 Agent 能力。

`AppSessionMode` 三态（`authManager.ts`）：

| 模式 | 含义 | 数据 owner | 是否联系云端 |
|---|---|---|---|
| `cloud` | 已登录账号 | 账号 id (`dataOwnerId`) | ✅ |
| `local` | **无账号**本地会话 | `LOCAL_DATA_OWNER_ID` | ❌ 不向云端上报 |
| `signed-out` | 未登录、未进应用 | — | ❌ |

- `ProtectedRoute` 以 `canEnterApp`（`mode !== 'signed-out'`）决定能否进入主界面；
  `GuestRoute` 对 `cloud` / `local` 一律 `Navigate to "/"`。
- 登录页提供「跳过登录」入口（`openLocalMode`），经 `AuthContext.enterLocalMode()` 切进
  本地会话，同意协议后进入主界面；界面显示账号态为「未登录」。

## 2. 进入 / 退出本地模式

- **进入**：登录页「跳过登录」→ `useLogin().enterLocalMode` → main 侧 `enterLocalMode`（会话切到
  `local`，数据 owner 为 `LOCAL_DATA_OWNER_ID`）。
- **退出**（切换到登录）：`exitLocalMode()`（回到 `signed-out`），再从应用内走登录
  `useSignInToCindy()`。**退出本地模式不删除 local 命名空间数据**——只是切走 owner；
  再次进入本地模式可找回。
- 本地与云是两个数据 owner，登录后 owner 切到账号命名空间，本地数据保留在盘上但不
  合并、不可见。

## 3. 本地模式能做什么 / 不能做什么

**能用**：本机 agent（Claude Code / Codex / 本地模型）、本地库、MCP、插件、定时调度、
设备链路（本地 / 远程 SSH）、文件浏览、语音输入、技能 / 记忆等客户端能力。

**不可用 / 有边界**：

- 账号级权利：SkillHub 市场登录态、账号数据同步、账单。
- 云端心跳 / 在线状态：`heartbeatService.ts` 只在 `mode === 'cloud'` 且已验证时启动
  （`verifiedCloudUserId` 返回 uid）；local / signed-out 一律不联系 `heartbeatUrl`。
- 服务端支撑的「账号看板」能力。

## 4. 私隐语义

本地模式的账号无关立场是**产品语义，不只是一条 if**：

- 本地模式**不得向云端上报在线状态**（无账号可隐私上报），心跳被显式禁用以落实『本地
  模式不发 device_login / 在线节拍』的心跳上报窗口。
- 本机数据默认落在本地 userData 目录（`Zbot` / 区域派生），不会因进入本地模式而偷偷
  上传；持久数据落盘与授权处理见
  `docs/dev-rules/credentials-and-local-storage.md`。

## 5. 云端作为未来服务端 / 中控系统接入点

Zbot 不做「到处散落的云端调用」，而是把所有对外服务收敛到一个**可插拔端点清单**，作为
未来接入我们自己的服务端 / 中控系统的接入点：

- 端点清单：`config/endpoint.json`（及 `endpoint.global.json`、`endpoint.dev.json.example`）。
  目前指向 Zbot 未来自有服务占位域（`*.zbot.local`）。
- 消费方：`apps/desktop/src/main/clientEndpointsService.ts` 读运行期清单；心跳、设备链路、
  mcp、skillhub、plugin、cdn 等 host 层一律经它取 URL，不硬编码。
- 认证契约：`packages/auth-client`（平台无关的 auth-server 客户端契约）与 main 侧
  `authManager.ts` 的 cloud 会话路径保留完整，登录 / 刷新 / 登出等状态机未被删除。未来
  只需把端点清单指向 Zbot 中控系统，并让 auth-server 契约对齐即可复用。

这样：**客户端能力（本机 Agent 核心）不依赖任何云**；**需要云的能力走同一个可切换的端点接入点**，
将来接我们自己的服务端时不必重写客户端。

## 6. 改动本地模式时的门禁

- 改动 `authManager.ts` 的会话切换 / 数据 owner 语义前，先读
  `docs/dev-rules/multi-account-database-architecture.md` 与
  `credentials-and-local-storage.md`。
- 不要把本地模式的数据 owner 或命名空间与云账号合并；`LOCAL_DATA_OWNER_ID` 与
  local-v1 命名空间是本地存在的锚点。
- 不要引入「本地模式也向云端上报状态」的逻辑（违反私隐语义）。
- 提交前跑 `pnpm test:unit:related` + 相关 package `typecheck`；涉及端点 / 身份用
  `pnpm check:endpoints` / `pnpm check:brand-terminology`。
