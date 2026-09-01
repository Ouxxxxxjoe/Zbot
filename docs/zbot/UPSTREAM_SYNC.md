# Zbot 与上游同步（Upstream Sync）

> 本文说明 Zbot 这个 fork 与上游 **Cyberbot**（`github.com/Ouxxxxxjoe/Cyberbot`）的关系、
> 如何拉取上游改动、哪些区域必须保护（品牌分歧、已删除的移动端、本地模式），以及同步后
> 必须跑的门禁。Cyberbot 是我们托管的 Cindy 派生仓，是 Zbot 的上游更新来源；
> `github.com/makecindy/cindy` 是更原始的开放源码 Cindy（即 Cyberbot 的上游），Zbot 一般
> 经 Cyberbot 转手合入，不必直接对一个极其遥远的源头做 3-way merge。上游文档
> （`docs/`、`docs/dev-rules/` 等）是**尽量不碰**的「考古地图」，同步时只合并到代码，
> 不改 Zbot 决策。

## 1. Fork 关系

| | |
|---|---|
| 上游（拉取来源） | `https://github.com/Ouxxxxxjoe/Cyberbot`（我们托管的派生仓，追踪 Cindy） |
| 原始开源源 | `https://github.com/makecindy/cindy`（Apache-2.0；Cyberbot 的上游） |
| Zbot 本仓 origin | `https://github.com/Ouxxxxxjoe/Zbot`（私有 / 未来；Zbot 推送目标） |
| 关系 | Cyberbot = Cindy 客户端的一个托管 fork；Zbot 在此基础上二次开发为「本地优先、去除云依赖」的私有客户端，桌面端 + 共享 packages；移动端已移除 |

- Zbot 保留了大量上游客户端代码（≈90%），改动集中在**身份 / 品牌、云依赖（本地优先）、
  未来服务端接入点（端点配置）**上，未对核心客户端做重新设计。
- 因此同步上游时，**大部分代码可以直接合并**；只有「品牌标识符层」「已删除的资产」「本地
  模式引入的分歧」这三类需要人工处理。

## 2. 配置 upstream remote

```bash
git remote add upstream https://github.com/Ouxxxxxjoe/Cyberbot.git
git remote -v           # 确认 upstream 已添加，origin 仍是 Zbot
git fetch upstream
```

> `origin` = Zbot 私有仓（推送目标）；`upstream` = Cyberbot（上游拉取来源）。两者已在本仓库
> 配置好。不要在本仓库内重命名既有的 `origin`，也不要把上游地址写死进脚本或 CI。

## 3. 拉取 / 合并策略

- **推荐**：定期 `git fetch upstream`，把上游 `main` 合并到 Zbot 的 `main`（或先合到一个
  `sync/*` 分支做 review，再走 PR）。合并而不是 rebase，保留 fork 历史，方便日后回溯
  「哪些改动来自上游」。
- 只在确实要独立成型、且上游历史是线性时才考虑 rebase；Zbot 与上游已分叉，默认不用 rebase。
- 大版本 / 高风险上游改动（涉及协议、数据库 migration、更新器、插件基座、权限边界）先阅读
  对应 `docs/dev-rules/*` 规则并评估迁移成本，再决定是否吸收。

## 4. 合并时必须保护的「分歧区」

这些区域与上游**故意不同**，合并时不能让上游覆盖，否则会破坏 Zbot 身份或删掉已剥离的
能力：

| 分歧区 | 位置 | 保护动作 |
|---|---|---|
| 展示名 | `packages/maker-shared/src/branding.ts` | 合并后确认仍是 `BRAND_NAME = 'Zbot'` |
| 标识符层 | `packages/maker-shared/src/brandIdentity.ts` | 确认可执行名 `zagent`、深链 `zbot://`、appId `com.zhida.agent` 系、userData `Zbot`、更新器 `zbot-updater` 未被上游改回 |
| 区域策略 | 同品牌标识符 + `docs/product-rules/region-and-editions.md` | Zbot 默认 `cn`（只发行简体中文版）；上游默认 `global`。合并时确认 `DEFAULT_CINDY_REGION = 'cn'` 与发布链路 |
| 移动端 | `apps/mobile`（已移除） | 上游新增 mobile 改动**不要**再合入；Zbot 只做桌面端 |
| 端点 / 中控 | `config/endpoint*.json` | Zbot 端点指向未来自有服务（`*.zbot.local`）；合并时让上游 endpoint 改动**不覆盖** Zbot 的接入点配置 |
| 本地模式 | `apps/desktop/src/main/authManager.ts` 会话模型 | 本地优先（`local` 模式）是 Zbot 引入的分歧；上游对登录 / 云会话的改动按注释逐条判断，避免破坏本地优先 |

## 5. 同步后必须跑的门禁

合并成功后，在 Zbot 侧重新校验品牌与端点身份，防止上游把名字/端点悄悄带偏：

```bash
pnpm check:brand-terminology   # 品牌术语 guard：禁止用户可见层出现 XD Maker 等旧名
pnpm check:endpoints           # endpoint 字面量 check：禁止 endpoint 被改回上游域名
pnpm check:i18n                # i18n 完整性
pnpm check:i18n-glossary       # 术语表
pnpm test:unit:related         # 本次改动影响的单测
pnpm --filter desktop run --if-present typecheck
```

> 单点一致性（TS 单一事实源 ↔ 各 .mjs 脚本镜像字面量）由
> `scripts/__tests__/brand-identity-sync.test.mjs` 断言；改 `brandIdentity.ts` 后漏改任何
> 一处镜像，这里立即红灯。

> ⚠️ **品牌 / locale / 深链 / 区域语义类上游改动，单测断言极易失配**（fork 初期
> `client-ci` 连续多轮全红即因此）。`test:unit:related` 只按 git 改动文件选测试，
> **覆盖不到「测试没改但断言过时」的文件**——fork / 大范围合并后必须跑 CI 全量分片。
> 合并后按 `docs/zbot/UPSTREAM_TEST_SYNC.md` 的可 grep 清单逐项自查，并用 Node 22
> （仓库钉的版本）本地验证，避免 Node 26 + threads 池的 localStorage 伪故障误报。

## 6. 合并冲突的通用处理

- **以当前 checkout 的代码为准**解决冲突；发现文档与实现不一致时，修文档而不是凭文档
  猜实现。
- 涉及用户数据的 migration / 破坏性 schema 变更，先读
  `docs/dev-rules/database-and-migrations.md` 与 `multi-account-database-architecture.md`。
- 提交前满足 `AGENTS.md` 的门禁：`pnpm test:unit:related` + 相关 package `typecheck`，
  并补齐 DCO `Signed-off-by`。
