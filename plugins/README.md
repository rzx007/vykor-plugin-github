# 可安装插件工程

[github](github/README.md) 是市场固定提交后使用的安装根目录，包含自己的 package.json、锁文件、清单、LICENSE、Skill、脚本与测试。它可以复制到独立目录检查，不依赖仓库根文件或 Vykor 源码。

源码和市场分别维护：本仓库负责插件，市场仓库只记录仓库、提交号和 `plugins/github` 路径并生成安装包。插件 ID、权限和用户数据机制不随目录变化。
