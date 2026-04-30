# 随机题日历视图设计

## 1. 设计目标

随机题页面左侧日历不是普通日期选择器。

它后续会承载多种业务状态，例如：

```text
已保存题组
计划中题组
批量生成中的日期
异常或冲突日期
```

因此日历视图必须从一开始就区分两类状态：

```text
1. 选中状态：用户当前正在查看或操作哪一天。
2. 业务状态：这一天在随机题业务里处于什么状态。
```

这两类状态不能互相覆盖。

## 2. 核心语义

### 2.1 选中状态

选中状态只回答一个问题：

```text
当前页面右侧正在展示或操作哪一天？
```

选中状态只使用背景色和文字色表达。

建议规则：

```text
亮色主题：黑色背景 + 白色文字
暗色主题：白色背景 + 深色文字
```

选中状态不负责表达业务含义。

### 2.2 业务状态

业务状态只回答一个问题：

```text
这个日期在随机题业务中有什么状态？
```

业务状态只使用边框线和底部实心圆点表达。

业务状态不负责表达当前是否选中。

## 3. 状态组合规则

日期单元格至少有两个状态维度：

```text
selected: boolean
businessState: none | saved | planned | warning | conflict
```

它们应该是可叠加的，而不是互斥的。

不要写成：

```text
isSelected ? selectedStyle : isGenerated ? generatedStyle : normalStyle
```

这种写法会导致选中已保存日期时，已保存状态消失。

应该写成：

```text
baseStyle
+ selectedStyle
+ businessStateStyle
+ monthScopeStyle
```

## 4. 当前状态定义

### 4.1 普通日期

条件：

```text
selected = false
businessState = none
```

视觉：

```text
默认背景
默认边框
默认文字
无圆点
```

### 4.2 已保存日期

条件：

```text
businessState = saved
```

视觉：

```text
绿色边框线
底部绿色实心圆点
```

注意：

```text
已保存状态不使用浅绿色背景。
已保存状态不需要额外 hover 背景。
```

原因：

```text
背景色留给 selected 状态使用。
边框线和圆点专门表达业务状态。
```

### 4.3 选中日期

条件：

```text
selected = true
```

视觉：

```text
亮色主题：黑色背景 + 白色文字
暗色主题：白色背景 + 深色文字
```

如果这个日期同时有业务状态，则继续保留业务状态的边框线和圆点。

### 4.4 已保存且选中

条件：

```text
selected = true
businessState = saved
```

视觉：

```text
选中背景
选中文字
绿色边框线
底部绿色实心圆点
```

也就是说：

```text
背景色 = 是否选中
边框线/圆点 = 是否已保存
```

## 5. 后续状态扩展

后续如果支持一段日期批量生成题组，可以增加计划态。

建议颜色：

```text
saved: emerald / green
planned: amber / yellow
warning: orange
conflict: rose / red
```

建议语义：

```text
saved    = 已正式写入 random_usb
planned  = 计划中或批量生成待确认
warning  = 有需要关注的非阻塞问题
conflict = 日期存在冲突或不可直接提交
```

每种业务状态仍然只控制：

```text
边框线颜色
底部圆点颜色
title / aria-label 中的状态说明
```

不要让业务状态控制背景色。

## 6. 优先级

视觉优先级建议：

```text
1. selected 控制背景和文字。
2. businessState 控制边框和圆点。
3. outOfMonth 控制整体透明度。
4. hover 只用于普通日期的轻微反馈。
```

如果一个日期同时存在多个业务状态，应在数据层先合成一个最终状态。

建议优先级：

```text
conflict > warning > planned > saved > none
```

例如：

```text
同一天既 saved 又 conflict，则展示 conflict。
```

## 7. 布局约束

日历卡片与右侧操作区在桌面端应首尾对齐。

当前页面两列布局建议：

```text
grid
xl:grid-cols-[24rem_minmax(0,1fr)]
xl:items-stretch
```

左侧日历卡片：

```text
xl:self-stretch
```

日期单元格保持固定高度。

当前建议：

```text
h-11
```

不要通过拉伸日期单元格来对齐左右边框。

如果右侧 Toggle 内容区高度变化，应通过右侧内容区的 `min-height` 控制抖动，而不是改变日历日期格尺寸。

## 8. 交互规则

点击任意日期：

```text
1. 更新 selectedDate。
2. 如果点击的是相邻月份日期，则 calendarMonth 切换到该日期所在月份。
3. 右侧展示该日期的状态、详情、分析或操作入口。
```

Hover：

```text
普通日期可以有轻微 hover 背景。
已有业务状态的日期不需要额外 hover 背景。
选中日期不需要额外 hover 背景。
```

原因：

```text
业务状态和选中状态已经足够明确。
hover 不应该制造第三套强视觉状态。
```

## 9. 可访问性

每个日期按钮应通过 `title` 或 `aria-label` 表达完整状态。

示例：

```text
2026-04-02, selected, saved random question set
2026-04-03, planned random question set
2026-04-04, no random question set
```

不要只依赖颜色表达业务状态。

后续如果业务状态变多，可以在右侧面板或日历下方增加简短图例。

图例也应遵循同一规则：

```text
绿色圆点/边框 = 已保存
黄色圆点/边框 = 计划中
红色圆点/边框 = 冲突
```

## 10. 当前实现待调整点

当前实现中，已保存日期和选中日期是互斥样式：

```text
isSelected ? selectedStyle : isGenerated ? generatedStyle : normalStyle
```

这会导致：

```text
选中一个已保存日期时，绿色边框和绿色圆点消失。
```

应改为叠加式样式：

```text
base date button style
+ selected background/text style
+ saved border/dot style
+ out-of-month opacity style
```

当前 `saved` 状态应调整为：

```text
绿色边框线
底部绿色实心圆点
不使用浅绿色背景
不使用绿色 hover 背景
```

这样后续 `planned` 等状态可以自然扩展。
