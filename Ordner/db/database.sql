-- phpMyAdmin SQL Dump
-- version 5.0.2
-- https://www.phpmyadmin.net/
--
-- Host: meinecooledb
-- Generation Time: Apr 09, 2020 at 12:19 PM
-- Server version: 10.4.12-MariaDB-1:10.4.12+maria~bionic
-- PHP Version: 7.4.4

SET SQL_MODE = "NO_AUTO_VALUE_ON_ZERO";
START TRANSACTION;
SET time_zone = "+00:00";


/*!40101 SET @OLD_CHARACTER_SET_CLIENT=@@CHARACTER_SET_CLIENT */;
/*!40101 SET @OLD_CHARACTER_SET_RESULTS=@@CHARACTER_SET_RESULTS */;
/*!40101 SET @OLD_COLLATION_CONNECTION=@@COLLATION_CONNECTION */;
/*!40101 SET NAMES utf8mb4 */;

--
-- Database: `exampledb`
--

-- --------------------------------------------------------

--
--
-- Table structure for table `users`
--
CREATE TABLE `users` (
  `user_id` int(11) NOT NULL AUTO_INCREMENT,
  `username` varchar(255) NOT NULL,
  `password` varchar(255) NOT NULL, -- Achtung: In der Praxis Passwörter gehasht speichern!
  PRIMARY KEY (`user_id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

--
-- Dumping data for table `users`
--
INSERT INTO `users` (`username`, `password`) VALUES
('Benutzer1', 'passwort1'), -- Achtung: In der Praxis Passwörter gehasht speichern!
('Benutzer2', 'passwort2');

--
-- Table structure for table `kontakte`
--
CREATE TABLE `kontakte` (
  `kontakt_id` int(11) NOT NULL AUTO_INCREMENT,
  `user_id` int(11) NOT NULL,
  `freund_user_id` int(11) NOT NULL,
  PRIMARY KEY (`kontakt_id`),
  KEY `user_id` (`user_id`),
  KEY `freund_user_id` (`freund_user_id`),
  CONSTRAINT `kontakte_ibfk_1` FOREIGN KEY (`user_id`) REFERENCES `users` (`user_id`),
  CONSTRAINT `kontakte_ibfk_2` FOREIGN KEY (`freund_user_id`) REFERENCES `users` (`user_id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

--
-- Dumping data for table `kontakte`
--
INSERT INTO `kontakte` (`user_id`, `freund_user_id`) VALUES
(1, 2),
(2, 1);
