const express = require('express');
const router = express.Router();
const perfilController = require('../controllers/perfilController');

// Ruta para acceder al perfil del usuario
router.get('/', perfilController.renderProfile);

module.exports = router;
