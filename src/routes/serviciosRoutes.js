const express = require('express');
const router = express.Router();
const serviciosController = require('../controllers/serviciosController');
const { body } = require('express-validator');
const { authMiddleware } = require('../middlewares/middleware');

// Middleware para proteger rutas de servicios solo para administradores
router.use(authMiddleware);

// Ruta para obtener y mostrar todos los servicios
router.get('/', serviciosController.listServicios);

// Ruta para mostrar el formulario de nuevo servicio
router.get('/new', serviciosController.renderCreateForm);

// Ruta para crear un nuevo servicio
router.post('/new', [
    body('servicio').notEmpty().withMessage('El nombre del servicio es obligatorio'),
    body('precio').isFloat({ gt: 0 }).withMessage('El precio debe ser un número positivo'),
    body('descripcion').notEmpty().withMessage('La descripción es obligatoria'),
    body('tipo_pago').notEmpty().withMessage('El tipo de pago es obligatorio')
], serviciosController.createServicio);

// Ruta para mostrar el formulario de edición de un servicio
router.get('/edit/:id', serviciosController.renderEditForm);

// Ruta para actualizar un servicio
router.post('/edit/:id', [
    body('servicio').notEmpty().withMessage('El nombre del servicio es obligatorio'),
    body('precio').isFloat({ gt: 0 }).withMessage('El precio debe ser un número positivo'),
    body('descripcion').notEmpty().withMessage('La descripción es obligatoria'),
    body('tipo_pago').notEmpty().withMessage('El tipo de pago es obligatorio')
], serviciosController.updateServicio);

// Ruta para eliminar un servicio
router.get('/delete/:id', serviciosController.deleteServicio);

module.exports = router;
