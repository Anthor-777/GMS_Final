SET NAMES utf8mb4;
USE gym_management;

-- Clear data in reverse foreign-key order
DELETE FROM `Maintenance_Log`;
DELETE FROM `Attendance`;
DELETE FROM `Session`;
DELETE FROM `Payment`;
DELETE FROM `Subscription`;
DELETE FROM `Equipment`;
DELETE FROM `Trainer`;
DELETE FROM `Member`;
DELETE FROM `Membership_Plan`;

ALTER TABLE `Membership_Plan` AUTO_INCREMENT = 1;
ALTER TABLE `Member` AUTO_INCREMENT = 1;
ALTER TABLE `Trainer` AUTO_INCREMENT = 1;
ALTER TABLE `Equipment` AUTO_INCREMENT = 1;
ALTER TABLE `Subscription` AUTO_INCREMENT = 1;
ALTER TABLE `Payment` AUTO_INCREMENT = 1;
ALTER TABLE `Session` AUTO_INCREMENT = 1;
ALTER TABLE `Attendance` AUTO_INCREMENT = 1;
ALTER TABLE `Maintenance_Log` AUTO_INCREMENT = 1;

-- =============================================================================
-- 1. MEMBERSHIP PLANS (strictly decreasing per-month fee to satisfy trg_plan_bi)
-- Monthly: 1500/mo; Quarterly: 1300/mo; Half Yearly: 1200/mo; Annual: 1000/mo
-- =============================================================================
INSERT INTO `Membership_Plan` (`Plan_ID`, `Plan_Name`, `Duration_Months`, `Fee`) VALUES
  (1, 'Monthly Fit',        1,  1500.00),
  (2, 'Quarterly Strength',  3,  3900.00),
  (3, 'Half Yearly Elite',   6,  7200.00),
  (4, 'Annual Premium',     12, 12000.00);

-- =============================================================================
-- 2. MEMBERS (20 members, realistic Indian names, 4 age bands, multiple genders)
-- All members joined >= 100 days ago except Member 4 (recent joiner: 30 days ago)
-- Age Bands based on 2026:
-- Under 25: 1 (22), 2 (23), 3 (24), 4 (21), 5 (22)
-- 25-34:    6 (30), 7 (28), 8 (29), 9 (32), 10 (30)
-- 35-44:    11 (38), 12 (36), 13 (40), 14 (42), 15 (37)
-- 45+:      16 (48), 17 (52), 18 (56), 19 (50), 20 (46)
-- =============================================================================
INSERT INTO `Member` (`Member_ID`, `Name`, `DOB`, `Gender`, `Phone`, `Email`, `Join_Date`) VALUES
  (1,  'Aarav Sharma',     '2004-05-14', 'Male',   '9876543210', 'aarav.sharma@gmail.com',     DATE_SUB(CURDATE(), INTERVAL 400 DAY)),
  (2,  'Ananya Reddy',     '2003-08-20', 'Female', '9834567890', 'ananya.reddy@gmail.com',     DATE_SUB(CURDATE(), INTERVAL 180 DAY)),
  (3,  'Kabir Khan',       '2002-11-10', 'Male',   '9901234567', 'kabir.khan@gmail.com',       DATE_SUB(CURDATE(), INTERVAL 210 DAY)),
  (4,  'Diya Sengupta',    '2005-02-18', 'Female', '9812345601', 'diya.sengupta@gmail.com',    DATE_SUB(CURDATE(), INTERVAL 30 DAY)),
  (5,  'Tanvi Verma',      '2004-09-30', 'Female', '9812345602', 'tanvi.verma@outlook.com',    DATE_SUB(CURDATE(), INTERVAL 120 DAY)),
  (6,  'Rohan Mehta',      '1996-04-12', 'Male',   '9823456789', 'rohan.mehta@yahoo.com',      DATE_SUB(CURDATE(), INTERVAL 360 DAY)),
  (7,  'Priya Iyer',       '1998-11-03', 'Female', '9812345678', 'priya.iyer@gmail.com',       DATE_SUB(CURDATE(), INTERVAL 420 DAY)),
  (8,  'Sneha Patil',      '1997-12-25', 'Female', '9856789012', 'sneha.patil@gmail.com',      DATE_SUB(CURDATE(), INTERVAL 240 DAY)),
  (9,  'Vikram Singh',     '1994-07-21', 'Male',   '9845678901', 'vikram.singh@outlook.com',   DATE_SUB(CURDATE(), INTERVAL 150 DAY)),
  (10, 'Ishita Banerjee',  '1996-10-17', 'Female', '9912345678', 'ishita.banerjee@yahoo.com',  DATE_SUB(CURDATE(), INTERVAL 200 DAY)),
  (11, 'Arjun Nair',       '1988-03-15', 'Male',   '9867890123', 'arjun.nair@gmail.com',       DATE_SUB(CURDATE(), INTERVAL 500 DAY)),
  (12, 'Kavya Gupta',      '1990-06-14', 'Female', '9878901234', 'kavya.gupta@hotmail.com',    DATE_SUB(CURDATE(), INTERVAL 300 DAY)),
  (13, 'Aditya Joshi',     '1986-09-08', 'Male',   '9889012345', 'aditya.joshi@gmail.com',     DATE_SUB(CURDATE(), INTERVAL 270 DAY)),
  (14, 'Meera Krishnan',   '1984-01-22', 'Female', '9890123456', 'meera.krishnan@gmail.com',   DATE_SUB(CURDATE(), INTERVAL 330 DAY)),
  (15, 'Rahul Deshmukh',   '1989-12-05', 'Male',   '9812345603', 'rahul.deshmukh@gmail.com',   DATE_SUB(CURDATE(), INTERVAL 140 DAY)),
  (16, 'Sunita Rao',       '1978-04-18', 'Female', '9812345604', 'sunita.rao@yahoo.com',       DATE_SUB(CURDATE(), INTERVAL 450 DAY)),
  (17, 'Rajesh Bhatia',    '1974-08-11', 'Male',   '9812345605', 'rajesh.bhatia@gmail.com',    DATE_SUB(CURDATE(), INTERVAL 280 DAY)),
  (18, 'Anil Kulkarni',    '1970-10-25', 'Male',   '9812345606', 'anil.kulkarni@rediff.com',   DATE_SUB(CURDATE(), INTERVAL 390 DAY)),
  (19, 'Geeta Pillai',     '1976-03-09', 'Female', '9812345607', 'geeta.pillai@gmail.com',     DATE_SUB(CURDATE(), INTERVAL 220 DAY)),
  (20, 'Preeti Choudhury', '1980-07-14', 'Other',  '9812345608', 'preeti.choudhury@gmail.com', DATE_SUB(CURDATE(), INTERVAL 190 DAY));

