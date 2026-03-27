# Answer-Universe 产品功能与技术设计说明

## 1. 项目概述

Answer-Universe 是一个题库内容管理与查看产品。当前工程已经基于 `@windrun-huaiin/backend-core`、`@windrun-huaiin/base-ui`、`@windrun-huaiin/third-ui` 等底层包完成了站点基础能力，包括导航、主题、国际化、登录态和通用页面结构。

本次需求是在现有工程上接入题库业务，重点围绕以下内容展开：

- 首页 Hero 改造
- 题目录入与编辑
- 题目预览
- 题目列表查看
- 题目详情查看
- JSON 批量导入与预览

涉及的主要参考文件：

- [UI.md](./UI.md)
- [prisma/schema.prisma](./prisma/schema.prisma)
- [src/components/hero.tsx](./src/components/hero.tsx)

题目主数据模型以 `prisma/schema.prisma` 中的 `Usb` 为核心。

## 2. 一期功能

### 2.1 一期目标

一期目标是让一个注册登录用户可以在系统内完成题目的完整基础操作闭环：

- 创建题目
- 编辑题目
- 预览题目
- 浏览题目列表
- 查看题目详情
- 通过 JSON 批量导入题目

一期核心不是搭建复杂后台体系，而是先把题库最基础、最常用的页面和数据链路打通。

### 2.2 核心使用流程

一期内，用户的主要使用流程如下：

1. 从首页进入题库入口
2. 在题目列表页浏览已有题目，按条件搜索和筛选
3. 进入题目详情页查看完整题目内容
4. 从列表页或详情页进入编辑页，修改已有题目
5. 从新建页手动录入题目，并在录入过程中实时预览
6. 在导入页粘贴或上传 JSON，先查看解析预览，再确认批量导入

### 2.3 数据模型

一期数据基于 `Usb` 模型，字段包括：

- `id`：题目主键
- `question`：题干正文
- `cdnImagePrefix`：图片 CDN 前缀
- `questionImage`：题目图片路径
- `correctAnswer`：正确答案
- `incorrectAnswers`：错误答案列表，JSON 存储
- `explanation`：题目解析
- `difficulty`：难度
- `category`：主分类
- `subCategory`：次分类
- `asFirst`：是否首发标记
- `tags`：附加标签
- `createUserId`：创建用户
- `updateUserId`：更新用户
- `createdAt` / `updatedAt`：创建与更新时间

服务层对外输出时，建议统一转换为页面直接可用的数据结构：

- `incorrectAnswers` 转为字符串数组
- `tags` 转为标签数组
- `cdnImagePrefix + questionImage` 转为完整图片地址
- `asFirst` 转为布尔值字段，如 `isFirst`

### 2.4 功能说明

#### 2.4.1 首页 Hero

一期只改造首页 Hero，不重做整个首页。

Hero 的任务是把原本偏模板展示型的首屏，改成题库产品的业务入口。用户进入首页后，应立即知道这是一个用于题目录入、查看和导入的系统。

Hero 建议包含以下内容：

- 明确题库产品定位的标题
- 说明录入、预览、列表、详情、导入能力的副标题
- 主按钮：进入题目列表页
- 次按钮：进入新建题目页或 JSON 导入页
- 一组流程型摘要信息，例如“录入 -> 预览 -> 保存 -> 查看 -> 编辑”
- 右侧题目卡片或题目预览示意，而不是纯宣传图

Hero 的改造文件是 [src/components/hero.tsx](./src/components/hero.tsx)。

#### 2.4.2 题目列表页

建议新增题目列表页作为题库主入口，建议路由为：

- `/questions`

题目列表页承担以下职责：

- 展示已有题目集合
- 提供搜索和筛选能力
- 提供进入详情页和编辑页的入口

页面布局建议：

- 顶部：页面标题、主操作按钮
- 筛选区：关键词、分类、难度、标签
- 列表区：题目卡片或表格列表
- 底部：分页区域

列表项建议展示：

- 题干摘要
- 分类
- 次分类
- 难度
- 标签
- 更新时间
- 查看按钮
- 编辑按钮

交互要求：

- 搜索和筛选支持组合使用
- 列表点击主体进入详情页
- 点击编辑按钮进入编辑页
- 分页切换后保留当前查询条件

#### 2.4.3 题目详情页

建议新增题目详情页，路由为：

- `/questions/[id]`

