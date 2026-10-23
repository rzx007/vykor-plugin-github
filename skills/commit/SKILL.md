---
name: commit
description: Use when the user asks to inspect changes, create a Git commit, or push selected work to a GitHub repository.
user-invocable: true
---

# 提交与推送代码

先从宿主提供的本 Skill 文件路径定位并读取 [共享检查指引](../../references/github-cli-preflight.md)。Git 命令使用用户实际项目的明确工作目录，插件目录不是代码仓库。

1. 查 `git status --short`、`git branch --show-current`、`git remote -v`、`git diff` 和 `git diff --cached`。确认本次文件、当前分支、暂存内容及远端；读取仓库已有提交规范。
2. 检查差异中是否有密钥、生成物和无关改动；保留它们原状。不要使用 `git add .` 或 `git add -A` 代替选择文件。按用户需求运行必要检查，记录实际命令与结果。
3. 用 `git add -- 'PATH'` 暂存本次精确文件，再读 `git diff --cached`。已有无关暂存内容时，先选择能保留原暂存区的隔离提交方法；无法可靠隔离时说明冲突并补问，不擅自取消暂存，也不顺带提交。
4. 根据实际差异写提交说明到临时文件，用 `git commit -F 'ABSOLUTE_MESSAGE_FILE'` 提交。提交后查 `git show --stat --oneline HEAD` 和 `git status --short`。不自动 amend 或改写已有历史。
5. 用户已授权推送时，按共享指引验证主机、账号和仓库，用 `gh repo view 'https://HOST/OWNER/REPO' --json nameWithOwner,url` 对照 remote，确认分支目标后运行 `git push REMOTE 'HEAD:refs/heads/BRANCH'`。不要强制推送；被拒绝时先读远端状态。

推送后用 `git ls-remote REMOTE 'refs/heads/BRANCH'` 对照本地 SHA。推送超时先查远端 SHA，不直接重复。返回提交 SHA、分支、实际推送状态、检查结果以及仍未提交的文件；用户只要求本地提交时不自行推送。
