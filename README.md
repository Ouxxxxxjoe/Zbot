<p align="center">
  <strong>English</strong> · <a href="README.zh-CN.md">简体中文</a>
</p>

<p align="center">
  <a href="LICENSE"><img src="https://img.shields.io/badge/license-Apache--2.0-blue.svg" alt="License" /></a>
  <a href="https://nodejs.org"><img src="https://img.shields.io/badge/node-22.x-brightgreen.svg" alt="Node.js 22.x" /></a>
  <a href="https://pnpm.io"><img src="https://img.shields.io/badge/pnpm-10-orange.svg" alt="pnpm" /></a>
</p>

**Zbot** is a **local-first Agent work client** for desktop. It brings multiple harnesses,
models and tools into one client that finishes real work in your projects and apps — running
locally on your own machine, using your real files and logged-in apps.

The first supported harnesses are **Claude Code** and **Codex**, with a native harness in the
works. Models and harnesses mix freely and can switch mid-task while your workspace, memory,
skills and tools stay continuous; one task can even be planned, executed in parallel, and
reviewed by agents on different harness × model combos.

This repository is the **client** for Zbot — the desktop app plus its shared packages, organized
as a pnpm monorepo. It is a fork of the Apache-2.0 licensed [Cindy](https://github.com/makecindy/cindy)
client, customized into a local-first, account-free agent work client. The upstream mobile client
and backend service are **not** part of this repository.

## Local-first, no account required

You don't need an account to use Zbot. Choose **Skip Sign-In** on the login screen to run local
agents (Claude Code / Codex / local models) against your own files — the app shows the account
state as "Not signed in".

| Mode | Account requirement | What you get |
| --- | --- | --- |
| Local (recommended path) | No sign-in | Full local agent work client: local models, agents, MCP, plugins, scheduling, device linking, skills & memory. Server-backed capabilities are unavailable. |
| Cloud (future hook) | Zbot cloud account | Server-backed capabilities, wired through the same pluggable endpoint manifest. |

The login screen appears first on a fresh install; pick **Skip Sign-In** to enter the
account-free local session (which persists across restarts). Cloud login is **kept as a future
hook**: all outbound servers are resolved from a single endpoint manifest
([`config/endpoint.json`](config/endpoint.json)), so a future Zbot control system can be plugged
in at the endpoint layer without rewriting the client. See
[`docs/zbot/LOCAL_MODE.md`](docs/zbot/LOCAL_MODE.md).

## What's in this repo

| Path | Description |
| --- | --- |
| `apps/desktop` | Electron desktop client (Windows / macOS, Simplified Chinese edition) |
| `packages/*` | Shared client capabilities (auth contracts, device-link, agent orchestration, model providers, tools, …) |
| `apps/*-bin` | Tool binaries shipped with the desktop app; not committed — claude-code, codex, and ripgrep are downloaded per platform by `pnpm install`, and Android platform-tools are fetched (pinned, sha256-verified) before Windows packaging |
| `config/` | Runtime endpoint manifest (`endpoint.json`, `endpoint.global.json`) — the pluggable server / control-system access point |

**Not in this repo:** the backend service lives in a separate repository and is not part of this
monorepo.

## Prerequisites

- **Node.js** 22.x
- **pnpm** 10.x (v11 is not yet supported)
- **Git LFS**
- **Git** (with LFS)

## Getting started

```bash
# clone your own Zbot repository, then
git lfs pull
pnpm install
```

`pnpm install` best-effort downloads the Desktop runtime binaries (claude-code / codex / ripgrep /
pi) for your platform; it warns but doesn't fail if a binary can't be fetched. See
[`docs/zbot/RELEASE.md`](docs/zbot/RELEASE.md) for packaging.

## Development

```bash
pnpm dev:desktop        # start the desktop dev client (runs local agents, no cloud sign-in needed)
```

Guard scripts and build checks:

```bash
pnpm check:brand-terminology   # no conflicting brand spellings on user-facing surfaces
pnpm check:endpoints           # endpoint manifest consistency
pnpm check:i18n                # i18n completeness
pnpm test:unit:related         # unit tests affected by your change
```

## Documentation

- [`docs/zbot/README.md`](docs/zbot/README.md) — the Zbot documentation index (Zbot-owned layer)
- [`docs/zbot/ARCHITECTURE.md`](docs/zbot/ARCHITECTURE.md) — repo structure, process model, local/cloud session
- [`docs/zbot/UPSTREAM_SYNC.md`](docs/zbot/UPSTREAM_SYNC.md) — how to sync from the Cindy upstream
- [`docs/zbot/BRANDING.md`](docs/zbot/BRANDING.md) — brand identity single points of truth
- [`docs/zbot/LOCAL_MODE.md`](docs/zbot/LOCAL_MODE.md) — local-first mode and cloud-as-hook
- [`docs/zbot/RELEASE.md`](docs/zbot/RELEASE.md) — desktop packaging & release
- [`docs/`](docs/README.md) — upstream engineering / product / design rule docs (kept as the reference map)

Also see [`AGENTS.md`](AGENTS.md) (engineering rules & module boundaries) and
[`CONTRIBUTING.md`](CONTRIBUTING.md) (contributor setup & validation).

## Contributing

Contributions go through pull requests into `main`. Read
[`CONTRIBUTING.md`](CONTRIBUTING.md) first. Every commit needs a
[Developer Certificate of Origin](DCO) sign-off (`git commit -s`); a DCO check on each pull
request enforces it, and no CLA is required. Please also follow
[`CODE_OF_CONDUCT.md`](CODE_OF_CONDUCT.md). For usage questions see
[`SUPPORT.md`](SUPPORT.md); report security issues privately through
[`SECURITY.md`](SECURITY.md).

## Security

Never commit credentials or authorization files to the working tree. If you discover a security
issue, follow [`SECURITY.md`](SECURITY.md) to report it privately rather than opening a public
issue.

## License

Except as otherwise noted, the source code in this repository is licensed under the
[Apache License, Version 2.0](LICENSE). Individual source files do not carry per-file license
headers; the repository-root `LICENSE` governs.

This project is a fork of the Apache-2.0 licensed Cindy client. Model weights, datasets, prompts,
trademarks, and other separately identified materials may be subject to their own license terms
and are not automatically covered by the repository-level Apache-2.0 grant. Third-party
open-source components retain their own copyright and license; their attribution notices and SPDX
SBOMs are managed under [`docs/legal/`](docs/legal/). See [`NOTICE`](NOTICE).
