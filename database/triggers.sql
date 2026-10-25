SET NAMES utf8mb4;
USE gym_management;

DELIMITER $$

-- =============================================================================
-- TRIGGERS
-- =============================================================================

-- T1: trg_subscription_bi (BEFORE INSERT ON Subscription)
DROP TRIGGER IF EXISTS `trg_subscription_bi`$$
CREATE TRIGGER `trg_subscription_bi`
BEFORE INSERT ON `Subscription`
FOR EACH ROW
BEGIN
  -- (1) Auto-expire active subscriptions with past End_Date
  IF NEW.Status = 'Active' AND NEW.End_Date < CURDATE() THEN
    SET NEW.Status = 'Expired';
  END IF;

  -- (2) Prevent overlapping Active subscriptions for the same member
  IF NEW.Status = 'Active' AND EXISTS (
    SELECT 1 FROM `Subscription`
    WHERE `Member_ID` = NEW.Member_ID
      AND `Status` = 'Active'
      AND `Sub_ID` <> IFNULL(NEW.Sub_ID, 0)
      AND `Start_Date` <= NEW.End_Date
      AND `End_Date` >= NEW.Start_Date
  ) THEN
    SIGNAL SQLSTATE '45000'
      SET MESSAGE_TEXT = 'Member already has an Active subscription overlapping these dates. A new one must start after the current one ends.';
  END IF;
END$$

-- T2: trg_subscription_bu (BEFORE UPDATE ON Subscription)
DROP TRIGGER IF EXISTS `trg_subscription_bu`$$
CREATE TRIGGER `trg_subscription_bu`
BEFORE UPDATE ON `Subscription`
FOR EACH ROW
BEGIN
  -- (1) Auto-expire active subscriptions with past End_Date
  IF NEW.Status = 'Active' AND NEW.End_Date < CURDATE() THEN
    SET NEW.Status = 'Expired';
  END IF;

  -- (2) Prevent overlapping Active subscriptions for the same member
  IF NEW.Status = 'Active' AND EXISTS (
    SELECT 1 FROM `Subscription`
    WHERE `Member_ID` = NEW.Member_ID
      AND `Status` = 'Active'
      AND `Sub_ID` <> IFNULL(NEW.Sub_ID, 0)
      AND `Start_Date` <= NEW.End_Date
      AND `End_Date` >= NEW.Start_Date
  ) THEN
    SIGNAL SQLSTATE '45000'
      SET MESSAGE_TEXT = 'Member already has an Active subscription overlapping these dates. A new one must start after the current one ends.';
  END IF;
END$$

-- T3: trg_payment_bi (BEFORE INSERT ON Payment)
DROP TRIGGER IF EXISTS `trg_payment_bi`$$
CREATE TRIGGER `trg_payment_bi`
BEFORE INSERT ON `Payment`
FOR EACH ROW
BEGIN
  IF (SELECT `Status` FROM `Subscription` WHERE `Sub_ID` = NEW.Sub_ID) = 'Cancelled' THEN
    SIGNAL SQLSTATE '45000'
      SET MESSAGE_TEXT = 'Cannot record a payment for a Cancelled subscription.';
  END IF;
END$$

-- T4: trg_attendance_bi (BEFORE INSERT ON Attendance)
DROP TRIGGER IF EXISTS `trg_attendance_bi`$$
CREATE TRIGGER `trg_attendance_bi`
BEFORE INSERT ON `Attendance`
FOR EACH ROW
BEGIN
  IF NEW.Check_Out IS NOT NULL AND NEW.Check_Out <= NEW.Check_In THEN
    SIGNAL SQLSTATE '45000'
      SET MESSAGE_TEXT = 'Check-out time must be later than check-in time.';
  END IF;
END$$

-- T5: trg_attendance_bu (BEFORE UPDATE ON Attendance)
DROP TRIGGER IF EXISTS `trg_attendance_bu`$$
CREATE TRIGGER `trg_attendance_bu`
BEFORE UPDATE ON `Attendance`
FOR EACH ROW
BEGIN
  IF NEW.Check_Out IS NOT NULL AND NEW.Check_Out <= NEW.Check_In THEN
    SIGNAL SQLSTATE '45000'
      SET MESSAGE_TEXT = 'Check-out time must be later than check-in time.';
  END IF;
