-- MySQL dump 10.13  Distrib 8.0.44, for Win64 (x86_64)
--
-- Host: 127.0.0.1    Database: finedge
-- ------------------------------------------------------
-- Server version	8.0.44

/*!40101 SET @OLD_CHARACTER_SET_CLIENT=@@CHARACTER_SET_CLIENT */;
/*!40101 SET @OLD_CHARACTER_SET_RESULTS=@@CHARACTER_SET_RESULTS */;
/*!40101 SET @OLD_COLLATION_CONNECTION=@@COLLATION_CONNECTION */;
/*!50503 SET NAMES utf8 */;
/*!40103 SET @OLD_TIME_ZONE=@@TIME_ZONE */;
/*!40103 SET TIME_ZONE='+00:00' */;
/*!40014 SET @OLD_UNIQUE_CHECKS=@@UNIQUE_CHECKS, UNIQUE_CHECKS=0 */;
/*!40014 SET @OLD_FOREIGN_KEY_CHECKS=@@FOREIGN_KEY_CHECKS, FOREIGN_KEY_CHECKS=0 */;
/*!40101 SET @OLD_SQL_MODE=@@SQL_MODE, SQL_MODE='NO_AUTO_VALUE_ON_ZERO' */;
/*!40111 SET @OLD_SQL_NOTES=@@SQL_NOTES, SQL_NOTES=0 */;

--
-- Table structure for table `attendance`
--

DROP TABLE IF EXISTS `attendance`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `attendance` (
  `id` bigint NOT NULL AUTO_INCREMENT,
  `record_state` varchar(10) NOT NULL,
  `employee_name` varchar(100) NOT NULL,
  `date` date NOT NULL,
  `status` varchar(10) NOT NULL,
  `notes` longtext,
  `created_at` datetime(6) NOT NULL,
  `updated_at` datetime(6) NOT NULL,
  `deleted_at` datetime(6) DEFAULT NULL,
  `payroll_id` bigint DEFAULT NULL,
  PRIMARY KEY (`id`),
  UNIQUE KEY `attendance_payroll_id_date_record_state_5e26f939_uniq` (`payroll_id`,`date`,`record_state`),
  CONSTRAINT `attendance_payroll_id_a799d33c_fk_payroll_id` FOREIGN KEY (`payroll_id`) REFERENCES `payroll` (`id`)
) ENGINE=InnoDB AUTO_INCREMENT=3 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `attendance`
--

