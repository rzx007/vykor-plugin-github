---
name: gist
description: Use when the user asks to list, read, create, edit, clone, or delete a GitHub Gist containing code snippets or small files.
user-invocable: true
---

# 处理 Gist

Gist 是单独的代码片段集合，不属于某个仓库。先从宿主提供的本 Skill 文件路径定位并读取 [共享检查指引](../../references/github-cli-preflight.md)。不要给 Gist 命令添加不存在的 `--repo`。确认支持 Gist 的实际主机与账号，并在本次进程显式设置 `GH_HOST=HOST`；读写已有对象时使用完整 Gist URL。

| 需求 | 命令 |
| --- | --- |
| 列表 | `gh gist list --limit 30` |
| 看文件名 | `gh gist view 'GIST_URL' --files` |
| 看指定文件 | `gh gist view 'GIST_URL' --filename 'FILENAME' --raw` |
| 创建 | `gh gist create 'ABSOLUTE_FILE' --desc 'DESCRIPTION'` |
| 更新文件 | `gh gist edit 'GIST_URL' --filename 'REMOTE_FILENAME' 'ABSOLUTE_LOCAL_FILE'` |
| 克隆 | `gh gist clone 'GIST_URL' 'ABSOLUTE_NEW_DIRECTORY'` |
| 删除 | `gh gist delete 'GIST_URL'` |

创建前列出精确文件，检查敏感内容，明确可见性。默认不加 `--public` 时创建的是 secret Gist；**它只是不会公开列出，拿到链接的人仍可访问，不能当成私密保险箱**。只有用户已明确选择公开时加 `--public`。不要上传 `.env`、令牌、私钥或含这些内容的日志。

修改或删除前核对 URL、所有者、文件名及当前内容；“查看/整理片段”不自动授权公开或删除。正文从文件提供，不把多行内容拼进命令。克隆不覆盖现有目录。

创建或编辑超时先查原 Gist 或该账号近期相同文件的候选，核对内容与时间，未知时不重复创建。完成后用 `gh gist view 'GIST_URL' --files` 核对，返回真实 URL、可见性和文件列表；读取可能含敏感信息时只摘要必要内容。
