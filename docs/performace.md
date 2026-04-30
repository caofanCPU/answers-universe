# 性能分析记录

## 1. 随机题临时止血算法

本文记录当前随机题临时止血算法的性能边界。

相关代码：

```text
apps/faq/src/lib/random-question-planner.ts
apps/faq/src/server/random-questions/random.service.ts
```

当前算法核心是 `selectBestRandomQuestionSet`。

它不是组合枚举算法，不会做类似下面这种笛卡尔积搜索：

```text
首题 x 普通题1 x 普通题2 x 普通题3 x 普通题4
```

因此它不存在组合爆炸问题。

但是它会读取所有当前可用候选题的核心字段，并在应用层完成分组、评分和排序。

当前读取字段为：

```text
id
questionUuid
asFirst
category
```

也就是说，它不会读取完整题干、答案、解释等大字段。

## 2. Generate preview 与 Analysis 的区别

`Generate preview` 和 `Analysis.New Days` 使用的是同一套止血算法。

区别不在算法核心，而在调用次数。

### 2.1 Generate preview

`Generate preview` 只生成下一组题。

流程可以理解为：

```text
查询所有可用首题
查询所有可用普通题
调用 selectBestRandomQuestionSet 一次
返回 1 组题
```

因此它只跑一次 planner。

### 2.2 Analysis.New Days

`Analysis.New Days` 用同一个 planner 做内存模拟。

流程可以理解为：

```text
查询所有可用题
拆成首题池和普通题池
调用 selectBestRandomQuestionSet 生成第 1 组
从内存池移除这组题
调用 selectBestRandomQuestionSet 生成第 2 组
继续循环
直到不能再生成完整题组
```

因此它可能跑很多次 planner。

如果剩余 100000 道题，且每组 5 道题，理论上最多可能接近 20000 轮模拟。

所以性能风险主要在 `Analysis.New Days`，不是单次 `Generate preview`。

## 3. 单次 planner 的主要成本

定义：

```text
F = 可用首题数量
M = 可用普通题数量
C = 分类数量，当前业务约 12 个
K = 每组普通题数量，当前为 targetCount - 1
```

单次 planner 大致包含：

```text
按分类分组首题：O(F)
按分类分组普通题：O(M)
枚举每一道首题：O(F)
对首题候选评分并排序：O(F log F)
```

分类数量 `C` 很小，所以分类层面的计算不是主要问题。

真正影响 CPU 的是：

```text
1. 可用首题数量 F
2. 可用普通题数量 M
3. 当前实现按“每一道首题”枚举，而不是按“首题分类”枚举
4. 当前实现会在选择普通题时对分类桶做稳定排序，重复调用时会产生额外成本
```

因此：

```text
普通题很多、首题很少：主要成本是 DB 拉取和内存分组。
首题很多：CPU 成本会上升明显。
某个普通题分类特别大：重复排序分类桶会造成浪费。
```

## 4. 数据库压力判断

当前查询只拉核心字段，并且可通过索引支持筛选：

```text
deleted
asFirst
category
id
```

数据库侧不是最主要风险。

但是当候选题达到 100000 级别时，即使 SQL 执行很快，仍然会有以下应用层成本：

```text
1. 大量行从 DB 传输到应用服务
2. Prisma 构造大量 JS 对象
3. Node 进程内存占用上升
4. planner 在 Node 中做分组、排序和循环模拟
```

所以不能只看 SQL 执行计划。

SQL 很快不代表接口整体一定快。

## 5. 10 万级数据下的风险

### 5.1 Generate preview

单次 `Generate preview` 没有组合爆炸。

在 100000 级别候选题下，它的风险主要是：

```text
1. 一次性拉取候选题较多
2. 首题数量过大时，按首题逐条枚举和排序会变慢
3. Node 内存和 CPU 会有明显消耗
```

整体风险低于 `Analysis.New Days`。

### 5.2 Analysis.New Days

`Analysis.New Days` 风险更高。

原因是它会连续多轮调用 planner，直到模拟不能再生成完整题组。

如果候选题很多，它可能产生大量循环。

例如：

```text
剩余题数：100000
每组题数：5
理论最大组数：20000
```

这种情况下，如果不加保护，`Analysis.New Days` 可能导致：

```text
1. 接口响应时间过长
2. Node CPU 长时间占用
3. 请求超时
4. 服务并发能力下降
5. 多个用户或自动刷新触发时形成连锁压力
```

## 6. 当前结论

当前止血算法本身是可接受的。

它解决的是首题选择不当导致题组生成失败的问题。

它不是精确全局最优算法，但已经明显优于旧的“先随机选首题，再补普通题”的方式。

性能层面的结论是：

```text
1. 算法没有笛卡尔积爆炸。
2. Generate preview 只跑一次 planner，风险相对可控。
3. Analysis.New Days 会重复模拟很多轮，是主要风险点。
4. 10 万级候选题下，不能无保护地在线实时模拟到题库耗尽。
```

## 7. 建议的保护措施

如果暂时不升级算法，建议至少做以下保护。

### 7.1 限制 Analysis 最大模拟天数

给 `Analysis.New Days` 增加最大模拟上限。

例如：

```text
最多模拟 365 组
```

这样可以把风险从：

```text
一直模拟到题库耗尽
```

降低为：

```text
最多调用 planner 365 次
```

返回语义建议：

```text
estimatedNewDays = 365
estimatedNewDaysCapped = true
```

前端可以显示为：

```text
365+
```

如果结果小于上限，表示确实只能生成这么多组。

如果结果等于上限，表示至少还能生成这么多组，但没有继续向后模拟。

### 7.2 降低 Analysis 调用频率

`Analysis` 不应高频自动刷新。

建议：

```text
1. 只在用户点击 Analysis 时加载。
2. 对接口结果增加短缓存，例如 30 秒或 60 秒。
3. 保存题组后再主动刷新。
```

### 7.3 后续可选的小优化

这些优化不改变止血算法的业务语义，只优化实现成本。

可选方向：

```text
1. 普通题分类桶预先稳定排序一次，避免在每个首题候选里重复排序。
2. 首题按分类先选代表候选，减少按每一道首题枚举的成本。
3. 单次 preview 不一定拉完所有普通题 ID，可以按分类取足够候选。
4. Analysis 可以只使用分类库存计数做粗筛，再必要时进入 planner 模拟。
```

这些不是当前必须项。

短期最重要的是给 `Analysis.New Days` 加最大模拟上限。
