# 定向检查

`secrets.test.mjs` 验证 Secret 文件解析、预览绑定、账号与仓库核对、标准输入传值及未知结果处理。所有写入使用隔离的假 GitHub CLI，不修改远端 Secret；临时文件由测试自行清理。

跨模块与命令行回归放在这里。`npm test` 执行全部测试，`npm run build` 检查实际清单和所有 Skill 引用。
