-- CIA: random_usb 当前库存排查 SQL。
--
-- 用途：
--   排查 analysis 接口里 New Days 偏低的原因。
--   典型现象是 ATF、Remain Total 看起来都不低，但 New Days 只有 0、1，
--   或者明显低于预期。
--
-- 当前算法规则：
--   每天需要 1 道首题 + RANDOM_USB_DAILY_COUNT - 1 道普通题。
--   普通题之间不能重复分类。
--   普通题也不能使用当天首题所在的分类。
--
-- 默认假设：
--   RANDOM_USB_DAILY_COUNT = 5，所以每天需要 4 个普通题分类。
--   如果线上配置不是 5，把下面 SQL 里的数字 4 替换成：
--     RANDOM_USB_DAILY_COUNT - 1
--
-- 安全性：
--   本文件全部是只读 SELECT，不会写入、删除、更新任何数据。
--
-- 性能说明：
--   这些 SQL 是给 10 万级题库做运维排查用的。
--   查询会聚合剩余题池，但不会把题目表自己和自己按行互相 JOIN。
--   文件里用到的 CROSS JOIN 只会 JOIN 一行 summary CTE，不会产生大笛卡尔积。
--
-- 建议已有索引：
--   faq.usb(id)
--   faq.usb(category)
--   faq.random_usb(question_id)
--
-- 如果线上发现 deleted 过滤很慢，可以再评估加这个索引：
--   CREATE INDEX CONCURRENTLY idx_usb_deleted_as_first_category
--     ON faq.usb(deleted, as_first, category);


-- ---------------------------------------------------------------------------
-- 1. 剩余库存总览诊断
-- ---------------------------------------------------------------------------
-- 用途：
--   看当前剩余库存是否至少还能生成下一天。
--
--   New Days 为 0、1，或者任何看起来偏少的情况，都可以先跑这一段。
--   这一段不复刻完整的多天模拟，只解释“从当前库存看，下一天卡不卡”。
--
-- 结果解释：
--   ATF:
--     剩余首题数量。应该和 analysis 接口里的 ATF 对得上。
--
--   Remain Total:
--     未删除、且从未进入 random_usb 的题目总数。
--     应该和 analysis 接口里的 Remain Total 对得上。
--
--   Normal Remain:
--     剩余普通题数量，也就是 as_first = 0 的剩余题。
--
--   Normal Category Count:
--     剩余普通题覆盖了多少个不同 category。
--
--   Best Available Normal Categories:
--     选一个最有利的首题分类后，排除该首题分类，还能留下多少个普通题分类。
--
--   diagnosis:
--     AT_LEAST_ONE_DAY_SHOULD_BE_POSSIBLE:
--       按当前分类规则，至少下一天应该能生成。
--       如果接口 New Days 仍然偏低，继续核对 RANDOM_USB_DAILY_COUNT、
--       应用连接的数据源，以及下面的分类分布查询。
--
--     NO_FIRST_QUESTION_AVAILABLE:
--       没有剩余首题。
--
--     NOT_ENOUGH_NORMAL_QUESTIONS_AVAILABLE:
--       剩余普通题数量少于 4。
--
--     NORMAL_CATEGORY_WIDTH_NOT_ENOUGH:
--       普通题总数可能不少，但分类太集中。
--       选定首题并排除首题分类后，剩下的普通题分类数不够凑满一天。
WITH remaining AS (
  SELECT
    u.id,
    u.as_first,
    u.category
  FROM faq.usb u
  LEFT JOIN faq.random_usb r
    ON r.question_id = u.id
  WHERE u.deleted = 0
    AND r.question_id IS NULL
),
summary AS (
  SELECT
    COUNT(*) AS remaining_questions,
    COUNT(*) FILTER (WHERE as_first = 1) AS available_first_questions,
    COUNT(*) FILTER (WHERE as_first = 0) AS available_normal_questions,
    COUNT(DISTINCT category) FILTER (WHERE as_first = 0) AS normal_category_count
  FROM remaining
),
normal_categories AS (
  SELECT DISTINCT category
  FROM remaining
  WHERE as_first = 0
),
first_category_check AS (
  SELECT
    f.category AS first_category,
    COUNT(*) AS first_question_count,
    s.normal_category_count - CASE WHEN nc.category IS NULL THEN 0 ELSE 1 END AS normal_categories_after_excluding_first
  FROM remaining f
  CROSS JOIN summary s
  LEFT JOIN normal_categories nc
    ON nc.category = f.category
  WHERE f.as_first = 1
  GROUP BY f.category, s.normal_category_count, nc.category
)
SELECT
  s.available_first_questions AS "ATF",
  s.remaining_questions AS "Remain Total",
  s.available_normal_questions AS "Normal Remain",
  s.normal_category_count AS "Normal Category Count",
  COALESCE(MAX(c.normal_categories_after_excluding_first), 0) AS "Best Available Normal Categories",
  CASE
    WHEN s.available_first_questions = 0 THEN 'NO_FIRST_QUESTION_AVAILABLE'
    WHEN s.available_normal_questions < 4 THEN 'NOT_ENOUGH_NORMAL_QUESTIONS_AVAILABLE'
    WHEN COALESCE(MAX(c.normal_categories_after_excluding_first), 0) < 4 THEN 'NORMAL_CATEGORY_WIDTH_NOT_ENOUGH'
    ELSE 'AT_LEAST_ONE_DAY_SHOULD_BE_POSSIBLE'
  END AS diagnosis
