const express = require('express');
const router = express.Router();
const usuariosController = require('../controllers/usuariosController');

// Listar usuarios
router.get('/', usuariosController.listUsuarios);

// Renderizar formulario para crear usuario
router.get('/new', usuariosController.renderCreateForm);

// Crear usuario
router.post('/new', usuariosController.createUsuario);

// Renderizar formulario para editar usuario
router.get('/edit/:id', usuariosController.renderEditForm);

// Actualizar usuario
router.post('/edit/:id', usuariosController.updateUsuario);

// Eliminar usuario
router.get('/delete/:id', usuariosController.deleteUsuario);

module.exports = router;
