// src/routes/loginRoutes.js
const express = require('express');
const router = express.Router();
const loginController = require('../controllers/loginController');

// Renderizar formulario de login
router.get('/', loginController.renderLoginForm);

// Procesar el login
router.post('/', loginController.processLogin);

module.exports = router;