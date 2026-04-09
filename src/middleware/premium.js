function premium(req, res, next) {
  if (!req.user) {
    return res.status(401).json({ error: 'Authentication required' });
  }
  if (req.user.plan !== 'premium') {
    return res.status(403).json({ error: 'Premium subscription required' });
  }
  if (req.user.planExpiry && new Date(req.user.planExpiry) < new Date()) {
    return res.status(403).json({ error: 'Subscription expired' });
  }
  next();
}

module.exports = { premium };
