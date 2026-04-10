# Message Skills

## 一、目标

本项目的国际化处理，目标不是“把所有文案都塞进一个大 JSON”，而是建立一套可持续维护的消息组织规则。

这套规则需要满足四件事：

1. 基础模板与业务文案隔离。
2. 服务端先取翻译，再以结构化数据传给客户端。
3. 组件内部尽量不直接做语言判断。
4. 后续扩展多语言时，只做翻译文件补充，不再回头改业务代码。


## 二、基础原则

### 1. `messages/en.json` 是基础翻译文件

`messages/en.json` 默认来源于模板工程或底层封装，是网站公共骨架和基础能力所依赖的翻译文件。

因此：

1. 一般不要随意修改它的既有结构。
2. 如果只是业务页面增加文案，不应优先改这里。
3. 它主要作为“基础层消息源”存在。


### 2. 业务翻译单独拆文件

业务翻译不直接继续堆到 `messages/en.json` 中，而是单独放到业务文件中，例如：

```txt
messages/
  en.json
  biz/
    answerYou.en.json
```

其中：

1. `messages/en.json` 负责基础模板翻译。
2. `messages/biz/answerYou.en.json` 负责业务站点自己的翻译。


### 3. i18n 入口统一合并消息

在 [src/i18n.ts](/Users/funeye/IdeaProjects/answers-universe/src/i18n.ts) 中统一完成：

1. locale 校验
2. 基础翻译加载
3. 业务翻译加载
4. 深合并后交给 `next-intl`

这意味着页面和组件层不需要关心消息来自哪个文件。


## 三、阶段策略

### 第一阶段：只处理英文

项目初期，优先只处理英语。

此时只维护：

1. `messages/en.json`
2. `messages/biz/answerYou.en.json`

这一阶段的重点不是“支持很多语言”，而是：

1. 先把代码中的硬编码文案清掉。
2. 先把消息结构整理稳定。
3. 先把页面、组件、builder 的职责边界理顺。

也就是说，第一阶段本质是在做“国际化架构收口”，不是在做“多语言翻译铺量”。


### 第二阶段：网站稳定后再扩展其他语言

当网站功能和页面结构稳定后，再引入其他语言。

此时新增语言的工作应当尽量变成纯翻译工作，例如新增：

```txt
messages/zh.json
messages/biz/answerYou.zh.json
```

如果第一阶段的代码收口做得正确，那么第二阶段就不应该再改业务组件逻辑，只需要：

1. 补充对应语言的消息文件。
2. 保持同样的 namespace 结构。
3. 验证页面显示是否完整。

也就是说，多语言扩展应当是“翻译文件工作”，而不是“代码重构工作”。


## 四、推荐的代码职责边界

### 1. 页面层负责取翻译

页面层应使用服务端 `getTranslations` 获取消息，再组装为结构化 `copy` 传给客户端组件。

正确方向：

1. Page Server Component 取翻译
2. 页面层拼装 `copy`
3. Client Component 只消费 `copy`


### 2. 共享组件不直接判断语言

共享组件不应再写类似：

```ts
const isZh = locale === 'zh';
```

也不应出现：

```ts
isZh ? '中文' : 'English'
```

原因很明确：

1. 这会让组件重新耦合语言逻辑。
2. 会导致文案散落在代码里。
3. 新增语言时会迫使组件继续改代码。


### 3. 共享组件优先接收结构化 copy

例如：

1. `QuestionFormCopy`
2. `QuestionEditorCopy`
3. `QuestionImportCopy`
4. `QuestionListItemCopy`
5. `QuestionPreviewCopy`

这类结构化类型的意义是：

1. 把翻译字段从组件内部抽离出来。
2. 限制消息的传播范围。
3. 让组件只依赖自己真正需要的文案。


## 五、Builder 缓冲层规则

### 1. 必须使用 builder 作为缓冲层

翻译消息不应从页面层零散地一项项传到深层组件。

推荐做法是使用 builder，例如：

