-- MySQL dump 10.13  Distrib 8.4.3, for Win64 (x86_64)
--
-- Host: localhost    Database: finora
-- ------------------------------------------------------
-- Server version	8.4.3

/*!40101 SET @OLD_CHARACTER_SET_CLIENT=@@CHARACTER_SET_CLIENT */;
/*!40101 SET @OLD_CHARACTER_SET_RESULTS=@@CHARACTER_SET_RESULTS */;
/*!40101 SET @OLD_COLLATION_CONNECTION=@@COLLATION_CONNECTION */;
/*!50503 SET NAMES utf8mb4 */;
/*!40103 SET @OLD_TIME_ZONE=@@TIME_ZONE */;
/*!40103 SET TIME_ZONE='+00:00' */;
/*!40014 SET @OLD_UNIQUE_CHECKS=@@UNIQUE_CHECKS, UNIQUE_CHECKS=0 */;
/*!40014 SET @OLD_FOREIGN_KEY_CHECKS=@@FOREIGN_KEY_CHECKS, FOREIGN_KEY_CHECKS=0 */;
/*!40101 SET @OLD_SQL_MODE=@@SQL_MODE, SQL_MODE='NO_AUTO_VALUE_ON_ZERO' */;
/*!40111 SET @OLD_SQL_NOTES=@@SQL_NOTES, SQL_NOTES=0 */;

--
-- Current Database: `finora`
--

CREATE DATABASE /*!32312 IF NOT EXISTS*/ `finora` /*!40100 DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci */ /*!80016 DEFAULT ENCRYPTION='N' */;

USE `finora`;

--
-- Table structure for table `budgets`
--

DROP TABLE IF EXISTS `budgets`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `budgets` (
  `id` int unsigned NOT NULL AUTO_INCREMENT,
  `user_id` int unsigned NOT NULL,
  `category_id` int unsigned NOT NULL,
  `month` date NOT NULL,
  `amount` decimal(12,2) NOT NULL,
  `created_at` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  UNIQUE KEY `uq_budgets_owner_category_month` (`user_id`,`category_id`,`month`),
  KEY `idx_budgets_user_month` (`user_id`,`month`),
  CONSTRAINT `fk_budgets_category` FOREIGN KEY (`user_id`, `category_id`) REFERENCES `categories` (`user_id`, `id`) ON DELETE CASCADE,
  CONSTRAINT `fk_budgets_user` FOREIGN KEY (`user_id`) REFERENCES `users` (`id`) ON DELETE CASCADE,
  CONSTRAINT `chk_budgets_amount` CHECK ((`amount` > 0)),
  CONSTRAINT `chk_budgets_first_day` CHECK ((dayofmonth(`month`) = 1))
) ENGINE=InnoDB AUTO_INCREMENT=7 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `budgets`
--