END$$

-- T6: trg_maintenance_ai (AFTER INSERT ON Maintenance_Log)
DROP TRIGGER IF EXISTS `trg_maintenance_ai`$$
CREATE TRIGGER `trg_maintenance_ai`
AFTER INSERT ON `Maintenance_Log`
FOR EACH ROW
BEGIN
  -- Constant: ALERT_LOG_LIMIT = 3
  -- Constant: ALERT_WINDOW_DAYS = 90
  IF (
    SELECT COUNT(*)
    FROM `Maintenance_Log`
    WHERE `Equip_ID` = NEW.Equip_ID
      AND `Service_Date` >= DATE_SUB(CURDATE(), INTERVAL 90 DAY)
  ) >= 3 THEN
    UPDATE `Equipment`
    SET `Condition` = 'Out of Order'
    WHERE `Equip_ID` = NEW.Equip_ID
      AND `Condition` <> 'Out of Order';
  END IF;
END$$

-- T7: trg_plan_bi (BEFORE INSERT ON Membership_Plan)
-- Enforces: Longer plans must cost strictly less per month than shorter plans.
DROP TRIGGER IF EXISTS `trg_plan_bi`$$
CREATE TRIGGER `trg_plan_bi`
BEFORE INSERT ON `Membership_Plan`
FOR EACH ROW
BEGIN
  IF EXISTS (
    SELECT 1 FROM `Membership_Plan`
    WHERE `Plan_ID` <> IFNULL(NEW.Plan_ID, 0)
      AND (
        (`Duration_Months` > NEW.Duration_Months AND (`Fee` / `Duration_Months`) >= (NEW.Fee / NEW.Duration_Months))
        OR
        (`Duration_Months` < NEW.Duration_Months AND (`Fee` / `Duration_Months`) <= (NEW.Fee / NEW.Duration_Months))
      )
  ) THEN
    SIGNAL SQLSTATE '45000'
      SET MESSAGE_TEXT = 'A longer plan must cost less per month than a shorter plan.';
  END IF;
END$$

-- T8: trg_plan_bu (BEFORE UPDATE ON Membership_Plan)
-- Enforces: Longer plans must cost strictly less per month than shorter plans.
DROP TRIGGER IF EXISTS `trg_plan_bu`$$
CREATE TRIGGER `trg_plan_bu`
BEFORE UPDATE ON `Membership_Plan`
FOR EACH ROW
BEGIN
  IF EXISTS (
    SELECT 1 FROM `Membership_Plan`
    WHERE `Plan_ID` <> IFNULL(NEW.Plan_ID, 0)
      AND (
        (`Duration_Months` > NEW.Duration_Months AND (`Fee` / `Duration_Months`) >= (NEW.Fee / NEW.Duration_Months))
        OR
        (`Duration_Months` < NEW.Duration_Months AND (`Fee` / `Duration_Months`) <= (NEW.Fee / NEW.Duration_Months))
      )
  ) THEN
    SIGNAL SQLSTATE '45000'
      SET MESSAGE_TEXT = 'A longer plan must cost less per month than a shorter plan.';
  END IF;
END$$

-- =============================================================================
-- EVENT
-- =============================================================================
-- Note: MySQL 8.0 enables the event scheduler by default.
-- Verify status with: SHOW VARIABLES LIKE 'event_scheduler';

DROP EVENT IF EXISTS `evt_expire_subscriptions`$$
CREATE EVENT `evt_expire_subscriptions`
ON SCHEDULE EVERY 1 HOUR
STARTS CURRENT_TIMESTAMP
DO
  UPDATE `Subscription`
  SET `Status` = 'Expired'
  WHERE `Status` = 'Active'
    AND `End_Date` < CURDATE()$$

DELIMITER ;
