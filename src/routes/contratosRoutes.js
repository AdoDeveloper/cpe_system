const express = require('express');
const router = express.Router();
const contratosController = require('../controllers/contratosController');

// Ruta para obtener y mostrar todos los contratos
router.get('/', contratosController.listContratos);

// Ruta para mostrar el formulario de nuevo contrato
router.get('/new', contratosController.renderCreateForm);

// Ruta para crear un nuevo contrato
router.post('/new',contratosController.validateCreateContrato, contratosController.createContrato);

// Ruta para mostrar el formulario de edición de un contrato
router.get('/edit/:id', contratosController.renderEditForm);

// Ruta para actualizar un contrato
router.put('/edit/:id',contratosController.validateUpdateContrato, contratosController.updateContrato);

// Ruta para eliminar un contrato
router.delete('/delete/:id', contratosController.deleteContrato);

// Ruta para generar el contrato en PDF
router.get('/pdf/:id', contratosController.generateContratoPDF);

module.exports = router;