-- =============================================================================
-- 3. TRAINERS
-- =============================================================================
INSERT INTO `Trainer` (`Trainer_ID`, `Name`, `Specialization`, `Phone`, `Salary`) VALUES
  (1, 'Rajesh Kumar',   'Strength Training',    '9923456789', 45000.00),
  (2, 'Neha Desai',     'Yoga and Flexibility', '9934567890', 38000.00),
  (3, 'Suresh Pillai',  'HIIT and Cardio',      '9945678901', 42000.00),
  (4, 'Pooja Malhotra', 'Weight Loss Coaching', '9956789012', 40000.00),
  (5, 'Farhan Ali',     'Sports Conditioning',  '9967890123', 48000.00);

-- =============================================================================
-- 4. EQUIPMENT
-- Equip 8 starts 'Good'. 3 logs inside 90 days will trigger trg_maintenance_ai to 'Out of Order'.
-- Equip 3 has exactly 2 logs (1 within 90 days), remaining 'Fair'.
-- Equip 10 has Condition 'Poor'.
-- =============================================================================
INSERT INTO `Equipment` (`Equip_ID`, `Name`, `Category`, `Purchase_Date`, `Condition`) VALUES
  (1,  'Olympic Barbell 20kg',     'Free Weights',     DATE_SUB(CURDATE(), INTERVAL 900 DAY),  'Excellent'),
  (2,  'Adjustable Dumbbell Pair', 'Free Weights',     DATE_SUB(CURDATE(), INTERVAL 700 DAY),  'Good'),
  (3,  'Treadmill T900',           'Cardio',           DATE_SUB(CURDATE(), INTERVAL 1100 DAY), 'Fair'),
  (4,  'Spin Bike S200',           'Cardio',           DATE_SUB(CURDATE(), INTERVAL 500 DAY),  'Good'),
  (5,  'Lat Pulldown Machine',     'Strength Machine', DATE_SUB(CURDATE(), INTERVAL 800 DAY),  'Excellent'),
  (6,  'Leg Press 45 Degree',      'Strength Machine', DATE_SUB(CURDATE(), INTERVAL 950 DAY),  'Good'),
  (7,  'Cable Crossover Station',  'Strength Machine', DATE_SUB(CURDATE(), INTERVAL 1200 DAY), 'Good'),
  (8,  'Rowing Machine R1',        'Cardio',           DATE_SUB(CURDATE(), INTERVAL 600 DAY),  'Good'),
  (9,  'Kettlebell Set 8-32kg',    'Free Weights',     DATE_SUB(CURDATE(), INTERVAL 400 DAY),  'Excellent'),
  (10, 'Smith Machine Pro',        'Strength Machine', DATE_SUB(CURDATE(), INTERVAL 1300 DAY), 'Poor');

