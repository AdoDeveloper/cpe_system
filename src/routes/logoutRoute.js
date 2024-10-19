// src/routes/logoutRoute.js
const express = require('express');
const router = express.Router();
const loginController = require('../controllers/loginController');

// Procesar el logout
router.get('/', loginController.logout);

module.exports = router;
