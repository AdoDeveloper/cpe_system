const express = require('express');
const router = express.Router();
const ticketsController = require('../controllers/ticketsController');
const { checkRole } = require('../middlewares/authMiddleware'); 

// Ruta para listar tickets
router.get('/', checkRole(['Administrador', 'Soporte Tecnico', 'Tecnico', 'Instalador', 'Cliente']), ticketsController.listTickets);

// Ruta para renderizar el formulario de creación de ticket
router.get('/new', checkRole(['Administrador', 'Soporte Tecnico', 'Cliente']), ticketsController.renderCreateForm);

// Ruta para crear un nuevo ticket (usa multer para manejar archivos)
const multer = require('multer');
const path = require('path');

// Configuración de Multer para subir imágenes y archivos PDF en memoria
const storage = multer.memoryStorage();
const upload = multer({
  storage: storage,
  fileFilter: (req, file, cb) => {
    const filetypes = /png|jpg|jpeg|webp|pdf/;
    const mimetype = filetypes.test(file.mimetype);
    const extname = filetypes.test(path.extname(file.originalname).toLowerCase());
    if (mimetype && extname) {
      return cb(null, true);
    } else {
      cb(new Error('Solo se permiten archivos de tipo png, jpg, jpeg, webp y pdf.'));
    }
  }
});

// Ruta para crear un nuevo ticket
router.post('/new', checkRole(['Administrador', 'Soporte Tecnico', 'Cliente']), upload.single('img_problema'), ticketsController.createTicket);

// Ruta para renderizar el formulario de edición de ticket (solo Administrador y Soporte Técnico)
router.get('/edit/:id', checkRole(['Administrador', 'Soporte Tecnico']), ticketsController.renderEditForm);

// Ruta para actualizar un ticket (solo Administrador y Soporte Técnico)
router.put('/edit/:id', checkRole(['Administrador', 'Soporte Tecnico']), upload.single('img_problema'), ticketsController.updateTicket);

// Ruta para eliminar un ticket (solo Administrador y Soporte Técnico)
router.delete('/delete/:id', checkRole(['Administrador', 'Soporte Tecnico']), ticketsController.deleteTicket);

// Mostrar timeline
router.get('/timeline/:id', ticketsController.showTimeline);

// Actualizar estado del ticket
router.put('/:id/updatestatus', ticketsController.updateTicketStatus);

// Exportar el router
module.exports = router;
