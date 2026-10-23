---
name: workflow-run
description: Use when the user asks to inspect GitHub Actions, trigger a workflow, read run logs, rerun jobs, cancel runs, or download artifacts.
user-invocable: true
---

# 操作 GitHub Actions

工作流是仓库中定义的自动执行步骤；一次执行有独立 run ID。先从宿主提供的本 Skill 文件路径定位并读取 [共享检查指引](../../references/github-cli-preflight.md)。

| 需求 | 命令 |
| --- | --- |
| 找工作流 | `gh workflow list --repo 'HOST/OWNER/REPO'` |
| 看定义 | `gh workflow view 'WORKFLOW_FILE' --repo 'HOST/OWNER/REPO' --ref 'REF' --yaml` |
| 找执行记录 | `gh run list --repo 'HOST/OWNER/REPO' --workflow 'WORKFLOW_FILE' --branch 'BRANCH' --limit 20 --json databaseId,url,status,conclusion,headSha,createdAt` |
| 看详情/失败日志 | `gh run view RUN_ID --repo 'HOST/OWNER/REPO'`；`gh run view RUN_ID --repo 'HOST/OWNER/REPO' --log-failed` |
| 等待结果 | `gh run watch RUN_ID --repo 'HOST/OWNER/REPO' --exit-status --interval 10` |
| 下载产物 | `gh run download RUN_ID --repo 'HOST/OWNER/REPO' --dir 'ABSOLUTE_DESTINATION'` |

触发前读指定 ref 的 YAML，确认支持 `workflow_dispatch`（手动触发入口）、输入字段、部署环境及可能发布的对象。核实本次账号、workflow 文件、ref 和输入；用户已明确授权该次部署或运行时继续，否则只补问缺失决定。

不含输入时运行 `gh workflow run 'WORKFLOW_FILE' --repo 'HOST/OWNER/REPO' --ref 'REF'`。有复杂或多行输入时先写 JSON 文件，以 Shell 工具支持的标准输入将文件交给同一命令的 `--json`，不要把 JSON 或敏感值拼在命令字符串中。普通公开输入也可按独立字面量参数用 `--raw-field 'KEY=VALUE'`。

触发后记录时间，查询对应工作流、ref、触发账号和 SHA 的运行；同时出现多个候选时逐一核实，不能把列表第一条当本次运行。触发超时先查已有运行，避免重复部署。

取消和重跑使用 `gh run cancel RUN_ID --repo 'HOST/OWNER/REPO'` 或 `gh run rerun RUN_ID --repo 'HOST/OWNER/REPO' --failed`，必须核对 run ID 并有相应授权。重跑可能重新部署；不把“看失败原因”当成重跑授权。

日志可能含敏感内容，摘要中删去凭据。最后返回准确运行 URL、SHA、状态和结论；触发成功只说明已发出请求，`queued`/`in_progress` 还不是完成。
