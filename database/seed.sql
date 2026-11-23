-- =============================================================================
-- Finora — jeu de données de démonstration
-- Compte : demo@finora.app / demo1234
-- Script idempotent : il remplace les données de démonstration uniquement.
-- À importer APRÈS schema.sql.
-- =============================================================================

USE Finora_db;

SET NAMES utf8mb4 COLLATE utf8mb4_unicode_ci;

SET @email = 'demo@finora.app';

INSERT INTO users (email, password_hash, name)
VALUES (@email, '$2a$12$QLum40RZpBVbbghsDqIgc.3utoCYCXrsCo6cDHWJCknlp4VC.sjSe', 'Camille Rousseau')
ON DUPLICATE KEY UPDATE password_hash = VALUES(password_hash), name = VALUES(name);

SET @user = (SELECT id FROM users WHERE email = @email);

DELETE FROM transactions WHERE user_id = @user;
DELETE FROM budgets      WHERE user_id = @user;
DELETE FROM categories   WHERE user_id = @user;

INSERT INTO categories (user_id, name, type) VALUES
  (@user, 'Alimentation',  'expense'),
  (@user, 'Transport',     'expense'),
  (@user, 'Logement',      'expense'),
  (@user, 'Loisirs',       'expense'),
  (@user, 'Santé',         'expense'),
  (@user, 'Abonnements',   'expense'),
  (@user, 'Éducation',     'expense'),
  (@user, 'Divers',        'expense'),
  (@user, 'Salaire',       'income'),
  (@user, 'Freelance',     'income'),
  (@user, 'Cadeaux',       'income'),
  (@user, 'Remboursements','income');

SET @alim     = (SELECT id FROM categories WHERE user_id = @user AND name = 'Alimentation');
SET @transport= (SELECT id FROM categories WHERE user_id = @user AND name = 'Transport');
SET @logement = (SELECT id FROM categories WHERE user_id = @user AND name = 'Logement');
SET @loisirs  = (SELECT id FROM categories WHERE user_id = @user AND name = 'Loisirs');
SET @sante    = (SELECT id FROM categories WHERE user_id = @user AND name = 'Santé');
SET @abos     = (SELECT id FROM categories WHERE user_id = @user AND name = 'Abonnements');
SET @salaire  = (SELECT id FROM categories WHERE user_id = @user AND name = 'Salaire');
SET @freelance= (SELECT id FROM categories WHERE user_id = @user AND name = 'Freelance');

SET @m0 = DATE_FORMAT(CURDATE(), '%Y-%m-01');
SET @m1 = DATE_FORMAT(DATE_SUB(CURDATE(), INTERVAL 1 MONTH), '%Y-%m-01');
SET @m2 = DATE_FORMAT(DATE_SUB(CURDATE(), INTERVAL 2 MONTH), '%Y-%m-01');

-- Mois en cours -------------------------------------------------------------
INSERT INTO transactions (user_id, category_id, label, amount, type, date) VALUES
  (@user, @salaire,   'Salaire — Studio Orion',      3250.00, 'income',  @m0),
  (@user, @logement,  'Loyer appartement',           890.00, 'expense', @m0),
  (@user, @alim,      'Courses Monoprix',             68.40, 'expense', LEAST(DATE_ADD(@m0, INTERVAL 1 DAY), CURDATE())),
  (@user, @transport, 'Pass Navigo',                  86.40, 'expense', LEAST(DATE_ADD(@m0, INTERVAL 2 DAY), CURDATE())),
  (@user, @loisirs,   'Concert — Philharmonie',       96.00, 'expense', LEAST(DATE_ADD(@m0, INTERVAL 2 DAY), CURDATE())),
  (@user, @alim,      'Boulangerie du coin',          12.80, 'expense', LEAST(DATE_ADD(@m0, INTERVAL 3 DAY), CURDATE())),
  (@user, @abos,      'Netflix',                      13.49, 'expense', LEAST(DATE_ADD(@m0, INTERVAL 4 DAY), CURDATE())),
  (@user, @sante,     'Pharmacie de la gare',         24.90, 'expense', LEAST(DATE_ADD(@m0, INTERVAL 5 DAY), CURDATE())),
  (@user, @alim,      'Marché du dimanche',           46.20, 'expense', LEAST(DATE_ADD(@m0, INTERVAL 6 DAY), CURDATE())),
  (@user, @freelance, 'Freelance — refonte de site',  620.00, 'income',  LEAST(DATE_ADD(@m0, INTERVAL 6 DAY), CURDATE())),
  (@user, @loisirs,   'Cinéma MK2',                   28.00, 'expense', LEAST(DATE_ADD(@m0, INTERVAL 7 DAY), CURDATE()));