-- =============================================================================
-- 5. SUBSCRIPTIONS (30 subscriptions, realistic spread across plans)
-- =============================================================================
INSERT INTO `Subscription` (`Sub_ID`, `Member_ID`, `Plan_ID`, `Start_Date`, `End_Date`, `Status`) VALUES
  (1,  1,  4, DATE_SUB(CURDATE(), INTERVAL 180 DAY), DATE_ADD(CURDATE(), INTERVAL 185 DAY), 'Active'),
  (2,  1,  1, DATE_ADD(CURDATE(), INTERVAL 186 DAY), DATE_ADD(CURDATE(), INTERVAL 216 DAY), 'Active'),
  (3,  2,  1, DATE_SUB(CURDATE(), INTERVAL 20 DAY),  DATE_ADD(CURDATE(), INTERVAL 10 DAY),  'Active'),
  (4,  3,  2, DATE_SUB(CURDATE(), INTERVAL 60 DAY),  DATE_ADD(CURDATE(), INTERVAL 30 DAY),  'Active'),
  (5,  4,  1, DATE_SUB(CURDATE(), INTERVAL 27 DAY),  DATE_ADD(CURDATE(), INTERVAL 3 DAY),   'Active'),
  (6,  5,  1, DATE_SUB(CURDATE(), INTERVAL 25 DAY),  DATE_ADD(CURDATE(), INTERVAL 5 DAY),   'Active'),
  (7,  6,  2, DATE_SUB(CURDATE(), INTERVAL 84 DAY),  DATE_ADD(CURDATE(), INTERVAL 6 DAY),   'Active'),
  (8,  7,  4, DATE_SUB(CURDATE(), INTERVAL 400 DAY), DATE_SUB(CURDATE(), INTERVAL 35 DAY),  'Expired'),
  (9,  7,  2, DATE_SUB(CURDATE(), INTERVAL 10 DAY),  DATE_ADD(CURDATE(), INTERVAL 80 DAY),  'Active'),
  (10, 8,  1, DATE_SUB(CURDATE(), INTERVAL 120 DAY), DATE_SUB(CURDATE(), INTERVAL 90 DAY),  'Expired'),
  (11, 8,  3, DATE_SUB(CURDATE(), INTERVAL 85 DAY),  DATE_ADD(CURDATE(), INTERVAL 95 DAY),  'Active'),
  (12, 9,  2, DATE_SUB(CURDATE(), INTERVAL 45 DAY),  DATE_ADD(CURDATE(), INTERVAL 45 DAY),  'Active'),
  (13, 10, 2, DATE_SUB(CURDATE(), INTERVAL 60 DAY),  DATE_ADD(CURDATE(), INTERVAL 30 DAY),  'Cancelled'),
  (14, 10, 1, DATE_SUB(CURDATE(), INTERVAL 15 DAY),  DATE_ADD(CURDATE(), INTERVAL 15 DAY),  'Active'),
  (15, 11, 1, DATE_SUB(CURDATE(), INTERVAL 100 DAY), DATE_SUB(CURDATE(), INTERVAL 70 DAY),  'Cancelled'),
  (16, 11, 1, DATE_SUB(CURDATE(), INTERVAL 10 DAY),  DATE_ADD(CURDATE(), INTERVAL 20 DAY),  'Active'),
  (17, 12, 1, DATE_SUB(CURDATE(), INTERVAL 210 DAY), DATE_SUB(CURDATE(), INTERVAL 180 DAY), 'Expired'),
  (18, 12, 3, DATE_SUB(CURDATE(), INTERVAL 90 DAY),  DATE_ADD(CURDATE(), INTERVAL 90 DAY),  'Active'),
  (19, 13, 4, DATE_SUB(CURDATE(), INTERVAL 120 DAY), DATE_ADD(CURDATE(), INTERVAL 245 DAY), 'Active'),
  (20, 14, 2, DATE_SUB(CURDATE(), INTERVAL 180 DAY), DATE_SUB(CURDATE(), INTERVAL 90 DAY),  'Expired'),
  (21, 14, 2, DATE_SUB(CURDATE(), INTERVAL 40 DAY),  DATE_ADD(CURDATE(), INTERVAL 50 DAY),  'Active'),
  (22, 15, 3, DATE_SUB(CURDATE(), INTERVAL 30 DAY),  DATE_ADD(CURDATE(), INTERVAL 150 DAY), 'Active'),
  (23, 16, 3, DATE_SUB(CURDATE(), INTERVAL 150 DAY), DATE_SUB(CURDATE(), INTERVAL 90 DAY),  'Cancelled'),
  (24, 16, 1, DATE_SUB(CURDATE(), INTERVAL 12 DAY),  DATE_ADD(CURDATE(), INTERVAL 18 DAY),  'Active'),
  (25, 17, 2, DATE_SUB(CURDATE(), INTERVAL 35 DAY),  DATE_ADD(CURDATE(), INTERVAL 55 DAY),  'Active'),
  (26, 18, 1, DATE_SUB(CURDATE(), INTERVAL 120 DAY), DATE_SUB(CURDATE(), INTERVAL 90 DAY),  'Expired'),
  (27, 18, 2, DATE_SUB(CURDATE(), INTERVAL 20 DAY),  DATE_ADD(CURDATE(), INTERVAL 70 DAY),  'Active'),
  (28, 19, 4, DATE_SUB(CURDATE(), INTERVAL 100 DAY), DATE_ADD(CURDATE(), INTERVAL 265 DAY), 'Active'),
  (29, 20, 1, DATE_SUB(CURDATE(), INTERVAL 160 DAY), DATE_SUB(CURDATE(), INTERVAL 130 DAY), 'Expired'),
  (30, 20, 3, DATE_SUB(CURDATE(), INTERVAL 50 DAY),  DATE_ADD(CURDATE(), INTERVAL 130 DAY), 'Active');

