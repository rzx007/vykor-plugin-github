---
name: setup
description: Use when GitHub CLI is missing, GitHub authentication fails, or the user needs to choose a GitHub host and account.
user-invocable: true
---

# 配置 GitHub CLI

先从宿主提供的本 Skill 文件路径定位并读取 [共享检查指引](../../references/github-cli-preflight.md)，不要假设当前目录是插件目录。

1. 用 `gh --version` 检查 CLI；需要安装时按实际系统使用官方说明，完成后重新检查版本。
2. 明确本次 `HOST` 和期望账号。用 `gh auth status --active --hostname HOST` 与 `gh api --hostname HOST user --jq .login` 检查。JSON 状态命令 exit 0 不能证明已登录。
3. 需要登录时，在用户可交互的终端运行 `gh auth login --hostname HOST --web --git-protocol https`。由用户自行完成浏览器授权；不要在对话收集 token 或设备码。终端不可交互时说明完成登录的位置，不假装已完成。
4. 多账号时用 `gh auth switch --hostname HOST --user LOGIN` 选择已确定的账号。登录或切换后，再查状态和 `gh api ... user`；核对返回的真实登录名。
5. 若用户给了仓库，运行 `gh repo view 'https://HOST/OWNER/REPO' --json nameWithOwner,url,viewerPermission` 核对访问。账号有效但仓库不可访问时，说明需要的仓库权限；按具体失败查看 `gh auth refresh --help`，不一次请求无关权限。

返回 CLI 版本、实际主机、验证过的账号、仓库 URL 与可执行状态。不要输出凭据或修改仓库默认目标来掩盖访问错误。后续任务已有明确授权且检查通过时，直接继续该任务。