-- Mois précédents -----------------------------------------------------------
INSERT INTO transactions (user_id, category_id, label, amount, type, date) VALUES
  (@user, @salaire,   'Salaire — Studio Orion',      3250.00, 'income',  @m1),
  (@user, @logement,  'Loyer appartement',           890.00, 'expense', @m1),
  (@user, @logement,  'Électricité EDF',              72.30, 'expense', DATE_ADD(@m1, INTERVAL 5 DAY)),
  (@user, @alim,      'Courses Monoprix',            124.60, 'expense', DATE_ADD(@m1, INTERVAL 3 DAY)),
  (@user, @alim,      'Marché du dimanche',           52.10, 'expense', DATE_ADD(@m1, INTERVAL 9 DAY)),
  (@user, @alim,      'Restaurant Bao',               38.00, 'expense', DATE_ADD(@m1, INTERVAL 17 DAY)),
  (@user, @alim,      'Courses Monoprix',            139.80, 'expense', DATE_ADD(@m1, INTERVAL 24 DAY)),
  (@user, @transport, 'Pass Navigo',                  86.40, 'expense', DATE_ADD(@m1, INTERVAL 2 DAY)),
  (@user, @transport, 'Essence',                      64.90, 'expense', DATE_ADD(@m1, INTERVAL 14 DAY)),
  (@user, @loisirs,   'Librairie Eyrolles',           34.00, 'expense', DATE_ADD(@m1, INTERVAL 11 DAY)),
  (@user, @loisirs,   'Concert',                      62.00, 'expense', DATE_ADD(@m1, INTERVAL 19 DAY)),
  (@user, @abos,      'Spotify',                      10.99, 'expense', DATE_ADD(@m1, INTERVAL 4 DAY)),
  (@user, @abos,      'Salle de sport',               29.90, 'expense', DATE_ADD(@m1, INTERVAL 6 DAY)),
  (@user, @sante,     'Consultation dentiste',        70.00, 'expense', DATE_ADD(@m1, INTERVAL 21 DAY)),
  (@user, @freelance, 'Freelance — mission data',    780.00, 'income',  DATE_ADD(@m1, INTERVAL 16 DAY)),

  (@user, @salaire,   'Salaire — Studio Orion',      3250.00, 'income',  @m2),
  (@user, @logement,  'Loyer appartement',           890.00, 'expense', @m2),
  (@user, @alim,      'Courses Monoprix',            142.20, 'expense', DATE_ADD(@m2, INTERVAL 4 DAY)),
  (@user, @alim,      'Marché du dimanche',           61.40, 'expense', DATE_ADD(@m2, INTERVAL 12 DAY)),
  (@user, @transport, 'Pass Navigo',                  86.40, 'expense', DATE_ADD(@m2, INTERVAL 2 DAY)),
  (@user, @loisirs,   'Sortie vélo',                  42.00, 'expense', DATE_ADD(@m2, INTERVAL 15 DAY)),
  (@user, @loisirs,   'Cinéma MK2',                   28.00, 'expense', DATE_ADD(@m2, INTERVAL 22 DAY)),
  (@user, @sante,     'Pharmacie',                    18.60, 'expense', DATE_ADD(@m2, INTERVAL 8 DAY)),
  (@user, @abos,      'Netflix',                      13.49, 'expense', DATE_ADD(@m2, INTERVAL 5 DAY)),
  (@user, @freelance, 'Freelance — audit UX',        480.00, 'income',  DATE_ADD(@m2, INTERVAL 20 DAY));

-- Budgets -------------------------------------------------------------------
INSERT INTO budgets (user_id, category_id, month, limit_amount) VALUES
  (@user, @alim,      @m0, 400.00),
  (@user, @transport, @m0, 120.00),
  (@user, @loisirs,   @m0, 110.00),
  (@user, @abos,      @m0,  40.00),
  (@user, @sante,     @m0,  60.00),
  (@user, @alim,      @m1, 400.00),
  (@user, @transport, @m1, 140.00),
  (@user, @loisirs,   @m1, 150.00),
  (@user, @abos,      @m1,  45.00)
ON DUPLICATE KEY UPDATE limit_amount = VALUES(limit_amount);
