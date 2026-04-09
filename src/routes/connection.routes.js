const { Router } = require('express');
const { start, stop, stats } = require('../controllers/connection.controller');
const { auth } = require('../middleware/auth');

const router = Router();

router.post('/start', auth, start);
router.post('/stop', auth, stop);
router.get('/stats', auth, stats);

module.exports = router;
