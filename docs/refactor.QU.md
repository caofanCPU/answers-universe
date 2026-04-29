# Random Question Plan Refactor

## 0. 当前临时止血方案

当前已经先做了一版不改数据库、不改前端主流程、不改接口结构的临时方案，用来解决“首题选择不当导致大量题目无法组成完整题组”的燃眉之急。

### 0.1 临时方案目标

保持现有流程不变：

```text
用户选择日期
-> Generate preview
-> 后端返回候选题单
-> 用户 Save set
-> 写入 random_usb
```

只优化后端生成算法。

也就是说，临时方案不引入 plan 表，不引入排程池，不改变页面交互。

### 0.2 当前算法改动

旧算法是：

```text
先稳定选 1 道首题
-> 排除首题分类
-> 再找普通题分类
```

这个做法的问题是：首题一旦选错分类，即使剩余普通题很多，也可能凑不出完整题组。

当前临时算法改成：

```text
1. 查询所有可用首题。
2. 查询所有可用普通题。
3. 普通题按 category 分组。
4. 枚举首题候选。
5. 对每个首题候选先检查：排除该首题分类后，普通题分类数是否足够。
6. 优先选择能凑满完整题组的首题。
7. 再根据分类库存评分选择普通题分类。
8. 返回 1 道首题 + targetCount - 1 道普通题。
```

核心代码已抽成纯函数：

```text
apps/faq/src/lib/random-question-planner.ts
```

后端预览接口复用这个函数：

```text
apps/faq/src/server/random-questions/random.service.ts
```

这个方案的性质是贪心算法，不保证全局最优，但能避免最严重的“首题先选错导致直接失败”问题。

### 0.3 Analysis 的 New Days 修正

`Analysis` 是单独接口：

```text
GET /api/random-questions/analysis
```

它不是生成预览接口的一部分。

旧的 `New Days` 只是粗略计算：

```text
min(可用首题数, floor(剩余题数 / targetCount))
```

这个数没有考虑：

```text
普通题数量
普通题分类数
首题分类排除
普通题分类互斥
```

当前已经改成用同一套 planner 做内存模拟：

```text
1. 查出当前所有未使用题目的 id / asFirst / category。
2. 拆成首题池和普通题池。
3. 调用 selectBestRandomQuestionSet 生成一组。
4. 如果成功，就从内存候选池移除这组题。
5. 继续重复，直到不能再生成完整题组。
6. 成功生成的组数作为 estimatedNewDays。
```

这个模拟不会写数据库，也不会真实消耗题目。

当前 `New Days` 的语义是：

```text
按当前临时算法和当前剩余题库，预计还能生成多少套完整题组。
```

### 0.4 可视化测试页面

为了不引入测试框架依赖，已经增加浏览器可视化测试页面：

```text
/test/abc
```

对应文件：

```text
apps/faq/src/app/[locale]/(home)/test/abc/page.tsx
apps/faq/src/app/[locale]/(home)/test/abc/random-question-planner-test-client.tsx
```

测试页面使用题目单元字符串表示题目：

```text
0F-A  表示 A 分类首题
1A    表示 A 分类普通题 1
2A    表示 A 分类普通题 2
```

页面支持：

```text
10 / 14 / 26 固定样例
Custom 5~100 道题随机生成
Random / Stable 开关
输入题目池展示
输出题组展示
无法匹配题目展示
```

这个页面用于快速肉眼验证：

```text
每组是否只有 1 道首题
首题是否排在第一位
普通题是否都是非首题
普通题分类是否互不重复
首题分类是否没有出现在普通题中
哪些题无法被匹配
```

### 0.5 后续精确升级方向

临时方案解决当前可用性问题，但不是最终最优排程算法。

后续如果要追求“最大化可生成题组数”，可以继续升级：