-- =============================================================================
-- 6. PAYMENTS (27 payments, 0 on Cancelled subscriptions)
-- =============================================================================
INSERT INTO `Payment` (`Payment_ID`, `Sub_ID`, `Amount`, `Paid_On`, `Mode`) VALUES
  (1,  1,  12000.00, DATE_SUB(CURDATE(), INTERVAL 180 DAY), 'Net Banking'),
  (2,  2,   1500.00, DATE_SUB(CURDATE(), INTERVAL 10 DAY),  'UPI'),
  (3,  3,   1500.00, DATE_SUB(CURDATE(), INTERVAL 20 DAY),  'UPI'),
  (4,  4,   3900.00, DATE_SUB(CURDATE(), INTERVAL 60 DAY),  'Card'),
  (5,  5,   1500.00, DATE_SUB(CURDATE(), INTERVAL 27 DAY),  'Cash'),
  (6,  6,   1500.00, DATE_SUB(CURDATE(), INTERVAL 25 DAY),  'UPI'),
  (7,  7,   3900.00, DATE_SUB(CURDATE(), INTERVAL 84 DAY),  'Net Banking'),
  (8,  8,  12000.00, DATE_SUB(CURDATE(), INTERVAL 400 DAY), 'Card'),
  (9,  9,   3900.00, DATE_SUB(CURDATE(), INTERVAL 10 DAY),  'Card'),
  (10, 10,  1500.00, DATE_SUB(CURDATE(), INTERVAL 120 DAY), 'Cash'),
  (11, 11,  7200.00, DATE_SUB(CURDATE(), INTERVAL 85 DAY),  'Net Banking'),
  (12, 12,  3900.00, DATE_SUB(CURDATE(), INTERVAL 45 DAY),  'UPI'),
  (13, 14,  1500.00, DATE_SUB(CURDATE(), INTERVAL 15 DAY),  'UPI'),
  (14, 16,  1500.00, DATE_SUB(CURDATE(), INTERVAL 10 DAY),  'Cash'),
  (15, 17,  1500.00, DATE_SUB(CURDATE(), INTERVAL 210 DAY), 'Card'),
  (16, 18,  7200.00, DATE_SUB(CURDATE(), INTERVAL 90 DAY),  'Net Banking'),
  (17, 19, 12000.00, DATE_SUB(CURDATE(), INTERVAL 120 DAY), 'Card'),
  (18, 20,  3900.00, DATE_SUB(CURDATE(), INTERVAL 180 DAY), 'UPI'),
  (19, 21,  3900.00, DATE_SUB(CURDATE(), INTERVAL 40 DAY),  'Card'),
  (20, 22,  7200.00, DATE_SUB(CURDATE(), INTERVAL 30 DAY),  'Net Banking'),
  (21, 24,  1500.00, DATE_SUB(CURDATE(), INTERVAL 12 DAY),  'Cash'),
  (22, 25,  3900.00, DATE_SUB(CURDATE(), INTERVAL 35 DAY),  'UPI'),
  (23, 26,  1500.00, DATE_SUB(CURDATE(), INTERVAL 120 DAY), 'Card'),
  (24, 27,  3900.00, DATE_SUB(CURDATE(), INTERVAL 20 DAY),  'Net Banking'),
  (25, 28, 12000.00, DATE_SUB(CURDATE(), INTERVAL 100 DAY), 'Net Banking'),
  (26, 29,  1500.00, DATE_SUB(CURDATE(), INTERVAL 160 DAY), 'Cash'),
  (27, 30,  7200.00, DATE_SUB(CURDATE(), INTERVAL 50 DAY),  'UPI');

