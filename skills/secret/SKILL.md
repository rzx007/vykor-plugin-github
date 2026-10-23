---
name: secret
description: Use when the user asks to list, set, delete, preview, or import GitHub repository secrets from a local dotenv file.
user-invocable: true
---

# 管理仓库 Secrets

Secret 是只写入、不读回原值的加密配置。本 Skill 默认管理仓库级 GitHub Actions secrets。先从宿主提供的本 Skill 文件路径定位并读取 [共享检查指引](../../references/github-cli-preflight.md)。主机、仓库、账号、名称和用途必须明确；不自动扩展到组织、用户或部署环境。

## 查看与删除

用 `gh secret list --repo 'HOST/OWNER/REPO'` 查看名称与更新时间。已有精确删除授权时运行 `gh secret delete 'SECRET_NAME' --repo 'HOST/OWNER/REPO'`，随后重新列出核对。不能从“同步”推导出删除远端多余名称。

## 从 .env 预览与写入

需要 Node.js 22 或更高版本。由本 Skill 实际目录解析 `../../scripts/secrets.mjs` 为绝对路径，不能根据 cwd 猜测。文件路径也解析为实际绝对路径；不要在对话、终端回显或日志中输出文件内容。

先只预览：

```text
node 'ABSOLUTE_PLUGIN_ROOT/scripts/secrets.mjs' preview --repo 'OWNER/REPO' --file 'ABSOLUTE_ENV_FILE' --hostname 'HOST'
```

预览只返回 `hostname`、`repository`、`account`、`names`、`sha256`。`sha256` 是确认摘要，绑定标准化的主机、仓库、账号、名称和原文件字节，不能自行替换为单独的文件摘要。将这些字段作为本次可审查的目标与输入版本；检查名称是否在用户要求范围内。用户已明确授权指定文件全部内容时，可覆盖本次预览得到的名称和输入摘要，无须另批摘要。已有授权覆盖这些精确字段时继续；缺少主机、仓库、账号或名称授权时只补确认缺失项，不要求重复批准。预览后内容变化，仅补确认变化的输入部分。

应用必须使用同一文件、主机、仓库与预览结果：

```text
node 'ABSOLUTE_PLUGIN_ROOT/scripts/secrets.mjs' apply --repo 'OWNER/REPO' --file 'ABSOLUTE_ENV_FILE' --hostname 'HOST' --expected-sha256 'PREVIEW_SHA256' --expected-account 'PREVIEW_ACCOUNT' --confirm
```

`--confirm` 仅表示已经取得上述精确授权，不能代替授权。确认摘要、实际账号或目标变化时停止应用，重新预览并解决差异；不能把 H1 的批准套到 H2 或把 alice 的批准套到 bob。helper 会通过 stdin 交给 `gh`；不使用 `--body`、不直接绕过预览批量运行 `gh secret set --env-file`。

单项设置也优先使用只含该项的受控 `.env` 文件走同样流程。由用户在本地受控文件中提供值，不在对话索要值。确需直接设置时只允许安全 stdin 给 `gh secret set 'SECRET_NAME' --repo 'HOST/OWNER/REPO'`，先核实相同精确授权；禁用命令回显和包含值的调试输出。

成功后重新列出名称，报告已完成名称与目标；列表不能证明旧值等于新值。helper 报错可能包含 `status: unknown` 和已完成名称：立即停止，先核对该目标的现状、完成清单与错误，不自动重放整批，也不把部分完成写成全部成功。临时文件仅清理本次明确创建的文件，保留用户原文件。
