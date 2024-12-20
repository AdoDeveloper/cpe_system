const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();
const cloudinary = require('cloudinary').v2;
const multer = require('multer');
const path = require('path');
const { check, validationResult } = require('express-validator');

// Configuración de Cloudinary
cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
});

// Configuración de Multer para subir imágenes
const storage = multer.memoryStorage();
const upload = multer({
  storage: storage,
  fileFilter: (req, file, cb) => {
    const filetypes = /png|jpg|jpeg|webp/;
    const mimetype = filetypes.test(file.mimetype);
    const extname = filetypes.test(path.extname(file.originalname).toLowerCase());
    if (mimetype && extname) {
      return cb(null, true);
    } else {
      cb(new Error('Solo se permiten imágenes de tipo png, jpg, jpeg, webp.'));
    }
  }
});

// Función para subir archivos a Cloudinary con el nombre_equipo como nombre de archivo
const uploadFileToCloudinary = async (file, folder, nombre_equipo) => {
  return new Promise((resolve, reject) => {
    cloudinary.uploader.upload_stream({
      folder: folder,
      format: 'webp', // Formato estandarizado
      public_id: nombre_equipo // Usar el hash como el nombre público del archivo
    }, (error, result) => {
      if (error) {
        reject(error);
      } else {
        resolve(result);
      }
    }).end(file.buffer); // Usar el buffer del archivo cargado
  });
};

// Función para eliminar archivos de Cloudinary
const deleteFileFromCloudinary = async (folder, publicId) => {
  return new Promise((resolve, reject) => {
    cloudinary.uploader.destroy(`${folder}/${publicId}`, (error, result) => {
      if (error) reject(error);
      else resolve(result);
    });
  });
};

// Validaciones para la creación de un equipo
exports.validateCreateEquipo = [
  check('nombre_equipo').notEmpty().withMessage('El nombre del equipo es obligatorio.').isLength({ max: 50 }).withMessage('El nombre no puede exceder los 50 caracteres.'),
  check('marca').notEmpty().withMessage('La marca del equipo es obligatoria.').isLength({ max: 50 }).withMessage('La marca no puede exceder los 50 caracteres.'),
  check('tipo').notEmpty().withMessage('El tipo de equipo es obligatorio.').isIn(['ANTENA', 'ROUTER']).withMessage('El tipo de equipo debe ser "ANTENA" o "ROUTER".'),
  check('descripcion').optional().isLength({ max: 500 }).withMessage('La descripción no puede exceder los 500 caracteres.')
];

// Validaciones para la actualización de un equipo
exports.validateUpdateEquipo = [
  check('nombre_equipo').notEmpty().withMessage('El nombre del equipo es obligatorio.').isLength({ max: 50 }).withMessage('El nombre no puede exceder los 50 caracteres.'),
  check('marca').notEmpty().withMessage('La marca del equipo es obligatoria.').isLength({ max: 50 }).withMessage('La marca no puede exceder los 50 caracteres.'),
  check('tipo').notEmpty().withMessage('El tipo de equipo es obligatorio.').isIn(['ANTENA', 'ROUTER']).withMessage('El tipo de equipo debe ser "ANTENA" o "ROUTER".'),
  check('descripcion').optional().isLength({ max: 500 }).withMessage('La descripción no puede exceder los 500 caracteres.')
];

// Controlador para listar los equipos
exports.listEquipos = async (req, res) => {
  try {
    const equipos = await prisma.equipoCPE.findMany({
      orderBy: { id: 'asc' },
    });
    res.render('pages/equipos/listado', { equipos, title: 'Equipos' });
  } catch (error) {
    console.error('Error al listar equipos:', error);
    req.flash('error_msg', 'Error al listar los equipos.');
    return res.status(500).redirect('/equipos');
  } finally {
    await prisma.$disconnect();
  }
};

// Renderiza el formulario para crear un nuevo equipo
exports.renderCreateForm = (req, res) => {
  res.render('pages/equipos/agregar', { equipo: {}, errors: [], title: 'Equipos' });
};

