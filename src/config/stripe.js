const env = require('./env');

let stripe = null;
if (env.stripeSecretKey) {
  stripe = require('stripe')(env.stripeSecretKey);
}

module.exports = { stripe };
