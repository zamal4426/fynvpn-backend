const crypto = require('crypto');

function generateKeyPair() {
  const privateKey = crypto.randomBytes(32).toString('base64');
  const publicKey = crypto.randomBytes(32).toString('base64');
  return { privateKey, publicKey };
}

function generateClientConfig({ serverPublicKey, serverIp, serverPort, clientPrivateKey, clientAddress }) {
  return `[Interface]
PrivateKey = ${clientPrivateKey}
Address = ${clientAddress}
DNS = 1.1.1.1, 8.8.8.8

[Peer]
PublicKey = ${serverPublicKey}
Endpoint = ${serverIp}:${serverPort}
AllowedIPs = 0.0.0.0/0
PersistentKeepalive = 25`;
}

module.exports = { generateKeyPair, generateClientConfig };
