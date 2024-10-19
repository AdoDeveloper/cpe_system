const express = require('express');
const router = express.Router();
const homeController = require('../controllers/homeController');

// ruta /

// Renderiza el home
router.get('/',  homeController.renderHome);

module.exports = router;