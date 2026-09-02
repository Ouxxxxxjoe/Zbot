# Zbot 文档

> 本目录是 **Zbot 自有的说明文档层**，与上游 Cindy 保留文档（`docs/`）分开维护。
> 它回答「Zbot 是什么、怎么构建、怎么改品牌、怎么出海（本地模式）、怎么发版」，
> 是 Zbot 团队未来的工程门面。上游技术细节仍以 `docs/dev-rules/` 等为准，两者不互相覆盖。

## 为什么分开

本仓库是开放源码 Cindy 客户端的一个**私有 fork**，目标是把它改造成**本地优先的 Agent
工作客户端**。上游 Cindy 文档（`docs/`、`docs/dev-rules/`、`docs/product-rules/`、
`docs/design-rules/` 等）是我们跟踪上游、排查旧代码时的「考古地图」，尽量不改、保留原样；
而 Zbot 自己的设计决策、分歧点与独家能力写在本目录，维护者只看这里就能上手。

## 文档集

| 文档 | 内容 | 什么时候读 |
|---|---|---|
| [`ARCHITECTURE.md`](ARCHITECTURE.md) | 仓库结构、桌面端进程模型、agent 编排、本地库、共享包、本地/云会话模型 | 初次接触代码、判断新代码归属 |
| [`UPSTREAM_SYNC.md`](UPSTREAM_SYNC.md) | 与上游 Cindy 的 fork 关系、remote 配置、拉取/合并策略、品牌分歧与回退保护 | 需要从上游拉取或合并改动 |
| [`BRANDING.md`](BRANDING.md) | 展示名与标识符层双单点、区域模型、品牌 guard 与测试、可执行名/appId/深链 | 改品牌、改可执行名、改区域 |
| [`LOCAL_MODE.md`](LOCAL_MODE.md) | 本地优先的无账号会话、云作为未来接入点、端点清单、私隐语义 | 理解默认启动体验、云/本地边界 |
| [`LOCAL_AGENT_RUNTIME_BUNDLING.md`](LOCAL_AGENT_RUNTIME_BUNDLING.md) | Codex / Pi 未来随 Desktop 包内置的决策、边界与验收条件 | 规划离线 Agent runtime 分发 |
| [`RELEASE.md`](RELEASE.md) | 桌面打包、更新器、发布区域（仅中文版）、签名/公证、CI | 打正式包、发版、排查打包失败 |

## 与上游文档的关系

- **Zbot 新增 → `docs/zbot/`**：本目录。
- **必须保留的技术文档（`docs/dev-rules/`）**：构建、开发环境、upstream sync 的工程背景、
  桌面端打包、架构说明、关键配置说明。Zbot 维护这些时**沿用**它们，但 Zbot 侧决策落在此目录。
- **暂时保留但不对外的文档（`docs/` 下 auth / cloud / SkillHub / Mobile / OAuth / 发布流程等）**：
  现在可能不用，但 upstream 合并或排查旧代码时是宝贵的参照，删除反而失去上下文。

## 维护约定

- 本目录只写 Zbot 的事实，不复制上游文档正文；需要引用时指向对应 `docs/…` 路径。
- 与代码冲突时，**以当前 checkout 的代码为准**并顺手修正此处文档。
- 涉及品牌名/标识符时，先读 [`BRANDING.md`](BRANDING.md) 的两个单点，避免在文档里硬编码
  会在改名时漏掉的字符串。
