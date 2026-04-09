const app = require('./app');
const { connectDB } = require('./config/db');
const env = require('./config/env');

async function start() {
  await connectDB();
  app.listen(env.port, () => {
    console.log(`FynVPN API running on port ${env.port}`);
  });
}

start();
