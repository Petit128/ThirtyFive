-- phpMyAdmin SQL Dump
-- version 5.2.1
-- https://www.phpmyadmin.net/
--
-- Host: 127.0.0.1:3306
-- Generation Time: May 11, 2026 at 06:00 AM
-- Server version: 9.1.0
-- PHP Version: 8.3.14

SET SQL_MODE = "NO_AUTO_VALUE_ON_ZERO";
START TRANSACTION;
SET time_zone = "+00:00";


/*!40101 SET @OLD_CHARACTER_SET_CLIENT=@@CHARACTER_SET_CLIENT */;
/*!40101 SET @OLD_CHARACTER_SET_RESULTS=@@CHARACTER_SET_RESULTS */;
/*!40101 SET @OLD_COLLATION_CONNECTION=@@COLLATION_CONNECTION */;
/*!40101 SET NAMES utf8mb4 */;

--
-- Database: `parking_db`
--

-- --------------------------------------------------------

--
-- Table structure for table `parking_entries`
--

DROP TABLE IF EXISTS `parking_entries`;
CREATE TABLE IF NOT EXISTS `parking_entries` (
  `id` int NOT NULL AUTO_INCREMENT,
  `userId` int NOT NULL,
  `spotId` int NOT NULL,
  `entryTime` datetime NOT NULL,
  `exitTime` datetime DEFAULT NULL,
  `amountPaid` decimal(10,2) DEFAULT '0.00',
  `paymentStatus` enum('PAID','PENDING') DEFAULT 'PENDING',
  `vehiclePlate` varchar(20) NOT NULL,
  PRIMARY KEY (`id`),
  KEY `spotId` (`spotId`),
  KEY `idx_entry_time` (`entryTime`),
  KEY `idx_user` (`userId`)
) ENGINE=MyISAM AUTO_INCREMENT=3 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;

--
-- Dumping data for table `parking_entries`
--

INSERT INTO `parking_entries` (`id`, `userId`, `spotId`, `entryTime`, `exitTime`, `amountPaid`, `paymentStatus`, `vehiclePlate`) VALUES
(1, 1, 3, '2026-04-16 02:28:03', '2026-04-16 02:28:08', 2.50, 'PAID', 'ss'),
(2, 2, 3, '2026-04-16 07:09:50', '2026-04-16 07:09:58', 2.50, 'PAID', '12');

-- --------------------------------------------------------

--
-- Table structure for table `parking_spots`
--

DROP TABLE IF EXISTS `parking_spots`;
CREATE TABLE IF NOT EXISTS `parking_spots` (
  `id` int NOT NULL AUTO_INCREMENT,
  `spotNumber` varchar(10) NOT NULL,
  `spotType` enum('STANDARD','VIP','DISABLED','ELECTRIC') DEFAULT 'STANDARD',
  `location` varchar(50) DEFAULT NULL,
  `isAvailable` tinyint(1) DEFAULT '1',
  `hourlyRate` decimal(10,2) NOT NULL,
  `reservedForVIP` tinyint(1) DEFAULT '0',
  PRIMARY KEY (`id`),
  UNIQUE KEY `spotNumber` (`spotNumber`)
) ENGINE=MyISAM AUTO_INCREMENT=11 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;

--
-- Dumping data for table `parking_spots`
--

INSERT INTO `parking_spots` (`id`, `spotNumber`, `spotType`, `location`, `isAvailable`, `hourlyRate`, `reservedForVIP`) VALUES
(1, 'A1', 'STANDARD', 'Floor A - Section 1', 0, 2.50, 0),
(2, 'A2', 'STANDARD', 'Floor A - Section 1', 1, 2.50, 0),
(3, 'A3', 'STANDARD', 'Floor A - Section 2', 1, 2.50, 0),
(4, 'A4', 'STANDARD', 'Floor A - Section 2', 1, 2.50, 0),
(5, 'B1', 'VIP', 'Floor B - VIP Section', 1, 5.00, 1),
(6, 'B2', 'VIP', 'Floor B - VIP Section', 1, 5.00, 1),
(7, 'C1', 'DISABLED', 'Floor C - Near Entrance', 1, 2.00, 0),
(8, 'C2', 'DISABLED', 'Floor C - Near Entrance', 1, 2.00, 0),
(9, 'D1', 'ELECTRIC', 'Floor D - Charging Station', 1, 3.00, 0),
(10, 'D2', 'ELECTRIC', 'Floor D - Charging Station', 1, 3.00, 0);

-- --------------------------------------------------------

--
-- Table structure for table `reservations`
--

DROP TABLE IF EXISTS `reservations`;
CREATE TABLE IF NOT EXISTS `reservations` (
  `id` int NOT NULL AUTO_INCREMENT,
  `userId` int NOT NULL,
  `spotId` int NOT NULL,
  `startTime` datetime NOT NULL,
  `endTime` datetime NOT NULL,
  `status` enum('CONFIRMED','CANCELLED','COMPLETED') DEFAULT 'CONFIRMED',
  `totalPrice` decimal(10,2) DEFAULT NULL,
  `creationDate` timestamp NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  KEY `userId` (`userId`),
  KEY `spotId` (`spotId`),
  KEY `idx_start_time` (`startTime`),
  KEY `idx_status` (`status`)
) ENGINE=MyISAM DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;

-- --------------------------------------------------------

--
-- Table structure for table `subscriptions`
--

