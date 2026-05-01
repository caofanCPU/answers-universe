# Questions SDK 接入说明

本文档用于说明 FAQ Base 对第三方业务方开放的只读题目能力 `v1` 接入规范。

注意，这不是传统意义上的 HTTP 接口开放文档。对外接入的唯一允许方式是：

- 通过 `@windrun-huaiin/faq-sdk` 调用

不允许的方式：

- 业务方自行拼接 HTTP 请求直调 `/api/outer/v1/*`
- 业务方自行实现签名逻辑
- 业务方绕过 SDK 自己控制分批、并发、验签协议

换句话说，`outer` 路由是 SDK 的服务端承载层，不是面向第三方直接公开的裸 HTTP 协议。

相关文档：

- [Client-Auth.design.md](/Users/funeye/IdeaProjects/answers-universe/docs/Client-Auth.design.md)
- [README.md](/Users/funeye/IdeaProjects/answers-universe/README.md)

## 1. 设计目标

FAQ Base 是题目生成、编辑、导入、存储的唯一数据真源。

第三方业务项目的职责是消费题目，而不是参与题库写入。因此对外能力被收敛为：

- 只读
- 可版本化
- 强制签名鉴权
- 强制通过 SDK 使用

该设计的目标有三点：

1. 让接入方只关心“配置 + 函数调用”，不关心底层签名协议。
2. 让服务端保留平滑升级鉴权、DTO、缓存链路和路由结构的空间。
3. 让题目读取主链路保持稳定，避免业务方各自实现一套不一致的调用逻辑。

## 2. 唯一接入方式

外部业务系统接入 FAQ Base 时，必须通过 SDK：

- 包名：`@windrun-huaiin/faq-sdk`

不允许 HTTP 直调的原因很明确：

- 服务端鉴权协议会持续演进，SDK 是唯一受控入口
- `ids` 分组、并发、去重、超时控制需要统一
- 错误格式、返回模型、版本切换需要统一
- 一旦放开直调，后续协议升级会被外部实现绑死

因此本项目的立场是：

- `outer` API 只对 SDK 开放
- 业务接入文档只提供 SDK 用法
- 联调时如需查看 HTTP 细节，仅限本项目内部排查，不作为对外协议承诺

## 3. 版本机制

当前对外版本为 `v1`。

版本同时存在于两层：

- Route：`/api/outer/v1/...`
- SDK：`client.v1.*`

SDK 初始化时也带版本配置：

```ts
version?: 'v1'
```

当前默认值就是 `v1`。

后续如果出现以下情况，需要考虑升级到 `v2`：

- DTO 出现不兼容变更
- SDK 的默认行为发生不兼容变化
- 鉴权签名协议变化
- 路由语义变化

在 `v1` 生命周期内，只允许做兼容增强，不允许破坏既有字段语义。

## 4. 使用方需要准备什么

业务方接入前，需要先在 FAQ Base 后台创建一个 `client`，平台会为其签发一组可用于 SDK 的凭证。

业务方最终需要持有以下配置：

- `baseUrl`
- `clientId`
- `keyVersion`
- `publicKey`
- `privateKey`
- `version`

其中，真正必填且必须来自平台下发的凭证字段是：

- `clientId`
- `keyVersion`
- `publicKey`
- `privateKey`

### 4.1 推荐环境变量

推荐业务方以环境变量方式保存配置。

示例：

```env
WINDRUN_HUAIIN_FAQ_BASE_URL=https://your-faq-base-domain.com
WINDRUN_HUAIIN_FAQ_CLIENT_ID=client_xxxxxxxxxxxx
WINDRUN_HUAIIN_FAQ_KEY_VERSION=v1
NEXT_PUBLIC_WINDRUN_HUAIIN_FAQ_PK=pk_test_xxxxxxxxxxxx
WINDRUN_HUAIIN_FAQ_SK=sk_test_xxxxxxxxxxxx
WINDRUN_HUAIIN_SDK_DEBUG=false
```

生产环境使用同一组变量名，只替换变量值：

```env
NEXT_PUBLIC_WINDRUN_HUAIIN_FAQ_PK=pk_live_xxxxxxxxxxxx
WINDRUN_HUAIIN_FAQ_SK=sk_live_xxxxxxxxxxxx
```

说明：

- `publicKey` 可以放前端可见环境变量命名形式，但 SDK 实际建议仅在服务端使用
- `privateKey` 必须只放服务端环境变量
- 业务方不应把 `privateKey` 注入到浏览器侧

### 4.2 配置项含义

#### `baseUrl`

FAQ Base 服务地址，例如：

```txt
https://your-faq-base-domain.com
```

SDK 内部会自动处理尾部斜杠。

#### `clientId`

