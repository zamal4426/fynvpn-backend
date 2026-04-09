require('./setup');
const app = require('../src/app');
const request = require('supertest');
const User = require('../src/models/User');
const Server = require('../src/models/Server');
const { generateTokens } = require('../src/utils/jwt');

let accessToken;
let serverId;

beforeEach(async () => {
  const user = await User.create({
    email: 'conn@fynvpn.com',
    password: 'password123',
  });
  const tokens = generateTokens({ id: user._id.toString(), email: user.email });
  accessToken = tokens.accessToken;

  const server = await Server.create({
    name: 'US East',
    country: 'US',
    city: 'New York',
    ip: '45.55.1.1',
    publicKey: 'test_pub_key',
    port: 51820,
    isPremium: false,
    maxUsers: 100,
    currentUsers: 0,
    status: 'online',
  });
  serverId = server._id.toString();
});

describe('Connection Endpoints', () => {
  describe('POST /v1/connection/start', () => {
    it('should log connection start', async () => {
      const res = await request(app)
        .post('/v1/connection/start')
        .set('Authorization', `Bearer ${accessToken}`)
        .send({ serverId });
      expect(res.status).toBe(201);
      expect(res.body).toHaveProperty('connectionId');
    });

    it('should increment server currentUsers', async () => {
      await request(app)
        .post('/v1/connection/start')
        .set('Authorization', `Bearer ${accessToken}`)
        .send({ serverId });
      const server = await Server.findById(serverId);
      expect(server.currentUsers).toBe(1);
    });
  });

  describe('POST /v1/connection/stop', () => {
    it('should log connection stop', async () => {
      const start = await request(app)
        .post('/v1/connection/start')
        .set('Authorization', `Bearer ${accessToken}`)
        .send({ serverId });
      const res = await request(app)
        .post('/v1/connection/stop')
        .set('Authorization', `Bearer ${accessToken}`)
        .send({
          connectionId: start.body.connectionId,
          bytesUp: 1024,
          bytesDown: 2048,
        });
      expect(res.status).toBe(200);
      expect(res.body.message).toBe('Connection stopped');
    });

    it('should decrement server currentUsers', async () => {
      const start = await request(app)
        .post('/v1/connection/start')
        .set('Authorization', `Bearer ${accessToken}`)
        .send({ serverId });
      await request(app)
        .post('/v1/connection/stop')
        .set('Authorization', `Bearer ${accessToken}`)
        .send({
          connectionId: start.body.connectionId,
          bytesUp: 0,
          bytesDown: 0,
        });
      const server = await Server.findById(serverId);
      expect(server.currentUsers).toBe(0);
    });
  });

  describe('GET /v1/connection/stats', () => {
    it('should return user connection stats', async () => {
      const res = await request(app)
        .get('/v1/connection/stats')
        .set('Authorization', `Bearer ${accessToken}`);
      expect(res.status).toBe(200);
      expect(res.body).toHaveProperty('totalConnections');
      expect(res.body).toHaveProperty('totalBytesUp');
      expect(res.body).toHaveProperty('totalBytesDown');
    });
  });
});
