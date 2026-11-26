const jwt = require('jsonwebtoken');

const generateToken = (userId, tokenVersion = 0) => {
  return jwt.sign({ id: userId, tokenVersion: Number(tokenVersion) || 0 }, process.env.JWT_SECRET, {
    expiresIn: process.env.JWT_EXPIRES_IN || '24h'
  });
};

module.exports = generateToken;