题目详情页是查看单道题目的核心页面，用于完整展示题目内容，并提供返回列表和进入编辑的操作入口。

页面布局建议：

- 桌面端采用左右布局
- 左侧为主体内容区
- 右侧为题目元信息卡片和操作区
- 移动端改为单列上下布局

主体内容区建议顺序：

- 题目标题或题号
- 题干正文
- 图片
- 选项区
- 答案区
- 解析区

元信息区建议包含：

- 分类
- 次分类
- 难度
- 标签
- 首发标记
- 创建时间
- 更新时间

交互要求：

- 默认先展示题干和选项
- 答案使用显隐或折叠方式展示，避免直接剧透
- 解析可与答案联动展开，也可单独展开
- 页面提供“编辑题目”和“返回列表”按钮

#### 2.4.4 题目录入页

建议新增题目录入页，路由为：

- `/questions/new`

录入页用于创建新题目。页面应同时承载编辑表单和实时预览。

布局建议：

- 桌面端左右布局
- 左侧表单区
- 右侧预览区
- 移动端改为上下布局

录入表单应包括：

- 题干
- 正确答案
- 错误答案
- 解析
- 分类
- 次分类
- 难度
- 标签
- 首发标记
- 图片配置

页面能力要求：

- 基础字段校验
- 保存题目
- 表单修改后同步预览区

#### 2.4.5 题目编辑页

建议新增题目编辑页，路由为：

- `/questions/[id]/edit`

编辑页与录入页应复用同一套表单组件和预览组件，区别仅在于初始化数据来源不同：

- 录入页使用空白初始值
- 编辑页加载已有题目数据

编辑页能力要求：

- 加载已有题目数据
- 支持继续修改
- 支持实时预览
- 保存后返回详情页或保留在编辑页

#### 2.4.6 JSON 导入页

建议新增 JSON 导入页，路由为：

- `/questions/import`

导入页用于批量创建题目。导入不是直接入库，而是先解析、预览、校验，再由用户确认导入。

页面结构建议：

- 顶部：导入格式说明
- 中部：JSON 输入区或上传区
- 下方：解析预览结果区
- 底部：确认导入操作区

交互要求：

- 用户输入 JSON 后先点击“解析预览”
- 系统逐条返回预览结果
- 解析结果明确标记哪些题目可导入，哪些题目有错误
- 用户确认后执行批量导入

#### 2.4.7 JSON 导入预览

导入预览是 JSON 导入功能的关键部分。

预览区建议展示：

- 每道题的题干摘要
- 分类
- 难度
- 标签
- 图片信息摘要
- 校验状态
- 错误原因

这样用户可以在真正写入数据库前完成一次批量确认。

### 2.5 前端方案

一期前端方案重点是页面布局、交互链路和组件复用，视觉样式遵循 [UI.md](./UI.md)。

前端实现建议：

- 保留现有首页整体结构，只改造 Hero
- 新增题库页面，不改动现有通用布局系统
- 详情页展示组件与编辑页预览组件共用一套题目展示逻辑
- 录入页与编辑页共用一套表单组件
- JSON 导入预览复用题目摘要展示组件

建议拆分的组件包括：

- `QuestionForm`
- `QuestionPreview`
- `QuestionList`
- `QuestionListFilters`
- `QuestionDetail`
- `QuestionMetaCard`
- `QuestionAnswerPanel`
- `JsonImportPanel`
- `JsonImportPreviewList`

建议覆盖的前端状态包括：

- 页面加载态
- 空列表态
- 无结果态
- 正常展示态
- 保存中状态
- 导入解析中状态
- 导入成功 / 失败状态
- 答案展开状态
- 解析展开状态
- 表单脏数据状态

### 2.6 后端方案

一期后端目标是围绕 `Usb` 模型补齐页面所需的查询、写入、标准化和导入能力。

建议沿用当前工程结构，按以下分层实现：

- Prisma Model：定义数据结构
- Repository / Prisma Service：负责基础查询和写入
- Domain Service：负责字段转换、导入解析、DTO 组装
- Route Handler：负责鉴权、参数校验、输出返回

建议的一期核心服务：

#### 2.6.1 题目列表查询服务

职责：

- 分页查询题目
- 支持关键词搜索
- 支持分类、难度、标签筛选
- 返回列表页所需字段

#### 2.6.2 题目详情查询服务

职责：

- 根据 `id` 查询单题
- 转换为详情页使用的 DTO
- 输出标准化字段

