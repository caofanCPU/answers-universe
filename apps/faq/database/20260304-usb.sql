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
    difficulty VARCHAR(30) NOT NULL DEFAULT 'unknown',
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
    CONSTRAINT chk_usb_difficulty CHECK (difficulty IN ('unknown', 'easy', 'medium', 'hard')),
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

ALTER SEQUENCE faq.usb_id_seq RESTART WITH 10000;

CREATE INDEX idx_usb_category ON faq.usb(category);
CREATE INDEX idx_usb_difficulty ON faq.usb(difficulty);


-- DROP TABLE IF EXISTS faq.random_usb;

CREATE TABLE faq.random_usb (
    id BIGSERIAL PRIMARY KEY,
    show_date DATE NOT NULL,
    question_id BIGINT NOT NULL,
    question_uuid UUID NOT NULL,
    as_first SMALLINT NOT NULL DEFAULT 0,
    category VARCHAR(100) NOT NULL,
    sort_order INTEGER NOT NULL,
    created_at TIMESTAMPTZ(6) DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMPTZ(6) DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT uq_random_usb_question_id UNIQUE (question_id),
    CONSTRAINT uq_random_usb_show_date_question_id UNIQUE (show_date, question_id),
    CONSTRAINT chk_random_usb_as_first CHECK (as_first IN (0, 1))
);

CREATE INDEX idx_random_usb_show_date ON faq.random_usb(show_date);
CREATE INDEX idx_random_usb_show_date_sort_order ON faq.random_usb(show_date, sort_order);