-- =============================================================================
-- 7. SESSIONS (26 personal training sessions, all 5 trainers)
-- =============================================================================
INSERT INTO `Session` (`Session_ID`, `Member_ID`, `Trainer_ID`, `Slot_DateTime`, `Focus_Area`) VALUES
  (1,  1,  1, DATE_SUB(NOW(), INTERVAL 10 DAY) + INTERVAL 7 HOUR,   'Compound Lifts'),
  (2,  2,  2, DATE_SUB(NOW(), INTERVAL 8 DAY) + INTERVAL 8 HOUR,    'Vinyasa Flow'),
  (3,  3,  3, DATE_SUB(NOW(), INTERVAL 7 DAY) + INTERVAL 18 HOUR,   'HIIT Circuits'),
  (4,  4,  4, DATE_SUB(NOW(), INTERVAL 6 DAY) + INTERVAL 9 HOUR,    'Fat Loss Plan'),
  (5,  5,  5, DATE_SUB(NOW(), INTERVAL 5 DAY) + INTERVAL 17 HOUR,   'Athletic Conditioning'),
  (6,  6,  1, DATE_SUB(NOW(), INTERVAL 4 DAY) + INTERVAL 7 HOUR,    'Upper Body Strength'),
  (7,  7,  2, DATE_SUB(NOW(), INTERVAL 3 DAY) + INTERVAL 8 HOUR,    'Mobility and Core'),
  (8,  8,  3, DATE_SUB(NOW(), INTERVAL 2 DAY) + INTERVAL 18 HOUR,   'Cardio Endurance'),
  (9,  9,  4, DATE_SUB(NOW(), INTERVAL 1 DAY) + INTERVAL 9 HOUR,    'Nutrition-linked Training'),
  (10, 10, 5, DATE_SUB(NOW(), INTERVAL 1 DAY) + INTERVAL 17 HOUR,   'Speed and Agility'),
  (11, 11, 1, DATE_ADD(NOW(), INTERVAL 1 DAY) + INTERVAL 7 HOUR,    'Deadlift Technique'),
  (12, 12, 2, DATE_ADD(NOW(), INTERVAL 1 DAY) + INTERVAL 8 HOUR,    'Restorative Yoga'),
  (13, 13, 3, DATE_ADD(NOW(), INTERVAL 2 DAY) + INTERVAL 18 HOUR,   'Sprint Intervals'),
  (14, 14, 4, DATE_ADD(NOW(), INTERVAL 2 DAY) + INTERVAL 9 HOUR,    'Core Strengthening'),
  (15, 15, 5, DATE_ADD(NOW(), INTERVAL 3 DAY) + INTERVAL 17 HOUR,   'Plyometrics'),
  (16, 16, 1, DATE_ADD(NOW(), INTERVAL 3 DAY) + INTERVAL 7 HOUR,    'Strength Basics'),
  (17, 17, 2, DATE_ADD(NOW(), INTERVAL 4 DAY) + INTERVAL 8 HOUR,    'Posture and Alignment'),
  (18, 18, 3, DATE_ADD(NOW(), INTERVAL 4 DAY) + INTERVAL 18 HOUR,   'Low Impact Cardio'),
  (19, 19, 4, DATE_ADD(NOW(), INTERVAL 5 DAY) + INTERVAL 9 HOUR,    'Endurance Training'),
  (20, 20, 5, DATE_ADD(NOW(), INTERVAL 5 DAY) + INTERVAL 17 HOUR,   'Functional Movement'),
  (21, 3,  1, DATE_ADD(NOW(), INTERVAL 6 DAY) + INTERVAL 7 HOUR,    'Squat Form Mastery'),
  (22, 6,  2, DATE_ADD(NOW(), INTERVAL 6 DAY) + INTERVAL 8 HOUR,    'Flexibility and Spine'),
  (23, 10, 3, DATE_ADD(NOW(), INTERVAL 7 DAY) + INTERVAL 18 HOUR,   'Metabolic Conditioning'),
  (24, 13, 4, DATE_ADD(NOW(), INTERVAL 7 DAY) + INTERVAL 9 HOUR,    'Body Composition'),
  (25, 15, 5, DATE_ADD(NOW(), INTERVAL 8 DAY) + INTERVAL 17 HOUR,   'Agility Ladders'),
  (26, 19, 1, DATE_ADD(NOW(), INTERVAL 8 DAY) + INTERVAL 7 HOUR,    'Powerlifting Prep');

