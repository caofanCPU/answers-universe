-- 创建faq.usb表（tags改为TEXT类型，默认空串）
CREATE TABLE IF NOT EXISTS faq.usb (
    id BIGSERIAL PRIMARY KEY,
    question TEXT NOT NULL,
    cdn_image_prefix VARCHAR(50),
    question_image VARCHAR(255),
    correct_answer TEXT NOT NULL,
    incorrect_answers JSON NOT NULL,
    explanation TEXT NOT NULL,
    difficulty VARCHAR(30) NOT NULL,
    category VARCHAR(100) NOT NULL,
    as_first SMALLINT NOT NULL DEFAULT 0,
    tags TEXT NOT NULL DEFAULT '',
    create_user_id UUID NOT NULL,
    update_user_id UUID NOT NULL,
    created_at TIMESTAMPTZ(6) DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMPTZ(6) DEFAULT CURRENT_TIMESTAMP
);

-- 创建核心索引
CREATE INDEX idx_usb_category ON faq.usb(category);
CREATE INDEX idx_usb_difficulty ON faq.usb(difficulty);