#### 2.6.3 题目创建服务

职责：

- 创建题目
- 处理错误答案、标签、图片等字段
- 写入创建人与更新人

#### 2.6.4 题目更新服务

职责：

- 更新已有题目
- 保持字段转换逻辑一致
- 更新 `updateUserId`

#### 2.6.5 JSON 导入服务

职责：

- 解析 JSON
- 校验字段结构
- 生成预览结果
- 用户确认后批量写入数据库

#### 2.6.6 Redis 缓存服务

一期 Redis 缓存纳入正式范围，直接服务于题目查询加速。

缓存设计采用“页面视图优先”的方式，而不是缓存数据库原始结构。也就是说，Redis 中存储的是前端页面可以直接消费的 DTO JSON，而不是 `Usb` 原始记录。

这样设计的好处是：

- 缓存的目标就是加速页面查询
- 前端拿到 JSON 后可以直接使用
- 列表页、详情页、预览区可以共用统一数据结构

一期先做单题详情缓存：

- 题目详情缓存：按题目 `id` 存储 `QuestionDetailDto`

结合 `@windrun-huaiin/backend-core` 已提供的 `redis-structures.ts` 能力，一期建议优先使用 `setJson` / `getJson` 这类按 key 存储 JSON 的方式。

建议缓存 key：

- `answers_universe:question:detail:{id}`

这种结构比 hash field 更适合一期，因为：

- 直接存储 JSON 更贴合 DTO 缓存
- 单 key TTL 更自然
- 单题查询和更新逻辑更简单

缓存读取规范：

- 任何单题查询 API 先查 Redis
- 缓存命中则直接返回
- 缓存未命中则查询数据库
- 数据库结果返回给调用方后，再异步触发缓存重建

缓存更新规范：

- 新建题目成功后，异步触发该题目的缓存构建
- 编辑题目成功后，异步触发该题目的缓存刷新
- JSON 批量导入成功后，异步触发成功题目的缓存构建

缓存构建采用“异步重建”方式，不要求主链路同步写缓存。

具体流程如下：

1. API 先查缓存
2. miss 后查数据库
3. 数据库结果先直接返回
4. 再通过 QStash 投递一个缓存刷新任务
5. 消费者根据题目 `id` 查数据库并重建缓存

这里异步任务消息建议只传题目 `id`，不直接传完整缓存数据。

建议消息结构：

```json
{
  "type": "question_cache_refresh",
  "questionId": "123"
}
```

消费者职责：

- 根据 `questionId` 查询数据库
- 转换为 `QuestionDetailDto`
- 写入 `answers_universe:question:detail:{id}`
- 如果题目不存在，则删除对应缓存

这样设计的原因是：

- 数据库始终是唯一真实数据源
- 消息体更小
- 避免旧消息覆盖新缓存
- DTO 结构变化时不需要兼容旧消息体

需要注意的是，一期在功能方案上确定 Redis 和 QStash 的规范，但在开发执行顺序上，会放在最后一个阶段补齐，先保证单题主流程可测试。

### 2.7 DTO 设计

建议至少定义以下 DTO：

- `QuestionListItemDto`
- `QuestionDetailDto`
- `QuestionImportPreviewDto`

其中：

- `QuestionListItemDto` 用于列表页
- `QuestionDetailDto` 用于详情页和预览区
- `QuestionImportPreviewDto` 用于导入预览结果展示

### 2.8 页面与接口关系

建议页面和接口按以下关系落地：

- 题目列表页调用列表查询接口
- 题目详情页调用详情查询接口
- 录入页调用创建接口
- 编辑页调用更新接口
- JSON 导入页先调用解析预览接口，再调用批量导入接口

### 2.9 一期验收标准

1. 首页 Hero 能明确表达题库产品定位，并提供题库业务入口
2. 用户可以进入题目列表页浏览题目
3. 列表页支持关键词、分类、难度、标签等基础筛选
4. 用户可以进入题目详情页查看完整题目内容
5. 用户可以创建新题目
6. 用户可以编辑已有题目
7. 录入页和编辑页都能实时预览题目效果
8. 用户可以进行 JSON 批量导入，并在导入前完成预览确认
9. 单题详情查询接入 Redis 缓存
10. 写入后能够主动预热缓存，查询回源数据库后能够刷新缓存
11. 后端返回的数据经过统一标准化处理，而不是直接暴露 Prisma 原始结构

### 2.10 一期开发执行顺序

