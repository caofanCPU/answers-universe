# 题库基础列表外部接口文档

本文档对应接口实现文件：[route.ts](/Users/zhch/Oversea/answers-universe/src/app/api/outer/questions-base/route.ts)。

## 1. 接口说明

- 接口路径：`/api/outer/questions-base`
- 请求方法：`GET`
- 接口用途：按条件查询题库基础信息列表，返回分页结果
- 排序规则：固定按 `updatedAt` 倒序返回
- 数据范围：仅返回未删除数据

## 2. 鉴权方式

调用该接口时，必须同时传以下请求头：

- `Authorization: Bearer <token>`
- `x-outer-identity-provider: <identityProvider>`

说明：

- `Authorization` 必须使用 Bearer Token 格式
- `x-outer-identity-provider` 必须与服务端配置的身份提供方完全匹配
- 任一请求头缺失、格式错误、或 token/identityProvider 不匹配时，接口返回 `401`

示例：

```bash
curl --request GET 'https://your-domain.com/api/outer/questions-base?page=1&pageSize=20' \
  --header 'Authorization: Bearer your-token' \
  --header 'x-outer-identity-provider: your-provider'
```

## 3. Query 参数

所有参数都通过 URL Query String 传递。

| 参数名 | 类型 | 必填 | 默认值 | 说明 |
| --- | --- | --- | --- | --- |
| `page` | number | 否 | `1` | 页码，最小值 `1` |
| `pageSize` | number | 否 | `20` | 每页数量，范围 `1-100` |
| `ids` | string | 否 | - | 按题目 ID 批量过滤，支持英文逗号 `,`、中文逗号 `，`、竖线 `|` 分隔，如 `1,2,3` |
| `uuids` | string | 否 | - | 按题目 UUID 批量过滤，支持 `,` / `，` / `|` 分隔 |
| `asFirst` | boolean | 否 | - | 是否为首题，支持 `true` / `false` / `1` / `0` |
| `category` | string | 否 | - | 题目大类，必须是枚举值之一 |
| `subCategory` | string | 否 | - | 题目子类，必须是枚举值之一 |
| `difficulty` | string | 否 | - | 难度，必须是枚举值之一 |
| `createdAtFrom` | string | 否 | - | 创建时间起始，传可被 JS `Date` 解析的日期或时间字符串 |
| `createdAtTo` | string | 否 | - | 创建时间结束，传可被 JS `Date` 解析的日期或时间字符串 |
| `updatedAtFrom` | string | 否 | - | 更新时间起始，传可被 JS `Date` 解析的日期或时间字符串 |
| `updatedAtTo` | string | 否 | - | 更新时间结束，传可被 JS `Date` 解析的日期或时间字符串 |

### 3.1 枚举值

`difficulty` 可选值：

- `easy`
- `medium`
- `hard`

`category` 可选值：

- `Science & Nature`
- `Tech & Innovation`
- `Pop Culture`
- `Lifestyle & Fun`
- `Geography`
- `History`
- `Sports`
- `Music`
- `Sociology`
- `Art & Culture`
- `General Knowledge`
- `Food & Drink`
- `Psychology`
- `Linguistics`
- `Environment & Climate`
- `Business & Economics`
- `Architecture`

`subCategory` 可选值：

- `animal`
- `movie`
- `science`
- `car`
- `soccer`
- `chemistry`

### 3.2 日期参数说明

- `createdAtFrom` 和 `updatedAtFrom` 会被自动归一化到当天 `00:00:00.000 UTC`
- `createdAtTo` 和 `updatedAtTo` 会被自动归一化到当天 `23:59:59.999 UTC`
- 如果 `createdAtFrom > createdAtTo`，返回 `400`
- 如果 `updatedAtFrom > updatedAtTo`，返回 `400`

### 3.3 过滤逻辑说明

- 所有筛选条件之间是“且”关系
- `ids` 表示 `id IN (...)` 查询，例如传 `ids=1,2,3`，会返回数据库中 `id` 属于 `1`、`2`、`3` 的全部记录
- `uuids` 表示 `uuid IN (...)` 查询，例如传多个 UUID，会返回数据库中命中的全部记录
- 如果传了 `ids` 和 `uuids`，则两个条件同时生效，等价于 `id IN (...) AND uuid IN (...)`
- 因此，`ids=1,2,3` 且数据库中存在 `1`、`2`、`3`，会返回 3 条；如果只存在 `1`、`2`，会返回 2 条，不会只返回 1 条

