CREATE DATABASE IF NOT EXISTS gym_management;
USE gym_management;

SET FOREIGN_KEY_CHECKS = 0;
DROP TABLE IF EXISTS `Maintenance_Log`;
DROP TABLE IF EXISTS `Attendance`;
DROP TABLE IF EXISTS `Session`;
DROP TABLE IF EXISTS `Payment`;
DROP TABLE IF EXISTS `Subscription`;
DROP TABLE IF EXISTS `Equipment`;
DROP TABLE IF EXISTS `Trainer`;
DROP TABLE IF EXISTS `Member`;
DROP TABLE IF EXISTS `Membership_Plan`;
SET FOREIGN_KEY_CHECKS = 1;

CREATE TABLE `Membership_Plan` (
  `Plan_ID` INT AUTO_INCREMENT PRIMARY KEY,
  `Plan_Name` VARCHAR(100) NOT NULL UNIQUE,
  `Duration_Months` INT NOT NULL,
  `Fee` DECIMAL(10,2) NOT NULL,
  CONSTRAINT `chk_membership_plan_duration` CHECK (`Duration_Months` > 0),
  CONSTRAINT `chk_membership_plan_fee` CHECK (`Fee` >= 0)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE `Member` (
  `Member_ID` INT AUTO_INCREMENT PRIMARY KEY,
  `Name` VARCHAR(100) NOT NULL,
  `DOB` DATE NOT NULL,
  `Gender` ENUM('Male','Female','Other') NOT NULL,
  `Phone` VARCHAR(20) NOT NULL,
  `Email` VARCHAR(150) NOT NULL UNIQUE,
  `Join_Date` DATE NOT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE `Trainer` (
  `Trainer_ID` INT AUTO_INCREMENT PRIMARY KEY,
  `Name` VARCHAR(100) NOT NULL,
  `Specialization` VARCHAR(100) NOT NULL,
  `Phone` VARCHAR(20) NOT NULL,
  `Salary` DECIMAL(10,2) NOT NULL,
  CONSTRAINT `chk_trainer_salary` CHECK (`Salary` >= 0)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE `Equipment` (
  `Equip_ID` INT AUTO_INCREMENT PRIMARY KEY,
  `Name` VARCHAR(100) NOT NULL,
  `Category` VARCHAR(100) NOT NULL,
  `Purchase_Date` DATE NOT NULL,
  `Condition` ENUM('Excellent','Good','Fair','Poor','Out of Order') NOT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE `Subscription` (
  `Sub_ID` INT AUTO_INCREMENT PRIMARY KEY,
  `Member_ID` INT NOT NULL,
  `Plan_ID` INT NOT NULL,
  `Start_Date` DATE NOT NULL,
  `End_Date` DATE NOT NULL,
  `Status` ENUM('Active','Expired','Cancelled') NOT NULL DEFAULT 'Active',
  CONSTRAINT `chk_subscription_dates` CHECK (`End_Date` >= `Start_Date`),
  CONSTRAINT `fk_subscription_member`
    FOREIGN KEY (`Member_ID`) REFERENCES `Member` (`Member_ID`)
    ON DELETE RESTRICT ON UPDATE CASCADE,
  CONSTRAINT `fk_subscription_plan`
    FOREIGN KEY (`Plan_ID`) REFERENCES `Membership_Plan` (`Plan_ID`)
    ON DELETE RESTRICT ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE `Payment` (
  `Payment_ID` INT AUTO_INCREMENT PRIMARY KEY,
  `Sub_ID` INT NOT NULL,
  `Amount` DECIMAL(10,2) NOT NULL,
  `Paid_On` DATE NOT NULL,
  `Mode` ENUM('Cash','Card','UPI','Net Banking') NOT NULL,
  CONSTRAINT `chk_payment_amount` CHECK (`Amount` > 0),
  CONSTRAINT `fk_payment_subscription`
    FOREIGN KEY (`Sub_ID`) REFERENCES `Subscription` (`Sub_ID`)
    ON DELETE RESTRICT ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE `Session` (
  `Session_ID` INT AUTO_INCREMENT PRIMARY KEY,
  `Member_ID` INT NOT NULL,
  `Trainer_ID` INT NOT NULL,
  `Slot_DateTime` DATETIME NOT NULL,
  `Focus_Area` VARCHAR(100) NOT NULL,
  UNIQUE KEY `uk_session_trainer_slot` (`Trainer_ID`, `Slot_DateTime`),
  CONSTRAINT `fk_session_member`
    FOREIGN KEY (`Member_ID`) REFERENCES `Member` (`Member_ID`)
    ON DELETE RESTRICT ON UPDATE CASCADE,
  CONSTRAINT `fk_session_trainer`
    FOREIGN KEY (`Trainer_ID`) REFERENCES `Trainer` (`Trainer_ID`)
    ON DELETE RESTRICT ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE `Attendance` (
  `Att_ID` INT AUTO_INCREMENT PRIMARY KEY,
  `Member_ID` INT NOT NULL,
  `Visit_Date` DATE NOT NULL,
  `Check_In` TIME NOT NULL,
  `Check_Out` TIME NULL,
  CONSTRAINT `fk_attendance_member`
    FOREIGN KEY (`Member_ID`) REFERENCES `Member` (`Member_ID`)
    ON DELETE RESTRICT ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE `Maintenance_Log` (
  `Log_ID` INT AUTO_INCREMENT PRIMARY KEY,
  `Equip_ID` INT NOT NULL,
  `Service_Date` DATE NOT NULL,
  `Cost` DECIMAL(10,2) NOT NULL,
  `Technician` VARCHAR(100) NOT NULL,
  CONSTRAINT `chk_maintenance_cost` CHECK (`Cost` >= 0),
  CONSTRAINT `fk_maintenance_equipment`
    FOREIGN KEY (`Equip_ID`) REFERENCES `Equipment` (`Equip_ID`)
    ON DELETE RESTRICT ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