-- =============================================================================
-- 8. ATTENDANCE (deterministic: exactly 5 Low, 5 Medium, 5 High, 5 Very High)
--
-- 1. Low: Members 1, 7, 11, 16, 18 (Joined >= 100 days ago, Observed_Days = 90)
--    Each has 6 visits in last 90 days -> 6 / 3.0 = 2.0 visits/mo (Low: <= 4.9). Fits range 3-9 visits.
--
-- 2. Medium: Members 2, 5, 8, 12, 17 (Joined >= 100 days ago, Observed_Days = 90)
--    Each has 24 visits in last 90 days -> 24 / 3.0 = 8.0 visits/mo (Medium: 4.9-12.0). Fits range 21-30 visits.
--
-- 3. High: Members 4, 9, 14, 15, 20
--    - Member 4 (Joined 30 days ago, Observed_Days = 31): 15 visits in 30 days
--      -> ROUND(15 / (31/30), 1) = 14.5 visits/mo (High: 12.0-20.0).
--    - Members 9, 14, 15, 20 (Observed_Days = 90): 48 visits in last 90 days
--      -> 48 / 3.0 = 16.0 visits/mo (High: 12.0-20.0). Fits range 42-54 visits.
--
-- 4. Very High: Members 3, 6, 10, 13, 19 (Joined >= 100 days ago, Observed_Days = 90)
--    Each has 72 visits in last 90 days -> 72 / 3.0 = 24.0 visits/mo (Very High: > 20.0). Fits range 66-80 visits.
-- =============================================================================

-- (1) Low Attendance: 5 members x 6 visits = 30 visits
INSERT INTO `Attendance` (`Member_ID`, `Visit_Date`, `Check_In`, `Check_Out`)
SELECT m.Member_ID, DATE_SUB(CURDATE(), INTERVAL d.offset DAY), '07:30:00', '08:45:00'
FROM (
  SELECT 1 AS Member_ID UNION ALL SELECT 7 UNION ALL SELECT 11 UNION ALL
  SELECT 16 UNION ALL SELECT 18
) m
CROSS JOIN (
  SELECT 0 AS offset UNION ALL SELECT 15 UNION ALL SELECT 30 UNION ALL
  SELECT 45 UNION ALL SELECT 60 UNION ALL SELECT 75
) d;

-- (2) Medium Attendance: 5 members x 24 visits = 120 visits
INSERT INTO `Attendance` (`Member_ID`, `Visit_Date`, `Check_In`, `Check_Out`)
SELECT m.Member_ID, DATE_SUB(CURDATE(), INTERVAL (d.n * 3 + 1) DAY), '08:00:00', '09:15:00'
FROM (
  SELECT 2 AS Member_ID UNION ALL SELECT 5 UNION ALL SELECT 8 UNION ALL
  SELECT 12 UNION ALL SELECT 17
) m
CROSS JOIN (
  SELECT 0 AS n UNION ALL SELECT 1 UNION ALL SELECT 2 UNION ALL SELECT 3 UNION ALL
  SELECT 4 UNION ALL SELECT 5 UNION ALL SELECT 6 UNION ALL SELECT 7 UNION ALL
  SELECT 8 UNION ALL SELECT 9 UNION ALL SELECT 10 UNION ALL SELECT 11 UNION ALL
  SELECT 12 UNION ALL SELECT 13 UNION ALL SELECT 14 UNION ALL SELECT 15 UNION ALL
  SELECT 16 UNION ALL SELECT 17 UNION ALL SELECT 18 UNION ALL SELECT 19 UNION ALL
  SELECT 20 UNION ALL SELECT 21 UNION ALL SELECT 22 UNION ALL SELECT 23
) d;

