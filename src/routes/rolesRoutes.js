const express = require('express');
const router = express.Router();
const rolesController = require('../controllers/rolesController');

// Listar roles
router.get('/', rolesController.listRoles);

// Crear rol
router.post('/new', rolesController.createRol);

// Eliminar rol
router.get('/delete/:id', rolesController.deleteRol);

module.exports = router;
