---
name: repo
description: Use when the user asks to find, inspect, create, clone, fork, configure, archive, or delete a GitHub repository.
user-invocable: true
---

# 管理 GitHub 仓库

先从宿主提供的本 Skill 文件路径定位并读取 [共享检查指引](../../references/github-cli-preflight.md)。`gh repo` 的下列子命令使用明确的仓库位置参数，不支持通用 `--repo` 时不要补造该参数。

| 需求 | 命令 |
| --- | --- |
| 查看 | `gh repo view 'https://HOST/OWNER/REPO' --json nameWithOwner,url,visibility,defaultBranchRef,isArchived,viewerPermission` |
| 列表 | `gh repo list 'OWNER' --limit 30` |
| 克隆 | `gh repo clone 'https://HOST/OWNER/REPO' 'ABSOLUTE_NEW_DIRECTORY'` |
| 改描述 | `gh repo edit 'https://HOST/OWNER/REPO' --description 'DESCRIPTION'` |

`repo list` 和 `repo create` 没有主机参数；在该次进程的环境中显式设置 `GH_HOST=HOST`，保持原有环境，不写全局配置。所有者必须用真实 `OWNER`，不能靠当前账号默认推断。

创建前明确完整名称、可见性、是否初始化 README/许可证及本地目录。先查询是否存在；权限或网络失败不能解释为不存在。示例为 `gh repo create 'OWNER/REPO' --private --description 'DESCRIPTION'`，仅当用户选择私有时使用 `--private`；公开或 internal 按已确定选项替换。没有同步授权时不加 `--source`、`--push` 或 `--clone`。

克隆前确认目标目录不存在或确实可用，不删除、覆盖用户目录。fork 前核对来源和目标所有者，按 `gh repo fork --help` 显式设置目标，避免交互默认顺便克隆或修改 remote。

改默认分支、可见性、归档、重命名、同步覆盖和删除等操作，先读当前设置与对应 `--help`。准确对象和后果已有授权则执行；缺失时展示具体变更后补确认，不使用强制参数绕过决定。删除不顺带清理本地目录。

写入超时先查询原完整名称及操作后名称，未知时不重复创建。最后读取真实仓库 URL 与最终设置；创建成功不等于本地提交已经推送。
