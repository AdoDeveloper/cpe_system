// src/routes/costosRoutes.js
const express = require('express');
const router = express.Router();
const costosController = require('../controllers/costosController');

// Ruta base /costos/

// Ruta para obtener y mostrar todos los costos fijos
router.get('/', costosController.listCostosFijos);

// Ruta para el endpoint de datos dinámicos para DataTables
// router.get('/api/costos-fijos', costosController.fetchCostosFijos);

// Ruta para mostrar el formulario de nuevo costo fijo
router.get('/new', costosController.renderCreateForm);

// Ruta para crear un nuevo costo fijo
router.post('/new', costosController.createCostoFijo);

// Ruta para mostrar el formulario de edición de un costo fijo
router.get('/edit/:id', costosController.renderEditForm);

// Ruta para actualizar un costo fijo
router.put('/edit/:id', costosController.updateCostoFijo);

// Ruta para eliminar un costo fijo
router.delete('/delete/:id', costosController.deleteCostoFijo);

module.exports = router;