FROM summary s
LEFT JOIN first_category_check c ON true
GROUP BY
  s.available_first_questions,
  s.remaining_questions,
  s.available_normal_questions,
  s.normal_category_count;


-- ---------------------------------------------------------------------------
-- 2. 按分类查看剩余库存
-- ---------------------------------------------------------------------------
-- 用途：
--   看剩余题是不是集中在少数 category。
--   这是解释“ATF、Remain Total 不低，但 New Days 很低”的最快查询。
--
-- 结果解释：
--   当前算法需要足够多的普通题分类，不只是需要足够多的普通题总数。
--   RANDOM_USB_DAILY_COUNT = 5 时，每天需要 4 个普通题分类，
--   并且这 4 个分类不能包含当天首题分类。
--
--   如果 normal_count > 0 的分类只有 3 个，下一天一定生成不了。
--
--   如果 normal_count > 0 的分类刚好 4 个，但所有可用首题也都在这 4 个分类里，
--   下一天也生成不了。因为选任意首题都会排除掉其中一个普通题分类。
WITH remaining AS (
  SELECT
    u.id,
    u.as_first,
    u.category
  FROM faq.usb u
  LEFT JOIN faq.random_usb r
    ON r.question_id = u.id
  WHERE u.deleted = 0
    AND r.question_id IS NULL
)
SELECT
  category,
  COUNT(*) FILTER (WHERE as_first = 1) AS first_count,
  COUNT(*) FILTER (WHERE as_first = 0) AS normal_count,
  COUNT(*) AS total_count
FROM remaining
GROUP BY category
ORDER BY normal_count DESC, first_count DESC, category;


-- ---------------------------------------------------------------------------
-- 3. 按首题分类查看是否可生成下一天
-- ---------------------------------------------------------------------------
-- 用途：
--   按“首题分类”逐个看，选这个分类做首题时，下一天能不能生成。
--
-- 结果解释：
--   CAN_GENERATE:
--     这个分类可以作为首题分类。
--     排除它以后，仍然能找到 4 个不同的普通题分类。
--
--   BLOCKED:
--     这个分类不能作为首题分类。
--     排除它以后，剩余普通题分类少于 4 个。
--
--   如果每一行都是 BLOCKED，说明当前剩余库存无法生成下一天。
WITH remaining AS (
  SELECT
    u.id,
    u.as_first,
    u.category
  FROM faq.usb u
  LEFT JOIN faq.random_usb r
    ON r.question_id = u.id
  WHERE u.deleted = 0
    AND r.question_id IS NULL
),
summary AS (
  SELECT
    COUNT(DISTINCT category) FILTER (WHERE as_first = 0) AS normal_category_count
  FROM remaining
),
normal_categories AS (
  SELECT DISTINCT category
  FROM remaining
  WHERE as_first = 0
)
SELECT
  f.category AS first_category,
  COUNT(*) AS first_question_count,
  s.normal_category_count - CASE WHEN nc.category IS NULL THEN 0 ELSE 1 END AS normal_categories_available,
  CASE
    WHEN s.normal_category_count - CASE WHEN nc.category IS NULL THEN 0 ELSE 1 END >= 4
    THEN 'CAN_GENERATE'
    ELSE 'BLOCKED'
  END AS status
FROM remaining f
CROSS JOIN summary s
LEFT JOIN normal_categories nc
  ON nc.category = f.category
WHERE f.as_first = 1
GROUP BY f.category, s.normal_category_count, nc.category
ORDER BY normal_categories_available DESC, first_question_count DESC, first_category;


-- ---------------------------------------------------------------------------
-- 4. analysis 接口基础计数交叉核对
-- ---------------------------------------------------------------------------
-- 用途：
--   核对 GET /api/random-questions/analysis 暴露出来的几个基础计数。
--
-- 结果解释：
--   GeneDays:
--     random_usb 里已经生成过多少个 show_date。
--
--   Question Total:
--     faq.usb 里未删除题目总数。
--
--   Used Total:
--     已经进入过 random_usb 的去重题目数。
--
--   Remain Total:
--     未删除、且从未进入 random_usb 的题目数。
--
--   ATF:
--     剩余首题数量。
WITH used_question_ids AS (
  SELECT DISTINCT question_id
  FROM faq.random_usb
),
remaining AS (
  SELECT
    u.id,
    u.as_first
  FROM faq.usb u
  LEFT JOIN used_question_ids used
    ON used.question_id = u.id
  WHERE u.deleted = 0
    AND used.question_id IS NULL
)
SELECT
  (SELECT COUNT(DISTINCT show_date) FROM faq.random_usb) AS "GeneDays",
  (SELECT COUNT(*) FROM remaining WHERE as_first = 1) AS "ATF",
  (SELECT COUNT(*) FROM faq.usb WHERE deleted = 0) AS "Question Total",
  (SELECT COUNT(*) FROM used_question_ids) AS "Used Total",
  (SELECT COUNT(*) FROM remaining) AS "Remain Total";