1. `buildQuestionFormCopy`
2. `buildQuestionEditorCopy`
3. `buildQuestionImportCopy`
4. `buildQuestionPreviewCopy`

这类 builder 的作用不是“多写一层”，而是建立缓冲层。

它的价值在于：

1. 防止页面层到处散落 `t('xxx')`
2. 防止底层组件知道过多 namespace 细节
3. 防止翻译字段在代码里横向扩散
4. 让消息结构的调整集中发生在 builder 中


### 2. Builder 只做消息映射，不做业务逻辑

builder 的职责应该是：

1. 从翻译 namespace 中读取字段
2. 组装为清晰的 copy 对象

不应该在 builder 中混入：

1. 复杂业务逻辑
2. 运行时状态判断
3. UI 行为分支

builder 是消息适配层，不是业务处理层。


## 六、消息结构最佳实践

### 1. 按页面或功能分组

推荐按页面或功能组织消息，例如：

1. `faqPage.questionsList`
2. `faqPage.questionsImport`
3. `faqPage.questionEdit`
4. `faqPage.questionCreate`
5. `faqPage.questionForm`
6. `faqPage.questionPreview`
7. `faqPage.questionDetail`

这样做的优点：

1. 结构足够清晰
2. 文件不会碎得太过分
3. AI 或人工维护时更容易定位


### 2. 不要把层级做得太深

不建议出现过深层级，例如：

```json
{
  "faqPage": {
    "questions": {
      "editor": {
        "preview": {
          "toolbar": {
            "buttons": {}
          }
        }
      }
    }
  }
}
```

层级过深的问题：

1. 可读性下降
2. 维护成本上升
3. 页面调整时需要频繁迁移 key

本项目更适合“页面一级 + 局部子块”这种适中的层级。


### 3. 共享字段文案单独收口

像 `questionForm` 这类可被多个页面复用的文案，应作为共享消息块单独存在。

例如：

1. import 的修复表单复用它
2. create/edit 页面复用它

这样可以保证：

1. 字段文案统一
2. 共享组件体验一致
3. 改一次即可影响所有相关页面


## 七、禁止事项

以下做法应尽量避免：

1. 在客户端组件中继续写 `isZh` 分支。
2. 直接把大量 `t('...')` 零散传入深层组件。
3. 把业务翻译继续大量追加到 `messages/en.json`。
4. 为了局部页面方便，绕过 builder 直接在组件里写硬编码文案。
5. 新增语言时顺手修改业务逻辑。


## 八、推荐工作流

### 新增页面文案

1. 先判断是基础文案还是业务文案。
2. 业务文案优先写入 `messages/biz/answerYou.en.json`。
3. 在页面层使用 `getTranslations` 获取对应 namespace。
4. 如有必要，新增或扩展 builder。
5. 通过 `copy` 传入客户端组件。


### 改造旧页面国际化

1. 先搜索 `isZh` 和硬编码字符串。
2. 把文案收口到对应 namespace。
3. 如页面存在多个共享组件，优先建立 copy builder。
4. 页面层先接好 builder，再替换组件内部硬编码。
5. 最后跑类型检查，确保没有残留分支。


### 扩展新语言

1. 复制 `messages/en.json` 为对应语言文件。
2. 复制 `messages/biz/answerYou.en.json` 为对应业务语言文件。
3. 只做翻译，不改业务代码。
4. 验证页面是否存在缺失 key。


## 九、最终原则

本项目的国际化处理，应当始终坚持以下原则：

1. 基础翻译与业务翻译分离。
2. 服务端取翻译，客户端消费结构化 copy。
3. builder 作为消息缓冲层长期保留。
4. 第一阶段先把英语与代码结构整理好。
5. 第二阶段的多语言扩展应当尽量退化为纯翻译工作。

如果后续遵守这套规则，那么国际化将不再是“每次改页面都要顺手补一堆语言判断”的负担，而会变成一套稳定、可扩展、低耦合的基础能力。
