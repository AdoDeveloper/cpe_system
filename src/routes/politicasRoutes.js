const express = require('express');
const router = express.Router();
const politicasController = require('../controllers/politicasController');

// Ruta para obtener y mostrar todas las políticas
router.get('/', politicasController.listPoliticas);

// Ruta para mostrar el formulario de nueva política
router.get('/new', politicasController.renderCreateForm);

// Ruta para crear una nueva política
router.post('/new',politicasController.validateCreatePolitica, politicasController.createPolitica);

// Ruta para mostrar el formulario de edición de una política
router.get('/edit/:id', politicasController.renderEditForm);

// Ruta para actualizar una política
router.put('/edit/:id',politicasController.validateUpdatePolitica, politicasController.updatePolitica);

// Ruta para eliminar una política
router.delete('/delete/:id', politicasController.deletePolitica);

module.exports = router;