// Controlador para crear un equipo
exports.createEquipo = async (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    // Unir los mensajes de error con '<br>' para saltos de línea
    const errorMessages = errors.array().map(err => err.msg).join('<br>');
    req.flash('error_msg', errorMessages);
    return res.redirect('/equipos/new');
  }

  try {
    const { nombre_equipo, marca, tipo, descripcion } = req.body;

    // Subir imagen a Cloudinary usando el hash como nombre del archivo
    const result = await uploadFileToCloudinary(req.file, 'equiposCPE', nombre_equipo);

    // Crear equipo en la base de datos
    await prisma.equipoCPE.create({
      data: {
        nombre_equipo,
        marca,
        tipo,
        descripcion,
        img_equipo: result.secure_url, // URL de la imagen en Cloudinary
      },
    });

    req.flash('success_msg', 'Equipo creado correctamente');
    res.status(201).redirect('/equipos');
  } catch (error) {
    console.error('Error al crear el equipo:', error);
    req.flash('error_msg', 'Error al crear el equipo.');
    return res.status(500).redirect('/equipos');
  } finally {
    await prisma.$disconnect();
  }
};

// Renderiza el formulario para editar un equipo
exports.renderEditForm = async (req, res) => {
  try {
    const { id } = req.params;
    const equipo = await prisma.equipoCPE.findUnique({ where: { id: parseInt(id) } });
    res.render('pages/equipos/modificar', { action: 'edit', equipo, title: 'Equipos' });
  } catch (error) {
    console.error('Error al obtener el equipo:', error);
    req.flash('error_msg', 'Error al obtener el equipo.');
    return res.status(500).redirect('/equipos');
  } finally {
    await prisma.$disconnect();
  }
};

// Controlador para actualizar un equipo
exports.updateEquipo = async (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    // Unir los mensajes de error con '<br>' para saltos de línea
    const errorMessages = errors.array().map(err => err.msg).join('<br>');
    req.flash('error_msg', errorMessages);
    return res.redirect(`/equipos/edit/${req.params.id}`);
  }

  try {
    const { id } = req.params;
    const { nombre_equipo, marca, tipo, descripcion } = req.body;
    let updatedData = { nombre_equipo, marca, tipo, descripcion };

    const equipo = await prisma.equipoCPE.findUnique({ where: { id: parseInt(id) } });

    // Verificar si se sube una nueva imagen
    if (req.file) {
      // Eliminar la imagen antigua si existe
      if (equipo.img_equipo) {
        await deleteFileFromCloudinary('equiposCPE', equipo.nombre_equipo);
      }

      // Subir la nueva imagen a Cloudinary usando el hash como nombre del archivo
      const result = await uploadFileToCloudinary(req.file, 'equiposCPE', nombre_equipo);
      updatedData.img_equipo = result.secure_url;
    }

    await prisma.equipoCPE.update({
      where: { id: parseInt(id) },
      data: updatedData,
    });

    req.flash('success_msg', 'Equipo actualizado correctamente');
    res.status(201).redirect('/equipos');
  } catch (error) {
    console.error('Error al actualizar el equipo:', error);
    req.flash('error_msg', 'Error al actualizar el equipo.');
    return res.status(500).redirect('/equipos');
  } finally {
    await prisma.$disconnect();
  }
};

// Controlador para eliminar un equipo
exports.deleteEquipo = async (req, res) => {
  try {
    const { id } = req.params;

    // Buscar el equipo por ID
    const equipo = await prisma.equipoCPE.findUnique({ where: { id: parseInt(id) } });

    // Verificar si el equipo está en uso en configuraciones
    const configuracionesEnUso = await prisma.configCPE.findMany({
      where: {
        OR: [
          { cpe_antenaId: parseInt(id) },
          { cpe_routerId: parseInt(id) }
        ]
      }
    });

    // Si hay configuraciones que usan este equipo, no permitir la eliminación
    if (configuracionesEnUso.length > 0) {
      req.flash('error_msg', 'No se puede eliminar el equipo porque está en uso en configuraciones de CPE.');
      return res.redirect('/equipos');
    }

    // Eliminar la imagen de Cloudinary si existe
    if (equipo.img_equipo) {
      await deleteFileFromCloudinary('equiposCPE', equipo.nombre_equipo);
    }

    // Eliminar el equipo si no está en uso
    await prisma.equipoCPE.delete({ where: { id: parseInt(id) } });

    req.flash('success_msg', 'Equipo eliminado correctamente');
    res.status(200).redirect('/equipos');
  } catch (error) {
    console.error('Error al eliminar el equipo:', error);
    req.flash('error_msg', 'Error al eliminar el equipo.');
    return res.status(500).redirect('/equipos');
  } finally {
    await prisma.$disconnect();
  }
};