LOCK TABLES `attendance` WRITE;
/*!40000 ALTER TABLE `attendance` DISABLE KEYS */;
INSERT INTO `attendance` VALUES (1,'active','Viona','2026-01-19','present','','2026-01-21 03:38:05.378522','2026-01-21 03:38:05.378522',NULL,1),(2,'active','Viona','2026-01-20','present','','2026-01-21 03:38:06.490535','2026-01-21 03:38:06.490535',NULL,1);
/*!40000 ALTER TABLE `attendance` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `attendance_summary`
--

DROP TABLE IF EXISTS `attendance_summary`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `attendance_summary` (
  `id` bigint NOT NULL AUTO_INCREMENT,
  `record_state` varchar(10) NOT NULL,
  `employee_name` varchar(100) NOT NULL,
  `period_type` varchar(20) NOT NULL,
  `start_date` date NOT NULL,
  `end_date` date NOT NULL,
  `total_days_in_period` int NOT NULL,
  `present_days` int NOT NULL,
  `half_days` int NOT NULL,
  `absent_days` int NOT NULL,
  `full_days` decimal(5,1) NOT NULL,
  `calculated_at` datetime(6) NOT NULL,
  `created_at` datetime(6) NOT NULL,
  `updated_at` datetime(6) NOT NULL,
  `deleted_at` datetime(6) DEFAULT NULL,
  `payroll_id` bigint DEFAULT NULL,
  PRIMARY KEY (`id`),
  UNIQUE KEY `attendance_summary_employee_name_period_typ_29f8171c_uniq` (`employee_name`,`period_type`,`start_date`,`end_date`,`record_state`),
  KEY `attendance_summary_payroll_id_de34924a_fk_payroll_id` (`payroll_id`),
  KEY `attendance__employe_18290b_idx` (`employee_name`,`start_date`,`end_date`),
  KEY `attendance__start_d_d696e2_idx` (`start_date`,`end_date`),
  KEY `attendance__employe_11e8c1_idx` (`employee_name`),
  KEY `attendance__period__433871_idx` (`period_type`),
  CONSTRAINT `attendance_summary_payroll_id_de34924a_fk_payroll_id` FOREIGN KEY (`payroll_id`) REFERENCES `payroll` (`id`)
) ENGINE=InnoDB AUTO_INCREMENT=5 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `attendance_summary`
--

LOCK TABLES `attendance_summary` WRITE;
/*!40000 ALTER TABLE `attendance_summary` DISABLE KEYS */;
INSERT INTO `attendance_summary` VALUES (1,'active','Viona','weekly','2026-01-19','2026-01-25',7,2,0,0,2.0,'2026-01-21 03:38:05.398472','2026-01-21 03:38:05.398472','2026-01-21 03:38:06.552501',NULL,1),(2,'active','Viona','monthly','2026-01-01','2026-01-31',31,2,0,0,2.0,'2026-01-21 03:38:05.417666','2026-01-21 03:38:05.417666','2026-01-21 03:38:06.573917',NULL,1),(3,'active','Viona','custom','2025-12-31','2026-01-30',31,2,0,0,2.0,'2026-01-21 03:38:43.228457','2026-01-21 03:38:43.230494','2026-01-23 04:31:01.163659',NULL,NULL),(4,'active','Viona','custom','2026-01-18','2026-01-24',7,2,0,0,2.0,'2026-01-21 03:39:22.185838','2026-01-21 03:39:22.185838','2026-01-21 03:39:22.185838',NULL,NULL);
/*!40000 ALTER TABLE `attendance_summary` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `auth_group`
--

DROP TABLE IF EXISTS `auth_group`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `auth_group` (
  `id` int NOT NULL AUTO_INCREMENT,
  `name` varchar(150) NOT NULL,
  PRIMARY KEY (`id`),
  UNIQUE KEY `name` (`name`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `auth_group`
--

LOCK TABLES `auth_group` WRITE;
/*!40000 ALTER TABLE `auth_group` DISABLE KEYS */;
/*!40000 ALTER TABLE `auth_group` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `auth_group_permissions`
--

DROP TABLE IF EXISTS `auth_group_permissions`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `auth_group_permissions` (
  `id` bigint NOT NULL AUTO_INCREMENT,
  `group_id` int NOT NULL,
  `permission_id` int NOT NULL,
  PRIMARY KEY (`id`),
  UNIQUE KEY `auth_group_permissions_group_id_permission_id_0cd325b0_uniq` (`group_id`,`permission_id`),
  KEY `auth_group_permissio_permission_id_84c5c92e_fk_auth_perm` (`permission_id`),
  CONSTRAINT `auth_group_permissio_permission_id_84c5c92e_fk_auth_perm` FOREIGN KEY (`permission_id`) REFERENCES `auth_permission` (`id`),
  CONSTRAINT `auth_group_permissions_group_id_b120cbf9_fk_auth_group_id` FOREIGN KEY (`group_id`) REFERENCES `auth_group` (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `auth_group_permissions`
--

LOCK TABLES `auth_group_permissions` WRITE;
/*!40000 ALTER TABLE `auth_group_permissions` DISABLE KEYS */;
/*!40000 ALTER TABLE `auth_group_permissions` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `auth_permission`
--

DROP TABLE IF EXISTS `auth_permission`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `auth_permission` (
  `id` int NOT NULL AUTO_INCREMENT,
  `name` varchar(255) NOT NULL,
  `content_type_id` int NOT NULL,
  `codename` varchar(100) NOT NULL,
  PRIMARY KEY (`id`),
  UNIQUE KEY `auth_permission_content_type_id_codename_01ab375a_uniq` (`content_type_id`,`codename`),
  CONSTRAINT `auth_permission_content_type_id_2f476e4b_fk_django_co` FOREIGN KEY (`content_type_id`) REFERENCES `django_content_type` (`id`)
) ENGINE=InnoDB AUTO_INCREMENT=57 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `auth_permission`
--

LOCK TABLES `auth_permission` WRITE;
/*!40000 ALTER TABLE `auth_permission` DISABLE KEYS */;
INSERT INTO `auth_permission` VALUES (1,'Can add log entry',1,'add_logentry'),(2,'Can change log entry',1,'change_logentry'),(3,'Can delete log entry',1,'delete_logentry'),(4,'Can view log entry',1,'view_logentry'),(5,'Can add permission',3,'add_permission'),(6,'Can change permission',3,'change_permission'),(7,'Can delete permission',3,'delete_permission'),(8,'Can view permission',3,'view_permission'),(9,'Can add group',2,'add_group'),(10,'Can change group',2,'change_group'),(11,'Can delete group',2,'delete_group'),(12,'Can view group',2,'view_group'),(13,'Can add user',4,'add_user'),(14,'Can change user',4,'change_user'),(15,'Can delete user',4,'delete_user'),(16,'Can view user',4,'view_user'),(17,'Can add content type',5,'add_contenttype'),(18,'Can change content type',5,'change_contenttype'),(19,'Can delete content type',5,'delete_contenttype'),(20,'Can view content type',5,'view_contenttype'),(21,'Can add session',6,'add_session'),(22,'Can change session',6,'change_session'),(23,'Can delete session',6,'delete_session'),(24,'Can view session',6,'view_session'),(25,'Can add cat',9,'add_cat'),(26,'Can change cat',9,'change_cat'),(27,'Can delete cat',9,'delete_cat'),(28,'Can view cat',9,'view_cat'),(29,'Can add income',11,'add_income'),(30,'Can change income',11,'change_income'),(31,'Can delete income',11,'delete_income'),(32,'Can view income',11,'view_income'),(33,'Can add payroll',12,'add_payroll'),(34,'Can change payroll',12,'change_payroll'),(35,'Can delete payroll',12,'delete_payroll'),(36,'Can view payroll',12,'view_payroll'),(37,'Can add expense',10,'add_expense'),(38,'Can change expense',10,'change_expense'),(39,'Can delete expense',10,'delete_expense'),(40,'Can view expense',10,'view_expense'),(41,'Can add purchase',13,'add_purchase'),(42,'Can change purchase',13,'change_purchase'),(43,'Can delete purchase',13,'delete_purchase'),(44,'Can view purchase',13,'view_purchase'),(45,'Can add Attendance Summary',8,'add_attendancesummary'),(46,'Can change Attendance Summary',8,'change_attendancesummary'),(47,'Can delete Attendance Summary',8,'delete_attendancesummary'),(48,'Can view Attendance Summary',8,'view_attendancesummary'),(49,'Can add attendance',7,'add_attendance'),(50,'Can change attendance',7,'change_attendance'),(51,'Can delete attendance',7,'delete_attendance'),(52,'Can view attendance',7,'view_attendance'),(53,'Can add site',14,'add_site'),(54,'Can change site',14,'change_site'),(55,'Can delete site',14,'delete_site'),(56,'Can view site',14,'view_site');
/*!40000 ALTER TABLE `auth_permission` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `auth_user`
--

DROP TABLE IF EXISTS `auth_user`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `auth_user` (
  `id` int NOT NULL AUTO_INCREMENT,
  `password` varchar(128) NOT NULL,
  `last_login` datetime(6) DEFAULT NULL,
  `is_superuser` tinyint(1) NOT NULL,
  `username` varchar(150) NOT NULL,
  `first_name` varchar(150) NOT NULL,
  `last_name` varchar(150) NOT NULL,
  `email` varchar(254) NOT NULL,
  `is_staff` tinyint(1) NOT NULL,
  `is_active` tinyint(1) NOT NULL,
  `date_joined` datetime(6) NOT NULL,
  PRIMARY KEY (`id`),
  UNIQUE KEY `username` (`username`)
) ENGINE=InnoDB AUTO_INCREMENT=2 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `auth_user`
--

LOCK TABLES `auth_user` WRITE;
/*!40000 ALTER TABLE `auth_user` DISABLE KEYS */;
INSERT INTO `auth_user` VALUES (1,'pbkdf2_sha256$1200000$QOLX1T1j6845izFR3W9yfS$zkZgTT4+JD/SShVSeHCKYhLwsgQgNapVwl7cOPqQ0jM=','2026-03-03 13:49:22.800601',1,'admin','','','',1,1,'2026-01-21 01:24:08.558462');
/*!40000 ALTER TABLE `auth_user` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `auth_user_groups`
--

DROP TABLE IF EXISTS `auth_user_groups`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `auth_user_groups` (
  `id` bigint NOT NULL AUTO_INCREMENT,
  `user_id` int NOT NULL,
  `group_id` int NOT NULL,
  PRIMARY KEY (`id`),
  UNIQUE KEY `auth_user_groups_user_id_group_id_94350c0c_uniq` (`user_id`,`group_id`),
  KEY `auth_user_groups_group_id_97559544_fk_auth_group_id` (`group_id`),
  CONSTRAINT `auth_user_groups_group_id_97559544_fk_auth_group_id` FOREIGN KEY (`group_id`) REFERENCES `auth_group` (`id`),
  CONSTRAINT `auth_user_groups_user_id_6a12ed8b_fk_auth_user_id` FOREIGN KEY (`user_id`) REFERENCES `auth_user` (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `auth_user_groups`
--

LOCK TABLES `auth_user_groups` WRITE;
/*!40000 ALTER TABLE `auth_user_groups` DISABLE KEYS */;
/*!40000 ALTER TABLE `auth_user_groups` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `auth_user_user_permissions`
--

DROP TABLE IF EXISTS `auth_user_user_permissions`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `auth_user_user_permissions` (
  `id` bigint NOT NULL AUTO_INCREMENT,
  `user_id` int NOT NULL,
  `permission_id` int NOT NULL,
  PRIMARY KEY (`id`),
  UNIQUE KEY `auth_user_user_permissions_user_id_permission_id_14a6b632_uniq` (`user_id`,`permission_id`),
  KEY `auth_user_user_permi_permission_id_1fbb5f2c_fk_auth_perm` (`permission_id`),
  CONSTRAINT `auth_user_user_permi_permission_id_1fbb5f2c_fk_auth_perm` FOREIGN KEY (`permission_id`) REFERENCES `auth_permission` (`id`),
  CONSTRAINT `auth_user_user_permissions_user_id_a95ead1b_fk_auth_user_id` FOREIGN KEY (`user_id`) REFERENCES `auth_user` (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `auth_user_user_permissions`
--

LOCK TABLES `auth_user_user_permissions` WRITE;
/*!40000 ALTER TABLE `auth_user_user_permissions` DISABLE KEYS */;
/*!40000 ALTER TABLE `auth_user_user_permissions` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `django_admin_log`
--

DROP TABLE IF EXISTS `django_admin_log`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `django_admin_log` (
  `id` int NOT NULL AUTO_INCREMENT,
  `action_time` datetime(6) NOT NULL,
  `object_id` longtext,
  `object_repr` varchar(200) NOT NULL,
  `action_flag` smallint unsigned NOT NULL,
  `change_message` longtext NOT NULL,
  `content_type_id` int DEFAULT NULL,
  `user_id` int NOT NULL,
  PRIMARY KEY (`id`),
  KEY `django_admin_log_content_type_id_c4bce8eb_fk_django_co` (`content_type_id`),
  KEY `django_admin_log_user_id_c564eba6_fk_auth_user_id` (`user_id`),
  CONSTRAINT `django_admin_log_content_type_id_c4bce8eb_fk_django_co` FOREIGN KEY (`content_type_id`) REFERENCES `django_content_type` (`id`),
  CONSTRAINT `django_admin_log_user_id_c564eba6_fk_auth_user_id` FOREIGN KEY (`user_id`) REFERENCES `auth_user` (`id`),
  CONSTRAINT `django_admin_log_chk_1` CHECK ((`action_flag` >= 0))
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `django_admin_log`
--

LOCK TABLES `django_admin_log` WRITE;
/*!40000 ALTER TABLE `django_admin_log` DISABLE KEYS */;
/*!40000 ALTER TABLE `django_admin_log` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `django_content_type`
--

DROP TABLE IF EXISTS `django_content_type`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `django_content_type` (
  `id` int NOT NULL AUTO_INCREMENT,
  `app_label` varchar(100) NOT NULL,
  `model` varchar(100) NOT NULL,
  PRIMARY KEY (`id`),
  UNIQUE KEY `django_content_type_app_label_model_76bd3d3b_uniq` (`app_label`,`model`)
) ENGINE=InnoDB AUTO_INCREMENT=15 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `django_content_type`
--

LOCK TABLES `django_content_type` WRITE;
/*!40000 ALTER TABLE `django_content_type` DISABLE KEYS */;
INSERT INTO `django_content_type` VALUES (1,'admin','logentry'),(2,'auth','group'),(3,'auth','permission'),(4,'auth','user'),(5,'contenttypes','contenttype'),(7,'fine','attendance'),(8,'fine','attendancesummary'),(9,'fine','cat'),(10,'fine','expense'),(11,'fine','income'),(12,'fine','payroll'),(13,'fine','purchase'),(6,'sessions','session'),(14,'sites','site');
/*!40000 ALTER TABLE `django_content_type` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `django_migrations`
--

DROP TABLE IF EXISTS `django_migrations`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `django_migrations` (
  `id` bigint NOT NULL AUTO_INCREMENT,
  `app` varchar(255) NOT NULL,
  `name` varchar(255) NOT NULL,
  `applied` datetime(6) NOT NULL,
  PRIMARY KEY (`id`)
) ENGINE=InnoDB AUTO_INCREMENT=30 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `django_migrations`
--

LOCK TABLES `django_migrations` WRITE;
/*!40000 ALTER TABLE `django_migrations` DISABLE KEYS */;
INSERT INTO `django_migrations` VALUES (1,'contenttypes','0001_initial','2026-01-21 01:23:42.933582'),(2,'auth','0001_initial','2026-01-21 01:23:43.655041'),(3,'admin','0001_initial','2026-01-21 01:23:43.864738'),(4,'admin','0002_logentry_remove_auto_add','2026-01-21 01:23:43.878547'),(5,'admin','0003_logentry_add_action_flag_choices','2026-01-21 01:23:43.878547'),(6,'contenttypes','0002_remove_content_type_name','2026-01-21 01:23:44.026242'),(7,'auth','0002_alter_permission_name_max_length','2026-01-21 01:23:44.099562'),(8,'auth','0003_alter_user_email_max_length','2026-01-21 01:23:44.150939'),(9,'auth','0004_alter_user_username_opts','2026-01-21 01:23:44.163078'),(10,'auth','0005_alter_user_last_login_null','2026-01-21 01:23:44.242464'),(11,'auth','0006_require_contenttypes_0002','2026-01-21 01:23:44.242464'),(12,'auth','0007_alter_validators_add_error_messages','2026-01-21 01:23:44.242464'),(13,'auth','0008_alter_user_username_max_length','2026-01-21 01:23:44.354160'),(14,'auth','0009_alter_user_last_name_max_length','2026-01-21 01:23:44.436895'),(15,'auth','0010_alter_group_name_max_length','2026-01-21 01:23:44.465788'),(16,'auth','0011_update_proxy_permissions','2026-01-21 01:23:44.481025'),(17,'auth','0012_alter_user_first_name_max_length','2026-01-21 01:23:44.562387'),(18,'fine','0001_initial','2026-01-21 01:23:45.308970'),(19,'fine','0002_payroll_worked_days','2026-01-21 01:23:45.436932'),(20,'fine','0003_remove_payroll_worked_days','2026-01-21 01:23:45.524217'),(21,'fine','0004_payroll_worked_days','2026-01-21 01:23:45.630055'),(22,'fine','0005_remove_payroll_worked_days','2026-01-21 01:23:45.708645'),(23,'fine','0006_payroll_worked_days','2026-01-21 01:23:45.818516'),(24,'fine','0007_alter_payroll_worked_days','2026-01-21 01:23:45.818516'),(25,'fine','0008_expense_voucher_no_alter_expense_quantity_and_more','2026-01-21 01:23:45.897206'),(26,'sessions','0001_initial','2026-01-21 01:23:45.944521'),(27,'fine','0009_alter_expense_quantity_alter_expense_total_amount_and_more','2026-01-21 01:30:35.196722'),(28,'sites','0001_initial','2026-03-03 13:22:53.790090'),(29,'sites','0002_alter_domain_unique','2026-03-03 13:22:53.813880');
/*!40000 ALTER TABLE `django_migrations` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `django_session`
--

DROP TABLE IF EXISTS `django_session`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `django_session` (
  `session_key` varchar(40) NOT NULL,
  `session_data` longtext NOT NULL,
  `expire_date` datetime(6) NOT NULL,
  PRIMARY KEY (`session_key`),
  KEY `django_session_expire_date_a5c62663` (`expire_date`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `django_session`
--

LOCK TABLES `django_session` WRITE;
/*!40000 ALTER TABLE `django_session` DISABLE KEYS */;
INSERT INTO `django_session` VALUES ('71iylllc5yf0bl0a2knwkvn2pjdude35','.eJxVjMsOwiAQRf-FtSEMb1y69xvIwIBUDU1KuzL-uzbpQrf3nHNfLOK2triNssSJ2JkBO_1uCfOj9B3QHftt5nnu6zIlviv8oINfZyrPy-H-HTQc7Vsr7w0SJZmdU8L6IG3QRguvki2yIjjttKCqoJgg0FcSoSoJoIMDKMDeH7k7Nok:1vxQ7m:pEkIGmHE-qm4zijAdw1rWdwgJw0fJKgzJgCz1NB0fP8','2026-03-17 13:49:22.807213'),('nv0ymac1yctpetfnazl2xqgov1uc9xrp','.eJxVjMsOwiAQRf-FtSEMb1y69xvIwIBUDU1KuzL-uzbpQrf3nHNfLOK2triNssSJ2JkBO_1uCfOj9B3QHftt5nnu6zIlviv8oINfZyrPy-H-HTQc7Vsr7w0SJZmdU8L6IG3QRguvki2yIjjttKCqoJgg0FcSoSoJoIMDKMDeH7k7Nok:1vxPiV:lDynK4MJQN9fXwVGTt46HxTMUKhAzRnV6ms_F6jCZK0','2026-03-17 13:23:15.583923'),('sp4dnz71ymx54mt9x1perk3sfokdzro6','.eJxVjMsOwiAQRf-FtSEMb1y69xvIwIBUDU1KuzL-uzbpQrf3nHNfLOK2triNssSJ2JkBO_1uCfOj9B3QHftt5nnu6zIlviv8oINfZyrPy-H-HTQc7Vsr7w0SJZmdU8L6IG3QRguvki2yIjjttKCqoJgg0FcSoSoJoIMDKMDeH7k7Nok:1vrykm:b5isD91BTd5oScbjCFKkhvNj6jxyxmxw2neNBzFqmIA','2026-03-02 13:35:08.926889'),('wfvkmglcaqq9o0p9wln3dlyfbvfhugh2','.eJxVjMsOwiAQRf-FtSEMb1y69xvIwIBUDU1KuzL-uzbpQrf3nHNfLOK2triNssSJ2JkBO_1uCfOj9B3QHftt5nnu6zIlviv8oINfZyrPy-H-HTQc7Vsr7w0SJZmdU8L6IG3QRguvki2yIjjttKCqoJgg0FcSoSoJoIMDKMDeH7k7Nok:1vj8oe:bHvm5bDJYbP0S56RdyiayI_g7uZ91oOE6sfFId8jCRs','2026-02-06 04:30:36.626398');
/*!40000 ALTER TABLE `django_session` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `django_site`
--

DROP TABLE IF EXISTS `django_site`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `django_site` (
  `id` int NOT NULL AUTO_INCREMENT,
  `domain` varchar(100) NOT NULL,
  `name` varchar(50) NOT NULL,
  PRIMARY KEY (`id`),
  UNIQUE KEY `django_site_domain_a2e37b91_uniq` (`domain`)
) ENGINE=InnoDB AUTO_INCREMENT=2 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `django_site`
--

LOCK TABLES `django_site` WRITE;
/*!40000 ALTER TABLE `django_site` DISABLE KEYS */;
INSERT INTO `django_site` VALUES (1,'example.com','example.com');
/*!40000 ALTER TABLE `django_site` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `fine_cat`
--

DROP TABLE IF EXISTS `fine_cat`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `fine_cat` (
  `id` bigint NOT NULL AUTO_INCREMENT,
  `name` varchar(100) NOT NULL,
  PRIMARY KEY (`id`),
  UNIQUE KEY `name` (`name`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `fine_cat`
--

LOCK TABLES `fine_cat` WRITE;
/*!40000 ALTER TABLE `fine_cat` DISABLE KEYS */;
/*!40000 ALTER TABLE `fine_cat` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `fine_expense`
--

DROP TABLE IF EXISTS `fine_expense`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `fine_expense` (
  `id` bigint NOT NULL AUTO_INCREMENT,
  `record_state` varchar(10) NOT NULL,
  `date` date NOT NULL,
  `category` varchar(100) NOT NULL,
  `description` longtext,
  `unit_price` decimal(10,2) DEFAULT NULL,
  `quantity` decimal(10,2) DEFAULT NULL,
  `unit` varchar(20) DEFAULT NULL,
  `total_amount` decimal(12,2) NOT NULL,
  `payment_method` varchar(50) NOT NULL,
  `created_at` datetime(6) NOT NULL,
  `employee_name` varchar(100) DEFAULT NULL,
  `payroll_id` bigint DEFAULT NULL,
  `voucher_no` varchar(50) DEFAULT NULL,
  PRIMARY KEY (`id`),
  KEY `fine_expense_payroll_id_34f914d2_fk_payroll_id` (`payroll_id`),
  CONSTRAINT `fine_expense_payroll_id_34f914d2_fk_payroll_id` FOREIGN KEY (`payroll_id`) REFERENCES `payroll` (`id`)
) ENGINE=InnoDB AUTO_INCREMENT=6 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `fine_expense`
--

LOCK TABLES `fine_expense` WRITE;
/*!40000 ALTER TABLE `fine_expense` DISABLE KEYS */;
INSERT INTO `fine_expense` VALUES (1,'active','2026-01-21','Daily Salary','',0.00,1.00,'pcs',584.00,'Cash','2026-01-21 03:19:28.615454','',NULL,'58'),(2,'deleted','2026-01-21','Daily Salary','',0.00,1.00,'pcs',584.00,'Cash','2026-01-21 03:19:28.652432','',NULL,'58'),(3,'active','2026-01-21','Salary','Salary payment to Viona - Cash portion',5486.00,1.00,'person',5486.00,'Cash','2026-01-21 03:38:01.198881','Viona',1,NULL),(4,'active','2026-03-03','Beta & OT','',0.00,1.00,'pcs',54.00,'Cash','2026-03-03 13:51:25.720240','',NULL,'45'),(5,'active','2026-03-03','Beta & OT','',0.00,1.00,'pcs',54.00,'Cash','2026-03-03 13:51:25.766593','',NULL,'45');
/*!40000 ALTER TABLE `fine_expense` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `fine_income`
--

DROP TABLE IF EXISTS `fine_income`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `fine_income` (
  `id` bigint NOT NULL AUTO_INCREMENT,
  `date` date NOT NULL,
  `description` varchar(255) NOT NULL,
  `amount` decimal(10,2) NOT NULL,
  `payment_mode` varchar(50) NOT NULL,
  `status` varchar(20) NOT NULL,
  `created_at` datetime(6) NOT NULL,
  PRIMARY KEY (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `fine_income`
--

LOCK TABLES `fine_income` WRITE;
/*!40000 ALTER TABLE `fine_income` DISABLE KEYS */;
/*!40000 ALTER TABLE `fine_income` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `fine_purchase`
--

DROP TABLE IF EXISTS `fine_purchase`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `fine_purchase` (
  `id` bigint NOT NULL AUTO_INCREMENT,
  `date` date NOT NULL,
  `vendor` varchar(100) NOT NULL,
  `bill_no` varchar(50) NOT NULL,
  `total_amount` decimal(12,2) NOT NULL,
  `gst_amount` decimal(10,2) NOT NULL,
  `payment_mode` varchar(50) NOT NULL,
  `status` varchar(50) NOT NULL,
  `description` longtext,
  `created_at` datetime(6) NOT NULL,
  `cat_id` bigint NOT NULL,
  PRIMARY KEY (`id`),
  KEY `fine_purchase_cat_id_956a404a_fk_fine_cat_id` (`cat_id`),
  CONSTRAINT `fine_purchase_cat_id_956a404a_fk_fine_cat_id` FOREIGN KEY (`cat_id`) REFERENCES `fine_cat` (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `fine_purchase`
--

LOCK TABLES `fine_purchase` WRITE;
/*!40000 ALTER TABLE `fine_purchase` DISABLE KEYS */;
/*!40000 ALTER TABLE `fine_purchase` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `payroll`
--

DROP TABLE IF EXISTS `payroll`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `payroll` (
  `id` bigint NOT NULL AUTO_INCREMENT,
  `record_state` varchar(10) NOT NULL,
  `employee_name` varchar(100) NOT NULL,
  `basic_pay` decimal(12,2) NOT NULL,
  `spr_amount` decimal(10,2) NOT NULL,
  `net_salary` decimal(12,2) NOT NULL,
  `payment_split_type` varchar(20) NOT NULL,
  `bank_transfer_percentage` decimal(5,2) NOT NULL,
  `cash_percentage` decimal(5,2) NOT NULL,
  `bank_transfer_amount` decimal(12,2) NOT NULL,
  `cash_amount` decimal(12,2) NOT NULL,
  `salary_date` date NOT NULL,
  `month` int unsigned NOT NULL,
  `year` int unsigned NOT NULL,
  `is_paid` tinyint(1) NOT NULL,
  `expenses_created` tinyint(1) NOT NULL,
  `created_at` datetime(6) NOT NULL,
  `updated_at` datetime(6) NOT NULL,
  `worked_days` decimal(5,2) NOT NULL,
  PRIMARY KEY (`id`),
  UNIQUE KEY `payroll_employee_name_month_year_record_state_7196498e_uniq` (`employee_name`,`month`,`year`,`record_state`),
  CONSTRAINT `payroll_chk_1` CHECK ((`month` >= 0)),
  CONSTRAINT `payroll_chk_2` CHECK ((`year` >= 0))
) ENGINE=InnoDB AUTO_INCREMENT=2 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `payroll`
--

LOCK TABLES `payroll` WRITE;
/*!40000 ALTER TABLE `payroll` DISABLE KEYS */;
INSERT INTO `payroll` VALUES (1,'active','Viona',5486.00,0.00,5486.00,'full_cash',0.00,100.00,0.00,5486.00,'2026-01-21',1,2026,1,1,'2026-01-21 03:38:01.182408','2026-01-21 03:38:01.182408',0.00);
/*!40000 ALTER TABLE `payroll` ENABLE KEYS */;
UNLOCK TABLES;
/*!40103 SET TIME_ZONE=@OLD_TIME_ZONE */;

/*!40101 SET SQL_MODE=@OLD_SQL_MODE */;
/*!40014 SET FOREIGN_KEY_CHECKS=@OLD_FOREIGN_KEY_CHECKS */;
/*!40014 SET UNIQUE_CHECKS=@OLD_UNIQUE_CHECKS */;
/*!40101 SET CHARACTER_SET_CLIENT=@OLD_CHARACTER_SET_CLIENT */;
/*!40101 SET CHARACTER_SET_RESULTS=@OLD_CHARACTER_SET_RESULTS */;
/*!40101 SET COLLATION_CONNECTION=@OLD_COLLATION_CONNECTION */;
/*!40111 SET SQL_NOTES=@OLD_SQL_NOTES */;

-- Dump completed on 2026-03-12 18:50:23