-- (3a) High Attendance (Recent Joiner Member 4): 15 visits in last 30 days
INSERT INTO `Attendance` (`Member_ID`, `Visit_Date`, `Check_In`, `Check_Out`)
SELECT 4, DATE_SUB(CURDATE(), INTERVAL (d.n * 2) DAY), '07:00:00', '08:15:00'
FROM (
  SELECT 0 AS n UNION ALL SELECT 1 UNION ALL SELECT 2 UNION ALL SELECT 3 UNION ALL
  SELECT 4 UNION ALL SELECT 5 UNION ALL SELECT 6 UNION ALL SELECT 7 UNION ALL
  SELECT 8 UNION ALL SELECT 9 UNION ALL SELECT 10 UNION ALL SELECT 11 UNION ALL
  SELECT 12 UNION ALL SELECT 13 UNION ALL SELECT 14
) d;

-- (3b) High Attendance (Tenured Members 9, 14, 15, 20): 4 members x 48 visits = 192 visits
INSERT INTO `Attendance` (`Member_ID`, `Visit_Date`, `Check_In`, `Check_Out`)
SELECT m.Member_ID, DATE_SUB(CURDATE(), INTERVAL (d.n * 1 + (d.n DIV 2)) DAY), '06:45:00', '08:00:00'
FROM (
  SELECT 9 AS Member_ID UNION ALL SELECT 14 UNION ALL SELECT 15 UNION ALL SELECT 20
) m
CROSS JOIN (
  SELECT 0 AS n UNION ALL SELECT 1 UNION ALL SELECT 2 UNION ALL SELECT 3 UNION ALL
  SELECT 4 UNION ALL SELECT 5 UNION ALL SELECT 6 UNION ALL SELECT 7 UNION ALL
  SELECT 8 UNION ALL SELECT 9 UNION ALL SELECT 10 UNION ALL SELECT 11 UNION ALL
  SELECT 12 UNION ALL SELECT 13 UNION ALL SELECT 14 UNION ALL SELECT 15 UNION ALL
  SELECT 16 UNION ALL SELECT 17 UNION ALL SELECT 18 UNION ALL SELECT 19 UNION ALL
  SELECT 20 UNION ALL SELECT 21 UNION ALL SELECT 22 UNION ALL SELECT 23 UNION ALL
  SELECT 24 UNION ALL SELECT 25 UNION ALL SELECT 26 UNION ALL SELECT 27 UNION ALL
  SELECT 28 UNION ALL SELECT 29 UNION ALL SELECT 30 UNION ALL SELECT 31 UNION ALL
  SELECT 32 UNION ALL SELECT 33 UNION ALL SELECT 34 UNION ALL SELECT 35 UNION ALL
  SELECT 36 UNION ALL SELECT 37 UNION ALL SELECT 38 UNION ALL SELECT 39 UNION ALL
  SELECT 40 UNION ALL SELECT 41 UNION ALL SELECT 42 UNION ALL SELECT 43 UNION ALL
  SELECT 44 UNION ALL SELECT 45 UNION ALL SELECT 46 UNION ALL SELECT 47
) d;

