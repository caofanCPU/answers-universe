-- DROP TABLE IF EXISTS faq.usb;

CREATE TABLE faq.usb (
    id BIGSERIAL PRIMARY KEY,
    question_uuid UUID NOT NULL,
    question TEXT NOT NULL,
    cdn_image_prefix VARCHAR(50),
    question_image VARCHAR(255),
    correct_answer TEXT NOT NULL,
    correct_answer_index INTEGER NOT NULL DEFAULT 0,
    incorrect_answers JSON NOT NULL,
    explanation TEXT NOT NULL,
    difficulty VARCHAR(30) NOT NULL,
    category VARCHAR(100) NOT NULL,
    sub_category VARCHAR(500),
    as_first SMALLINT NOT NULL DEFAULT 0,
    tags TEXT NOT NULL DEFAULT '',
    keywords JSON,
    deleted INTEGER NOT NULL DEFAULT 0,
    create_user_id UUID NOT NULL,
    update_user_id UUID NOT NULL,
    created_at TIMESTAMPTZ(6) DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMPTZ(6) DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT uq_usb_question_uuid UNIQUE (question_uuid),
    CONSTRAINT chk_usb_correct_answer_index CHECK (correct_answer_index >= 0),
    CONSTRAINT chk_usb_deleted CHECK (deleted IN (0, 1)),
    CONSTRAINT chk_usb_as_first CHECK (as_first IN (0, 1)),
    CONSTRAINT chk_usb_difficulty CHECK (difficulty IN ('easy', 'medium', 'hard')),
    CONSTRAINT chk_usb_category CHECK (
        category IN (
            'Science & Nature',
            'Tech & Innovation',
            'Pop Culture',
            'Lifestyle & Fun',
            'Geography',
            'History',
            'Sports',
            'Music',
            'Sociology',
            'Art & Culture',
            'General Knowledge',
            'Food & Drink',
            'Psychology',
            'Linguistics',
            'Environment & Climate',
            'Business & Economics',
            'Architecture'
        )
    ),
    CONSTRAINT chk_usb_sub_category CHECK (
        sub_category IS NULL OR sub_category IN ('animal', 'movie', 'science', 'car', 'soccer', 'chemistry')
    )
);

CREATE INDEX idx_usb_category ON faq.usb(category);
CREATE INDEX idx_usb_difficulty ON faq.usb(difficulty);
