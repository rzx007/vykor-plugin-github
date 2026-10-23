---
name: issue
description: Use when the user asks to find, read, create, edit, comment on, close, or reopen a GitHub issue.
user-invocable: true
---

# 处理 GitHub Issue

先从宿主提供的本 Skill 文件路径定位并读取 [共享检查指引](../../references/github-cli-preflight.md)，核实主机、账号和仓库。

| 需求 | 命令 |
| --- | --- |
| 查找 | `gh issue list --repo 'HOST/OWNER/REPO' --state open --limit 30` |
| 读取 | `gh issue view NUMBER --repo 'HOST/OWNER/REPO' --comments` |
| 创建 | `gh issue create --repo 'HOST/OWNER/REPO' --title 'TITLE' --body-file 'ABSOLUTE_BODY_FILE'` |
| 修改 | `gh issue edit NUMBER --repo 'HOST/OWNER/REPO' --body-file 'ABSOLUTE_BODY_FILE'` |
| 评论 | `gh issue comment NUMBER --repo 'HOST/OWNER/REPO' --body-file 'ABSOLUTE_COMMENT_FILE'` |
| 关闭/重开 | `gh issue close NUMBER --repo 'HOST/OWNER/REPO'`；`gh issue reopen NUMBER --repo 'HOST/OWNER/REPO'` |

创建前先按主题搜索已有 Issue，用 `gh issue list --repo 'HOST/OWNER/REPO' --state all --search 'QUERY'` 查重。缺陷正文写清实际现象、复现条件、期望行为和已有证据；不要编造环境、日志或原因。正文和评论先写文件，避免 Shell 改写换行与符号。

只在用户已授权范围内发布、修改或关闭；标签、指派人和里程碑用真实名称，不猜测。不把“查看/分析 Issue”扩展为发表评论。删除、转移、锁定等操作先用对应 `--help` 核对语法；准确对象和后果缺少授权时才补确认。

写入超时先查原对象或近期相同标题与正文的候选，核对作者和时间，不重复创建或评论。完成后读回 URL、标题和状态；返回实际变更及未解决的问题。