```text
第一层：当前贪心算法
  快速、低改动、能解决首题误选问题。

第二层：有限深度回溯
  当某一步贪心选择导致后续卡死时，回退并尝试其他首题或普通题分类组合。

第三层：排程池
  一次性生成多个候选题组，用户审核后再确认到正式日期。

第四层：ILP / 求解器
  把题组生成建模为整数规划，求全局最优。
  仅适合后台规划，不适合实时预览接口。
```

建议短期保持当前临时方案。

当业务确认需要“提前排程 + 用户逐组审核 + 批量发布”时，再进入后文的 plan pool 重构方案。

## 1. Refactor Goal

The current random question generation flow chooses one date and tries to generate one question set immediately.

That flow has a structural weakness:

1. The first question is selected before checking the full category combination.
2. A bad first-question category can block a valid group, even when many unused questions still exist.
3. The user has no chance to review whether generated questions are semantically too close.

The refactored flow changes the backend model from "generate one daily set in real time" to "generate a temporary plan pool first".

The backend should:

1. Build a pool of valid question groups from unused questions.
2. Let users review each group.
3. Let users reject groups they do not want.
4. Let users commit a selected group to a selected date.
5. Store only committed groups in `random_usb`.

The plan pool is temporary. It is not a business fact table.


## 2. Business Boundary

### 2.1 Source of Truth

`random_usb` remains the only source of truth for consumed questions.

Once a question enters `random_usb`, it is permanently consumed and must never be used again by future committed random question sets.

### 2.2 Plan Pool Semantics

The plan pool is only a temporary candidate pool.

A plan group existing in `random_usb_plan_group` means:

1. The scheduler selected these question IDs as a candidate group.
2. The group has not been committed.
3. The group has not been rejected.
4. The questions are not yet consumed.

A plan group disappearing from `random_usb_plan_group` means either:

1. The user rejected it.
2. The user committed it to `random_usb`.
3. The user cleared the entire current plan.

The plan table does not need a status column.

### 2.3 Date Binding

Plan groups do not bind dates.

Binding a group to a date is the same business action as committing it into `random_usb`.

There is no intermediate "assigned date but not committed" state in the backend.

### 2.4 Manual Planning Only

The system must not automatically rebuild or refill the plan pool.

The dashboard only displays the current situation.

If the plan pool is empty, the frontend should tell the user to manually generate a new plan.

If the plan pool is not empty, generating a new plan should be rejected unless the user explicitly clears the current plan first.


## 3. Minimal Database Design

Only two temporary planning tables are required.

### 3.1 `random_usb_plan_meta`

This table stores metadata for the current plan pool.

It should contain exactly one row.

```sql
CREATE TABLE faq.random_usb_plan_meta (
  id smallint PRIMARY KEY DEFAULT 1,
  version integer NOT NULL DEFAULT 1,
  target_count integer NOT NULL,
  max_group_count integer NOT NULL,
  generated_group_count integer NOT NULL DEFAULT 0,
  summary_json jsonb,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now(),
  CONSTRAINT random_usb_plan_meta_singleton CHECK (id = 1)
);
```

Field semantics:

1. `version`
   Current plan pool version. It is only used to identify the current pool from the frontend/backend request flow.
2. `target_count`
   Number of questions per group, currently defaulting to `5`.
3. `max_group_count`
   Business cap for generated groups in one plan.
4. `generated_group_count`
   Actual number of groups generated in the current plan pool.
5. `summary_json`
   Optional dashboard summary, such as inventory totals, theoretical limits, generated count, and stop reason.

### 3.2 `random_usb_plan_group`

This table stores current candidate groups.

```sql
CREATE TABLE faq.random_usb_plan_group (
  id bigserial PRIMARY KEY,
  version integer NOT NULL,
  group_no integer NOT NULL,
  question_ids jsonb NOT NULL,
  created_at timestamptz DEFAULT now(),
  CONSTRAINT uq_random_usb_plan_group_no UNIQUE (version, group_no)
);
```

`question_ids` is a minimal JSON array:

```json
["101", "205", "309", "412", "588"]
```

Rules:

1. The first ID is the planned first question.
2. The remaining IDs are planned normal questions.
3. No question text, answer, explanation, category, or `as_first` snapshot is stored here.
4. The plan group's only responsibility is to remember the selected question ID combination.


## 4. Existing Permanent Table

`random_usb` remains the committed result table.

Important constraints:

1. `question_id` must stay globally unique.
2. A committed `show_date` should be unique at the date level.
3. The existing `show_date + question_id` unique constraint is still useful as a defensive guard.

If the current schema only prevents duplicate question IDs but does not prevent multiple sets on the same date, add a date-level uniqueness rule or enforce it transactionally in the commit service.


## 5. Required Indexes

For a large single `usb` table, add indexes for inventory and candidate lookup.

Recommended general index:

```sql
CREATE INDEX idx_usb_random_pool
ON faq.usb (deleted, as_first, category, id);
```

If PostgreSQL partial indexes are preferred:

```sql
CREATE INDEX idx_usb_random_first_available
ON faq.usb (category, id)
WHERE deleted = 0 AND as_first = 1;

CREATE INDEX idx_usb_random_normal_available
ON faq.usb (category, id)
WHERE deleted = 0 AND as_first = 0;
```

`random_usb.question_id` is already unique and can support anti-join checks.


## 6. Backend Operations

### 6.1 Dashboard Query

The dashboard is read-only.

It should return:

1. Current plan metadata.
2. Current plan groups.
3. Inventory summary.
4. Whether the plan pool is empty.
5. A message telling the frontend whether manual plan generation is available.

It must not generate or refill plan groups.

### 6.2 Generate Plan

This operation is explicitly triggered by the user.

Rules:

1. If `random_usb_plan_group` is not empty, reject the request.
2. Read available inventory from `usb - random_usb`.
3. Generate up to `RANDOM_USB_MAX_PLAN_GROUPS`.
4. Insert all generated groups into `random_usb_plan_group`.
5. Update `random_usb_plan_meta`.

This operation should be wrapped in a transaction.

Concurrency can be controlled outside the schema later with role permissions, Redis locks, queues, or operation-level mutexes. The DB design does not need extra status columns for this first version.

### 6.3 Clear Current Plan

This operation is explicitly triggered by the user.

Rules:

1. Delete all rows from `random_usb_plan_group`.
2. Keep or reset `random_usb_plan_meta` according to UI needs.
3. Do not touch `random_usb`.
4. Do not consume any question.

### 6.4 Reject One Group

This operation is explicitly triggered by the user.

Rules:

1. Delete the selected row from `random_usb_plan_group`.
2. Do not refill the pool.
3. Do not touch `random_usb`.
4. The rejected questions naturally return to the original available pool for the next manually generated plan, unless they are later committed elsewhere.

### 6.5 Commit Group To Date

This operation is explicitly triggered by the user by selecting a plan group and a date.

Rules:

1. Read the selected `random_usb_plan_group`.
2. Read its `question_ids`.
3. Query `usb` by these IDs.
4. Re-validate the full random question rule.
5. Check that the selected date has no existing committed set unless replace behavior is explicitly supported.
6. Check that none of the selected question IDs already exists in `random_usb`.
7. Insert rows into `random_usb`.
8. Delete the plan group row.

This is the only operation that consumes questions.


## 7. Plan Generation Algorithm

The scheduler should work from inventory and selected IDs, not from full question details.

### 7.1 Inventory Query

Fetch category-level inventory first:

```sql
SELECT
  u.category,
  u.as_first,
  COUNT(*)::int AS available_count
FROM faq.usb u
LEFT JOIN faq.random_usb r ON r.question_id = u.id
WHERE u.deleted = 0
  AND r.question_id IS NULL
GROUP BY u.category, u.as_first;
```

The result size is bounded by `category_count * 2`, not by total question count.

### 7.2 Candidate ID Query

Fetch candidate IDs needed for the plan in a controlled way.

One practical approach:

1. Compute a safe upper bound for planned groups.
2. For each useful category, fetch enough first-question IDs and normal-question IDs.
3. Keep only `id`, `category`, and `as_first` in memory during planning.

For one million rows, do not load all columns and do not load every question unless the inventory size is actually needed.

### 7.3 Theoretical Limit

Compute the upper bound:

```text
limitByTotal = floor(availableTotal / targetCount)
limitByFirst = availableFirstTotal
limitByNormal = floor(availableNormalTotal / (targetCount - 1))
limitByBusiness = RANDOM_USB_MAX_PLAN_GROUPS

candidateLimit = min(
  limitByTotal,
  limitByFirst,
  limitByNormal,
  limitByBusiness
)
```

This is only an upper bound. Category constraints can reduce the actual generated count.

### 7.4 Group Packing Rule

For each group:

1. Choose one first question.
2. Choose `targetCount - 1` normal questions.
3. The first question category must not appear among normal questions.
4. Normal question categories must be distinct.
5. The selected question IDs must not appear in another plan group in the same current plan.

### 7.5 Practical Greedy Strategy

Use category inventory to avoid the current first-question trap.

For each group:

1. Enumerate available first-question categories.
2. For each first category, check whether enough normal categories remain after excluding it.
3. Discard impossible first categories.
4. Score feasible first categories.
5. Choose the best first category.
6. Choose normal categories.
7. Pop one unused question ID from each selected category bucket.

Suggested first-category scoring:

```text
score =
  normalCategoryCountAfterExcludingFirst
  + firstCountInCategory * 0.2
  - normalCountInCategory * 0.1
```

This favors first categories that do not block normal category diversity, consumes first-question-rich categories, and avoids unnecessarily excluding valuable normal-question-heavy categories.

The exact score can be tuned later. The important rule is that a first question is selected only after proving a full category combination exists.


## 8. Commit-Time Validation

Because `random_usb_plan_group` stores only IDs, commit-time validation is mandatory.

Validation rules:

1. `question_ids.length === targetCount`
2. All IDs are unique.
3. All IDs exist in `usb`.
4. All questions have `deleted = 0`.
5. First ID has `as_first = 1`.
6. Remaining IDs have `as_first = 0`.
7. All categories are distinct.
8. No selected ID exists in `random_usb`.
9. The target `show_date` has no committed group unless explicit replace is supported.

If validation fails, return a clear error telling the frontend to refresh or regenerate the plan.


## 9. API Shape

Suggested backend endpoints:

```text
GET /api/random-questions/plan
```

Returns dashboard data and current plan groups.

```text
POST /api/random-questions/plan/generate
```

Manually generates a new plan pool. Rejects if the pool is not empty.

```text
DELETE /api/random-questions/plan
```

Clears the current plan pool after user confirmation.

```text
DELETE /api/random-questions/plan/groups/:id
```

Rejects one plan group.

```text
POST /api/random-questions/plan/groups/:id/commit
```

Body:

```json
{
  "showDate": "2026-04-29"
}
```

Commits one plan group to `random_usb` for the selected date, then removes it from the plan pool.


## 10. Dashboard Summary

The dashboard can show:

1. Current plan group count.
2. Target questions per group.
3. Business max plan groups.
4. Theoretical upper bound.
5. Actual generated group count.
6. Available first-question count.
7. Available normal-question count.
8. Available category count.
9. Per-category first and normal counts.
10. Empty-pool message.

The dashboard must not mutate data.


## 11. Error Codes

Suggested error codes:

```text
PLAN_POOL_NOT_EMPTY
PLAN_POOL_EMPTY
PLAN_GROUP_NOT_FOUND
PLAN_GROUP_INVALID
PLAN_GENERATION_NOT_ENOUGH_FIRST
PLAN_GENERATION_NOT_ENOUGH_NORMAL
PLAN_GENERATION_NOT_ENOUGH_CATEGORIES
SHOW_DATE_ALREADY_COMMITTED
QUESTION_ALREADY_COMMITTED
```

