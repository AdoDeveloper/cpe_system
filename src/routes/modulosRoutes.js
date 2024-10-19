const express = require('express');
const router = express.Router();
const modulosController = require('../controllers/modulosController');

// ruta /modulos/

// Ruta para obtener y mostrar todos los módulos
router.get('/', modulosController.listModulos);

// Ruta para mostrar el formulario de nuevo módulo
router.get('/new', modulosController.renderCreateForm);

// Ruta para crear un nuevo módulo
router.post('/new', [], modulosController.createModulo);

// Ruta para mostrar el formulario de edición de un módulo
router.get('/edit/:id', modulosController.renderEditForm);

// Ruta para actualizar un módulo
router.put('/edit/:id', [], modulosController.updateModulo);

// Ruta para eliminar un módulo
router.delete('/delete/:id', modulosController.deleteModulo);

module.exports = router;
