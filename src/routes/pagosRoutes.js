// routes/pagosRoutes.js

const express = require('express');
const router = express.Router();
const pagosController = require('../controllers/pagosController');

// Ruta para listar los pagos
router.get('/', pagosController.listPagos);

// Ruta para ver el detalle de un pago específico
router.get('/detalle/:id', pagosController.viewPagoDetail);

module.exports = router;
