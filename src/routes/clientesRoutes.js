const express = require('express');
const router = express.Router();
const clientesController = require('../controllers/clientesController');

// Ruta para listar clientes
router.get('/', clientesController.listClientes);

// Ruta para renderizar formulario para agregar un nuevo cliente
router.get('/new', clientesController.renderCreateForm);

// Ruta para crear un nuevo cliente, con validaciones
router.post('/new', clientesController.validateCreateCliente, clientesController.createCliente);

// Ruta para renderizar formulario para editar un cliente
router.get('/edit/:id', clientesController.renderEditForm);

// Ruta para actualizar un cliente, con validaciones
router.put('/edit/:id', clientesController.validateUpdateCliente, clientesController.updateCliente);

// Ruta para eliminar un cliente
router.delete('/delete/:id', clientesController.deleteCliente);

module.exports = router;