一期建议按“先主流程，后增强项”的顺序推进，这样可以分阶段测试，降低联调复杂度。

#### 第一阶段：后端主流程

先完成不依赖 Redis 和 QStash 的后端主业务逻辑：

- `Usb` 的 DTO 转换
- 单题创建接口
- 单题更新接口
- 题目列表查询接口
- 题目详情查询接口

这一阶段 Redis 缓存和 QStash 异步任务先留空，只保证数据库读写和接口返回正确。

完成后可以先验证单题主数据链路是否跑通。

#### 第二阶段：前端单题主流程

在后端主流程稳定后，先完成单题相关前端页面：

- 首页 Hero 改造
- 题目列表页
- 题目详情页
- 题目录入页
- 题目编辑页

这一阶段 JSON 批量导入页面和批量处理逻辑可以先留空，只聚焦单道题目的用户操作闭环。

完成后可以进行第一轮完整测试，验证以下流程：

- 首页进入题库
- 列表查看
- 查看详情
- 新建单题
- 编辑单题
- 录入和编辑时预览

#### 第三阶段：JSON 批量导入

单题主流程确认稳定后，再补 JSON 批量导入能力：

- JSON 导入页
- JSON 解析预览接口
- JSON 批量导入接口
- 导入结果展示

完成后可以进行第二轮测试，验证批量导入和批量预览的效果。

#### 第四阶段：Redis 缓存与 QStash 异步队列

最后补 Redis 缓存和 QStash 异步任务：

- 单题详情缓存 key 设计与工具封装
- 单题查询先查缓存的读取逻辑
- DB 查询后异步投递缓存刷新任务
- 创建、编辑、批量导入后的缓存刷新任务投递
- QStash 消费者按题目 `id` 重建缓存

这样安排的好处是：

- 先把核心业务流程跑通
- 先验证单题操作体验
- 再验证批量处理效果
- 最后补性能增强层，避免缓存和队列问题干扰主功能验证

按这个顺序推进，你可以分三轮测试：

1. 先测试单题用户主流程
2. 再测试 JSON 批量导入效果
3. 最后测试缓存命中、回源和异步刷新链路

### 2.11 研发执行清单

这一节用于直接指导编码落地，按阶段列出需要完成的对象、接口、页面和验证点。

#### 2.11.1 第一阶段执行清单：后端主流程（已完成）

这一阶段先不接 Redis，不接 QStash，只保证数据库主逻辑和接口正确。

当前实际已完成：

- DTO：
  - `QuestionListItemDto`
  - `QuestionDetailDto`
  - `QuestionUpsertInput`
  - `QuestionImportPreviewDto`
  - `QuestionImportValidationItem`
  - `QuestionImportValidationResult`
  - `QuestionImportCommitResult`

- service 方法：
  - `getQuestionById(id)`
  - `getQuestionList(params)`
  - `createQuestion(input, userId)`
  - `updateQuestion(id, input, userId)`
  - `buildQuestionDetailDto(record)`
  - `buildQuestionListItemDto(record)`
  - `validateQuestionImportItem(item, index)`
  - `validateQuestionImportItems(items)`
  - `importQuestions(items, userId)`

- API：
  - `GET /api/questions`
  - `GET /api/questions/:id`
  - `POST /api/questions`
  - `PUT /api/questions/:id`

当前 `GET /api/questions` 已支持以下参数：

- `page`
- `pageSize`
- `keyword`
- `category`
- `difficulty`
- `tags`

当前这一阶段的完成判定：

- 可以创建单题
- 可以更新单题
- 可以分页查看题目列表
- 可以按 `id` 查看题目详情
- 接口返回的是 DTO，而不是 Prisma 原始结构

#### 2.11.2 第二阶段执行清单：前端单题主流程（已完成）

这一阶段围绕单题用户流程完成页面落地。

当前实际已完成页面：

- 首页 Hero 改造
- `/questions`
- `/questions/[id]`
- `/questions/new`
- `/questions/[id]/edit`

当前实际已完成组件：

- `QuestionForm`
- `QuestionPreview`
- `QuestionList`
- `QuestionListFilters`
- `QuestionDetail`
- `QuestionMetaCard`
- `QuestionAnswerPanel`
- `QuestionListClient`
- `QuestionDetailClient`
- `QuestionEditorClient`

当前已实现的页面动作：

