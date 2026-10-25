import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { AppError } from '../middleware/errorHandler.js';
import { asyncHandler } from '../utils/asyncHandler.js';

export const login = asyncHandler(async (req, res) => {
  const username = req.body.username;
  const password = req.body.password;

  const adminUser = process.env.ADMIN_USERNAME;
  const adminHash = process.env.ADMIN_PASSWORD_HASH;

  if (!adminUser || !adminHash || !process.env.JWT_SECRET) {
    throw new AppError('Server auth is not configured. Set ADMIN_USERNAME, ADMIN_PASSWORD_HASH and JWT_SECRET.', 500);
  }

  const userOk = username === adminUser;
  const passOk = await bcrypt.compare(password || '', adminHash);

  if (!userOk || !passOk) {
    throw new AppError('Invalid username or password.', 401);
  }

  const token = jwt.sign({ username: adminUser }, process.env.JWT_SECRET, { expiresIn: '12h' });
  res.json({ success: true, data: { token, username: adminUser } });
});