平台生成的客户端标识，格式固定为：

```txt
client_xxx
```

业务方不需要自行生成。

#### `keyVersion`

平台签发 key 时对应的版本号。服务端会通过 `clientId + keyVersion` 查找有效公钥。

#### `publicKey`

平台签发的公钥字符串，格式为 `pk_test_xxx` / `pk_live_xxx`。

#### `privateKey`

平台签发的私钥字符串，格式为 `sk_test_xxx` / `sk_live_xxx`。

### 4.3 缓存链路相关环境变量

这一节主要是 FAQ Base 服务端自身联调和部署时需要关注的环境变量，不是第三方业务方初始化 SDK 时必须传入的字段。

当前缓存链路至少涉及以下配置：

- `NEXT_PUBLIC_QSTASH_CACHE_TASK_URL`
- `WINDRUN_HUAIIN_FAQ_OUTER_CACHE_ENABLED`
- `WINDRUN_HUAIIN_FAQ_OUTER_CACHE_TTL_DAYS`
- `QSTASH_TOKEN`
- `QSTASH_CURRENT_SIGNING_KEY`
- `QSTASH_NEXT_SIGNING_KEY`

#### `NEXT_PUBLIC_QSTASH_CACHE_TASK_URL`

QStash 投递缓存任务时使用的完整回调地址。

示例：

```env
NEXT_PUBLIC_QSTASH_CACHE_TASK_URL=https://your-domain.com/api/internal/questions/cache/rebuild
```

当前题目缓存链路只需要这 `1` 个回调地址。

它负责两类事情：

- 重建单题详情缓存
- 删除单题详情缓存

#### `WINDRUN_HUAIIN_FAQ_OUTER_CACHE_ENABLED`

控制 outer 题目缓存链路是否启用。

示例：

```env
WINDRUN_HUAIIN_FAQ_OUTER_CACHE_ENABLED=false
```

说明：

- 只有配置为 `true` 时才启用缓存。
- 未配置或其他值都视为关闭。
- 关闭时 outer ids 查询直接走 DB，不读 Redis。
- 关闭时不会投递 QStash 缓存重建任务。
- 关闭时 QStash rebuild 回调即使被历史消息触发，也不会写 Redis。
- 开发环境建议保持 `false`，避免消耗 Upstash 调用次数和存储。
- 生产环境可根据成本、性能和命中率观察结果决定是否开启。

#### `WINDRUN_HUAIIN_FAQ_OUTER_CACHE_TTL_DAYS`

控制 outer 单题详情缓存 TTL，单位是天。

示例：

```env
WINDRUN_HUAIIN_FAQ_OUTER_CACHE_TTL_DAYS=30
```

说明：

- 未配置时默认 `30` 天。
- 只接受正整数天数。
- 非法值、`0` 或负数都会回退到默认 `30` 天。

#### `QSTASH_TOKEN`

FAQ Base 服务端向 QStash 发布消息时使用的 token。

如果没有这个配置：

- 写后缓存重建任务不会投递
- 读 miss 后的异步缓存恢复也不会投递

#### `QSTASH_CURRENT_SIGNING_KEY` 与 `QSTASH_NEXT_SIGNING_KEY`

FAQ Base 内部 webhook 在接收 QStash 回调时，用于验签。

当前内部回调路由是：

```txt
/api/internal/questions/cache/rebuild
```

如果这两个签名 key 没有配置，内部 webhook 无法完成 QStash 请求验签。

#### 联调建议

本地或测试环境联调缓存链路时，建议最少确认以下几点：

1. `WINDRUN_HUAIIN_FAQ_OUTER_CACHE_ENABLED=true`，确认当前环境确实需要启用缓存。
2. `NEXT_PUBLIC_QSTASH_CACHE_TASK_URL` 指向当前 FAQ 服务可访问地址。
3. `WINDRUN_HUAIIN_FAQ_OUTER_CACHE_TTL_DAYS` 已按环境成本和命中率预期配置；不配置时默认 `30` 天。
4. `QSTASH_TOKEN` 已配置，确保服务端可以成功发布任务。
5. `QSTASH_CURRENT_SIGNING_KEY` 和 `QSTASH_NEXT_SIGNING_KEY` 已配置，确保 webhook 可以验签。
6. Redis 配置已可用，否则即使任务成功执行，也无法真正落缓存。

## 5. SDK 初始化

安装：

```bash
pnpm add @windrun-huaiin/faq-sdk
```

初始化示例：

```ts
import { createAnswersUniverseClientFromEnv } from '@windrun-huaiin/faq-sdk';

const faqClient = createAnswersUniverseClientFromEnv();
```

SDK 初始化完成后，统一从 `v1` 命名空间下访问能力：