The generation endpoint should return a summary even when it cannot generate any group.


## 12. Implementation Phases

### Phase 1: Backend Tables And Service

1. Add `random_usb_plan_meta`.
2. Add `random_usb_plan_group`.
3. Add plan service functions.
4. Add plan API routes.
5. Keep the frontend minimal or temporarily test from API calls.

### Phase 2: Scheduling Algorithm

1. Implement inventory query.
2. Implement group packing with feasible first-category selection.
3. Insert question ID arrays into plan groups.
4. Add summary output.

### Phase 3: Commit And Reject

1. Commit a selected group to a date.
2. Reject a selected group.
3. Clear the entire plan.
4. Reuse existing `random_usb` detail display for committed results.

### Phase 4: Frontend Redesign

After the backend plan pool is stable, redesign the frontend around the existing random question page layout.

The page should keep the current official calendar as the main visual anchor.

Do not use a page-level toggle to switch between calendar mode and plan mode.

The plan pool should be introduced as a collapsible lower panel. This keeps the user in one continuous workflow:

1. Review official saved dates from the calendar.
2. Open the temporary plan pool panel.
3. Switch between candidate groups.
4. Preview the questions inside a selected group.
5. Reject the group or publish it to a date.
6. Return to the same workspace to continue with the next group.


## 13. Final Rule

The refactored backend must keep this boundary:

1. Planning selects candidate question ID groups.
2. Planning does not bind dates.
3. Planning does not consume questions.
4. The dashboard does not auto-generate.
5. Rejection deletes a candidate group only.
6. Commit binds a group to a date and writes `random_usb`.
7. Only `random_usb` consumes questions permanently.


## 14. Frontend Refactor Design

### 14.1 Existing Layout To Preserve

The current page already has a useful structure:

1. Top-left calendar.
2. Top-right status/details/analysis card.
3. Lower question detail preview area.

This layout should remain recognizable.

The calendar must continue to represent committed `random_usb` facts only. It should not show temporary plan groups as saved dates.

### 14.2 Main Interaction Model

The page should use one main selection model:

```ts
type ActiveSelection =
  | { type: 'date'; showDate: string }
  | { type: 'planGroup'; groupId: string };
```

Selection rules:

1. Clicking a calendar date selects a committed date context.
2. Clicking a plan group selects a temporary candidate group context.
3. The lower detail area renders questions for the active selection.
4. The top-right card changes its labels and actions based on the active selection.

This avoids switching the whole page into a separate plan mode.

### 14.3 Calendar Area

The calendar remains the official date view.

It should show:

1. Dates with committed random sets.
2. Empty dates.
3. The currently selected date.

The calendar should not trigger plan generation.

The calendar is used for viewing committed sets. Date selection for publishing a plan group should happen in a dedicated modal, not by requiring the user to jump between the lower panel and the top calendar.

### 14.4 Top-Right Card

Keep the existing compact top-right panel style and the small toggle idea.

The existing `Status / Details / Analysis` structure can stay, but its content should be selection-aware.

When `activeSelection.type === 'date'`:

1. `Status` shows the selected date and committed-set completeness.
2. `Details` shows committed question IDs/categories.
3. `Analysis` shows dashboard-level inventory and plan summary.

When `activeSelection.type === 'planGroup'`:

1. `Status` shows `Group #n`, candidate completeness, and plan-pool context.
2. `Details` shows candidate question IDs/categories after joining `usb`.
3. `Analysis` shows current plan-pool metrics and inventory summary.

Global actions should live here when they affect the whole plan pool:

1. `Generate Plan`
   Enabled only when the plan pool is empty.
2. `Clear Plan`
   Enabled only when the plan pool is not empty and requires confirmation.

### 14.5 Plan Pool Panel

Add a collapsible panel below the top calendar/status grid.

The plan panel is the main workspace for temporary candidate groups.

Suggested structure:

```text
Plan Pool Panel
  Header:
    Plan Groups: 18
    Generated at / version
    Generate Plan / Clear Plan
    Collapse

  Body:
    Left rail:
      #1 #2 #3 #4 ... group selector

    Main:
      Selected Group #n
      Reuse question detail preview
      Previous question / next question controls

    Action bar:
      Reject Group
      Choose Date
```

Panel rules:

1. The panel can be collapsed to keep the page light.
2. The left rail switches candidate groups.
3. The main area reuses the existing `QuestionDetail` and previous/next navigation pattern.
4. Rejecting a group deletes that group from the plan pool.
5. Choosing a date opens a publish date modal.

The panel should not auto-generate more groups when one group is rejected or committed.

### 14.6 Publish Date Modal

Use a modal only for the short task of choosing a publish date.

Do not put the whole plan pool workflow inside a modal.

Modal flow:

```text
User selects Group #7
-> Clicks Choose Date
-> Publish Date Modal opens
-> User selects an empty calendar date
-> User confirms Publish
-> Backend commits the group to random_usb
-> Backend deletes the plan group
-> Frontend refreshes calendar, plan pool, and selected date details
```

Modal content:

1. Title: `Publish Group #7`
2. Small group summary.
3. Calendar month view.
4. Committed dates shown as unavailable.
5. Empty dates selectable.
6. Selected target date highlighted.
7. Footer actions: `Cancel` and `Publish to YYYY-MM-DD`.

The modal should reuse the visual language of the existing calendar.

This solves the cross-region problem: the user does not need to move attention between the lower plan panel and the top calendar to assign a date.

### 14.7 After Publish Behavior

After a successful publish:

1. Close the modal.
2. Refresh the committed calendar date list.
3. Refresh the plan pool.
4. Set the selected date to the published date.
5. Show the newly committed official question set.
6. Keep the plan panel available so the user can continue with the next group.

The user should not need to manually switch views to verify that the publish worked.

### 14.8 Reject Group Behavior

Rejecting a group should be simple:

1. Delete the selected `random_usb_plan_group`.
2. Refresh the plan pool.
3. Select the next available group if one exists.
4. If the pool becomes empty, show an empty-pool message.

No replacement group should be generated automatically.

### 14.9 Empty Plan Pool Behavior

When the plan pool is empty:

1. The dashboard displays that no plan is currently available.
2. The plan panel shows an empty state.
3. The frontend can show a `Generate Plan` button.
4. The backend must generate only after the user explicitly clicks it.

### 14.10 Future Batch Publish Upgrade

The first version can support single-group publishing only in the UI, but the frontend and API design should not block batch publishing later.

Preferred backend API shape:

```text
POST /api/random-questions/plan/commit
```

Request:

```json
{
  "items": [
    {
      "groupId": "12",
      "showDate": "2026-05-01"
    }
  ]
}
```

Single-group publishing is just a batch with one item.

Future batch workflow:

1. User selects multiple plan groups.
2. User opens the publish modal.
3. User chooses a start date or drags a date range in an upgraded calendar.
4. The frontend builds a group-to-date mapping.
5. Occupied dates are skipped by default.
6. User reviews the mapping.
7. User confirms all mapped groups at once.

Suggested future mapping model:

```ts
type PublishMapping = Array<{
  groupId: string;
  showDate: string;
}>;
```

The backend should validate the whole batch as one operation:

1. All groups still exist.
2. No duplicate dates.
3. No selected date is already committed.
4. All group question IDs remain valid.
5. No question ID appears in another committed set.
6. No question ID is duplicated across the submitted batch.
7. Either all groups commit, or none do.

This keeps the first UI simple while preserving a clean path to multi-select groups and date-range publishing.

### 14.11 Frontend Component Direction

The existing `RandomQuestionBoardClient` will likely need to be split.

Suggested component boundaries:

