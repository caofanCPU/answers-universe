# 通用日历与范围选择组件设计

## 1. 设计目标

当前随机题页面的日历不应继续作为页面内部实现存在。

它需要抽象成一组通用日历能力，覆盖两类场景：

```text
1. 简单范围筛选：例如题目列表 createdAtFrom / createdAtTo。
2. 复杂业务日历：例如随机题按日期生成 plan、逐日审查、单日或批量提交。
```

这两类场景共享日期选择交互，但不共享业务工作流。

因此组件必须拆分，避免简单筛选场景引入完整业务日历。

## 2. 组件拆分

建议分三层：

```text
DateRangePickerCore
  只负责日期范围选择交互。
  不包含业务状态、审查状态、提交按钮。

DateRangeField
  表单字段封装。
  用于筛选场景，最终只输出 startDate / endDate。

RichCalendarView
  通用增强日历视图。
  支持 single / range、activeDate、dayStates、月历视图、滑动范围视图。

RandomCalendarPlanner
  随机题专用组合层。
  负责 plan / review / commit 等业务行为。
```

依赖方向：

```text
DateRangeField -> DateRangePickerCore
RichCalendarView -> DateRangePickerCore
RandomCalendarPlanner -> RichCalendarView
```

## 3. 数据模型边界

范围拖动、滑动、hover 都只是交互过程。

业务层最终只应拿到明确结果：

```ts
type DateRangeValue = {
  startDate: string | null;
  endDate: string | null;
};
```

组件内部可以维护拖动过程状态，但不要泄漏给业务层：

```ts
type DragState = {
  dragging: boolean;
  anchorDate: string | null;
  hoverDate: string | null;
};
```

随机题场景还需要区分：

```text
range      = 当前批量操作范围
activeDate = 当前正在查看或审查的日期
```

例如：

```text
range: 2026-01-10 到 2026-03-15
activeDate: 2026-02-03
```

点击范围内某天应切换 activeDate，不应改变范围。

## 3.1 random 场景交互语义

random 场景必须拆成两条独立交互链路：

```text
1. 范围行为：用户通过滑动弹窗确定 startDate / endDate。
2. 单日行为：用户在日历视图中点击某一天查看该日题组详情。
```

两者不能复用同一个接口语义。

### 范围行为

滑动弹窗只是一个范围确定器。

弹窗内所有拖动、滚动、快捷范围都只是过渡态。

用户点击确认后，业务语义是：

```text
我已经确定一个日期范围，请基于这个范围生成 planned preview 数据。
```

这一步对应的是一次明确的后端请求，不是本地拼装，不是单日详情请求。

返回结果应该是：

```ts
type PlannedRangeResult = {
  startDate: string;
  endDate: string;
  requestedDays: number;
  plannedDates: Array<{
    showDate: string;
    planId: string;
    canCommit: boolean;
    stats: ...;
    items: ...;
    messages: string[];
  }>;
};
```

前端拿到这个结果后：

```text
1. 把 plannedDates 标记到日历视图上，显示橙点。
2. 选中第一个 planned date 作为当前 activeDate。
3. 右侧展示该 activeDate 对应的 planned preview 详情。
```

### 单日行为

日历视图点击某一天时，先判断该日期是否有状态。

只有以下两类日期允许继续取详情：

```text
saved   = 绿点
planned = 橙点
```

交互语义如下：

```text
点击绿点：请求已保存题组详情。
点击橙点：读取或请求 planned 题组详情。
点击空日期：只切换 activeDate，不请求详情。
```

这里要强调：

```text
单日点击不是生成 planned 的入口。
范围确认才是生成 planned preview 的入口。
```

## 3.2 random 场景后端接口职责

random 场景接口需要按职责分层，不能让 analysis 同时负责统计、预览、详情三件事。

推荐语义如下：

### `GET /api/random-questions/analysis`

职责：

```text
返回全局统计与已保存日期摘要。
```

它只负责：

```text
1. 已生成日期列表（用于日历绿点）
2. total / used / remain / available first / estimated new days
3. category inventory
```

它不负责：

```text
1. 某个范围内的 planned preview
2. 某一天的题组详情
```

### `POST /api/random-questions/plan-range`

职责：

```text
根据 startDate / endDate 生成该范围对应的 planned preview 数据。
```

它是范围确认后的唯一请求。

返回结果中的 `plannedDates` 由后端直接给出 `showDate` 绑定结果，这样前端只负责展示，不再自行拼接日期。

### `GET /api/random-questions?showDate=YYYY-MM-DD`

职责：

```text
获取某一天已保存题组详情。
```

只用于绿点日期。

### `POST /api/random-questions/preview`

职责：

```text
获取某一个指定日期的 planned preview。
```

这个接口只保留给“单日生成 preview”场景。

如果页面设计决定后续完全以范围弹窗作为 planned 入口，那么它可以继续保留，但不是主路径。

## 4. 日期状态语义

日期单元格至少有三类状态维度：

```text
1. selected / active：当前正在查看或操作哪一天。
2. range：当前范围选择覆盖哪些日期。
3. businessState：这一天在业务中处于什么状态。
```

它们必须可叠加，不能互相覆盖。

不要写成：

```text
isSelected ? selectedStyle : isSaved ? savedStyle : normalStyle
```