```ts
faqClient.v1.questionsBase
```

## 6. 业务方如何使用

当前 `v1` 主要提供两类能力：

- 按 ids 批量读取完整题目详情

### 6.1 按 ids 批量获取

这是业务方的主调用方式，也是推荐方式。

```ts
const result = await faqClient.v1.questionsBase.getByIds([
  '123',
  '456',
  '789',
]);

console.log(result.items);
```

SDK 内部会自动完成：

1. 去重
2. 过滤空字符串
3. 使用 `POST` body 发送 `{ ids }`
4. 签名鉴权

业务方不应该自行拼接 HTTP 请求或实现签名协议。

当前返回结果就是一组 `items`，不再附带分页结构，因为：

- `Outer` 现在只支持按 `ids` 读取
- 单次请求规模和服务端执行策略由 FAQ Base 的 outer route 进入内部 service 后统一控制

```ts
type OuterQuestionBaseResult = {
  items: OuterQuestionBaseItemDto[];
};
```

`OuterQuestionBaseItemDto` 当前等价于完整题目详情 DTO，包含答案、解析、图片、tags、keywords 等字段。

### 6.1.1 大批量 ids 的实际处理流程

业务方传递批量 `ids` 时，职责边界如下：

1. 业务方只调用 `faqClient.v1.questionsBase.getByIds(ids)`，不自行拆批、不自行控制并发。
2. SDK 对 `ids` 做去重和空字符串过滤，然后用一次 `POST` body 请求发送给 FAQ Base。
3. FAQ Base outer route 完成签名鉴权和参数解析。
4. FAQ Base 内部 questions service 对 `ids` 做统一分批和限并发处理。
5. 当前每批 `100` 个 `id`，批次并发数为 `3`。
6. 最终结果会按请求 `ids` 的顺序重新合并后返回。

这里的分批限并发是服务端执行策略，不依赖业务方，也不在 SDK 内部实现。

### 6.2 保留 query 形态

SDK 仍然保留了对象参数形态的 `query` 方法，但当前它只接受 `ids`：

```ts
const result = await faqClient.v1.questionsBase.query({
  ids: ['123', '456'],
});
```

保留这个对象形态的原因不是为了继续支持复杂筛选，而是为了给后续协议扩展保留签名。

`query({ ids })` 和 `getByIds(ids)` 走同一套底层逻辑，都会使用 `POST` body。

当前 `v1` 的明确结论是：

- `Outer` 查询只支持 `ids`
- 不支持分页参数
- 不支持 `category / difficulty / asFirst / 时间范围 / uuids` 等筛选参数

不要把 FAQ Base 当成第三方业务侧的复杂搜索平台。

### 6.3 单题读取

如果只需要一个题目，也统一走：

```ts
const result = await faqClient.v1.questionsBase.getByIds(['123']);
const item = result.items[0] ?? null;
```

## 7. 为什么主推 ids 批量查询

这一点需要明确写死，因为它会直接影响 SDK、缓存和接口稳定性。

主推 `ids` 的原因：

- 业务语义最稳定
- 最适合做题目 `id` 级别缓存
- 容易控制查询规模
- 更容易做服务保护

因此对外能力的核心不是“开放复杂检索语义”，而是“给业务方一个稳定的按题目集合取数能力”。

## 8. 缓存链路说明

Redis 缓存主要服务 `outer` 读链路，而不是内部后台列表查询。

链路边界：

- 内部管理查询：直接走 DB
- 对外只读查询：优先建设 Redis 缓存

### 8.1 缓存粒度

一期缓存粒度明确为：

- 题目 `id` 级别

不做的事情：

- 不做列表查询缓存
- 不做复杂筛选条件缓存
- 不做组合 query key 缓存

### 8.2 读链路

对外详情读取时：

1. 先查 Redis
2. 命中则直接返回 DTO
3. miss 则回源 DB
4. 先把 DB 结果返回
5. 再异步投递缓存重建任务

这条链路的目标是：

- 保证读取稳定
- 不让同步写缓存拖慢读请求

对外 `questionsBase` 的纯 `ids` 查询会先进入统一的分批限并发执行策略。缓存只影响每批内部是先读 Redis 还是直接回源 DB，不影响是否分批。

当前实现方式是：

1. 按 ids 分组，每批 `100` 个 `id`
2. 批次限并发执行，当前并发数为 `3`
3. 缓存开启时，每批先用 Redis `mget` 批量读取缓存
4. 缓存 miss 的部分在该批内回源 DB
5. 缓存关闭时，每批直接回源 DB，不会把全部 ids 一次性放进单个 DB 查询
6. 按请求 ids 顺序合并完整题目 DTO
7. 缓存开启时，返回结果后异步投递缓存重建任务

