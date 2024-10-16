const express = require('express');
const router = express.Router();
const loginController = require('../controllers/loginController');

// Renderiza el formulario de login
router.get('/', loginController.renderLoginForm);

// Procesa el formulario de login
router.post('/', loginController.processLogin);

// Procesa el logout
router.get('/logout', loginController.logout);

module.exports = router;
