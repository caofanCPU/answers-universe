# Answer-Universe产品说明书

## 核心功能

- 生题
- 一审录题
- 二审用题
- 题目缓存
- 查询API

### 生题规则
- 分类
- 难度
- 首发标签
- 其他标签
- 图片url
- 图库目录
- 输出格式
  * JSON(利于阅读处理)
  * 再用jq转csv(利于导入数据库)

### 一题录题规则
- JSON解析
- 重复题识别检出(难点)
- 编辑修改

### 二审用题规则
- 编辑修改
- 固定分组模式，5道/组(支持配置)
  * 1th，首发标签，category-A
  * 2nd，非首发标签 and 非 category-A，category-B
  * 3rd，非首发标签 and 非 (category-A 和 category-B)，category-C
  * 4th，非首发标签 and 非 (category-A 和 category-B 和 category-C)，category-D
  * 5th，非首发标签 and 非 (category-A 和 category-B 和 category-C 和 category-D)，category-E
  * 并且1-5道题都不能和已有的使用题目ids重复
  * 这里的算法如何处理，考虑程序简化与SQL查询性能，如何优化算法处理
  * 边界条件如何处理，例如题目池处于枯竭状态，达不到5道新题目了
- 随机分组模式，10道/组
  * 根据 分类 和 难度 两个条件筛选，随机选择10道结果
  * 不足的怎么处理？

### 题目缓存
- 存储题目数据，map结构，「id, 题目明细JSON串」，这样支持单id单点查和多id批量查
- 题目数据更新也要更新缓存，将修改信息发到消息队列，再消费，是否有类似的直接同步感知钩子？

### 查询API
- token/webhook鉴权机制
- 根据id批量拉取题目数据
- 分页查询

