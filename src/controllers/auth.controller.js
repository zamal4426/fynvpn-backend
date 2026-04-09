const User = require('../models/User');
const { generateTokens, verifyRefreshToken } = require('../utils/jwt');

async function register(req, res, next) {
  try {
    const { email, password } = req.body;
    if (!email || !password) {
      return res.status(400).json({ error: 'Email and password are required' });
    }
    if (password.length < 6) {
      return res.status(400).json({ error: 'Password must be at least 6 characters' });
    }

    const existing = await User.findOne({ email: email.toLowerCase() });
    if (existing) {
      return res.status(409).json({ error: 'Email already registered' });
    }

    const user = await User.create({ email, password });
    const tokens = generateTokens({ id: user._id.toString(), email: user.email });

    user.refreshToken = tokens.refreshToken;
    await user.save();

    res.status(201).json({
      ...tokens,
      user: {
        id: user._id,
        email: user.email,
        plan: user.plan,
        planExpiry: user.planExpiry,
      },
    });
  } catch (err) {
    next(err);
  }
}

async function login(req, res, next) {
  try {
    const { email, password } = req.body;
    if (!email || !password) {
      return res.status(400).json({ error: 'Email and password are required' });
    }

    const user = await User.findOne({ email: email.toLowerCase() });
    if (!user) {
      return res.status(401).json({ error: 'Invalid credentials' });
    }

    const isMatch = await user.comparePassword(password);
    if (!isMatch) {
      return res.status(401).json({ error: 'Invalid credentials' });
    }

    const tokens = generateTokens({ id: user._id.toString(), email: user.email });

    user.refreshToken = tokens.refreshToken;
    await user.save();

    res.json({
      ...tokens,
      user: {
        id: user._id,
        email: user.email,
        plan: user.plan,
        planExpiry: user.planExpiry,
      },
    });
  } catch (err) {
    next(err);
  }
}

async function refresh(req, res, next) {
  try {
    const { refreshToken } = req.body;
    if (!refreshToken) {
      return res.status(400).json({ error: 'Refresh token is required' });
    }

    let decoded;
    try {
      decoded = verifyRefreshToken(refreshToken);
    } catch {
      return res.status(401).json({ error: 'Invalid refresh token' });
    }

    const user = await User.findById(decoded.id);
    if (!user || user.refreshToken !== refreshToken) {
      return res.status(401).json({ error: 'Invalid refresh token' });
    }

    const tokens = generateTokens({ id: user._id.toString(), email: user.email });

    user.refreshToken = tokens.refreshToken;
    await user.save();

    res.json(tokens);
  } catch (err) {
    next(err);
  }
}

async function me(req, res) {
  res.json({
    id: req.user._id,
    email: req.user.email,
    plan: req.user.plan,
    planExpiry: req.user.planExpiry,
    trialUsed: req.user.trialUsed,
    createdAt: req.user.createdAt,
  });
}

module.exports = { register, login, refresh, me };
