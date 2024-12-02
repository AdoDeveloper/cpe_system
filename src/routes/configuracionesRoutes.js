const express = require('express');
const router = express.Router();
const configuracionesController = require('../controllers/configuracionesController');

// Listar configuraciones
router.get('/', configuracionesController.listConfiguraciones);

// Mostrar formulario para agregar configuración
router.get('/new', configuracionesController.renderCreateForm);

// Crear nueva configuración
router.post('/new',configuracionesController.validateCreateConfiguracion, configuracionesController.createConfiguracion);

// Mostrar formulario para editar configuración
router.get('/edit/:id', configuracionesController.renderEditForm);

// Actualizar configuración existente
router.put('/edit/:id',configuracionesController.validateUpdateConfiguracion, configuracionesController.updateConfiguracion);

// Eliminar configuración
router.delete('/delete/:id', configuracionesController.deleteConfiguracion);

module.exports = router;
