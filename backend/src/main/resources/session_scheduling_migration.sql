-- ============================================================
-- Session Scheduling Module — Database Migration
-- Run once against your Skillify database.
-- ============================================================

-- 1. Add new columns to existing `sessions` table
-- (Spring JPA will also do this via ddl-auto=update, but this
--  gives you explicit control in production)

ALTER TABLE sessions
    ADD COLUMN IF NOT EXISTS host_user_id    BIGINT         NULL,
    ADD COLUMN IF NOT EXISTS session_request_id BIGINT     NULL,
    ADD COLUMN IF NOT EXISTS meeting_provider   VARCHAR(30) NULL,
    ADD COLUMN IF NOT EXISTS created_at     DATETIME(6)    NULL DEFAULT CURRENT_TIMESTAMP(6),
    ADD COLUMN IF NOT EXISTS updated_at     DATETIME(6)    NULL DEFAULT CURRENT_TIMESTAMP(6) ON UPDATE CURRENT_TIMESTAMP(6);

-- 2. Allow ONGOING and CANCELLED in the status enum
-- MySQL ENUM — if using TEXT/VARCHAR already this is a no-op
-- ALTER TABLE sessions MODIFY COLUMN status ENUM('SCHEDULED','ONGOING','COMPLETED','CANCELLED') NOT NULL DEFAULT 'SCHEDULED';

-- 3. Extend meeting_link column to hold longer URLs (Teams links can be long)
ALTER TABLE sessions
    MODIFY COLUMN meeting_link VARCHAR(2048) NULL;

-- 4. Indexes for common queries
CREATE INDEX IF NOT EXISTS idx_sessions_request_id  ON sessions (session_request_id);
CREATE INDEX IF NOT EXISTS idx_sessions_host_user   ON sessions (host_user_id);
CREATE INDEX IF NOT EXISTS idx_sessions_status_time ON sessions (status, scheduled_time);

-- 5. Full schema reference (what the sessions table should look like after migration)
/*
CREATE TABLE sessions (
    id                  BIGINT AUTO_INCREMENT PRIMARY KEY,
    user1_id            BIGINT      NOT NULL,
    user2_id            BIGINT      NOT NULL,
    host_user_id        BIGINT          NULL,
    session_request_id  BIGINT          NULL,
    skill               VARCHAR(255)NOT NULL,
    scheduled_time      VARCHAR(255)    NULL,
    meeting_link        VARCHAR(2048)   NULL,
    meeting_provider    VARCHAR(30)     NULL,
    status              VARCHAR(30) NOT NULL DEFAULT 'SCHEDULED',
    one_way             TINYINT(1)  NOT NULL DEFAULT 0,
    user1_rating        INT         NOT NULL DEFAULT 0,
    user2_rating        INT         NOT NULL DEFAULT 0,
    user1_review        VARCHAR(1000)   NULL,
    user2_review        VARCHAR(1000)   NULL,
    reminder30_sent     TINYINT(1)  NOT NULL DEFAULT 0,
    reminder10_sent     TINYINT(1)  NOT NULL DEFAULT 0,
    reminder_at_sent    TINYINT(1)  NOT NULL DEFAULT 0,
    created_at          DATETIME(6)     NULL DEFAULT CURRENT_TIMESTAMP(6),
    updated_at          DATETIME(6)     NULL DEFAULT CURRENT_TIMESTAMP(6) ON UPDATE CURRENT_TIMESTAMP(6),

    CONSTRAINT fk_sessions_user1 FOREIGN KEY (user1_id) REFERENCES users(id) ON DELETE CASCADE,
    CONSTRAINT fk_sessions_user2 FOREIGN KEY (user2_id) REFERENCES users(id) ON DELETE CASCADE,

    INDEX idx_sessions_user1    (user1_id),
    INDEX idx_sessions_user2    (user2_id),
    INDEX idx_sessions_request  (session_request_id),
    INDEX idx_sessions_host     (host_user_id),
    INDEX idx_sessions_status   (status, scheduled_time)
);
*/
