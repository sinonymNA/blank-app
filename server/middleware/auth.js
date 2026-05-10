function requireAuth(req, res, next) {
  req.userId = 'user';
  next();
}

module.exports = { requireAuth };
