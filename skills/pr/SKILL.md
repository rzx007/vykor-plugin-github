---
name: pr
description: Use when the user asks to find, inspect, create, edit, review, close, or merge a GitHub pull request.
user-invocable: true
---

# 处理 Pull Request

PR 是请求把一个分支的提交合并到另一个分支。先从宿主提供的本 Skill 文件路径定位并读取 [共享检查指引](../../references/github-cli-preflight.md)。下列命令中的目标均须替换为已核实值。

| 需求 | 命令 |
| --- | --- |
| 查找 | `gh pr list --repo 'HOST/OWNER/REPO' --state open --limit 30` |
| 读取 | `gh pr view NUMBER --repo 'HOST/OWNER/REPO' --json number,url,title,body,state,isDraft,baseRefName,headRefName,headRefOid,headRepositoryOwner,headRepository` |
| 看差异、检查 | `gh pr diff NUMBER --repo 'HOST/OWNER/REPO'`；`gh pr checks NUMBER --repo 'HOST/OWNER/REPO'` |
| 修改正文 | `gh pr edit NUMBER --repo 'HOST/OWNER/REPO' --body-file 'ABSOLUTE_BODY_FILE'` |
| 发布评论 | `gh pr comment NUMBER --repo 'HOST/OWNER/REPO' --body-file 'ABSOLUTE_COMMENT_FILE'` |

创建时先检查本地差异、必要测试、base、源仓库和源分支；按已有授权完成精确提交与推送。先用 `gh pr list --repo 'HOST/OWNER/REPO' --head 'BRANCH' --base 'BASE' --state all` 查已有对象，再读候选的源仓库和 SHA，避免同名分支误认。`--head` 过滤不接受 `OWNER:BRANCH`。

将正文写到文件，说明具体问题、改后行为和实际验证。创建示例：

```text
gh pr create --repo 'HOST/OWNER/REPO' --base 'BASE' --head 'BRANCH' --title 'TITLE' --body-file 'ABSOLUTE_BODY_FILE' --draft
```

同仓库使用明确分支；个人 fork 可用 `--head 'USER:BRANCH'`，当前 CLI 不支持将组织名用作该 `USER`，组织 fork 先查当前帮助选择受支持的方法。按用户要求决定是否使用 `--draft`；不要把 `--dry-run` 当成无副作用检查，它可能推送代码。用户已授权推送和开 PR 时继续，不重复索要批准。创建失败或超时，按原 base、源仓库、分支和 SHA 查询是否已创建，未知时不再次创建。

“帮我 review”默认只在对话给审查结果；向 GitHub 发布评论或 review 必须在已有授权范围内。发布 review 使用 `gh pr review NUMBER --repo 'HOST/OWNER/REPO' --comment --body-file 'ABSOLUTE_REVIEW_FILE'`；批准、要求修改、关闭或合并要有对应明确授权。

合并前重新核对 PR、检查状态和当前 `headRefOid`，选择已确定的策略并加 `--match-head-commit SHA`；例如 `gh pr merge NUMBER --repo 'HOST/OWNER/REPO' --squash --match-head-commit SHA`。不默认使用管理员绕过、删除分支或自动合并。

最后读回对象，返回真实 URL、状态、源/目标分支及检查结果。工作流尚在运行时如实报告。
