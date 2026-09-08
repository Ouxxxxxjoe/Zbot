# 本地 Agent Runtime 内置计划

> 状态：**已记录，暂不在 Zbot Local 0.1 实现**。

## 决策

Zbot Local 的长期目标是在 macOS 与 Windows 安装包内优先提供可离线运行的
Agent runtime。优先级为：

1. **Codex**
2. **Pi**

两者可降低用户首次使用时对外网、公司代理与单独安装 CLI 的依赖。Claude Code
暂不纳入此决定，待单独确认分发许可、体积和升级策略后再评估。

## 当前状态

当前 Desktop 包仅内置 ripgrep。Claude Code、Codex 与 Pi 的运行时准备仍沿用现有
agent-binaries 链路；不能把「缺少可选 runtime」处理成整个本地应用无法启动。

本文件不授权在 Local 0.1 中新增下载、端点、云端配置或自动更新逻辑。

## 后续实现边界

- 仅支持 macOS、Windows；不恢复 iOS、Android、WDA、iOS Simulator 或 mobile helper。
- runtime 必须随 Desktop package 的目标平台与架构分别打入，并经固定版本与 SHA-256 校验。
- packaged Local 优先解析内置 runtime；只有用户明确开启的外部安装/更新动作才允许访问网络。
- Codex/Pi 不可用时，应只禁用相应 Agent 入口并给出可操作说明；本地数据库、插件、MCP、
  Scheduler 和主界面不得因此无法进入。
- runtime 升级必须与应用更新解耦，不能重新引入 Zbot/Cindy CDN 作为 Local 启动前置条件。

## 实现前验收

- macOS x64、arm64 与 Windows x64 均能从全新安装包解析正确的内置 runtime。
- 断网、无 DNS、空 userData 下进入 Local 后，Codex/Pi 可启动且不触发 endpoint manifest。
- 包内 runtime 的版本、SHA-256、许可证/第三方声明和平台架构均可由 CI 校验。
- 不内置或校验失败时，应用进入主界面且仅对应 Agent 显示不可用。

## 上游兼容

实现应收敛在 Desktop packaging 与 `agent-binaries` 的 packaged-resolution 层；不要修改
上游 Agent 编排接口，也不要让 renderer 根据 local/cloud 分支硬编码 runtime 路径。这样后续
合并上游时，分歧仍局限在 Zbot 的发布与本地运行时适配层。
