import jwt from 'jsonwebtoken';

export function auth(req, res, next) {
  const header = req.headers.authorization || '';
  const [scheme, token] = header.split(' ');

  if (scheme !== 'Bearer' || !token) {
    return res.status(401).json({
      success: false,
      message: 'Authentication required. Provide Authorization: Bearer <token>.'
    });
  }

  try {
    const payload = jwt.verify(token, process.env.JWT_SECRET);
    req.admin = { username: payload.username };
    return next();
  } catch {
    return res.status(401).json({
      success: false,
      message: 'Invalid or expired token.'
    });
  }
}
