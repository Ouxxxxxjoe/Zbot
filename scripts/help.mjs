import path from 'node:path';
import { fileURLToPath } from 'node:url';

export function printHelp(log = console.log) {
  log('\n  Zbot 客户端仓常用指令（按场景分组，说明在上、指令在下，可直接复制）');

  log('\n  桌面端启动:');
  log('    # 推荐：先清理已有 Zbot dev 进程，再启动远程 API 模式');
  log('    # Zbot 简体中文版（cn，默认），读取仓内 config/endpoint.json');
  log('    pnpm restart:desktop:remote');
  log('    # 中国大陆版，读取仓内 config/endpoint.json');
  log('    pnpm restart:desktop:remote --region=cn');
  log('    # Zbot，读取线上 CDN 端点清单');
  log('    pnpm restart:desktop:remote --endpoints-cdn');
  log('    # Human 可直接启动；不会先清旧进程，Agent 不要使用');
  log('    pnpm dev:desktop:remote');
  log('    pnpm dev:desktop:remote --region=cn');
  log('    # 连接本地 http://localhost:3333（只起客户端，不起 server）');
  log('    pnpm restart:desktop:local');

  log('\n  Agent 二进制安装 / 升级（Claude Code、Codex、ripgrep、Pi）:');
  log('    # 按 latest.json 当前 pin 安装到本机，不修改 pin');
  log('    # 安装当前平台的全部四种二进制');
  log('    pnpm install:agent-binaries');
  log('    # 只安装当前平台的指定二进制');
  log('    pnpm install:claude');
  log('    pnpm install:codex');
  log('    pnpm install:ripgrep');
  log('    pnpm install:pi');
  log('    # 升级到上游最新版：下载全平台二进制，并修改对应 latest.json pin');
  log('    pnpm update:claude');
  log('    pnpm update:codex');
  log('    pnpm update:ripgrep');
  log('    pnpm update:pi');
  log('    # 依次把四种二进制全部升级到上游最新版');
  log('    pnpm update:vendors');
  log('    # 固定到指定版本：下面是完整示例，会修改 latest.json pin');
  log('    pnpm update:claude 2.1.199');
  log('    pnpm update:codex 0.144.1');
  log('    pnpm update:ripgrep 15.1.0');
  log('    pnpm update:pi 0.83.0');
  log('    # 发布到 CDN 不在本仓：见同级 cindy-binary-release 工程（pnpm release:<kind>）');

  log('    # 常用可选参数:--out <dir> 拷产物 / --desktop-version x.y.z / --version-code <n>(仅 Android)');

  log('\n  开发检查:');
  log('    pnpm lint');
  log('    pnpm test:runner');
  log('    pnpm test:unit:related');
  log('    pnpm test:unit');
  log('    # 排查并发相关问题时，可把 workspace runner 临时退回串行');
  log('    pnpm test:unit -- --workspace-concurrency=1');
  log('    pnpm benchmark:desktop-workers -- --workers=1,2,4,8 --output=<report.json>');
  log('    pnpm test:all');
  log('    pnpm test:db');
  log('    pnpm test:guard');
  log();
}

if (process.argv[1] && path.resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
  printHelp();
}
