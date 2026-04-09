const User = require('../models/User');
const { stripe } = require('../config/stripe');

async function getSubscription(req, res) {
  res.json({
    plan: req.user.plan,
    planExpiry: req.user.planExpiry,
    trialUsed: req.user.trialUsed,
  });
}

async function createCheckout(req, res, next) {
  try {
    if (!stripe) {
      return res.status(503).json({ error: 'Payment service unavailable' });
    }

    const { priceId } = req.body;
    if (!priceId) {
      return res.status(400).json({ error: 'priceId is required' });
    }

    const user = await User.findById(req.user._id);

    let customerId = user.stripeCustomerId;
    if (!customerId) {
      const customer = await stripe.customers.create({ email: user.email });
      customerId = customer.id;
      user.stripeCustomerId = customerId;
      await user.save();
    }

    const sessionParams = {
      customer: customerId,
      payment_method_types: ['card'],
      line_items: [{ price: priceId, quantity: 1 }],
      mode: 'subscription',
      success_url: `${process.env.CLIENT_URL}/payment/success?session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: `${process.env.CLIENT_URL}/payment/cancel`,
    };

    if (!user.trialUsed) {
      sessionParams.subscription_data = {
        trial_period_days: 3,
      };
    }

    const session = await stripe.checkout.sessions.create(sessionParams);
    res.json({ sessionId: session.id, url: session.url });
  } catch (err) {
    next(err);
  }
}

async function webhook(req, res, next) {
  try {
    if (!stripe) {
      return res.status(503).json({ error: 'Payment service unavailable' });
    }

    const sig = req.headers['stripe-signature'];
    let event;
    try {
      event = stripe.webhooks.constructEvent(
        req.body,
        sig,
        process.env.STRIPE_WEBHOOK_SECRET
      );
    } catch {
      return res.status(400).json({ error: 'Invalid webhook signature' });
    }

    switch (event.type) {
      case 'checkout.session.completed': {
        const session = event.data.object;
        const customerId = session.customer;
        const user = await User.findOne({ stripeCustomerId: customerId });
        if (user) {
          user.plan = 'premium';
          user.trialUsed = true;
          const subscription = await stripe.subscriptions.retrieve(session.subscription);
          user.planExpiry = new Date(subscription.current_period_end * 1000);
          await user.save();
        }
        break;
      }
      case 'customer.subscription.updated': {
        const subscription = event.data.object;
        const user = await User.findOne({ stripeCustomerId: subscription.customer });
        if (user) {
          user.planExpiry = new Date(subscription.current_period_end * 1000);
          if (subscription.status === 'active' || subscription.status === 'trialing') {
            user.plan = 'premium';
          }
          await user.save();
        }
        break;
      }
      case 'customer.subscription.deleted': {
        const subscription = event.data.object;
        const user = await User.findOne({ stripeCustomerId: subscription.customer });
        if (user) {
          user.plan = 'free';
          user.planExpiry = null;
          await user.save();
        }
        break;
      }
    }

    res.json({ received: true });
  } catch (err) {
    next(err);
  }
}

async function verify(req, res, next) {
  try {
    const { sessionId } = req.body;
    if (!sessionId) {
      return res.status(400).json({ error: 'sessionId is required' });
    }

    if (!stripe) {
      return res.status(503).json({ error: 'Payment service unavailable' });
    }

    const session = await stripe.checkout.sessions.retrieve(sessionId);
    const user = await User.findById(req.user._id);

    res.json({
      status: session.payment_status,
      plan: user.plan,
      planExpiry: user.planExpiry,
    });
  } catch (err) {
    next(err);
  }
}

module.exports = { getSubscription, createCheckout, webhook, verify };
