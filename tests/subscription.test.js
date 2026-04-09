require('./setup');
const app = require('../src/app');
const request = require('supertest');
const User = require('../src/models/User');
const { generateTokens } = require('../src/utils/jwt');

let accessToken;
let userId;

beforeEach(async () => {
  const user = await User.create({
    email: 'sub@fynvpn.com',
    password: 'password123',
  });
  userId = user._id.toString();
  const tokens = generateTokens({ id: userId, email: user.email });
  accessToken = tokens.accessToken;
});

describe('Subscription Endpoints', () => {
  describe('GET /v1/subscription', () => {
    it('should return current subscription info', async () => {
      const res = await request(app)
        .get('/v1/subscription')
        .set('Authorization', `Bearer ${accessToken}`);
      expect(res.status).toBe(200);
      expect(res.body.plan).toBe('free');
      expect(res.body.planExpiry).toBeNull();
      expect(res.body.trialUsed).toBe(false);
    });
  });

  describe('POST /v1/subscription/verify', () => {
    it('should reject without session ID', async () => {
      const res = await request(app)
        .post('/v1/subscription/verify')
        .set('Authorization', `Bearer ${accessToken}`)
        .send({});
      expect(res.status).toBe(400);
    });
  });
});
