#!/usr/bin/env node
/**
 * 客户端端点单一来源门禁。
 *
 * 真实运行期地址只允许进入受 Git 管理的 config/endpoint*.json。本脚本验证关键
 * 消费源码不重新烘焙业务端点；飞书登录相关构建变量继续列入退役
 * 键，防止旧登录链复活。
 */
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const REPO_ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const CONTROLLED_SOURCE_FILES = Object.freeze([
  'apps/desktop/src/shared/endpoints.ts',
  'apps/desktop/src/shared/hookControlIpc.ts',
  'apps/desktop/src/main/clientEndpointsService.ts',



  'packages/embedding-client/src/client.ts',
  'packages/embedding-client/src/types.ts',
]);
const CONTROLLED_APP_CONFIG_FILES = Object.freeze([
  'scripts/restart-desktop-remote.mjs',



]);
const ALLOWED_NON_PRODUCTION_ORIGINS = new Set([
  'http://localhost:3333',
  'http://localhost:3344',
  'http://localhost:3335',
  // model-access-server 本地开发兜底(服务端仓,端口 3339)
  'http://localhost:3339',
  // TapDB 埋点采集端(cn / global 各一),第三方固定协议地址而非本产品生产端点,
  // 不进入 config/endpoint*.json;与项目 appId 的区域配对见
  // renderer/analytics/tapdbClient.ts 的 TAPDB_PROJECT_BY_REGION。
  'https://e.tapdb.com',
  'https://e.tapdb.ap-sg.tapapis.com',
]);

function findAbsoluteOrigins(content) {
  return [
    ...content.matchAll(/(?:https?|wss?):\/\/[A-Za-z0-9.-]+(?::\d+)?/gi),
  ].map((match) => match[0].toLowerCase());
}

function main() {
  const errors = [];

  for (const file of CONTROLLED_SOURCE_FILES) {
    const content = fs.readFileSync(path.join(REPO_ROOT, file), 'utf8');
    for (const origin of findAbsoluteOrigins(content)) {
      if (!ALLOWED_NON_PRODUCTION_ORIGINS.has(origin)) {
        errors.push(`${file} 不允许包含生产 URL 字面量: ${origin}`);
      }
    }
  }
  for (const file of CONTROLLED_APP_CONFIG_FILES) {
    const content = fs.readFileSync(path.join(REPO_ROOT, file), 'utf8');
    if (/\bcli_[a-z0-9]{8,}\b/i.test(content)) {
      errors.push(`${file} 不允许包含飞书 App ID 字面量`);
    }
  }

  if (errors.length) {
    console.error(`生产端点门禁失败 (${errors.length}):`);
    for (const error of errors) console.error(`  - ${error}`);
    process.exit(1);
  }
  console.log('endpoint source guard passed');
}

const isDirectRun =
  process.argv[1] && path.resolve(process.argv[1]) === path.resolve(fileURLToPath(import.meta.url));
if (isDirectRun) main();
