const jwt = require('jsonwebtoken');
const { fail } = require('../utils/respond');

// 401 = "I don't know who you are" (no token / bad token)
exports.authenticate = (req, res, next) => {
  const header = req.headers.authorization || '';
  const token = header.startsWith('Bearer ') ? header.slice(7) : null;
  if (!token) return fail(res, 401, 'Please log in first');
  try {
    req.user = jwt.verify(token, process.env.JWT_SECRET); // { id, role, name }
    next();
  } catch {
    return fail(res, 401, 'Session expired or invalid token');
  }
};

// 403 = "I know who you are, but you are not allowed to do this"
exports.requireRole = (...roles) => (req, res, next) => {
  if (!roles.includes(req.user.role)) return fail(res, 403, 'You do not have permission for this action');
  next();
};