LOCK TABLES `budgets` WRITE;
/*!40000 ALTER TABLE `budgets` DISABLE KEYS */;
INSERT INTO `budgets` VALUES (1,1,5,'2026-11-01',1000.00,'2026-11-03 17:19:41','2026-11-03 17:19:41'),(2,1,4,'2026-11-01',350.00,'2026-11-03 17:19:41','2026-11-03 17:19:41'),(3,1,6,'2026-11-01',120.00,'2026-11-03 17:19:41','2026-11-03 17:19:41'),(4,1,7,'2026-11-01',150.00,'2026-11-03 17:19:41','2026-11-03 17:19:41'),(5,1,9,'2026-11-01',40.00,'2026-11-03 17:19:41','2026-11-03 17:19:41');
/*!40000 ALTER TABLE `budgets` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `categories`
--

DROP TABLE IF EXISTS `categories`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `categories` (
  `id` int unsigned NOT NULL AUTO_INCREMENT,
  `user_id` int unsigned NOT NULL,
  `name` varchar(80) COLLATE utf8mb4_unicode_ci NOT NULL,
  `type` enum('income','expense') COLLATE utf8mb4_unicode_ci NOT NULL,
  `created_at` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  UNIQUE KEY `uq_categories_owner_name_type` (`user_id`,`name`,`type`),
  UNIQUE KEY `uq_categories_owner_id` (`user_id`,`id`),
  UNIQUE KEY `uq_categories_owner_id_type` (`user_id`,`id`,`type`),
  KEY `idx_categories_user_type` (`user_id`,`type`),
  CONSTRAINT `fk_categories_user` FOREIGN KEY (`user_id`) REFERENCES `users` (`id`) ON DELETE CASCADE,
  CONSTRAINT `chk_categories_name` CHECK ((char_length(trim(`name`)) > 0))
) ENGINE=InnoDB AUTO_INCREMENT=67 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `categories`
--

LOCK TABLES `categories` WRITE;
/*!40000 ALTER TABLE `categories` DISABLE KEYS */;
INSERT INTO `categories` VALUES (1,1,'Salaire','income','2026-11-03 17:19:41'),(2,1,'Freelance','income','2026-11-03 17:19:41'),(3,1,'Cadeaux','income','2026-11-03 17:19:41'),(4,1,'Alimentation','expense','2026-11-03 17:19:41'),(5,1,'Logement','expense','2026-11-03 17:19:41'),(6,1,'Transport','expense','2026-11-03 17:19:41'),(7,1,'Loisirs','expense','2026-11-03 17:19:41'),(8,1,'Santé','expense','2026-11-03 17:19:41'),(9,1,'Abonnements','expense','2026-11-03 17:19:41'),(28,4,'Salaire','income','2026-11-03 17:53:05'),(29,4,'Freelance','income','2026-11-03 17:53:05'),(30,4,'Cadeaux','income','2026-11-03 17:53:05'),(31,4,'Alimentation','expense','2026-11-03 17:53:05'),(32,4,'Logement','expense','2026-11-03 17:53:05'),(33,4,'Transport','expense','2026-11-03 17:53:05'),(34,4,'Loisirs','expense','2026-11-03 17:53:05'),(35,4,'Santé','expense','2026-11-03 17:53:05'),(36,4,'Abonnements','expense','2026-11-03 17:53:05'),(37,6,'Salaire','income','2026-11-03 17:54:30'),(38,6,'Freelance','income','2026-11-03 17:54:30'),(39,6,'Cadeaux','income','2026-11-03 17:54:30'),(40,6,'Alimentation','expense','2026-11-03 17:54:30'),(41,6,'Logement','expense','2026-11-03 17:54:30'),(42,6,'Transport','expense','2026-11-03 17:54:30'),(43,6,'Loisirs','expense','2026-11-03 17:54:30'),(44,6,'Santé','expense','2026-11-03 17:54:30'),(45,6,'Abonnements','expense','2026-11-03 17:54:30'),(46,8,'Salaire','income','2026-11-03 18:00:32'),(47,8,'Freelance','income','2026-11-03 18:00:32'),(48,8,'Cadeaux','income','2026-11-03 18:00:32'),(49,8,'Alimentation','expense','2026-11-03 18:00:32'),(50,8,'Logement','expense','2026-11-03 18:00:32'),(51,8,'Transport','expense','2026-11-03 18:00:32'),(52,8,'Loisirs','expense','2026-11-03 18:00:32'),(53,8,'Santé','expense','2026-11-03 18:00:32'),(54,8,'Abonnements','expense','2026-11-03 18:00:32'),(55,12,'Alimentation','expense','2026-11-08 14:56:50'),(56,12,'Transport','expense','2026-11-08 14:56:50'),(57,12,'Logement','expense','2026-11-08 14:56:50'),(58,12,'Loisirs','expense','2026-11-08 14:56:50'),(59,12,'Sant├®','expense','2026-11-08 14:56:50'),(60,12,'Abonnements','expense','2026-11-08 14:56:50'),(61,12,'├ëducation','expense','2026-11-08 14:56:50'),(62,12,'Divers','expense','2026-11-08 14:56:50'),(63,12,'Salaire','income','2026-11-08 14:56:50'),(64,12,'Freelance','income','2026-11-08 14:56:50'),(65,12,'Cadeaux','income','2026-11-08 14:56:50'),(66,12,'Remboursements','income','2026-11-08 14:56:50');
/*!40000 ALTER TABLE `categories` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Temporary view structure for view `monthly_summary`
--

DROP TABLE IF EXISTS `monthly_summary`;
/*!50001 DROP VIEW IF EXISTS `monthly_summary`*/;
SET @saved_cs_client     = @@character_set_client;
/*!50503 SET character_set_client = utf8mb4 */;
/*!50001 CREATE VIEW `monthly_summary` AS SELECT 
 1 AS `user_id`,
 1 AS `month`,
 1 AS `income`,
 1 AS `expense`,
 1 AS `balance`*/;