-- (4) Very High Attendance: 5 members x 72 visits = 360 visits
INSERT INTO `Attendance` (`Member_ID`, `Visit_Date`, `Check_In`, `Check_Out`)
SELECT m.Member_ID, DATE_SUB(CURDATE(), INTERVAL (d.n * 1) DAY), '06:30:00', '08:00:00'
FROM (
  SELECT 3 AS Member_ID UNION ALL SELECT 6 UNION ALL SELECT 10 UNION ALL
  SELECT 13 UNION ALL SELECT 19
) m
CROSS JOIN (
  SELECT 0 AS n UNION ALL SELECT 1 UNION ALL SELECT 2 UNION ALL SELECT 3 UNION ALL
  SELECT 4 UNION ALL SELECT 5 UNION ALL SELECT 6 UNION ALL SELECT 7 UNION ALL
  SELECT 8 UNION ALL SELECT 9 UNION ALL SELECT 10 UNION ALL SELECT 11 UNION ALL
  SELECT 12 UNION ALL SELECT 13 UNION ALL SELECT 14 UNION ALL SELECT 15 UNION ALL
  SELECT 16 UNION ALL SELECT 17 UNION ALL SELECT 18 UNION ALL SELECT 19 UNION ALL
  SELECT 20 UNION ALL SELECT 21 UNION ALL SELECT 22 UNION ALL SELECT 23 UNION ALL
  SELECT 24 UNION ALL SELECT 25 UNION ALL SELECT 26 UNION ALL SELECT 27 UNION ALL
  SELECT 28 UNION ALL SELECT 29 UNION ALL SELECT 30 UNION ALL SELECT 31 UNION ALL
  SELECT 32 UNION ALL SELECT 33 UNION ALL SELECT 34 UNION ALL SELECT 35 UNION ALL
  SELECT 36 UNION ALL SELECT 37 UNION ALL SELECT 38 UNION ALL SELECT 39 UNION ALL
  SELECT 40 UNION ALL SELECT 41 UNION ALL SELECT 42 UNION ALL SELECT 43 UNION ALL
  SELECT 44 UNION ALL SELECT 45 UNION ALL SELECT 46 UNION ALL SELECT 47 UNION ALL
  SELECT 48 UNION ALL SELECT 49 UNION ALL SELECT 50 UNION ALL SELECT 51 UNION ALL
  SELECT 52 UNION ALL SELECT 53 UNION ALL SELECT 54 UNION ALL SELECT 55 UNION ALL
  SELECT 56 UNION ALL SELECT 57 UNION ALL SELECT 58 UNION ALL SELECT 59 UNION ALL
  SELECT 60 UNION ALL SELECT 61 UNION ALL SELECT 62 UNION ALL SELECT 63 UNION ALL
  SELECT 64 UNION ALL SELECT 65 UNION ALL SELECT 66 UNION ALL SELECT 67 UNION ALL
  SELECT 68 UNION ALL SELECT 69 UNION ALL SELECT 70 UNION ALL SELECT 71
) d;

-- In-progress visits today: Check_Out IS NULL for a few members
UPDATE `Attendance`
SET `Check_Out` = NULL
WHERE `Visit_Date` = CURDATE() AND `Member_ID` IN (1, 3, 4);

-- =============================================================================
-- 9. MAINTENANCE LOGS
-- Equip 3: 2 logs total (1 in 90 days, 1 at 200 days), Condition stays 'Fair'.
-- Equip 8: 3 logs inside 90 days (Logs 5, 6, 7) -> trg_maintenance_ai auto-sets to 'Out of Order'.
-- Equip 10: 1 log, Condition remains 'Poor'.
-- =============================================================================
INSERT INTO `Maintenance_Log` (`Log_ID`, `Equip_ID`, `Service_Date`, `Cost`, `Technician`) VALUES
  (1,  3,  DATE_SUB(CURDATE(), INTERVAL 200 DAY), 4500.00, 'Ramesh Electricals'),
  (2,  3,  DATE_SUB(CURDATE(), INTERVAL 40 DAY),  2800.00, 'FitTech Services'),
  (3,  7,  DATE_SUB(CURDATE(), INTERVAL 90 DAY),  6200.00, 'Metro Gym Repairs'),
  (4,  7,  DATE_SUB(CURDATE(), INTERVAL 15 DAY),  3500.00, 'Metro Gym Repairs'),
  (5,  8,  DATE_SUB(CURDATE(), INTERVAL 60 DAY),  3200.00, 'CardioCare India'),
  (6,  8,  DATE_SUB(CURDATE(), INTERVAL 30 DAY),  2800.00, 'CardioCare India'),
  (7,  8,  DATE_SUB(CURDATE(), INTERVAL 10 DAY),  8900.00, 'CardioCare India'),
  (8,  10, DATE_SUB(CURDATE(), INTERVAL 120 DAY), 5100.00, 'IronWorks Maintenance'),
  (9,  4,  DATE_SUB(CURDATE(), INTERVAL 60 DAY),  1800.00, 'FitTech Services'),
  (10, 6,  DATE_SUB(CURDATE(), INTERVAL 75 DAY),  2200.00, 'Ramesh Electricals'),
  (11, 1,  DATE_SUB(CURDATE(), INTERVAL 30 DAY),   900.00, 'Olympic Bar Recalibration');
