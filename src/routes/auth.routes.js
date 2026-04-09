const { Router } = require('express');
const { register, login, refresh, me } = require('../controllers/auth.controller');
const { auth } = require('../middleware/auth');

const router = Router();

router.post('/register', register);
router.post('/login', login);
router.post('/refresh', refresh);
router.get('/me', auth, me);

module.exports = router;
