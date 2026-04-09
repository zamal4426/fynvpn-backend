require('./setup');
const app = require('../src/app');
const request = require('supertest');
const User = require('../src/models/User');
const Server = require('../src/models/Server');
const { generateTokens } = require('../src/utils/jwt');

async function createAuthUser(plan = 'free') {
  const user = await User.create({
    email: `${plan}${Date.now()}@fynvpn.com`,
    password: 'password123',
    plan,
    planExpiry: plan === 'premium' ? new Date(Date.now() + 86400000) : null,
  });
  const tokens = generateTokens({ id: user._id.toString(), email: user.email });
  return { user, ...tokens };
}

async function seedServers() {
  await Server.create([
    {
      name: 'US East',
      country: 'US',
      city: 'New York',
      ip: '45.55.1.1',
      publicKey: 'us_pub_key_abc123',
      port: 51820,
      isPremium: false,
      maxUsers: 100,
      currentUsers: 10,
      status: 'online',
    },
    {
      name: 'UK London',
      country: 'UK',
      city: 'London',
      ip: '46.66.2.2',
      publicKey: 'uk_pub_key_def456',
      port: 51820,
      isPremium: false,
      maxUsers: 100,
      currentUsers: 5,
      status: 'online',
    },
    {
      name: 'Canada Toronto',
      country: 'CA',
      city: 'Toronto',
      ip: '47.77.3.3',
      publicKey: 'ca_pub_key_ghi789',
      port: 51820,
      isPremium: true,
      maxUsers: 100,
      currentUsers: 2,
      status: 'online',
    },
  ]);
}

describe('Server Endpoints', () => {
  beforeEach(async () => {
    await seedServers();
  });

  describe('GET /v1/servers', () => {
    it('should list all online servers', async () => {
      const { accessToken } = await createAuthUser();
      const res = await request(app)
        .get('/v1/servers')
        .set('Authorization', `Bearer ${accessToken}`);
      expect(res.status).toBe(200);
      expect(res.body.length).toBe(3);
      expect(res.body[0]).toHaveProperty('name');
      expect(res.body[0]).toHaveProperty('country');
      expect(res.body[0]).not.toHaveProperty('ip');
      expect(res.body[0]).not.toHaveProperty('publicKey');
    });

    it('should reject unauthenticated request', async () => {
      const res = await request(app).get('/v1/servers');
      expect(res.status).toBe(401);
    });
  });

  describe('GET /v1/servers/:id/config', () => {
    it('should return config for free server to free user', async () => {
      const { accessToken } = await createAuthUser('free');
      const servers = await Server.find({ isPremium: false });
      const res = await request(app)
        .get(`/v1/servers/${servers[0]._id}/config`)
        .set('Authorization', `Bearer ${accessToken}`);
      expect(res.status).toBe(200);
      expect(res.body).toHaveProperty('config');
      expect(res.body.config).toContain('[Interface]');
    });

    it('should reject free user from premium server', async () => {
      const { accessToken } = await createAuthUser('free');
      const servers = await Server.find({ isPremium: true });
      const res = await request(app)
        .get(`/v1/servers/${servers[0]._id}/config`)
        .set('Authorization', `Bearer ${accessToken}`);
      expect(res.status).toBe(403);
    });

    it('should allow premium user to access premium server', async () => {
      const { accessToken } = await createAuthUser('premium');
      const servers = await Server.find({ isPremium: true });
      const res = await request(app)
        .get(`/v1/servers/${servers[0]._id}/config`)
        .set('Authorization', `Bearer ${accessToken}`);
      expect(res.status).toBe(200);
      expect(res.body).toHaveProperty('config');
    });
  });
});
