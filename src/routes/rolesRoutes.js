// src/routes/rolesRoutes.js
const express = require('express');
const router = express.Router();
const rolesController = require('../controllers/rolesController');

// ruta /roles/

// Ruta para obtener y mostrar todos los roles
router.get('/', rolesController.listRoles);

// Ruta para mostrar el formulario de nuevo rol
router.get('/new', rolesController.renderCreateForm);

// Ruta para crear un nuevo rol
router.post('/new', rolesController.createRol);

// Ruta para mostrar el formulario de edición de un rol
router.get('/edit/:id', rolesController.renderEditForm);

// Ruta para actualizar un rol existente
router.put('/edit/:id', rolesController.updateRol);

// Ruta para eliminar un rol
router.delete('/delete/:id', rolesController.deleteRol);

module.exports = router;
