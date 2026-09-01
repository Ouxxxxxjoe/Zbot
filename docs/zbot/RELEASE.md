# 发布与桌面端打包（Release）

> 本文说明桌面端的打包、更新与发布链路。**高风险模块**（自动更新）的门禁见
> `docs/dev-rules/cindy-updater.md`（上游保留文档，其中路径 `cindy-updater` 已在 Zbot 改名为
> `zbot-updater`，以当前代码为准）；功能打包发布细节以 `apps/desktop/scripts/` 为代码事实源。

## 1. 构建 / 打包命令

| 命令 | 作用 |
|---|---|
| `pnpm install` | 安装依赖 + postinstall best-effort 拉取 runtime 二进制（claude／codex／ripgrep／pi）。 |
| `pnpm dev:desktop` | 启动开发版（不经云端登录即可跑本机 agent）。 |
| `pnpm build` | 构建 desktop（`pnpm --filter desktop build`）。 |
| `pnpm release:package` | **只打包不发布**：`apps/desktop/scripts/package-desktop.mjs` 产出本地产物 + `build-info.json`；上传 / update manifest / canary / stable 由后续 publish 侧脚本读 `build-info.json` 接手。 |

常用参数（`package-desktop.mjs`）：

```
--platform win32|darwin|linux   # 默认当前平台，不支持交叉打包
--arch     x64|arm64            # 显式传 = 单架构；darwin 缺省连打双架构
--region   cn|global|dev        # 决定应用身份、端点清单与发布目标
--version  x.y.z|major|minor|patch
--skip-smoke                    # 跳过 packaged smoke test（调试用）
--no-sign / --allow-unsigned    # 跳过 / 放行无签名（无签名环境的版本无关包）
```

> Zbot 只发行**简体中文版**，打包默认 `--region=cn`（构建区经 `CINDY_AUTH_REGION` 注入、
> `VITE_CINDY_AUTH_REGION` 烘焙）；发布链路只配 `cn`。安装包把 `config/endpoint.json`
> 打进 `resources/endpoint.json`，启动读本地文件，不拉 CDN。`release-regions.json.example` 展示
> cn / dev 两区的 OSS 与 macOS 签名身份（真机密走 env，不入仓）。

### 产物

`release/artifacts/<region>/<version|unversioned>/<platform-arch>/`：

- `zagent-<version>-Setup.exe` / `zagent-<version>-<arch>.dmg` / `zagent-<version>-<arch>.deb`
  —— 安装包（**产物基名按区域派生**，cn/global = `zagent`，dev = `zagentDev`）。
- `zagent-<version>-hotfix.zip` —— 热更包（仅有版本时）。
- `build-info.json` —— 发布侧唯一输入。

## 2. 应用身份（打包层）

打包身份由 `brandIdentity.ts` 单一事实源派生（见 [`BRANDING.md`](BRANDING.md)）：

- `forge.config.ts`：`executableName` / `appBundleId`（mac）/ `protocols`（深链 `zbot://`）/
  NSIS `appId`（三者为 AUMID 三位一体，逐字符一致）。构建期 `resolveCindyRegion(CINDY_AUTH_REGION)`。
- 图标：`apps/desktop/resources/icon.png|ico|icns`；Windows 安装器 `installer.nsh`。
- 第三方声明：`apps/desktop/resources/THIRD-PARTY-NOTICES.txt` / `THIRD-PARTY-RESTRICTED.txt`
  （`pnpm licenses:generate` 生成）。

## 3. 自动更新（高风险）

- 独立更新器：`apps/desktop/zbot-updater/`（Tauri / Rust），产物名 `zbot-updater`（`updaterName`）。
- Electron 侧更新服务：`apps/desktop/src/main/updateService.ts` + `updateArtifacts.ts` +
  `updateRelaunchSafety.ts` / `updateAutoRelaunchPolicy.ts` / `updateChannelStore.ts`。
- 分发：CDN / OSS 一级路径前缀 = `cdnPrefix`（`zbot`）；更新 manifest 在 publish 侧。
- ⚠️ **改动更新链路前必须先与维护者确认**（见 `docs/dev-rules/cindy-updater.md`）；该链路
  一处改错会无差别影响所有已装用户，禁止在普通功能 PR 里「顺带」改。
- **关闭自动更新**（内部使用、手动分发、无 OSS/CDN 更新源）：
  - 构建期设 `ZBOT_DISABLE_AUTO_UPDATE=1` → 经 vite define 烘焙，`updateService.ts` 的
    `update-check-startup`、`doCheckForUpdate`、后台轮询整体短路（即使显式 `--version` 也不再
    检查/下载）。
  - 无版本打包（占位 0.0.0）本身也豁免更新链（`isVersionlessAppVersion`），但与 `--version`
    显式构建互斥。

## 4. 签名 / 公证

- macOS：公证 + Developer ID（身份按区域声明，见 `release-regions.json.example` 的
  `macSigning`；`APPLE_APP_PASSWORD` 走 env，**fail closed**，缺配置不签名）。
- Windows：NSIS 签名命令 `CINDY_WIN_SIGN_CMD`；无签名环境打版本无关包用 `--no-sign` /
  `--allow-unsigned`。
- 相关脚本：`generate-win-ico.mjs`、`notarize-mac-app` 相关测试、`forge-ios-simulator-helper.ts`。

### 4.1 内部使用构建（无 OSS、无签名）

内部使用**不做 OSS 分发、不做 Windows / macOS 签名**（本地/私有使用无需过签名与公证），
打包命令：

```bash
ZBOT_DISABLE_AUTO_UPDATE=1 pnpm release:package --region=cn --no-sign --version=0.1.0
```

- `--no-sign`：跳过 Windows/macOS 签名（`release-regions.json` 缺失时会静默跳过签名身份注入）。
- 显式 `--version`：不再读线上 CDN manifest 取基线（内部无 OSS/CDN 更新源）。
- `ZBOT_DISABLE_AUTO_UPDATE=1`：烘焙关闭应用内自动更新（见 §3）。
- 产物：`apps/desktop/release/artifacts/cn/<version>/...`（未签名 .exe / .dmg），手动分发、不依赖自动更新。
- 发给同事时附上 [`INTERNAL_INSTALL.md`](INTERNAL_INSTALL.md)（未签名包会被 SmartScreen / 门禁拦截，按文档打开即可）。
- CI 侧：`.github/workflows/release-desktop.yml`（`workflow_dispatch` 手动触发，产出未签名安装包
  并作为构建产物上传）。

## 5. CI 与发布流程

- `.github/workflows/ci.yml`：单测 / 门禁（`pnpm test:unit`、`check:brand-terminology`、
  `check:endpoints`、`check:i18n`、`brand-identity-sync`、`check:dco` 等）。
- `.github/workflows/release-desktop.yml`：内部打包（未签名安装包构建产物），手动触发。
- 发布以 `build-info.json` 为唯一输入；**本仓只打包，不写 OSS / CDN**，上传与 canary/promote
  由维护者侧发布链路负责。

## 6. 改发布链路前的门禁

- 改打包 / 身份：跑 `pnpm --filter desktop run --if-present typecheck` + 受影响单测。
- 改品牌 / 端点：`pnpm check:brand-terminology`、`pnpm check:endpoints`、
  `pnpm (test:unit:related)`。
- 改更新器 / 更新服务：**先与维护者确认**（见 §3）。
