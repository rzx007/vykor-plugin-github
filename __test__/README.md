# 分发工程检查

`distribution.test.mjs` 将实际的 `plugins/github` 工程复制到临时目录，在没有仓库其余文件的情况下运行清单、版本、Skill 引用、许可证和 Secret 辅助命令检查。入口为仓库根的 `node --test __test__/*.test.mjs`。

插件自己的命令与权限回归保留在 `plugins/github/__test__/`，通过该工程的 `npm test` 执行。测试不读取用户安装，也不修改远端资源。
