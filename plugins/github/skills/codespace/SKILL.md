---
name: codespace
description: Use when the user asks to list, create, inspect, connect to, copy files to or from, stop, rebuild, or delete a GitHub Codespace.
user-invocable: true
---

# 管理 Codespaces

Codespace 是 GitHub 托管的远程开发环境，创建和运行可能产生费用。先从宿主提供的本 Skill 文件路径定位并读取 [共享检查指引](../../references/github-cli-preflight.md)。按当前 `gh codespace --help` 支持的服务执行，不假设任意企业主机都支持；核实实际主机、账号、仓库和资源名称。

Codespaces 的 `--repo` 使用 `OWNER/REPO`；不要传 `HOST/OWNER/REPO`。本次进程显式选择已验证的 `GH_HOST`。已有资源同时用 `--codespace 'EXACT_NAME'`，不能只依赖仓库过滤后交互选择第一项。

| 需求 | 命令 |
| --- | --- |
| 列表 | `gh codespace list --repo 'OWNER/REPO' --json name,repository,owner,state,gitStatus` |
| 详情 | `gh codespace view --repo 'OWNER/REPO' --codespace 'EXACT_NAME' --json name,repository,owner,state,gitStatus,billableOwner,machineName` |
| 创建 | `gh codespace create --repo 'OWNER/REPO' --branch 'BRANCH' --machine 'MACHINE'` |
| 连接 | `gh codespace ssh --repo 'OWNER/REPO' --codespace 'EXACT_NAME'` |
| 停止 | `gh codespace stop --repo 'OWNER/REPO' --codespace 'EXACT_NAME'` |
| 删除 | `gh codespace delete --repo 'OWNER/REPO' --codespace 'EXACT_NAME'` |

创建前核对分支、机器规格、计费归属和必要的 devcontainer 配置（环境构建说明）；已有授权覆盖这些选择时直接继续，不自行升级规格或加 `--default-permissions` 接受额外权限。创建超时先查近期资源，避免生成多台计费环境。

复制文件先确认方向、精确本地/远端路径和覆盖后果，再按 `gh codespace cp --help` 操作，例如 `gh codespace cp --repo 'OWNER/REPO' --codespace 'EXACT_NAME' 'ABSOLUTE_LOCAL_FILE' 'remote:/workspaces/REPO/FILE'`。不自动使用 `--expand` 展开远端 Shell 表达式，不把传文件扩展为执行远端代码。

停止、重建或删除前读 `gitStatus`，核对是否有未保存工作。删除与重建须有对应资源和后果的明确授权；不默认 `--force`、`--all` 或按天批量删除。授权缺失时先说明具体资源及未保存状态，再补确认。

完成后重新读取该资源；删除后通过列表确认准确名称消失。返回实际名称、仓库、状态、已完成动作与连接信息，不把“创建请求已发出”写成环境已就绪。