## 4. 响应结构

成功时返回 `200 OK`，响应体结构如下：

```json
{
  "items": [
    {
      "id": "10001",
      "uuid": "7e8d0a1d-2d31-4c0a-8c51-5e1a5d9f7b01",
      "question": "What is the chemical symbol for water?",
      "category": "Science & Nature",
      "subCategory": "chemistry",
      "difficulty": "easy",
      "asFirst": true,
      "createdAt": "2026-03-01T10:00:00.000Z",
      "updatedAt": "2026-03-20T08:30:00.000Z"
    }
  ],
  "pagination": {
    "page": 1,
    "pageSize": 20,
    "total": 1,
    "totalPages": 1
  }
}
```

### 4.1 `items` 字段说明

| 字段名 | 类型 | 说明 |
| --- | --- | --- |
| `id` | string | 题目主键 ID，服务端会将 bigint 转成字符串返回 |
| `uuid` | string | 题目 UUID |
| `question` | string | 题干 |
| `category` | string | 题目大类 |
| `subCategory` | string \| null | 题目子类 |
| `difficulty` | string | 难度 |
| `asFirst` | boolean | 是否为首题 |
| `createdAt` | string \| null | 创建时间，ISO 8601 字符串 |
| `updatedAt` | string \| null | 更新时间，ISO 8601 字符串 |

### 4.2 `pagination` 字段说明

| 字段名 | 类型 | 说明 |
| --- | --- | --- |
| `page` | number | 当前页码 |
| `pageSize` | number | 当前每页数量 |
| `total` | number | 符合条件的总记录数 |
| `totalPages` | number | 总页数，计算方式为 `Math.ceil(total / pageSize)` |

## 5. 错误响应

### 5.1 401 未授权

```json
{
  "error": "UNAUTHORIZED"
}
```

触发场景：

- 缺少 `Authorization`
- 缺少 `x-outer-identity-provider`
- `Authorization` 不是 `Bearer <token>` 格式
- token 或 identityProvider 校验失败
- 服务端未配置对应外部接口凭证

### 5.2 400 请求参数错误

```json
{
  "error": "INVALID_REQUEST",
  "details": {
    "formErrors": [],
    "fieldErrors": {
      "pageSize": [
        "Number must be less than or equal to 100"
      ]
    }
  }
}
```

常见触发场景：

- `page < 1`
- `pageSize > 100`
- `ids` 中包含非正整数
- `asFirst` 不是合法布尔值
- `category` / `subCategory` / `difficulty` 不是合法枚举值
- 日期格式无法解析
- 开始时间晚于结束时间

### 5.3 500 服务端错误

```json
{
  "error": "INTERNAL_SERVER_ERROR"
}
```

## 6. 调用示例

### 6.1 按分页查询

```bash
curl --request GET 'https://your-domain.com/api/outer/questions-base?page=1&pageSize=20' \
  --header 'Authorization: Bearer your-token' \
  --header 'x-outer-identity-provider: your-provider'
```

### 6.2 按多个 ID 查询

```bash
curl --request GET 'https://your-domain.com/api/outer/questions-base?ids=10001,10002,10003' \
  --header 'Authorization: Bearer your-token' \
  --header 'x-outer-identity-provider: your-provider'
```

### 6.3 按条件组合查询

```bash
curl --request GET 'https://your-domain.com/api/outer/questions-base?page=1&pageSize=50&category=Science%20%26%20Nature&difficulty=easy&asFirst=true&updatedAtFrom=2026-03-01&updatedAtTo=2026-03-31' \
  --header 'Authorization: Bearer your-token' \
  --header 'x-outer-identity-provider: your-provider'
```

## 7. 接入建议

- `id` 是字符串类型，客户端不要按 JavaScript Number 处理超大整数
- `category` 中包含空格和 `&`，拼接 URL 时应进行 URL Encode
- 如果需要稳定翻页，建议固定传 `page` 和 `pageSize`
- 如果只是同步增量数据，优先使用 `updatedAtFrom` / `updatedAtTo`