```text
RandomQuestionBoardClient
  owns page state and data loading

RandomQuestionCalendar
  renders committed date calendar

RandomQuestionTopPanel
  renders Status / Details / Analysis

RandomQuestionPlanPanel
  renders collapsible plan pool workspace

RandomQuestionPublishDateModal
  handles date selection and publish confirmation

RandomQuestionDetailViewer
  wraps QuestionDetail plus previous/next controls
```

The split should happen during implementation only if it reduces complexity. The first priority is preserving the workflow semantics.


## 15. 任务复杂度与实施评估

整体复杂度：中高。

这个改造不是单点功能，而是把随机题单从“按日期实时生成”改成“先生成临时排程池，再由用户审核并发布到正式日期”。难点主要在业务边界、状态流转和前端工作台体验，不在单个 SQL 或单个组件。

### 15.1 后端复杂度

后端复杂度：中。

主要任务：

1. 新增 `random_usb_plan_meta` 和 `random_usb_plan_group`。
2. 新增 plan 查询、生成、清空、删除题组、提交题组到日期的接口。
3. 改造排程算法，从单日生成改成一次性生成题组池。
4. 生成阶段只负责选择题目 ID 组合，不绑定日期，不消耗题目。
5. 提交阶段根据 `question_ids` 回查 `usb` 并重新校验首题、普通题、分类互斥、未删除、未使用。
6. 保留 `random_usb` 作为唯一正式事实表。

工作量估计：

```text
DB + Prisma migration：0.5-1 天
plan service + API：1.5-2.5 天
排程算法 + 诊断 summary：1-2 天
后端测试和边界处理：1-2 天
```

后端合计：

```text
4-7 天
```

### 15.2 前端复杂度

前端复杂度：中高。

主要任务：

1. 重构 `RandomQuestionBoardClient` 的状态模型。
2. 移除旧的 `Generate preview -> Save set` 单日生成链路。
3. 保留正式日历和已保存题单查看能力。
4. 新增下方可折叠的 Plan Pool Panel。
5. 支持题组编号切换、组内题目预览、上一题/下一题。
6. 支持删除或否决当前题组。
7. 新增 Publish Date Modal，在弹窗里选择空日期并发布。
8. 发布成功后刷新日历、刷新排程池、展示刚发布的正式题单。
9. 保持现有亮暗主题样式和移动端兼容。

样式约束：

1. 继续复用当前圆角卡片、边框、浅色/暗色主题 class。
2. 移动端继续走单列堆叠。
3. 桌面端保留当前上方 `calendar + info panel` 的布局心智。
4. Plan Pool Panel 使用同一视觉体系，不另起一套设计。
5. 按钮继续使用 `GradientButton`、`XButton`、`XToggleButton`。
6. 临时按钮图标可用 `EyeIcon`、`EyeOffIcon`。
7. 关闭按钮使用 `XIcon`。

工作量估计：

```text
前端状态模型重构：1-2 天
Plan Pool Panel：1.5-2.5 天
Publish Date Modal：1-2 天
接口联调和错误态：1-2 天
移动端/暗色主题收口：0.5-1 天
```

前端合计：

```text
5-9 天
```

### 15.3 整体工作量

整体估计：

```text
可用版：8-12 天
较稳版本：2-3 周
带完整测试、边界提示、较好交互打磨：3 周左右
```

### 15.4 推荐实施顺序

建议分阶段实施，不要第一版就做拖拽和批量发布。

第一阶段：

```text
后端 plan 表
plan API
排程算法
单组 commit 到日期
```

第二阶段：

```text
前端接入 Plan Pool Panel
单组预览
单组删除
单组 Publish Date Modal
```

第三阶段：

```text
大盘 summary
清空计划确认
错误态完善
移动端与暗色主题收口
```

第四阶段：

```text
多选题组
日期范围选择
连续日期批量发布
占用日期自动顺延
```

第一版必须优先保证：

1. 排程池不会自动生成或自动补排。
2. 日历只展示正式 `random_usb` 数据。
3. Plan Pool 只展示临时候选题组。
4. 提交到日期才真正消耗题目。
5. 用户发布成功后能立即看到正式题单结果。
