require('./setup');
const User = require('../src/models/User');

describe('User Model', () => {
  it('should hash password before saving', async () => {
    const user = await User.create({
      email: 'test@fynvpn.com',
      password: 'password123',
    });
    expect(user.password).not.toBe('password123');
    expect(user.password.length).toBeGreaterThan(50);
  });

  it('should compare password correctly', async () => {
    const user = await User.create({
      email: 'test2@fynvpn.com',
      password: 'password123',
    });
    const isMatch = await user.comparePassword('password123');
    expect(isMatch).toBe(true);
    const isWrong = await user.comparePassword('wrongpass');
    expect(isWrong).toBe(false);
  });

  it('should default plan to free', async () => {
    const user = await User.create({
      email: 'test3@fynvpn.com',
      password: 'password123',
    });
    expect(user.plan).toBe('free');
    expect(user.trialUsed).toBe(false);
  });

  it('should reject duplicate email', async () => {
    await User.create({ email: 'dup@fynvpn.com', password: 'pass123' });
    await expect(
      User.create({ email: 'dup@fynvpn.com', password: 'pass456' })
    ).rejects.toThrow();
  });
});

const { generateTokens, verifyAccessToken, verifyRefreshToken } = require('../src/utils/jwt');

describe('JWT Utility', () => {
  it('should generate access and refresh tokens', () => {
    const tokens = generateTokens({ id: 'user123', email: 'a@b.com' });
    expect(tokens).toHaveProperty('accessToken');
    expect(tokens).toHaveProperty('refreshToken');
    expect(typeof tokens.accessToken).toBe('string');
    expect(typeof tokens.refreshToken).toBe('string');
  });

  it('should verify a valid access token', () => {
    const tokens = generateTokens({ id: 'user123', email: 'a@b.com' });
    const decoded = verifyAccessToken(tokens.accessToken);
    expect(decoded.id).toBe('user123');
    expect(decoded.email).toBe('a@b.com');
  });

  it('should verify a valid refresh token', () => {
    const tokens = generateTokens({ id: 'user123', email: 'a@b.com' });
    const decoded = verifyRefreshToken(tokens.refreshToken);
    expect(decoded.id).toBe('user123');
  });

  it('should reject an invalid token', () => {
    expect(() => verifyAccessToken('invalid.token.here')).toThrow();
  });
});

const app = require('../src/app');
const request = require('supertest');

describe('Auth Endpoints', () => {
  describe('POST /v1/auth/register', () => {
    it('should register a new user', async () => {
      const res = await request(app)
        .post('/v1/auth/register')
        .send({ email: 'new@fynvpn.com', password: 'password123' });
      expect(res.status).toBe(201);
      expect(res.body).toHaveProperty('accessToken');
      expect(res.body).toHaveProperty('refreshToken');
      expect(res.body.user.email).toBe('new@fynvpn.com');
      expect(res.body.user.plan).toBe('free');
      expect(res.body.user).not.toHaveProperty('password');
    });

    it('should reject duplicate email', async () => {
      await request(app)
        .post('/v1/auth/register')
        .send({ email: 'dup@fynvpn.com', password: 'password123' });
      const res = await request(app)
        .post('/v1/auth/register')
        .send({ email: 'dup@fynvpn.com', password: 'password456' });
      expect(res.status).toBe(409);
      expect(res.body).toHaveProperty('error');
    });

    it('should reject missing fields', async () => {
      const res = await request(app)
        .post('/v1/auth/register')
        .send({ email: 'no@pass.com' });
      expect(res.status).toBe(400);
    });
  });

  describe('POST /v1/auth/login', () => {
    beforeEach(async () => {
      await request(app)
        .post('/v1/auth/register')
        .send({ email: 'login@fynvpn.com', password: 'password123' });
    });

    it('should login with correct credentials', async () => {
      const res = await request(app)
        .post('/v1/auth/login')
        .send({ email: 'login@fynvpn.com', password: 'password123' });
      expect(res.status).toBe(200);
      expect(res.body).toHaveProperty('accessToken');
      expect(res.body).toHaveProperty('refreshToken');
    });

    it('should reject wrong password', async () => {
      const res = await request(app)
        .post('/v1/auth/login')
        .send({ email: 'login@fynvpn.com', password: 'wrongpass' });
      expect(res.status).toBe(401);
    });

    it('should reject non-existent email', async () => {
      const res = await request(app)
        .post('/v1/auth/login')
        .send({ email: 'nope@fynvpn.com', password: 'password123' });
      expect(res.status).toBe(401);
    });
  });

  describe('POST /v1/auth/refresh', () => {
    it('should issue new tokens with valid refresh token', async () => {
      const reg = await request(app)
        .post('/v1/auth/register')
        .send({ email: 'refresh@fynvpn.com', password: 'password123' });
      const res = await request(app)
        .post('/v1/auth/refresh')
        .send({ refreshToken: reg.body.refreshToken });
      expect(res.status).toBe(200);
      expect(res.body).toHaveProperty('accessToken');
      expect(res.body).toHaveProperty('refreshToken');
    });

    it('should reject invalid refresh token', async () => {
      const res = await request(app)
        .post('/v1/auth/refresh')
        .send({ refreshToken: 'invalid_token' });
      expect(res.status).toBe(401);
    });
  });

  describe('GET /v1/auth/me', () => {
    it('should return current user with valid token', async () => {
      const reg = await request(app)
        .post('/v1/auth/register')
        .send({ email: 'me@fynvpn.com', password: 'password123' });
      const res = await request(app)
        .get('/v1/auth/me')
        .set('Authorization', `Bearer ${reg.body.accessToken}`);
      expect(res.status).toBe(200);
      expect(res.body.email).toBe('me@fynvpn.com');
      expect(res.body).not.toHaveProperty('password');
    });

    it('should reject request without token', async () => {
      const res = await request(app).get('/v1/auth/me');
      expect(res.status).toBe(401);
    });
  });
});
