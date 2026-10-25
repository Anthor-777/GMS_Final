export class AppError extends Error {
  constructor(message, statusCode = 500) {
    super(message);
    this.statusCode = statusCode;
  }
}

function duplicateMessage(err) {
  const msg = err.sqlMessage || err.message || '';
  if (msg.includes('Email')) return 'A member with this Email already exists.';
  if (msg.includes('Plan_Name')) return 'A plan with this Plan_Name already exists.';
  if (msg.includes('uk_session_trainer_slot')) {
    return 'This trainer already has a session at that Slot_DateTime.';
  }
  return 'A record with this unique value already exists.';
}

function fkDeleteMessage(err) {
  const msg = err.sqlMessage || err.message || '';
  if (msg.includes('fk_subscription_member') || msg.includes('fk_session_member') || msg.includes('fk_attendance_member')) {
    return 'Cannot delete this member because they have subscriptions, sessions or attendance records.';
  }
  if (msg.includes('fk_subscription_plan')) {
    return 'Cannot delete this plan because subscriptions still reference it.';
  }
  if (msg.includes('fk_payment_subscription')) {
    return 'Cannot delete this subscription because payments still reference it.';
  }
  if (msg.includes('fk_session_trainer')) {
    return 'Cannot delete this trainer because they have sessions.';
  }
  if (msg.includes('fk_maintenance_equipment')) {
    return 'Cannot delete this equipment because maintenance logs still reference it.';
  }
  return 'Cannot delete this record because other records still reference it.';
}

function fkInsertMessage(err) {
  const msg = err.sqlMessage || err.message || '';
  if (msg.includes('fk_subscription_member') || msg.includes('fk_session_member') || msg.includes('fk_attendance_member')) {
    return 'Invalid Member_ID: that member does not exist.';
  }
  if (msg.includes('fk_subscription_plan')) {
    return 'Invalid Plan_ID: that membership plan does not exist.';
  }
  if (msg.includes('fk_payment_subscription')) {
    return 'Invalid Sub_ID: that subscription does not exist.';
  }
  if (msg.includes('fk_session_trainer')) {
    return 'Invalid Trainer_ID: that trainer does not exist.';
  }
  if (msg.includes('fk_maintenance_equipment')) {
    return 'Invalid Equip_ID: that equipment item does not exist.';
  }
  return 'Invalid foreign key: a referenced record does not exist.';
}

export function errorHandler(err, req, res, next) {
  if (res.headersSent) return next(err);

  if (err instanceof AppError) {
    return res.status(err.statusCode).json({ success: false, message: err.message });
  }

  const errno = err.errno;
  const code = err.code;

  // Custom MySQL Trigger SIGNAL exception (SQLSTATE '45000')
  if (errno === 1644 || code === 'ER_SIGNAL_EXCEPTION') {
    return res.status(409).json({ success: false, message: err.sqlMessage || err.message });
  }

  if (errno === 1062 || code === 'ER_DUP_ENTRY') {
    return res.status(409).json({ success: false, message: duplicateMessage(err) });
  }

  if (errno === 1451 || code === 'ER_ROW_IS_REFERENCED_2' || code === 'ER_ROW_IS_REFERENCED') {
    return res.status(409).json({ success: false, message: fkDeleteMessage(err) });
  }

  if (errno === 1452 || code === 'ER_NO_REFERENCED_ROW_2' || code === 'ER_NO_REFERENCED_ROW') {
    return res.status(400).json({ success: false, message: fkInsertMessage(err) });
  }

  if (errno === 3819 || code === 'ER_CHECK_CONSTRAINT_VIOLATED') {
    return res.status(400).json({ success: false, message: 'A CHECK constraint was violated.' });
  }

  console.error(err);
  return res.status(500).json({ success: false, message: 'Internal server error' });
}

export function notFound(req, res) {
  res.status(404).json({ success: false, message: `Route ${req.method} ${req.originalUrl} not found` });
}