SET character_set_client = @saved_cs_client;

--
-- Table structure for table `transactions`
--

DROP TABLE IF EXISTS `transactions`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `transactions` (
  `id` int unsigned NOT NULL AUTO_INCREMENT,
  `user_id` int unsigned NOT NULL,
  `category_id` int unsigned NOT NULL,
  `label` varchar(160) COLLATE utf8mb4_unicode_ci NOT NULL,
  `amount` decimal(12,2) NOT NULL,
  `type` enum('income','expense') COLLATE utf8mb4_unicode_ci NOT NULL,
  `date` date NOT NULL,
  `created_at` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  KEY `idx_transactions_user_date` (`user_id`,`date`),
  KEY `idx_transactions_user_type_date` (`user_id`,`type`,`date`),
  KEY `idx_transactions_user_category_date` (`user_id`,`category_id`,`date`),
  KEY `fk_transactions_category` (`user_id`,`category_id`,`type`),
  CONSTRAINT `fk_transactions_category` FOREIGN KEY (`user_id`, `category_id`, `type`) REFERENCES `categories` (`user_id`, `id`, `type`) ON DELETE RESTRICT ON UPDATE CASCADE,
  CONSTRAINT `fk_transactions_user` FOREIGN KEY (`user_id`) REFERENCES `users` (`id`) ON DELETE CASCADE,
  CONSTRAINT `chk_transactions_amount` CHECK ((`amount` > 0)),
  CONSTRAINT `chk_transactions_label` CHECK ((char_length(trim(`label`)) > 0))
) ENGINE=InnoDB AUTO_INCREMENT=100 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `transactions`
--