DROP TABLE IF EXISTS `subscriptions`;
CREATE TABLE IF NOT EXISTS `subscriptions` (
  `id` int NOT NULL AUTO_INCREMENT,
  `userId` int NOT NULL,
  `spotId` int NOT NULL,
  `subscriptionType` enum('WEEKLY','MONTHLY','YEARLY') NOT NULL,
  `startDate` datetime NOT NULL,
  `endDate` datetime NOT NULL,
  `price` decimal(10,2) NOT NULL,
  `status` enum('ACTIVE','EXPIRED','CANCELLED') DEFAULT 'ACTIVE',
  PRIMARY KEY (`id`),
  KEY `userId` (`userId`),
  KEY `spotId` (`spotId`),
  KEY `idx_end_date` (`endDate`),
  KEY `idx_status` (`status`)
) ENGINE=MyISAM AUTO_INCREMENT=2 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;

--
-- Dumping data for table `subscriptions`
--

INSERT INTO `subscriptions` (`id`, `userId`, `spotId`, `subscriptionType`, `startDate`, `endDate`, `price`, `status`) VALUES
(1, 1, 1, 'WEEKLY', '2026-04-16 02:28:30', '2026-04-23 02:28:30', 120.00, 'ACTIVE');

-- --------------------------------------------------------

--
-- Table structure for table `tariffs`
--

DROP TABLE IF EXISTS `tariffs`;
CREATE TABLE IF NOT EXISTS `tariffs` (
  `id` int NOT NULL AUTO_INCREMENT,
  `tariffType` varchar(50) NOT NULL,
  `hourlyRate` decimal(10,2) NOT NULL,
  `dailyRate` decimal(10,2) DEFAULT NULL,
  `weeklyRate` decimal(10,2) DEFAULT NULL,
  `monthlyRate` decimal(10,2) DEFAULT NULL,
  `vipDiscount` decimal(5,2) DEFAULT '0.00',
  `subscriberDiscount` decimal(5,2) DEFAULT '0.00',
  `lastUpdated` timestamp NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`)
) ENGINE=MyISAM AUTO_INCREMENT=5 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;

--
-- Dumping data for table `tariffs`
--

INSERT INTO `tariffs` (`id`, `tariffType`, `hourlyRate`, `dailyRate`, `weeklyRate`, `monthlyRate`, `vipDiscount`, `subscriberDiscount`, `lastUpdated`) VALUES
(1, 'STANDARD', 2.50, 20.00, 100.00, 300.00, 15.00, 20.00, '2026-04-16 02:01:45'),
(2, 'VIP', 5.00, 40.00, 200.00, 600.00, 0.00, 30.00, '2026-04-16 02:01:45'),
(3, 'DISABLED', 2.00, 15.00, 80.00, 240.00, 20.00, 25.00, '2026-04-16 02:01:45'),
(4, 'ELECTRIC', 3.00, 25.00, 120.00, 360.00, 10.00, 20.00, '2026-04-16 02:01:45');

-- --------------------------------------------------------

--
-- Table structure for table `users`
--

DROP TABLE IF EXISTS `users`;
CREATE TABLE IF NOT EXISTS `users` (
  `id` int NOT NULL AUTO_INCREMENT,
  `username` varchar(50) NOT NULL,
  `password` varchar(255) NOT NULL,
  `fullName` varchar(100) NOT NULL,
  `email` varchar(100) NOT NULL,
  `phone` varchar(20) DEFAULT NULL,
  `role` enum('ADMIN','AGENT','CLIENT') DEFAULT 'CLIENT',
  `userType` enum('REGULAR','VIP') DEFAULT 'REGULAR',
  `vehiclePlate` varchar(20) DEFAULT NULL,
  `registrationDate` timestamp NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  UNIQUE KEY `username` (`username`),
  UNIQUE KEY `email` (`email`)
) ENGINE=MyISAM AUTO_INCREMENT=6 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;

--
-- Dumping data for table `users`
--

INSERT INTO `users` (`id`, `username`, `password`, `fullName`, `email`, `phone`, `role`, `userType`, `vehiclePlate`, `registrationDate`) VALUES
(1, 'admin', 'admin123', 'Administrator', 'admin@parking.com', '+261 34 00 001', 'ADMIN', 'REGULAR', 'ADMIN-001', '2026-04-16 02:01:45'),
(2, 'agent1', 'agent123', 'John Agent', 'agent@parking.com', '+261 34 00 002', 'AGENT', 'REGULAR', 'AGENT-001', '2026-04-16 02:01:45'),
(3, 'john_doe', 'password123', 'John Doe', 'john@example.com', '+261 34 00 003', 'CLIENT', 'REGULAR', 'ABC-123', '2026-04-16 02:01:45'),
(4, 'jane_smith', 'password456', 'Jane Smith', 'jane@example.com', '+261 34 00 004', 'CLIENT', 'VIP', 'XYZ-789', '2026-04-16 02:01:45'),
(5, 'peter_wilson', 'password789', 'Peter Wilson', 'peter@example.com', '+261 34 00 005', 'CLIENT', 'REGULAR', 'DEF-456', '2026-04-16 02:01:45');
COMMIT;

/*!40101 SET CHARACTER_SET_CLIENT=@OLD_CHARACTER_SET_CLIENT */;
/*!40101 SET CHARACTER_SET_RESULTS=@OLD_CHARACTER_SET_RESULTS */;
/*!40101 SET COLLATION_CONNECTION=@OLD_COLLATION_CONNECTION */;
