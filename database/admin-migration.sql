-- Migration idempotente pour les bases Finora existantes.
USE Finora_db;

SET @role_exists = (
  SELECT COUNT(*) FROM information_schema.COLUMNS
  WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = 'users' AND COLUMN_NAME = 'role'
);
SET @role_sql = IF(
  @role_exists = 0,
  "ALTER TABLE users ADD COLUMN role ENUM('user', 'admin') NOT NULL DEFAULT 'user'",
  'SELECT 1'
);
PREPARE role_stmt FROM @role_sql;
EXECUTE role_stmt;
DEALLOCATE PREPARE role_stmt;

SET @active_exists = (
  SELECT COUNT(*) FROM information_schema.COLUMNS
  WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = 'users' AND COLUMN_NAME = 'is_active'
);
SET @active_sql = IF(
  @active_exists = 0,
  'ALTER TABLE users ADD COLUMN is_active BOOLEAN NOT NULL DEFAULT TRUE',
  'SELECT 1'
);
PREPARE active_stmt FROM @active_sql;
EXECUTE active_stmt;
DEALLOCATE PREPARE active_stmt;

CREATE TABLE IF NOT EXISTS user_daily_activity (
  user_id        INT UNSIGNED NOT NULL,
  day            DATE NOT NULL,
  logged_in      BOOLEAN NOT NULL DEFAULT FALSE,
  active_seconds BIGINT UNSIGNED NOT NULL DEFAULT 0,
  last_seen_at   DATETIME(3) NULL,
  PRIMARY KEY (user_id, day),
  KEY idx_user_daily_activity_day (day),
  CONSTRAINT fk_user_daily_activity_user
    FOREIGN KEY (user_id) REFERENCES users (id) ON DELETE CASCADE
) ENGINE = InnoDB DEFAULT CHARSET = utf8mb4 COLLATE = utf8mb4_unicode_ci;
