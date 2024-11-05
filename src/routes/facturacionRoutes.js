const express = require('express');
const router = express.Router();
const facturacionController = require('../controllers/facturacionController');

// Ruta para listar todas las facturas
router.get('/', facturacionController.listFacturas);

// Ruta para ver detalles de una factura específica
router.get('/detalle/:id', facturacionController.viewFacturaDetails);

// Ruta para generar pago y facturar
router.put('/generar-pago/:id', facturacionController.generatePaymentAndInvoice);

module.exports = router;
