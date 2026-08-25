# Zbot 品牌（Branding）

> 本文说明 Zbot 的品牌架构：展示名层与标识符层**两个单点**、区域模型、用户可见与内部命名
> 约定、以及改品牌时必须跑的 guard。
> 上游设计系统索引见 `docs/design-rules/cindy-design-system.md`；区域分支与对外文案规则见
> `docs/product-rules/region-and-editions.md`。

## 1. 两个单点（single source of truth）

Zbot 刻意把「用户/LLM 看到的名字」和「OS / 磁盘 / 协议识别的名字」分开，各自一个单点，
互不派生。**改品牌只改这两个文件**，其它代码经 import / `{{appName}}` 跟上。

| 单点 | 文件 | 管理什么 |
|---|---|---|
| 展示名 | `packages/maker-shared/src/branding.ts` | 唯一规范写法 `BRAND_NAME`，供 UI 文案、窗口标题、LLM 可见描述 |
| 标识符 | `packages/maker-shared/src/brandIdentity.ts` | 可执行名、AppUserModelId / bundle id、深链 scheme、userData 目录名、更新器名、本地库前缀、CDN 渠道前缀 |

### 当前值（Zbot）

展示名：`BRAND_NAME = 'Zbot'`

标识符（`brandIdentity.ts` 的 `BRAND_IDENTITY`）：

| 项 | 值 |
|---|---|
| `executableName` | `zagent` |
| `executableNameByRegion` | cn / global = `zagent`；dev = `zagentDev` |
| `appIdByRegion` | cn = `com.zhida.agentcn`；global = `com.zhida.agent`；dev = `com.zhida.agentdev` |
| `primaryScheme` | `zbot`（深链 `zbot://session/...`） |
| `userDataDirName` | `Zbot` |
| `userDataDirNameByRegion` | cn = `Zbot`；global = `ZbotGlobal`；dev = `ZbotDev` |
| `cdnPrefix` | `zbot` |
| `updaterName` | `zbot-updater` |
| `dbFilePrefix` | `zbot` |
| legacy 数组 | 全部为空（全新私有产品，无存量用户） |

> ⚠️ `appIdByRegion` 目前是**占位 Bundle ID**（`com.zhida.agent` 系）。上线前须替换为公司
> 实际域名反转（如 `com.<company>.zbot`）；全局搜索 `com.zhida.agent` 即可定位全部消费点。

消费方：`apps/desktop/forge.config.ts`（exe / appId / protocols / UTI）、
`apps/desktop/src/main`（AUMID、深链、orphan-reaper、skillhub usageIndexer、localDb 前缀）、
发布 / smoke 脚本（产物名、CDN 前缀）。

## 2. 区域模型

Zbot 只发行**简体中文版（Windows / macOS 桌面端）**，不发行国际版。

```ts
type CindyRegion = 'cn' | 'global' | 'dev';
export const DEFAULT_CINDY_REGION: CindyRegion = 'cn';       // Zbot 决策：默认 cn
```

- 未显式注入区域的构建一律产出中文版（`DEFAULT_CINDY_REGION = 'cn'`）。
- `global` / `dev` 保留在类型与代码分支中（防未来需要），但发布链路只配 `cn`。
- 构建期用 `CINDY_AUTH_REGION`（打包时 `package-desktop.mjs` 显式注入）选择区域；运行时再经
  `resolveCindyRegion()` 归一化，非法值直接抛错（宁可失败也不打出身份错误的包）。
- 区域徽标（`REGION_PILL_KEY` + `shared/regionCode.ts` 的 `shouldLabelRegion`）决定登录页 / 侧栏
  是否标注区域代号；一致性由 `renderer/__tests__/regionCode.consistency.test.ts` 断言。

## 3. 用户可见 vs 内部命名

- **用户可见文案**：一律用 i18n + `{{appName}}` 占位，**不要**在 locale JSON 里硬编码品牌名——
  已在 `scripts/brand-terminology-guard.mjs` 强制（否则开发期无感知、未来改名会漏）。
  运行时插值的端到端断言在 `apps/desktop/src/renderer/__tests__/i18nBrandPlaceholder.test.ts`。
- **内部模块 / 标识符**：保留上游 Cindy 命名（`cindy-brain`、`cindy-media`、`cindy-tools`、
  `CindyRegion`、`cindy_helper` 等），它们是「保留 90% 客户端」的一部分，**不再改名**，也
  不要从品牌单点派生。要改也只在一处单点改，避免在内部模块间引入不必要的大规模 churn。

## 4. 品牌 guard 与一致性测试

改品牌 / 标识符后必须跑：

```bash
pnpm check:brand-terminology        # 禁止用户可见层出现 XD Maker 等旧名；locale 禁止硬编码品牌名
pnpm check:endpoints                # endpoint 字面量一致性
pnpm check:i18n                     # i18n 完整性
pnpm test:unit:related              # 本次改动影响的单测
pnpm --filter maker-shared run --if-present typecheck
pnpm --filter desktop run --if-present typecheck
```

单点 ↔ `.mjs` 脚本镜像字面量一致性由 `scripts/__tests__/brand-identity-sync.test.mjs` 断言：
改 `brandIdentity.ts` 后，`ci/lib.mjs`、`smoke-packaged.mjs`、`restart-desktop-remote.mjs`、
`scripts/shared/desktop-dev-region.mjs`、`apps/desktop/package.json.productName` 任一漏改立即红灯。

## 5. 品牌资产

- 图标 / 图标组：`apps/desktop/resources/icon*.png|ico|icns`、`appicon/`。
- 登录 / 品牌 overlay 资产：`apps/desktop/src/renderer/assets/`、`apps/desktop/src/renderer/assets/login/`。
- 桌面端第三方声明：`apps/desktop/resources/THIRD-PARTY-NOTICES.txt` /
  `THIRD-PARTY-RESTRICTED.txt`（`pnpm licenses:generate` 生成）。

> 品牌资产随品牌翻转已切到 Zbot；若还有历史 Cindy 资产残留（图标、splash、wordmark），
> 以「用户可见」为判断标准：只在用户能看到的入口替换，内部静态资源名不必大动。
