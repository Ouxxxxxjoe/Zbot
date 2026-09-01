# 上游同步后的测试失配：根因与防再犯清单

> 2026-09 fork 成立时（`ffda0e677`）一次性做了品牌改名（Cindy→Zbot）与 locale
> 裁剪（仅简体中文），但**没有同步单测断言**，导致 `client-ci` 自 fork 起全红、
> 连续几轮修复才恢复。本文沉淀根因与可 grep 的防再犯清单，供每次从上游
> （Cyberbot / Cindy）合入改动后自查。核心原则：**测试里断言的是「产品事实」，
> 改了产品事实就必须同步所有断言它的测试**。

## 1. 这次为什么连续失败（根因）

1. **fork 大提交改了「测试可见的产品事实」，却只改了生产代码。** 品牌串、支持语言、
   深链 scheme、区域语义、snapshot marker 全变了，但 100+ 个测试文件还在断言旧值。
2. **`pnpm test:unit:related` 按 git 改动文件选测试，覆盖不到这类失配。** fork 提交里
   测试文件本身没改，所以 `related` 认为它们不受影响、不运行；只有 CI 全量分片（或
   本地全量）才暴露。**fork / 大范围上游合并后，不能只信 `related`，必须跑一次 CI 全量。**
3. **失败是「同一类模式分散在几十个文件」，不是单一根因。** 每个文件改几行就能过，
   但数量大、逐个发现，表现为「修一批、CI 又报下一批」的挤牙膏循环。
4. **本地环境与 CI 不一致，干扰了本地全量验证。** 仓库钉 Node 22（`.node-version`），
   本地若用 Node 26 + vitest `threads` 池跑 jsdom 测试，`window.localStorage` 会变成
   `undefined`，导致**大量与改动无关的测试假失败**（`Cannot read properties of
   undefined (reading 'clear')`）。用本地全量结果下结论前，先确认 Node 版本与池。

## 2. 防再犯检查清单（同步上游后逐个 grep）

下列每行 = 「产品事实的当前值」 vs 「测试里过时的旧断言模式」。合并上游后跑一遍，
把命中的测试文件全列出来再统一修；**改完一项就从清单划掉一项**。

| 产品事实（当前值） | 测试里的旧断言模式 | 检查命令（apps/desktop 或全仓） |
|---|---|---|
| `BRAND_NAME = 'Zbot'` | 用户可见文案断言 `'Cindy ...'` | `grep -rn "'Cindy \|Cindy 暂\|Cindy subagent\|Cindy AI\|Cindy Plugin Market\|Cindy iOS Simulator Helper" apps/desktop/src packages --include="*.test.ts" --include="*.test.tsx"` |
| 仅支持 zh-CN | 5 语言数组 `['zh-CN','zh-TW','en','ja','ko']` / `it.each` | `grep -rn "'zh-TW', 'en', 'ja', 'ko'" apps/desktop/src --include="*.test.*"` |
| `changeLanguage('en')` 无效（fallback zh-CN） | `beforeEach` 里 `i18n.changeLanguage('en')` | `grep -rn "changeLanguage('en')\|changeLanguage(\"en\")" apps/desktop/src --include="*.test.*"` |
| `locales/` 只剩 `zh-CN/` | `readFileSync` 读 `locales/en|ja|ko|zh-TW/common.json` | `grep -rn "locales/\(en\|ja\|ko\|zh-TW\)/common.json" apps/desktop/src --include="*.test.*"` |
| 深链主 scheme `zbot://` | 生成侧断言 `xdt-maker://` / `cindy://` | `grep -rn "xdt-maker://" apps/desktop/src --include="*.test.*"`（生成侧；解析侧兼容可保留） |
| snapshot `source` marker = `'zbot'` | `source: 'cindy'` | `grep -rn "source: 'cindy'" apps/desktop/src --include="*.test.*"` |
| 官方 userData 目录 `Zbot/ZbotGlobal/ZbotDev` | `Cindy/CindyGlobal` 路径 fixture | `grep -rn "CindyGlobal\|/AppData/Cindy\|Roaming.Cindy" apps/desktop/src --include="*.test.*"` |
| endpoint 信任域 cn/global 都 `zbot.local` | 断言 cn 域 ≠ global 域（跨区拒绝） | `grep -rn "REGION_ENDPOINT_DOMAIN\|findUntrustedCachedEndpoint" apps/desktop/src/main/__tests__` |
| locale 解析任何输入 → `zh-CN` | `resolveSystemLocale('zh-TW') === 'zh-TW'` 等 | `grep -rn "resolveSystemLocale\|resolvePreferredSystemLocale" apps/desktop/src/shared/__tests__` |
| 语音输入语言只认 `zh-CN` | `normalizeVoiceInputSettings({language:'en'})` 保留 en | `grep -rn "language: 'en'\|language: 'ja'" apps/desktop/src --include="*.test.*"` |
| MCP `clientInfo.name = 'Zbot'` | `clientInfo: { name: 'Cindy' }` | `grep -rn "clientInfo: { name: 'Cindy'" apps/desktop/src --include="*.test.*"` |
| PI launch receipt `'Zbot subagent launched...'` | `'Cindy subagent launched...'` | `grep -rn "Cindy subagent launched" apps/desktop/src packages --include="*.test.*"` |
| Ghost `resolvedLocale` 归一到 `zh-CN` | `resolvedLocale: 'ko'` / `'zh-TW'` | `grep -rn "resolvedLocale: '\(ko\|zh-TW\|ja\|en\)'" apps/desktop/src --include="*.test.*"` |
| 插件市场 publisher `'Zbot Plugin Market'` | `'Cindy Plugin Market'` | `grep -rn "Cindy Plugin Market" apps/desktop/src --include="*.test.*"` |
| 深链解析正则认 `zbot`（生产 `shared/agentInputQueue.ts` 的 `SESSION_REF_LINK_RE`） | 正则写死 `(?:cindy\|xdt-maker)` | `grep -rn "cindy|xdt-maker" apps/desktop/src`（生产代码也要查） |
| 主题 family id 仍为 `'cindy'`（**不变**，勿误改） | — | 若 grep 到 `'cindy'` 主题 id，先确认是否 family id，不是品牌串 |

