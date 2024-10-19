// src\routes\serviciosRoutes.js
const express = require('express');
const router = express.Router();
const serviciosController = require('../controllers/serviciosController');

// ruta /servicios/

// Ruta para obtener y mostrar todos los servicios
router.get('/', serviciosController.listServicios);

// Ruta para mostrar el formulario de nuevo servicio
router.get('/new', serviciosController.renderCreateForm);

// Ruta para crear un nuevo servicio
router.post('/new', [
], serviciosController.createServicio);

// Ruta para mostrar el formulario de edición de un servicio
router.get('/edit/:id', serviciosController.renderEditForm);

// Ruta para actualizar un servicio
router.put('/edit/:id', [
], serviciosController.updateServicio);

// Ruta para eliminar un servicio
router.delete('/delete/:id', serviciosController.deleteServicio);

module.exports = router;
