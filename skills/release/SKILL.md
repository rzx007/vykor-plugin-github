---
name: release
description: Use when the user asks to list, inspect, draft, publish, update, download, or delete a GitHub release or release asset.
user-invocable: true
---

# 管理发布版本

先从宿主提供的本 Skill 文件路径定位并读取 [共享检查指引](../../references/github-cli-preflight.md)。明确仓库、tag、提交、草稿/正式发布、预发布标记和附件路径。

| 需求 | 命令 |
| --- | --- |
| 列表 | `gh release list --repo 'HOST/OWNER/REPO' --limit 20` |
| 读取 | `gh release view 'TAG' --repo 'HOST/OWNER/REPO'` |
| 修改说明 | `gh release edit 'TAG' --repo 'HOST/OWNER/REPO' --notes-file 'ABSOLUTE_NOTES_FILE'` |
| 下载 | `gh release download 'TAG' --repo 'HOST/OWNER/REPO' --dir 'ABSOLUTE_DESTINATION'` |

发布步骤：

1. 先查相同 tag 的 Release，再核实远端 tag 指向的提交。访问失败不能当成 tag 或 Release 不存在。确认实际构建、测试结果和附件存在；列出要上传的精确文件，不用宽泛通配符捎带其他文件。
2. 将发布说明写入文件，概括用户可见变化、必要升级步骤及验证结果。已有远端 tag 时优先加 `--verify-tag`，防止 CLI 自动从默认分支创建错误 tag。
3. 按用户授权创建，例如 `gh release create 'TAG' 'ABSOLUTE_ASSET_FILE' --repo 'HOST/OWNER/REPO' --verify-tag --title 'TITLE' --notes-file 'ABSOLUTE_NOTES_FILE' --draft`。无附件时省略附件参数。已授权正式发布时按要求去掉 `--draft`，不重复批准。
4. 如果确实要新建远端 tag，先核实完整目标 SHA 并用 `--target 'FULL_SHA'`；不能默默采用默认分支。已有 tag 不能因本次发布自动移动。
5. 发布已有草稿使用 `gh release edit 'TAG' --repo 'HOST/OWNER/REPO' --draft=false`；先核对其当前说明、附件和目标提交。

覆盖同名附件、删除 Release/资产或 tag、改变 latest 和公开发布都应在已有精确授权范围内；不能顺便删除 tag。失败时先查看原 tag、Release 与资产清单，未知结果不重发。返回真实 Release URL、草稿/发布状态、tag、提交及附件，不能把上传成功当作构建测试通过。