## 3. 同步上游后的标准流程

1. `git fetch upstream`，把上游 main 合到 `sync/*` 分支（不要直接合 main，走 PR 可回溯）。
2. **跑第 2 节所有 grep**，把命中的测试文件全部列出；连同「本次上游改动里可能新增的
   英文文案 / 多语言 / 旧品牌断言」一起审。
3. **跑 CI 全量分片，别只跑 `test:unit:related`**。fork / 大范围合并场景下 `related`
   覆盖不到「测试没改但断言过时」的文件。本地可用
   `XDT_UNIT_TEST_SHARD=1/2 node scripts/test-workspaces.mjs --tier unit` 模拟 CI 分片。
4. 本地验证时用 **Node 22**（仓库 `.node-version` 钉的版本），或 `--pool=forks`；
   不要用系统 Node 26 + threads 池的全量结果下结论（localStorage 伪故障会误报大量失败）。
5. 修完跑 `pnpm test:unit:related` + `pnpm --filter desktop run --if-present typecheck`
   做提交门禁，再走 PR。CI（Node 22）是最终裁决。

## 4. 已知的「非品牌」干扰项（别误修）

- `codex_plan_json` / `no such column` 类失败：本地 localDb 测试的 schema 残留，
  CI 的 unit tier 已显式排除 `src/main/localDb/**`、`*LocalSessions.test.ts`、
  `drizzle-proxy-perf` 等，不是品牌问题。
- 主题 family id `'cindy'`、`cindy-github` 插件 ghostId、`application/x-cindy-session-id`
  MIME 等是**稳定协议标识符**，不随品牌改名，测试里的它们是正确断言，不要改。
- 测试文件里 mock 数据（`title: 'Tavily API Key'` 等）是测试自造的输入，组件原样显示，
  与产品文案无关，一般不需要改。

## 5. 本问题在 CI 上的表现（用于快速识别复发）

- `verify-checks`（typecheck / i18n 门禁 / migration 校验）通过，但**单测分片全红** →
  大概率是测试断言与产品事实失配（本文场景）。
- 单测失败断言形如 `expected 'zh-CN' to be 'ko'`、`expected 'Zbot...' to be 'Cindy...'`、
  `Unable to find ... 'Type your answer…'`、`ENOENT locales/en/common.json` →
  都是本文第 2 节清单里的模式。
