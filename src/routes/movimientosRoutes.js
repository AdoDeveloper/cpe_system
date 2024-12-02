// src/routes/movimientosRoutes.js

const express = require('express');
const router = express.Router();
const movimientosController = require('../controllers/movimientosController');

// ruta /movimientos/

// Ruta para obtener y mostrar todos los movimientos
router.get('/', movimientosController.listMovimientos);

// Ruta para mostrar el formulario de nuevo movimiento
router.get('/new', movimientosController.renderCreateForm);

// Ruta para crear un nuevo movimiento
router.post('/new', movimientosController.createMovimiento);

// Ruta para mostrar el formulario de edición de un movimiento
router.get('/edit/:id', movimientosController.renderEditForm);

// Ruta para actualizar un movimiento
router.put('/edit/:id', movimientosController.updateMovimiento);

// Ruta para eliminar un movimiento
router.delete('/delete/:id', movimientosController.deleteMovimiento);

// Ruta para generar reporte en PDF
router.get('/report/pdf', movimientosController.generatePDFReport);

// Ruta para generar reporte en Excel
router.get('/report/excel', movimientosController.generateExcelReport);

module.exports = router;
