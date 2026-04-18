CREATE TABLE IF NOT EXISTS faq.outer_client (
  id BIGSERIAL PRIMARY KEY,
  client_id VARCHAR(100) NOT NULL UNIQUE,
  name VARCHAR(255) NOT NULL,
  status VARCHAR(50) NOT NULL DEFAULT 'active',
  remark TEXT NULL,
  created_by_user_id UUID NULL,
  updated_by_user_id UUID NULL,
  created_at TIMESTAMPTZ(6) NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ(6) NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_outer_client_status
  ON faq.outer_client (status);

CREATE TABLE IF NOT EXISTS faq.outer_client_key (
  id BIGSERIAL PRIMARY KEY,
  client_id VARCHAR(100) NOT NULL,
  environment VARCHAR(20) NOT NULL,
  key_version VARCHAR(50) NOT NULL,
  algorithm VARCHAR(50) NOT NULL DEFAULT 'ed25519',
  public_key TEXT NOT NULL,
  fingerprint VARCHAR(255) NULL,
  status VARCHAR(50) NOT NULL DEFAULT 'active',
  expires_at TIMESTAMPTZ(6) NULL,
  last_used_at TIMESTAMPTZ(6) NULL,
  created_at TIMESTAMPTZ(6) NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ(6) NOT NULL DEFAULT NOW(),
  CONSTRAINT fk_outer_client_key_client_id
    FOREIGN KEY (client_id) REFERENCES faq.outer_client(client_id)
);

CREATE UNIQUE INDEX IF NOT EXISTS uq_outer_client_key_client_id_key_version
  ON faq.outer_client_key (client_id, key_version);

CREATE INDEX IF NOT EXISTS idx_outer_client_key_client_id_status
  ON faq.outer_client_key (client_id, status);

CREATE INDEX IF NOT EXISTS idx_outer_client_key_environment
  ON faq.outer_client_key (environment);
