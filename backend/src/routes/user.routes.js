const express = require('express');
const router  = express.Router();

const userController = require('../controllers/user.controller');
const { authenticate } = require('../middlewares/auth.middleware');

router.use(authenticate);

router.get('/profile',                   userController.getProfile);
router.get('/login-history',             userController.getLoginHistory);
router.delete('/devices/:fingerprint',   userController.revokeDevice);

module.exports = router;
