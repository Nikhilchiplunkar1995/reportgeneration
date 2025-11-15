/*
-- --------------------------------------------------------
--
-- This SQL script creates the database schema for the
-- sustainable products application and populates it with
-- initial data.
--
-- To use this file:
-- 1. Make sure you have MySQL installed and running.
-- 2. Create a database (e.g., `sustainability_db`).
-- 3. Use a tool like MySQL Workbench or the `mysql` command-line
--    client to execute the SQL commands in this file.
-- 4. Update the `dbConfig` in `server/server.js` with your
--    MySQL username, password, and the database name you created.
--
-- --------------------------------------------------------
*/

-- Create a new database if it doesn't exist
CREATE DATABASE IF NOT EXISTS `sustainability_db`;

-- Use the newly created database
USE `sustainability_db`;

-- --------------------------------------------------------

--
-- Table structure for table `categories`
--
DROP TABLE IF EXISTS `categories`;
CREATE TABLE `categories` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `name` varchar(255) NOT NULL,
  PRIMARY KEY (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

--
-- Dumping data for table `categories`
--
INSERT INTO `categories` (`id`, `name`) VALUES
(1, 'Kitchen'),
(2, 'Apparel'),
(3, 'Home Goods'),
(4, 'Office'),
(5, 'Electronics');

-- --------------------------------------------------------

--
-- Table structure for table `products`
--
DROP TABLE IF EXISTS `products`;
CREATE TABLE `products` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `name` varchar(255) NOT NULL,
  `categoryId` int(11) NOT NULL,
  `price` decimal(10,2) NOT NULL,
  `description` text,
  PRIMARY KEY (`id`),
  KEY `categoryId` (`categoryId`),
  CONSTRAINT `products_ibfk_1` FOREIGN KEY (`categoryId`) REFERENCES `categories` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

--
-- Dumping data for table `products`
--
INSERT INTO `products` (`id`, `name`, `categoryId`, `price`, `description`) VALUES
(1, 'Eco-Friendly Water Bottle', 1, 15.99, 'A reusable water bottle made from recycled materials.'),
(2, 'Organic Cotton T-Shirt', 2, 24.99, 'A soft and comfortable t-shirt made from 100% organic cotton.'),
(3, 'Bamboo Toothbrush Set', 3, 9.99, 'A set of four biodegradable bamboo toothbrushes.'),
(4, 'Recycled Paper Notebook', 4, 7.99, 'A stylish notebook made from 100% recycled paper.'),
(5, 'Solar-Powered Phone Charger', 5, 49.99, 'A portable charger that uses solar energy to power your devices.'),
(6, 'Reusable Grocery Bags', 1, 12.99, 'A set of three durable and washable grocery bags.'),
(7, 'Natural Beeswax Candles', 3, 18.99, 'A set of three hand-poured candles made from natural beeswax.');

