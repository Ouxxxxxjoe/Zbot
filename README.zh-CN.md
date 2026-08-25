<p align="center">
  <a href="README.md">English</a> · <strong>简体中文</strong>
</p>

<p align="center">
  <a href="LICENSE"><img src="https://img.shields.io/badge/license-Apache--2.0-blue.svg" alt="License" /></a>
  <a href="https://nodejs.org"><img src="https://img.shields.io/badge/node-22.x-brightgreen.svg" alt="Node.js 22.x" /></a>
  <a href="https://pnpm.io"><img src="https://img.shields.io/badge/pnpm-10-orange.svg" alt="pnpm" /></a>
</p>

**Zbot** 是一款**本地优先的 Agent 工作客户端**。它把多套 Harness、模型与工具收进同一个
客户端，在真实的工程与软件里把任务做完——在你的电脑上本地运行，使用你自己的文件与已登录
的应用。首批兼容 **Claude Code** 与 **Codex** 两套 Agent Harness，更多 Harness 与自研
Harness 正在接入。模型与 Harness 自由组合、同一任务中随时切换，工作现场、记忆、Skill 与
工具始终连续；一个任务可以由不同 Harness × 模型组合的多个 agent 规划、并行执行、独立
review。

本仓库是 Zbot 的**客户端** —— 桌面端及其共享 packages，以 pnpm monorepo 组织。它是
Apache-2.0 开源 [Cindy](https://github.com/makecindy/cindy) 客户端的 fork，被二次开发成一个
**本地优先、无需账号**的 Agent 工作客户端。上游的移动端与服务端**不在**本仓库内。

## 本地优先，无需账号

使用 Zbot 不需要账号。在登录页选择「跳过登录」，即可用本机 Agent（Claude Code / Codex /
本地模型）针对你自己的文件干活——应用内账号状态显示为「未登录」。

| 使用方式 | 账号要求 | 可用范围 |
| --- | --- | --- |
| 本地（推荐入口） | 无需登录 | 完整本地 Agent 工作客户端：本地模型、agent、MCP、插件、定时、设备链路、技能与记忆。依赖服务端的能力不可用。 |
| 云端（未来接入） | Zbot 云端账号 | 依赖服务端的能力，统一经同一个可插拔端点清单接线。 |

全新安装会先进入登录页；选择「跳过登录」即可进入免账号的本地会话（重启后保留）。云端
登录**作为未来接入点保留**：所有出站服务都从一个端点清单
（[`config/endpoint.json`](config/endpoint.json)）取值，未来接我们自己的中控系统时只需改
端点层，无需重写客户端。详见 [`docs/zbot/LOCAL_MODE.md`](docs/zbot/LOCAL_MODE.md)。

## 本仓包含什么

| 路径 | 说明 |
| --- | --- |
| `apps/desktop` | Electron 桌面客户端（Windows / macOS，简体中文版） |
| `packages/*` | 客户端共享能力（鉴权契约、device-link、agent 编排、模型供应商、工具等） |
| `apps/*-bin` | 桌面端附带的工具二进制，均不入库；claude-code / codex / ripgrep 由 `pnpm install` 按平台自动下载，Android platform-tools 在 Windows 打包前按 pin 版本下载并校验 sha256 |
| `config/` | 运行期端点清单（`endpoint.json`、`endpoint.global.json`）—— 未来服务端 / 中控系统的可插拔接入点 |

**服务端不在本仓库：** 服务端位于独立仓库，不属于本 monorepo。

## 前置要求

- **Node.js** 22.x
- **pnpm** 10.x（暂不支持 v11）
- **Git LFS**

## 开始开发

```bash
# 克隆你自己的 Zbot 仓库后
git lfs pull
pnpm install
```

`pnpm install` 会按当前平台 best-effort 下载桌面端运行时二进制（claude-code / codex /
ripgrep / pi），失败只告警不阻断。打包见 [`docs/zbot/RELEASE.md`](docs/zbot/RELEASE.md)。

## 开发入口

```bash
pnpm dev:desktop        # 启动桌面开发客户端（可直接跑本机 agent，无需云端登录）
```

校验与门禁：

```bash
pnpm check:brand-terminology   # 用户可见面不得出现冲突的品牌拼写
pnpm check:endpoints           # 端点清单一致性
pnpm check:i18n                # i18n 完整性
pnpm test:unit:related         # 本次改动影响的单测
```

## 文档

- [`docs/zbot/README.md`](docs/zbot/README.md) —— Zbot 文档索引（Zbot 自有文档层）
- [`docs/zbot/ARCHITECTURE.md`](docs/zbot/ARCHITECTURE.md) —— 仓库结构、进程模型、本地 / 云会话
- [`docs/zbot/UPSTREAM_SYNC.md`](docs/zbot/UPSTREAM_SYNC.md) —— 如何与 Cindy 上游同步
- [`docs/zbot/BRANDING.md`](docs/zbot/BRANDING.md) —— 品牌身份单点
- [`docs/zbot/LOCAL_MODE.md`](docs/zbot/LOCAL_MODE.md) —— 本地优先与云作为未来接入点
- [`docs/zbot/RELEASE.md`](docs/zbot/RELEASE.md) —— 桌面打包与发布
- [`docs/`](docs/README.md) —— 上游工程 / 产品 / 设计规则文档（作为参照地图保留）

另见 [`AGENTS.md`](AGENTS.md)（工程规范与模块边界）与 [`CONTRIBUTING.md`](CONTRIBUTING.md)
（贡献者环境与验证）。

## 贡献

改动通过 pull request 合入 `main`。请先阅读 [`CONTRIBUTING.md`](CONTRIBUTING.md)，再按
[`.github/PULL_REQUEST_TEMPLATE.md`](.github/PULL_REQUEST_TEMPLATE.md) 提交。每个 commit 需带
[DCO](DCO) 签名（`git commit -s`），由 PR 上的 DCO check 校验；不需要签 CLA。
同时请遵守 [`CODE_OF_CONDUCT.md`](CODE_OF_CONDUCT.md)；普通使用问题见
[`SUPPORT.md`](SUPPORT.md)，安全问题仍按 [`SECURITY.md`](SECURITY.md) 私下报告。

## 安全

任何凭证 / 授权文件都不得提交进工作区。发现安全问题请按照
[`SECURITY.md`](SECURITY.md) 的说明私下报告，不要开公开 issue。

## 隐私

Zbot 本地优先：本地模式下不会向云端上报在线状态或使用数据。依赖服务端的能力（如账号级
SkillHub、云端心跳）只在登录云账号后生效，见
[`docs/zbot/LOCAL_MODE.md`](docs/zbot/LOCAL_MODE.md)。崩溃转储只留在本地，不会自动上传。

## 许可证 / License

除非另有说明，本仓库的源代码依据 [Apache License 2.0](LICENSE) 授权。源文件不单独携带
许可证头，统一以仓库根目录的 `LICENSE` 为准。

本项目是 Apache-2.0 开源 Cindy 客户端的 fork。模型权重、数据集、提示词、商标，以及其他
单独标识的材料，可能适用各自的许可条款，不因根目录的 Apache-2.0 而被自动覆盖。第三方
开源组件保留各自的版权与许可，其归属声明与 SPDX SBOM 统一收口在 [`docs/legal/`](docs/legal/)。
本项目的版权与归属信息见 [`NOTICE`](NOTICE)。
