// src/routes/clientesRoutes.js
const express = require('express');
const router = express.Router();
const clientesController = require('../controllers/clientesController');

// Listar clientes
router.get('/', clientesController.listClientes);

// Renderizar formulario para agregar cliente
router.get('/new', clientesController.renderCreateForm);

// Crear nuevo cliente
router.post('/new', clientesController.createCliente);

// Renderizar formulario para editar cliente
router.get('/edit/:id', clientesController.renderEditForm);

// Actualizar cliente
router.post('/edit/:id', clientesController.updateCliente);

// Eliminar cliente
router.get('/delete/:id', clientesController.deleteCliente);

module.exports = router;