当前 Redis 读取使用批量 `mget` 能力。缓存关闭时仍然保留分批和限并发，避免大 ids 请求把压力集中到单个 DB 查询。

### 8.3 写后构建链路

创建、更新、导入题目后，不要求同步写 Redis，而是通过 QStash 异步触发缓存构建。

也就是说：

- 写入成功
- 投递异步任务
- 后台重建该题目 `id` 对应缓存

这与 SDK 的主使用方式是匹配的，因为 SDK 主推按 `ids` 批量取题，底层缓存天然就应该是题目粒度。

## 9. DTO 与 contracts

FAQ Base 对外暴露的数据模型，统一来自 contracts 包。

当前相关包：

- `@windrun-huaiin/faq-contracts`
- `@windrun-huaiin/faq-sdk`

其中：

- `contracts` 负责稳定的数据类型与协议结构
- `sdk` 负责接入方调用体验、签名、请求控制、错误处理

SDK 已直接 re-export `contracts` 的 `outer/v1` 类型，业务方可以直接复用：

```ts
import type { OuterQuestionBaseItemDto } from '@windrun-huaiin/faq-sdk';
```

这意味着：

- 使用方不需要自己重新定义一套 DTO
- FAQ Base 内部和业务方消费的 DTO 语义保持统一

## 10. 鉴权说明

SDK 会自动为每个请求生成签名头，业务方不需要自己拼接。

当前请求头核心包括：

- `x-au-client-id`
- `x-au-key-version`
- `x-au-timestamp`
- `x-au-nonce`
- `x-au-signature`

服务端会做以下校验：

- 根据 `clientId + keyVersion` 查找有效公钥
- 校验签名
- 校验时间窗口
- 校验 Redis nonce 防重放

因此对业务方的要求只有两条：

1. 正确配置平台下发的 `clientId / keyVersion / publicKey / privateKey`
2. 只通过 SDK 调用

### 10.1 调试签名和耗时

本地联调或排查慢请求时，可以临时开启：

```env
WINDRUN_HUAIIN_SDK_DEBUG=true
```

该开关会同时影响 SDK 和 FAQ Base outer 服务端日志：

- SDK 侧会输出签名 payload、请求路径、HTTP 状态、请求耗时、请求/响应 body 字节数。
- FAQ Base 服务端会输出验签 payload、签名校验信息。
- `questionsBase.getByIds(ids)` 会输出服务端分批执行耗时，包括批次数、批大小、并发数、缓存是否开启、Redis cache 耗时、DB 回源耗时、命中/未命中数量、最终返回数量和总耗时。

不要在生产环境长期开启该变量；它用于临时定位签名、网络、Redis 和 DB 查询耗时问题。

## 11. QuickStart

```mermaid
flowchart TD
    A[业务方在 FAQ Base 后台创建 client] --> B[平台返回 client_id / key_version / pk_xxx / sk_xxx]
    B --> C[业务方写入服务端环境变量]
    C --> D[初始化 @windrun-huaiin/faq-sdk]
    D --> E[调用 client.v1.questionsBase.getByIds(ids)]
    E --> F[SDK 自动去重 / POST body / 签名]
    F --> G[服务端校验签名与 Redis nonce]
    G --> H[Outer Route 读取 DTO]
    H --> I{Redis 命中?}
    I -- Yes --> J[直接返回 DTO]
    I -- No --> K[回源 DB]
    K --> L[返回 DTO]
    L --> M[QStash 异步重建缓存]
```

## 12. 明确约束

这一章是硬约束，不是建议。

### 12.1 对业务方

- 必须通过 `@windrun-huaiin/faq-sdk` 调用
- 不允许 HTTP 直调 `outer` 路由
- 不允许自行实现签名协议
- 不允许绕过 SDK 自行拼接请求

### 12.2 对 FAQ Base 自身

- 对外能力以 SDK 为唯一接入面
- DTO 必须保持版本稳定
- 大批量 ids 的执行策略由 outer route 后面的 FAQ Base 内部 service 控制
- 内部 service 必须在缓存开启和关闭时都保留分批、限并发查询
- 缓存粒度继续保持题目 `id` 级别
- 后续协议升级优先通过 SDK 向外平滑演进

## 13. 当前 v1 能力边界

当前文档对应的 `v1` 能力边界是：

- SDK 初始化
- `questionsBase.getByIds(ids)`
- `questionsBase.query(params)`
- 服务端签名鉴权
- Redis `id` 级别缓存
- QStash 异步缓存构建

暂不在 `v1` 承诺的内容：

- 面向业务方的复杂搜索 DSL
- 条件组合缓存
- 允许跳过 SDK 的 HTTP 对外协议
