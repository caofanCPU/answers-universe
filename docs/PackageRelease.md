# Package Release

本文档定义当前 monorepo 下内部包的统一发包方式。

当前需要发布的包：

- `@windrun-huaiin/faq-contracts`
- `@windrun-huaiin/faq-sdk`

## 1. 前置约束

- 只在仓库根目录执行发包命令
- 使用 `pnpm`
- 使用 `changesets`
- 发布目标为内部 npm 仓库

## 2. 根目录脚本

根目录已经提供以下统一命令：

- `pnpm run dj`
  - 复制 changeset 模板并查看当前 release 状态
- `pnpm run djv`
  - 执行 `changeset version`
  - 更新包版本
  - 同步 workspace lockfile
- `pnpm run djvp`
  - 先构建 `contracts` 和 `sdk`
  - 再执行 `changeset publish`

## 3. 推荐发布流程

### 3.1 新增变更记录

在根目录执行：

```bash
pnpm run dj
```

然后在 `.changeset/` 下补充或调整本次发包说明。

### 3.2 提升版本

在根目录执行：

```bash
pnpm run djv
```

该步骤会：

- 计算本次 changesets 对应的版本号
- 更新两个包的版本
- 更新内部依赖版本
- 刷新 lockfile

### 3.3 正式发布

在根目录执行：

```bash
pnpm run djvp
```

该步骤会先构建，再执行 `changeset publish`。

## 4. 版本联动

当前 changeset 配置为：

- `updateInternalDependencies: patch`

因此：

- 如果 `contracts` 发布了新版本
- 且 `sdk` 依赖了它
- 那么 `changeset version` 会自动更新 `sdk` 内部依赖范围

这正是当前双包发布方案的关键前提。

## 5. publishConfig

两个包都已经显式配置：

- `publishConfig.access = restricted`

这意味着默认按内部包方式发布，而不是公开包。

## 6. 一句话结论

后续你只需要在仓库根目录维护 changeset，并执行 `dj -> djv -> djvp` 这条链路，就可以统一完成 `contracts` 和 `sdk` 的内部发包。
