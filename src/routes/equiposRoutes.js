// src/routes/equiposRoutes.js
const express = require('express');
const router = express.Router();
const equiposController = require('../controllers/equiposController');
const multer = require('multer');

// Configuración de Multer para el manejo de archivos en memoria
const storage = multer.memoryStorage();
const upload = multer({
  storage: storage,
  fileFilter: (req, file, cb) => {
    const filetypes = /png|jpg|jpeg|webp/;
    const mimetype = filetypes.test(file.mimetype);
    const extname = filetypes.test(require('path').extname(file.originalname).toLowerCase());
    if (mimetype && extname) {
      return cb(null, true);
    }
    cb(new Error('Solo se permiten imágenes de tipo png, jpg, jpeg o webp.'));
  }
});

// Listar equipos
router.get('/', equiposController.listEquipos);

// Renderizar formulario para agregar equipo
router.get('/new', equiposController.renderCreateForm);

// Crear nuevo equipo (Se usa multer para manejar la subida de imagen)
router.post('/new', upload.single('img_equipo'), equiposController.createEquipo);

// Renderizar formulario para editar equipo
router.get('/edit/:id', equiposController.renderEditForm);

// Actualizar equipo (Permitir actualización de la imagen usando multer)
router.post('/edit/:id', upload.single('img_equipo'), equiposController.updateEquipo);

// Eliminar equipo
router.get('/delete/:id', equiposController.deleteEquipo);

module.exports = router;
