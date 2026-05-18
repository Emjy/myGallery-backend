const db = require('../db');

function getToken(req) {
  const header = req.get('authorization') || '';
  if (header.toLowerCase().startsWith('bearer ')) return header.slice(7).trim();
  return header.trim();
}

function findUserByToken(req) {
  const token = getToken(req);
  if (!token) return null;
  return db.prepare('SELECT id, user FROM users WHERE token = ?').get(token);
}

function requireAuth(req, res, next) {
  const user = findUserByToken(req);
  if (!user) {
    return res.status(401).json({ result: false, error: 'Unauthorized' });
  }
  req.user = user;
  return next();
}

module.exports = { requireAuth, findUserByToken };
