const jwt = require('jsonwebtoken');
const env = require('../config/env');

function generateTokens(payload) {
  const accessToken = jwt.sign(payload, env.jwtAccessSecret, {
    expiresIn: '15m',
  });
  const refreshToken = jwt.sign(payload, env.jwtRefreshSecret, {
    expiresIn: '7d',
  });
  return { accessToken, refreshToken };
}

function verifyAccessToken(token) {
  return jwt.verify(token, env.jwtAccessSecret);
}

function verifyRefreshToken(token) {
  return jwt.verify(token, env.jwtRefreshSecret);
}

module.exports = { generateTokens, verifyAccessToken, verifyRefreshToken };
