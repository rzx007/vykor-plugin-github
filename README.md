# GitHub for Vykor

独立维护的 GitHub 工作流插件，稳定 ID 为 `dev.vykor.github`。通过本机 GitHub CLI 提供仓库、提交、PR、Issue、Release、Actions、Gist、Codespaces 和 Secret 等 10 个 Skill，继续使用宿主的权限确认和操作回执。

可安装工程位于 [plugins/github](plugins/github/README.md)。市场固定本仓库的完整提交号，并使用 `source.path: "plugins/github"`；现有客户端可直接安装，不需要支持仓库根路径。

## 本地检查

在仓库根执行工程隔离检查，再在插件目录构建和测试：

```sh
node --test __test__/*.test.mjs
cd plugins/github
npm ci --ignore-scripts
npm run build
npm test
```

需要 Node.js 22 或以上。检查不修改真实 GitHub 资源；Secret 测试使用隔离的假 CLI。完整安装与使用说明、权限边界、发布步骤见[插件说明](plugins/github/README.md)。

## 发布到市场

更新插件清单、package.json 和锁文件的版本，检查后提交并推送源码，再向 [vykor-plugins](https://github.com/rzx007/vykor-plugins) 提交固定提交号和 `plugins/github` 路径的收录或升级 PR。市场构建离线 ZIP 并发布，客户端不执行 npm。已发布版本的内容不可覆盖。

- [plugins/github](plugins/github/README.md)：插件清单、Skill、辅助脚本、测试及包内许可证。
- [__test__](__test__/README.md)：复制到独立目录后的完整性和脚本检查。
- [来源与许可](plugins/github/UPSTREAM.md)、[MIT 许可](LICENSE)：原创内容及参考来源。
