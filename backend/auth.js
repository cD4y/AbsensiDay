const jwt = require('jsonwebtoken');

function auth(req, res, next) {
  const header = req.headers.authorization;

  if (!header || !header.startsWith('Bearer ')) {
    return res.status(401).json({ message: 'Token tidak ditemukan' });
  }

  try {
    req.user = jwt.verify(header.split(' ')[1], process.env.JWT_SECRET || 'secret');
    next();
  } catch {
    return res.status(401).json({ message: 'Token tidak valid' });
  }
}

function adminOnly(req, res, next) {
  if (req.user?.role !== 'admin') {
    return res.status(403).json({ message: 'Akses hanya untuk admin' });
  }

  next();
}

module.exports = { auth, adminOnly };