应该按维度组合：

```text
baseStyle
+ activeStyle
+ rangeStyle
+ businessStateStyle
+ monthScopeStyle
```

核心类型只需要表达语义，不绑定 random 字段：

```ts
type CalendarDayState = {
  date: string;
  businessState?: 'saved' | 'planned' | 'warning' | 'conflict';
  progress?: 'idle' | 'generating' | 'reviewing' | 'ready' | 'committed';
  count?: number;
  disabled?: boolean;
  title?: string;
};
```

## 5. 视觉规则

### 5.1 Active 状态

Active 只回答：

```text
当前页面正在展示或操作哪一天？
```

建议视觉：

```text
亮色主题：黑色背景 + 白色文字
暗色主题：白色背景 + 深色文字
```

Active 不表达业务含义。

### 5.2 Range 状态

Range 只回答：

```text
当前批量操作覆盖哪些日期？
```

建议视觉：

```text
范围中间：浅色连续背景
范围起点/终点：明确的 handle 或更强边界
```

Range 背景不能覆盖 active 背景，也不能吞掉业务状态边框和圆点。

### 5.3 Business 状态

Business 状态只回答：

```text
这个日期在业务中有什么状态？
```

业务状态只使用：

```text
边框线
底部实心圆点
title / aria-label
```

建议颜色：

```text
saved: emerald / green
planned: amber / yellow
warning: orange
conflict: rose / red
```

建议语义：

```text
saved    = 已正式写入
planned  = 临时计划中，待审查或待提交
warning  = 有非阻塞问题
conflict = 有冲突，不能直接提交
```

如果一个日期存在多个业务状态，应在数据层合成最终状态。

建议优先级：

```text
conflict > warning > planned > saved > none
```

## 6. 简单范围筛选场景

题目列表筛选现在使用两个原生日期输入：

```text
createdAtFrom
createdAtTo
```

这类场景应使用 DateRangeField。

它的职责：

```text
展示开始日期
展示截止日期
展示范围天数
打开轻量范围选择器
清空范围
```

它不需要：

```text
dayStates
业务状态图例
activeDate
plan / review / commit 行为
```

对外结果仍然是：

```text
startDate
endDate
```

这样可以直接回填现有筛选参数。

## 7. 移动端范围筛选

移动端不能把桌面月历硬塞进页面。

DateRangeField 在移动端应使用 bottom sheet。

推荐结构：

```text
顶部：结果栏
Start: Jan 10   End: Mar 15   65D

中间：横向日期滑动选择器
支持滑动浏览、按住拖动、范围预览

底部：操作
Clear   Cancel   Apply
```

移动端筛选必须使用 draft range。

原因：

```text
用户拖动时会产生大量临时日期变化。
筛选列表不应该在拖动过程中连续请求接口。
```

因此 DateRangeField 应支持提交模式：

```text
instant = 选择变化立刻提交
apply   = 先修改 draft，点击 Apply 后提交
```

筛选场景使用：

```text
commitMode = apply
```

随机题场景可以使用：

```text
commitMode = instant
```

因为随机题范围选择通常只是本地 plan 输入，不应每次拖动都立即提交后端。

## 8. 滑动范围选择

滑动范围选择是交互手段，不是业务数据模型。

它适合：

```text
移动端快速选一段连续日期
跨月范围选择
批量 plan 的范围输入
```

基础交互：

```text
横向滑动：浏览日期
点日期：设置 start 或 end
按住拖动：从 anchorDate 预览到 hoverDate
松手：生成 draft range
拖动两端 handle：调整 start 或 end
```

滑动选择器必须始终显示最终结果：

```text
startDate
endDate
range length
```

不要只用高亮条表达结果。

## 9. 随机题业务场景

随机题页面使用 RichCalendarView + RandomCalendarPlanner。

范围选择在 random 中也是过渡交互。

最终用户必须看到明确结果：

```text
Plan range
Start: 2026-01-10
End: 2026-03-15
65 days
```

生成 plan 后，每一天进入 planned 临时状态。

用户需要支持：

```text
点击某一天审查该日数据
单独提交当前日期
批量提交 ready 日期
单独重生成某一天
批量重生成未提交日期
清空未提交 plan
```

日历上的表达：

```text
range      = 批量 plan 范围
activeDate = 当前审查日期
planned    = 临时计划状态
saved      = 已正式保存
conflict   = 不能直接提交
```

这些状态必须同时可见。

例如：

```text
某一天既在 range 中，又是 activeDate，又是 planned。
```

视觉上应同时保留：

```text
范围背景
active 背景
planned 边框和圆点
```

## 10. 桌面端布局

桌面端可使用月历网格作为主视图。

随机题页面建议：

```text
左侧：RichCalendarView
右侧：当前 activeDate 的状态、详情、审查和提交操作
```

两列布局：

```text
grid
xl:grid-cols-[24rem_minmax(0,1fr)]
xl:items-stretch
```

日期单元格保持稳定尺寸。

不要通过拉伸日期单元格来对齐左右卡片高度。

## 11. 后续补充

本设计文档先定义组件边界、交互规则和状态语义。

具体使用示例、props 完整类型、测试用例，在组件开发和验证完成后再补充。
