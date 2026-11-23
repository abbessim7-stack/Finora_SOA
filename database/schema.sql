-- =============================================================================
-- Finora — schéma de la base MySQL 8 / MariaDB 10.5+
-- Script idempotent : peut être rejoué sans perdre les données existantes.
-- Import : HeidiSQL > Fichier > Exécuter le script SQL, ou
--          mysql -u root < database/schema.sql
-- =============================================================================

CREATE DATABASE IF NOT EXISTS Finora_db
  CHARACTER SET utf8mb4
  COLLATE utf8mb4_unicode_ci;

USE Finora_db;

-- Charset explicite : le script reste correct quel que soit le client (HeidiSQL,
-- mysql.exe sous Windows, etc.).
SET NAMES utf8mb4 COLLATE utf8mb4_unicode_ci;

-- ---------------------------------------------------------------------------
-- Utilisateurs
-- ---------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS users (
  id            INT UNSIGNED NOT NULL AUTO_INCREMENT,
  email         VARCHAR(180) NOT NULL,
  password_hash VARCHAR(255) NOT NULL,
  name          VARCHAR(80)  NOT NULL,
  role          ENUM('user', 'admin') NOT NULL DEFAULT 'user',
  is_active     BOOLEAN      NOT NULL DEFAULT TRUE,
  created_at    TIMESTAMP    NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (id),
  UNIQUE KEY uq_users_email (email)
) ENGINE = InnoDB DEFAULT CHARSET = utf8mb4 COLLATE = utf8mb4_unicode_ci;

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

-- ---------------------------------------------------------------------------
-- Catégories : un nom unique par utilisateur et par type
-- La contrainte (id, user_id) permet la clé étrangère composite des transactions.
-- ---------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS categories (
  id         INT UNSIGNED NOT NULL AUTO_INCREMENT,
  user_id    INT UNSIGNED NOT NULL,
  name       VARCHAR(40)  NOT NULL,
  type       ENUM('income', 'expense') NOT NULL,
  created_at TIMESTAMP    NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (id),
  UNIQUE KEY uq_categories_user_name_type (user_id, name, type),
  UNIQUE KEY uq_categories_id_user (id, user_id),
  KEY idx_categories_user_type (user_id, type),
  CONSTRAINT fk_categories_user FOREIGN KEY (user_id) REFERENCES users (id) ON DELETE CASCADE
) ENGINE = InnoDB DEFAULT CHARSET = utf8mb4 COLLATE = utf8mb4_unicode_ci;

-- ---------------------------------------------------------------------------
-- Transactions : montants en DECIMAL(12,2), jamais de flottant
-- La clé étrangère composite (category_id, user_id) garantit qu'une transaction
-- ne peut référencer une catégorie appartenant à un autre utilisateur.
-- ---------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS transactions (
  id          BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
  user_id     INT UNSIGNED    NOT NULL,
  category_id INT UNSIGNED    NOT NULL,
  label       VARCHAR(120)    NOT NULL,
  amount      DECIMAL(12, 2)  NOT NULL,
  type        ENUM('income', 'expense') NOT NULL,
  date        DATE            NOT NULL,
  created_at  TIMESTAMP       NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (id),
  KEY idx_transactions_user_date (user_id, date),
  KEY idx_transactions_user_category (user_id, category_id),
  KEY idx_transactions_user_type (user_id, type),
  CONSTRAINT chk_transactions_amount CHECK (amount > 0),
  CONSTRAINT fk_transactions_user FOREIGN KEY (user_id) REFERENCES users (id) ON DELETE CASCADE,
  CONSTRAINT fk_transactions_category FOREIGN KEY (category_id, user_id)
    REFERENCES categories (id, user_id) ON DELETE RESTRICT
) ENGINE = InnoDB DEFAULT CHARSET = utf8mb4 COLLATE = utf8mb4_unicode_ci;

-- ---------------------------------------------------------------------------
-- Budgets : un seul plafond par catégorie et par mois
-- ---------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS budgets (
  id           BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
  user_id      INT UNSIGNED    NOT NULL,
  category_id  INT UNSIGNED    NOT NULL,
  month        DATE            NOT NULL,
  limit_amount DECIMAL(12, 2)  NOT NULL,
  created_at   TIMESTAMP       NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (id),
  UNIQUE KEY uq_budgets_user_category_month (user_id, category_id, month),
  KEY idx_budgets_user_month (user_id, month),
  CONSTRAINT chk_budgets_limit CHECK (limit_amount > 0),
  CONSTRAINT fk_budgets_user FOREIGN KEY (user_id) REFERENCES users (id) ON DELETE CASCADE,
  CONSTRAINT fk_budgets_category FOREIGN KEY (category_id, user_id)
    REFERENCES categories (id, user_id) ON DELETE CASCADE
) ENGINE = InnoDB DEFAULT CHARSET = utf8mb4 COLLATE = utf8mb4_unicode_ci;

-- ---------------------------------------------------------------------------
-- Vue d'agrégation mensuelle utilisée par les rapports
-- ---------------------------------------------------------------------------
CREATE OR REPLACE VIEW monthly_summary AS
SELECT
  t.user_id,
  t.month,
  SUM(CASE WHEN t.type = 'income'  THEN t.amount ELSE 0 END) AS income,
  SUM(CASE WHEN t.type = 'expense' THEN t.amount ELSE 0 END) AS expense,
  SUM(CASE WHEN t.type = 'income'  THEN t.amount ELSE -t.amount END) AS balance
FROM (
  SELECT user_id, type, amount, CAST(DATE_FORMAT(date, '%Y-%m-01') AS DATE) AS month
  FROM transactions
) AS t
GROUP BY t.user_id, t.month;
