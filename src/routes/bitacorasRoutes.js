// src/routes/bitacorasRoutes.js

const express = require('express');
const router = express.Router();

const bitacorasController = require('../controllers/bitacorasController');

// Ruta protegida para ver las bitácoras (solo para administradores)
router.get('/', bitacorasController.listBitacoras);

module.exports = router;