- Hero 主按钮跳转题目列表页
- Hero 次按钮跳转新建题目页
- 列表页支持搜索和筛选
- 列表页点击进入详情
- 详情页点击进入编辑
- 新建页支持保存
- 编辑页支持更新
- 新建页和编辑页支持实时预览

当前这一阶段的完成判定：

- 用户可以从首页进入题库
- 用户可以完成列表 -> 详情 -> 编辑的链路
- 用户可以完成新建 -> 预览 -> 保存 -> 查看详情的链路

#### 2.11.3 第三阶段执行清单：JSON 批量导入（已按新方案完成）

这一阶段补齐批量处理能力。

这一阶段实际采用的方案与最初计划不同，现已按以下边界实现：

- 前端负责 JSON 本地解析
- 前端负责 JSON 本地预览
- 后端不接收原始 JSON 字符串
- 后端只接收“已解析的题目对象数组”
- 后端负责批量业务校验与批量入库

当前实际已完成前端能力：

- `/questions/import` 页面
- 本地 `JSON.parse`
- 本地预览结果展示
- 本地错误提示
- 调用后端批量校验
- 调用后端批量入库

当前实际已完成后端能力：

- `validateQuestionImportItem(item, index)`
- `validateQuestionImportItems(items)`
- `importQuestions(items, userId)`

当前实际已完成 API：

- `POST /api/questions/import/validate`
- `POST /api/questions/import/commit`

当前 `validate` 接口返回：

- 总记录数
- 可导入数量
- 错误数量
- 每条记录的预览 DTO
- 每条记录的错误信息
- 后端规范化后的 payload 是否可用

当前 `commit` 接口返回：

- 总记录数
- 成功导入数量
- 失败数量
- 成功题目的 id 列表
- 每条记录的导入结果摘要

当前这一阶段的完成判定：

- 用户可以粘贴 JSON 并完成预览
- 用户可以看到每条记录的错误原因
- 用户可以先调后端校验，再确认批量入库
- 用户可以看到批量导入结果

#### 2.11.4 第四阶段执行清单：Redis 缓存与 QStash

这一阶段补性能增强层和异步缓存重建链路。

建议先完成以下缓存 helper：

- `getQuestionDetailCacheKey(id)`
- `getQuestionDetailFromCache(id)`
- `setQuestionDetailToCache(id, dto)`
- `deleteQuestionDetailCache(id)`

建议先完成以下异步任务方法：

- `enqueueQuestionCacheRefresh(id)`
- `refreshQuestionDetailCacheById(id)`

建议先完成以下链路改造：

- `GET /api/questions/:id` 先查缓存
- cache miss 后查 DB
- DB 返回后异步投递缓存刷新任务
- 创建成功后异步投递缓存刷新任务
- 更新成功后异步投递缓存刷新任务
- 批量导入成功后对成功题目异步投递缓存刷新任务

建议补一个 QStash 消费者入口，用于：

- 接收 `question_cache_refresh`
- 根据 `questionId` 查库
- 重建 `QuestionDetailDto`
- 写入 Redis

建议这一阶段的完成判定：

- 首次查询 miss 后能正常返回 DB 结果
- 后续同题查询能命中缓存
- 创建和更新后能异步刷新缓存
- 缓存删除后下一次查询能自动恢复

#### 2.11.5 开发时的推荐验证顺序

建议你实际开发时，按下面顺序逐项验证：

1. 先用接口工具验证后端单题接口
2. 再接前端页面验证单题用户流程
3. 再补 JSON 导入并验证批量流程
4. 最后补 Redis 和 QStash 并验证缓存与异步链路

#### 2.11.6 下一步待开工对象

当前前三阶段已经完成，下一步待开工对象如下：

- 单题详情缓存 key helper
- Redis 读写 helper
- QStash 任务投递 helper
- QStash 消费者入口
- `GET /api/questions/:id` 的缓存优先读取
- 创建、编辑、批量导入后的异步缓存刷新链路

这些对象完成后，就会进入第四阶段：Redis + QStash 异步缓存增强。

## 3. 后续计划

后续计划可以在一期完成后继续拆分为二期、三期。

当前已明确但暂未纳入一期的方向包括：

- 多角色权限体系
- 更完整的审核流转机制
- 对外开放 API
- 更复杂的批量运维能力
- AI 生题能力
- 更完善的数据统计与运营能力

后续新增需求时，可以直接从这里继续扩写为二期、三期方案，而不需要改写一期文档结构。
