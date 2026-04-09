const Server = require('../models/Server');
const { generateKeyPair, generateClientConfig } = require('../utils/wireguard');

async function listServers(req, res, next) {
  try {
    const servers = await Server.find({ status: 'online' })
      .select('name country city isPremium maxUsers currentUsers status')
      .sort('country');
    res.json(servers);
  } catch (err) {
    next(err);
  }
}

async function getConfig(req, res, next) {
  try {
    const server = await Server.findById(req.params.id);
    if (!server) {
      return res.status(404).json({ error: 'Server not found' });
    }

    if (server.isPremium && req.user.plan !== 'premium') {
      return res.status(403).json({ error: 'Premium subscription required' });
    }

    if (req.user.plan === 'premium' && req.user.planExpiry && new Date(req.user.planExpiry) < new Date()) {
      return res.status(403).json({ error: 'Subscription expired' });
    }

    const { privateKey } = generateKeyPair();
    const clientAddress = `10.0.0.${Math.floor(Math.random() * 254) + 2}/32`;

    const config = generateClientConfig({
      serverPublicKey: server.publicKey,
      serverIp: server.ip,
      serverPort: server.port,
      clientPrivateKey: privateKey,
      clientAddress,
    });

    res.json({ config, serverName: server.name, country: server.country });
  } catch (err) {
    next(err);
  }
}

module.exports = { listServers, getConfig };
