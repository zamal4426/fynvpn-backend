const { Router } = require('express');
const { listServers, getConfig } = require('../controllers/server.controller');
const { auth } = require('../middleware/auth');

const router = Router();

router.get('/', auth, listServers);
router.get('/:id/config', auth, getConfig);

module.exports = router;
