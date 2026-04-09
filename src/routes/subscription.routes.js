const { Router } = require('express');
const { getSubscription, createCheckout, webhook, verify } = require('../controllers/subscription.controller');
const { auth } = require('../middleware/auth');

const router = Router();

router.get('/', auth, getSubscription);
router.post('/create', auth, createCheckout);
router.post('/webhook', webhook);
router.post('/verify', auth, verify);

module.exports = router;
