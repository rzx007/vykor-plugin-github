# GitHub 工作流

每个子目录的 `SKILL.md` 是一个独立入口，目录名、本名与根清单保持一致。宿主使用 `github:<本名>` 暴露技能。

`setup` 检查环境；`commit` 处理本地提交；`pr`、`issue`、`release`、`workflow-run`、`repo`、`gist` 和 `codespace` 处理对应 GitHub 资源；`secret` 使用共享辅助安全地预览并提交仓库 Secret。

新增工作流放在单独子目录，共享检查放在 `../references/`；实际变更仍由宿主工具执行，这些文件不保存用户运行数据。
