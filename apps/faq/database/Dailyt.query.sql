SELECT
    r.show_date,
    u.question,
    r.question_id,
    r.question_uuid,
    r.as_first,
    r.sort_order
  FROM faq.random_usb r
  LEFT JOIN faq.usb u
    ON u.id = r.question_id
  WHERE r.show_date >= '2026-01-01'
  ORDER BY r.show_date ASC, r.sort_order ASC;