LOCK TABLES `transactions` WRITE;
/*!40000 ALTER TABLE `transactions` DISABLE KEYS */;
INSERT INTO `transactions` VALUES (1,1,1,'Salaire — Studio Orion',3200.00,'income','2026-11-01','2026-11-03 17:19:41','2026-11-03 17:19:41'),(2,1,2,'Mission illustration',650.00,'income','2026-11-03','2026-11-03 17:19:41','2026-11-03 17:19:41'),(3,1,5,'Loyer',950.00,'expense','2026-11-01','2026-11-03 17:19:41','2026-11-03 17:19:41'),(4,1,4,'Courses de la semaine',84.30,'expense','2026-11-02','2026-11-03 17:19:41','2026-11-03 17:19:41'),(5,1,4,'Marché du dimanche',56.75,'expense','2026-11-03','2026-11-03 17:19:41','2026-11-03 17:19:41'),(6,1,4,'Courses hebdomadaires',92.10,'expense','2026-11-03','2026-11-03 17:19:41','2026-11-03 17:19:41'),(7,1,4,'Boulangerie & primeur',48.90,'expense','2026-11-03','2026-11-03 17:19:41','2026-11-03 17:19:41'),(8,1,4,'Courses de la semaine',39.60,'expense','2026-11-03','2026-11-03 17:19:41','2026-11-03 17:19:41'),(9,1,6,'Abonnement transports',42.00,'expense','2026-11-03','2026-11-03 17:19:41','2026-11-03 17:19:41'),(10,1,6,'Carburant',48.50,'expense','2026-11-03','2026-11-03 17:19:41','2026-11-03 17:19:41'),(11,1,7,'Cinéma — séance du soir',14.50,'expense','2026-11-03','2026-11-03 17:19:41','2026-11-03 17:19:41'),(12,1,7,'Concert',79.00,'expense','2026-11-03','2026-11-03 17:19:41','2026-11-03 17:19:41'),(13,1,7,'Dîner entre amis',62.30,'expense','2026-11-03','2026-11-03 17:19:41','2026-11-03 17:19:41'),(14,1,7,'Jeu vidéo',39.90,'expense','2026-11-03','2026-11-03 17:19:41','2026-11-03 17:19:41'),(15,1,9,'Netflix',13.49,'expense','2026-11-03','2026-11-03 17:19:41','2026-11-03 17:19:41'),(16,1,9,'Spotify',10.99,'expense','2026-11-03','2026-11-03 17:19:41','2026-11-03 17:19:41'),(17,1,8,'Pharmacie',25.00,'expense','2026-11-03','2026-11-03 17:19:41','2026-11-03 17:19:41'),(18,1,1,'Salaire — Studio Orion',3200.00,'income','2026-10-01','2026-11-03 17:19:41','2026-11-03 17:19:41'),(19,1,2,'Identité visuelle — Alma',400.00,'income','2026-10-09','2026-11-03 17:19:41','2026-11-03 17:19:41'),(20,1,5,'Loyer',950.00,'expense','2026-10-01','2026-11-03 17:19:41','2026-11-03 17:19:41'),(21,1,4,'Courses du mois',312.40,'expense','2026-10-04','2026-11-03 17:19:41','2026-11-03 17:19:41'),(22,1,6,'Abonnement transports',42.00,'expense','2026-10-03','2026-11-03 17:19:41','2026-11-03 17:19:41'),(23,1,6,'Train — week-end',58.00,'expense','2026-10-17','2026-11-03 17:19:41','2026-11-03 17:19:41'),(24,1,7,'Exposition photo',18.00,'expense','2026-10-11','2026-11-03 17:19:41','2026-11-03 17:19:41'),(25,1,7,'Librairie',36.50,'expense','2026-10-22','2026-11-03 17:19:41','2026-11-03 17:19:41'),(26,1,9,'Netflix',13.49,'expense','2026-10-04','2026-11-03 17:19:41','2026-11-03 17:19:41'),(27,1,9,'Spotify',10.99,'expense','2026-10-08','2026-11-03 17:19:41','2026-11-03 17:19:41'),(28,1,1,'Salaire — Studio Orion',3200.00,'income','2026-09-01','2026-11-03 17:19:41','2026-11-03 17:19:41'),(29,1,2,'Retouche photo',280.00,'income','2026-09-13','2026-11-03 17:19:41','2026-11-03 17:19:41'),(30,1,5,'Loyer',950.00,'expense','2026-09-01','2026-11-03 17:19:41','2026-11-03 17:19:41'),(31,1,4,'Courses du mois',287.15,'expense','2026-09-05','2026-11-03 17:19:41','2026-11-03 17:19:41'),(32,1,6,'Abonnement transports',42.00,'expense','2026-09-03','2026-11-03 17:19:41','2026-11-03 17:19:41'),(33,1,6,'Carburant',52.00,'expense','2026-09-18','2026-11-03 17:19:41','2026-11-03 17:19:41'),(34,1,7,'Cinéma',12.00,'expense','2026-09-10','2026-11-03 17:19:41','2026-11-03 17:19:41'),(35,1,9,'Netflix',13.49,'expense','2026-09-04','2026-11-03 17:19:41','2026-11-03 17:19:41'),(36,1,9,'Spotify',10.99,'expense','2026-09-08','2026-11-03 17:19:41','2026-11-03 17:19:41'),(37,1,8,'Consultation',55.00,'expense','2026-09-20','2026-11-03 17:19:41','2026-11-03 17:19:41'),(38,1,1,'Salaire — Studio Orion',3200.00,'income','2026-08-01','2026-11-03 17:19:41','2026-11-03 17:19:41'),(39,1,3,'Cadeau d\'anniversaire',150.00,'income','2026-08-15','2026-11-03 17:19:41','2026-11-03 17:19:41'),(40,1,5,'Loyer',950.00,'expense','2026-08-01','2026-11-03 17:19:41','2026-11-03 17:19:41'),(41,1,4,'Courses du mois',341.20,'expense','2026-08-04','2026-11-03 17:19:41','2026-11-03 17:19:41'),(42,1,6,'Abonnement transports',42.00,'expense','2026-08-03','2026-11-03 17:19:41','2026-11-03 17:19:41'),(43,1,7,'Week-end à Lyon',189.00,'expense','2026-08-21','2026-11-03 17:19:41','2026-11-03 17:19:41'),(44,1,9,'Netflix',13.49,'expense','2026-08-04','2026-11-03 17:19:41','2026-11-03 17:19:41'),(45,1,9,'Spotify',10.99,'expense','2026-08-08','2026-11-03 17:19:41','2026-11-03 17:19:41'),(46,1,1,'Salaire — Studio Orion',3100.00,'income','2026-07-01','2026-11-03 17:19:41','2026-11-03 17:19:41'),(47,1,2,'Affiche de festival',520.00,'income','2026-07-16','2026-11-03 17:19:41','2026-11-03 17:19:41'),(48,1,5,'Loyer',950.00,'expense','2026-07-01','2026-11-03 17:19:41','2026-11-03 17:19:41'),(49,1,4,'Courses du mois',298.60,'expense','2026-07-06','2026-11-03 17:19:41','2026-11-03 17:19:41'),(50,1,6,'Abonnement transports',42.00,'expense','2026-07-03','2026-11-03 17:19:41','2026-11-03 17:19:41'),(51,1,7,'Concert',64.00,'expense','2026-07-19','2026-11-03 17:19:41','2026-11-03 17:19:41'),(52,1,9,'Netflix',13.49,'expense','2026-07-04','2026-11-03 17:19:41','2026-11-03 17:19:41'),(53,1,9,'Spotify',10.99,'expense','2026-07-08','2026-11-03 17:19:41','2026-11-03 17:19:41'),(54,1,1,'Salaire — Studio Orion',3100.00,'income','2026-06-01','2026-11-03 17:19:41','2026-11-03 17:19:41'),(55,1,5,'Loyer',950.00,'expense','2026-06-01','2026-11-03 17:19:41','2026-11-03 17:19:41'),(56,1,4,'Courses du mois',276.30,'expense','2026-06-07','2026-11-03 17:19:41','2026-11-03 17:19:41'),(57,1,6,'Abonnement transports',42.00,'expense','2026-06-03','2026-11-03 17:19:41','2026-11-03 17:19:41'),(58,1,7,'Livres & revues',48.00,'expense','2026-06-14','2026-11-03 17:19:41','2026-11-03 17:19:41'),(59,1,9,'Netflix',13.49,'expense','2026-06-04','2026-11-03 17:19:41','2026-11-03 17:19:41'),(60,1,9,'Spotify',10.99,'expense','2026-06-08','2026-11-03 17:19:41','2026-11-03 17:19:41'),(64,12,63,'Salaire ÔÇö Studio Orion',3250.00,'income','2026-11-01','2026-11-08 14:56:50','2026-11-08 14:56:50'),(65,12,57,'Loyer appartement',890.00,'expense','2026-11-01','2026-11-08 14:56:50','2026-11-08 14:56:50'),(66,12,55,'Courses Monoprix',68.40,'expense','2026-11-02','2026-11-08 14:56:50','2026-11-08 14:56:50'),(67,12,56,'Pass Navigo',86.40,'expense','2026-11-03','2026-11-08 14:56:50','2026-11-08 14:56:50'),(68,12,58,'Concert ÔÇö Philharmonie',96.00,'expense','2026-11-03','2026-11-08 14:56:50','2026-11-08 14:56:50'),(69,12,55,'Boulangerie du coin',12.80,'expense','2026-11-04','2026-11-08 14:56:50','2026-11-08 14:56:50'),(70,12,60,'Netflix',13.49,'expense','2026-11-05','2026-11-08 14:56:50','2026-11-08 14:56:50'),(71,12,59,'Pharmacie de la gare',24.90,'expense','2026-11-06','2026-11-08 14:56:50','2026-11-08 14:56:50'),(72,12,55,'March├® du dimanche',46.20,'expense','2026-11-07','2026-11-08 14:56:50','2026-11-08 14:56:50'),(73,12,64,'Freelance ÔÇö refonte de site',620.00,'income','2026-11-07','2026-11-08 14:56:50','2026-11-08 14:56:50'),(74,12,58,'Cin├®ma MK2',28.00,'expense','2026-11-08','2026-11-08 14:56:50','2026-11-08 14:56:50'),(75,12,63,'Salaire ÔÇö Studio Orion',3250.00,'income','2026-10-01','2026-11-08 14:56:50','2026-11-08 14:56:50'),(76,12,57,'Loyer appartement',890.00,'expense','2026-10-01','2026-11-08 14:56:50','2026-11-08 14:56:50'),(77,12,57,'├ëlectricit├® EDF',72.30,'expense','2026-10-06','2026-11-08 14:56:50','2026-11-08 14:56:50'),(78,12,55,'Courses Monoprix',124.60,'expense','2026-10-04','2026-11-08 14:56:50','2026-11-08 14:56:50'),(79,12,55,'March├® du dimanche',52.10,'expense','2026-10-10','2026-11-08 14:56:50','2026-11-08 14:56:50'),(80,12,55,'Restaurant Bao',38.00,'expense','2026-10-18','2026-11-08 14:56:50','2026-11-08 14:56:50'),(81,12,55,'Courses Monoprix',139.80,'expense','2026-10-25','2026-11-08 14:56:50','2026-11-08 14:56:50'),(82,12,56,'Pass Navigo',86.40,'expense','2026-10-03','2026-11-08 14:56:50','2026-11-08 14:56:50'),(83,12,56,'Essence',64.90,'expense','2026-10-15','2026-11-08 14:56:50','2026-11-08 14:56:50'),(84,12,58,'Librairie Eyrolles',34.00,'expense','2026-10-12','2026-11-08 14:56:50','2026-11-08 14:56:50'),(85,12,58,'Concert',62.00,'expense','2026-10-20','2026-11-08 14:56:50','2026-11-08 14:56:50'),(86,12,60,'Spotify',10.99,'expense','2026-10-05','2026-11-08 14:56:50','2026-11-08 14:56:50'),(87,12,60,'Salle de sport',29.90,'expense','2026-10-07','2026-11-08 14:56:50','2026-11-08 14:56:50'),(88,12,59,'Consultation dentiste',70.00,'expense','2026-10-22','2026-11-08 14:56:50','2026-11-08 14:56:50'),(89,12,64,'Freelance ÔÇö mission data',780.00,'income','2026-10-17','2026-11-08 14:56:50','2026-11-08 14:56:50'),(90,12,63,'Salaire ÔÇö Studio Orion',3250.00,'income','2026-09-01','2026-11-08 14:56:50','2026-11-08 14:56:50'),(91,12,57,'Loyer appartement',890.00,'expense','2026-09-01','2026-11-08 14:56:50','2026-11-08 14:56:50'),(92,12,55,'Courses Monoprix',142.20,'expense','2026-09-05','2026-11-08 14:56:50','2026-11-08 14:56:50'),(93,12,55,'March├® du dimanche',61.40,'expense','2026-09-13','2026-11-08 14:56:50','2026-11-08 14:56:50'),(94,12,56,'Pass Navigo',86.40,'expense','2026-09-03','2026-11-08 14:56:50','2026-11-08 14:56:50'),(95,12,58,'Sortie v├®lo',42.00,'expense','2026-09-16','2026-11-08 14:56:50','2026-11-08 14:56:50'),(96,12,58,'Cin├®ma MK2',28.00,'expense','2026-09-23','2026-11-08 14:56:50','2026-11-08 14:56:50'),(97,12,59,'Pharmacie',18.60,'expense','2026-09-09','2026-11-08 14:56:50','2026-11-08 14:56:50'),(98,12,60,'Netflix',13.49,'expense','2026-09-06','2026-11-08 14:56:50','2026-11-08 14:56:50'),(99,12,64,'Freelance ÔÇö audit UX',480.00,'income','2026-09-21','2026-11-08 14:56:50','2026-11-08 14:56:50');
/*!40000 ALTER TABLE `transactions` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `users`
--

DROP TABLE IF EXISTS `users`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `users` (
  `id` int unsigned NOT NULL AUTO_INCREMENT,
  `email` varchar(190) COLLATE utf8mb4_unicode_ci NOT NULL,
  `password_hash` varchar(255) COLLATE utf8mb4_unicode_ci NOT NULL,
  `name` varchar(80) COLLATE utf8mb4_unicode_ci NOT NULL,
  `created_at` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  UNIQUE KEY `uq_users_email` (`email`),
  CONSTRAINT `chk_users_name` CHECK ((char_length(trim(`name`)) > 0))
) ENGINE=InnoDB AUTO_INCREMENT=13 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `users`
--

LOCK TABLES `users` WRITE;
/*!40000 ALTER TABLE `users` DISABLE KEYS */;
INSERT INTO `users` VALUES (1,'demo@finora.fr','$2b$12$iw72iYn4rCrU1K83kk5DvuELobFolApsjIUF4USgNtba0A0gjI6Ju','Camille Martin','2026-11-03 17:19:41'),(4,'mahdi@test.com','$2b$12$WUu/9dtSk4AUICpE4FBDh.CW2Py7J.gK38esDFRNDmmydgzw//uFW','Mahdi','2026-11-03 17:53:05'),(6,'adem@test.com','$2b$12$QvGFaU47B8Kwlm5/cbAB5.KfULbm9hs/BnWEKQd19E751DG/mQPyG','adem','2026-11-03 17:54:30'),(8,'ahmed@test.com','$2b$12$BhTKsJmdNOhnSHNMvwoHdOQr9p7RXl0CUibOC0gYrK/elbMko.5PS','ahmed','2026-11-03 18:00:32'),(12,'demo@finora.app','$2a$12$QLum40RZpBVbbghsDqIgc.3utoCYCXrsCo6cDHWJCknlp4VC.sjSe','Camille Rousseau','2026-11-08 14:56:50');
/*!40000 ALTER TABLE `users` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Dumping events for database 'finora'
--

--
-- Dumping routines for database 'finora'
--

--
-- Current Database: `finora`
--

USE `finora`;

--
-- Final view structure for view `monthly_summary`
--

/*!50001 DROP VIEW IF EXISTS `monthly_summary`*/;
/*!50001 SET @saved_cs_client          = @@character_set_client */;
/*!50001 SET @saved_cs_results         = @@character_set_results */;
/*!50001 SET @saved_col_connection     = @@collation_connection */;
/*!50001 SET character_set_client      = cp850 */;
/*!50001 SET character_set_results     = cp850 */;
/*!50001 SET collation_connection      = cp850_general_ci */;
/*!50001 CREATE ALGORITHM=UNDEFINED */
/*!50013 DEFINER=`root`@`localhost` SQL SECURITY DEFINER */
/*!50001 VIEW `monthly_summary` AS select `transactions`.`user_id` AS `user_id`,cast(date_format(`transactions`.`date`,'%Y-%m-01') as date) AS `month`,sum((case when (`transactions`.`type` = 'income') then `transactions`.`amount` else 0 end)) AS `income`,sum((case when (`transactions`.`type` = 'expense') then `transactions`.`amount` else 0 end)) AS `expense`,sum((case when (`transactions`.`type` = 'income') then `transactions`.`amount` else -(`transactions`.`amount`) end)) AS `balance` from `transactions` group by `transactions`.`user_id`,date_format(`transactions`.`date`,'%Y-%m-01') */;
/*!50001 SET character_set_client      = @saved_cs_client */;
/*!50001 SET character_set_results     = @saved_cs_results */;
/*!50001 SET collation_connection      = @saved_col_connection */;
/*!40103 SET TIME_ZONE=@OLD_TIME_ZONE */;

/*!40101 SET SQL_MODE=@OLD_SQL_MODE */;
/*!40014 SET FOREIGN_KEY_CHECKS=@OLD_FOREIGN_KEY_CHECKS */;
/*!40014 SET UNIQUE_CHECKS=@OLD_UNIQUE_CHECKS */;
/*!40101 SET CHARACTER_SET_CLIENT=@OLD_CHARACTER_SET_CLIENT */;
/*!40101 SET CHARACTER_SET_RESULTS=@OLD_CHARACTER_SET_RESULTS */;
/*!40101 SET COLLATION_CONNECTION=@OLD_COLLATION_CONNECTION */;
/*!40111 SET SQL_NOTES=@OLD_SQL_NOTES */;

-- Dump completed on 2026-11-08 15:57:43
