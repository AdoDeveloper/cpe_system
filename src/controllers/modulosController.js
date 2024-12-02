// src/controllers/modulosController.js

const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();
const fs = require('fs');
const path = require('path');
const { check, validationResult } = require('express-validator');

// Cargar y parsear el archivo icons.json al inicio del controlador
let allowedIcons = [];
try {
  const iconsFilePath = path.join(__dirname, '../data/icons.json');
  const iconsData = fs.readFileSync(iconsFilePath, 'utf8');
  allowedIcons = JSON.parse(iconsData);
} catch (error) {
  console.error('Error al cargar icons.json:', error);
  allowedIcons = [];
}

// Validaciones para crear un módulo
exports.validateCreateModulo = [
  check('nombre')
    .notEmpty().withMessage('El nombre es obligatorio.')
    .isLength({ max: 100 }).withMessage('El nombre no debe exceder los 100 caracteres.'),
  check('descripcion')
    .optional()
    .isLength({ max: 255 }).withMessage('La descripción no debe exceder los 255 caracteres.'),
  check('activo')
    .notEmpty().withMessage('El estado es obligatorio.')
    .isIn(['true', 'false']).withMessage('El estado debe ser "true" o "false".'),
  check('rutas').custom((value, { req }) => {
    const rutas = [];
    let i = 0;
    while (req.body[`rutas[${i}][nombre]`] || req.body[`rutas[${i}][ruta]`]) {
      const nombreRuta = req.body[`rutas[${i}][nombre]`];
      const rutaRuta = req.body[`rutas[${i}][ruta]`];
      const iconoRuta = req.body[`rutas[${i}][icono]`];

      if (!nombreRuta) {
        throw new Error(`El nombre de la ruta ${i + 1} es obligatorio.`);
      }
      if (!rutaRuta) {
        throw new Error(`La ruta de la ruta ${i + 1} es obligatoria.`);
      }
      if (!allowedIcons.includes(iconoRuta)) {
        throw new Error(`El ícono de la ruta ${i + 1} no es válido.`);
      }
      i++;
    }
    if (i === 0) {
      throw new Error('Debe agregar al menos una ruta.');
    }
    return true;
  }),
];

// Validaciones para actualizar un módulo
exports.validateUpdateModulo = [
  check('nombre')
    .notEmpty().withMessage('El nombre es obligatorio.')
    .isLength({ max: 100 }).withMessage('El nombre no debe exceder los 100 caracteres.'),
  check('descripcion')
    .optional()
    .isLength({ max: 255 }).withMessage('La descripción no debe exceder los 255 caracteres.'),
  check('activo')
    .notEmpty().withMessage('El estado es obligatorio.')
    .isIn(['true', 'false']).withMessage('El estado debe ser "true" o "false".'),
  check('rutas').custom((value, { req }) => {
    const rutas = [];
    let i = 0;
    while (req.body[`rutas[${i}][nombre]`] || req.body[`rutas[${i}][ruta]`]) {
      const nombreRuta = req.body[`rutas[${i}][nombre]`];
      const rutaRuta = req.body[`rutas[${i}][ruta]`];
      const iconoRuta = req.body[`rutas[${i}][icono]`];

      if (!nombreRuta) {
        throw new Error(`El nombre de la ruta ${i + 1} es obligatorio.`);
      }
      if (!rutaRuta) {
        throw new Error(`La ruta de la ruta ${i + 1} es obligatoria.`);
      }
      if (!allowedIcons.includes(iconoRuta)) {
        throw new Error(`El ícono de la ruta ${i + 1} no es válido.`);
      }
      i++;
    }
    if (i === 0) {
      throw new Error('Debe agregar al menos una ruta.');
    }
    return true;
  }),
];


// Controlador para listar los módulos
exports.listModulos = async (req, res) => {
  try {
    const modulos = await prisma.modulo.findMany({
      include: {
        rutas: true, // Incluir las rutas asociadas
        moduloPermisos: {
          include: {
            permiso: true, // Incluir los permisos relacionados si es necesario
          },
        },
      },
    orderBy: { id: "asc" },
    });
    res.render('pages/modulos/listado', { modulos, title: 'Modulos' });
  } catch (error) {
    console.error('Error al listar los módulos:', error);
    req.flash('error_msg', 'Error al listar los módulos.');
    return res.status(500).redirect('/modulos');
  } finally {
    await prisma.$disconnect();
  }
};

// Renderiza el formulario para crear un nuevo módulo
exports.renderCreateForm = (req, res) => {
  try {
    res.render('pages/modulos/agregar', {
      action: 'new',
      modulo: { rutas: [] },
      errors: [],
      icons: JSON.stringify(allowedIcons), // Pasar los íconos serializados a la vista
      title: 'Modulos'
    });
  } catch (error) {
    console.error('Error al cargar los íconos:', error);
    req.flash('error_msg', 'Error al cargar el formulario.');
    return res.status(500).redirect('/modulos');
  }
};

// Controlador para crear un nuevo módulo
exports.createModulo = async (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    // Unir los mensajes de error con '<br>' para saltos de línea
    const errorMessages = errors.array().map(err => err.msg).join('<br>');
    req.flash('error_msg', errorMessages);
    return res.redirect('/modulos/new');
  }

  try {
    const { nombre, descripcion, activo } = req.body;
    const isActive = activo === 'true';

    // Capturar las rutas desde el formulario
    const rutas = [];
    let i = 0;
    while (req.body[`rutas[${i}][nombre]`]) {
      const icono = req.body[`rutas[${i}][icono]`];
      rutas.push({
        nombre: req.body[`rutas[${i}][nombre]`],
        ruta: req.body[`rutas[${i}][ruta]`],
        icono: icono,
      });
      i++;
    }

    // Validar que todos los íconos seleccionados sean válidos
    const invalidIcons = rutas.filter(ruta => !allowedIcons.includes(ruta.icono));
    if (invalidIcons.length > 0) {
      const errorMessages = invalidIcons.map(ruta => ({
        msg: `Ícono no válido seleccionado para la ruta: ${ruta.nombre}`,
      }));
      return res.render('pages/modulos/agregar', {
        action: 'new',
        modulo: { rutas },
        errors: errorMessages,
        icons: JSON.stringify(allowedIcons),
        title: 'Modulos'
      });
    }

    // Crear el nuevo módulo con las rutas
    await prisma.modulo.create({
      data: {
        nombre,
        descripcion,
        activo: isActive,
        rutas: {
          create: rutas,
        },
      },
    });

    req.flash('success_msg', 'Módulo creado exitosamente.');
    res.status(201).redirect('/modulos');
  } catch (error) {
    console.error('Error al crear el módulo:', error);
    req.flash('error_msg', 'Error al crear el módulo.');
    return res.status(500).redirect('/modulos');
  } finally {
    await prisma.$disconnect();
  }
};

// Renderiza el formulario para editar un módulo existente
exports.renderEditForm = async (req, res) => {
  try {
    const { id } = req.params;
    const modulo = await prisma.modulo.findUnique({
      where: { id: parseInt(id) },
      include: { rutas: true },
    });
    if (!modulo) {
      req.flash('error_msg', 'Módulo no encontrado.');
      return res.redirect('/modulos');
    }
    res.render('pages/modulos/modificar', { action: 'edit', modulo, errors: [], icons: allowedIcons, title: 'Modulos' });
  } catch (error) {
    console.error('Error al obtener el módulo para editar:', error);
    req.flash('error_msg', 'Error al obtener el módulo.');
    return res.status(500).redirect('/modulos');
  } finally {
    await prisma.$disconnect();
  }
};


// Controlador para actualizar un módulo
exports.updateModulo = async (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    // Unir los mensajes de error con '<br>' para saltos de línea
    const errorMessages = errors.array().map(err => err.msg).join('<br>');
    req.flash('error_msg', errorMessages);
    return res.redirect(`/modulos/edit/${req.params.id}`);
  }

  try {
    const { id } = req.params;
    const { nombre, descripcion, activo } = req.body;
    const isActive = activo === 'true';

    // Capturar las rutas desde el formulario
    const rutas = [];
    let i = 0;
    while (req.body[`rutas[${i}][nombre]`] || req.body[`rutas[${i}][ruta]`]) {
      const icono = req.body[`rutas[${i}][icono]`];
      rutas.push({
        id: req.body[`rutas[${i}][id]`] ? parseInt(req.body[`rutas[${i}][id]`]) : null,
        nombre: req.body[`rutas[${i}][nombre]`],
        ruta: req.body[`rutas[${i}][ruta]`],
        icono: icono,
      });
      i++;
    }

    // Validar que todos los íconos seleccionados sean válidos
    const invalidIcons = rutas.filter(ruta => !allowedIcons.includes(ruta.icono));
    if (invalidIcons.length > 0) {
      const errorMessages = invalidIcons.map(ruta => ({
        msg: `Ícono no válido seleccionado para la ruta: ${ruta.nombre}`,
      }));

      // Obtener el módulo actual para re-renderizar la vista con los datos existentes
      const modulo = await prisma.modulo.findUnique({
        where: { id: parseInt(id) },
        include: { rutas: true },
      });
      if (!modulo) {
        req.flash('error_msg', 'Módulo no encontrado.');
        return res.redirect('/modulos');
      }

      return res.render('pages/modulos/modificar', {
        action: 'edit',
        modulo: { ...modulo, rutas },
        errors: errorMessages,
        icons: JSON.stringify(allowedIcons),
      });
    }

    // Actualizar el módulo
    await prisma.modulo.update({
      where: { id: parseInt(id) },
      data: {
        nombre,
        descripcion,
        activo: isActive,
      },
    });

    // Obtener rutas existentes
    const existingRoutes = await prisma.ruta.findMany({
      where: { moduloId: parseInt(id) },
    });

    const existingRouteIds = existingRoutes.map(r => r.id);
    const submittedRouteIds = rutas.filter(r => r.id).map(r => r.id);

    // Identificar rutas a eliminar
    const routesToDelete = existingRouteIds.filter(id => !submittedRouteIds.includes(id));

    // Eliminar rutas que ya no están en el formulario
    if (routesToDelete.length > 0) {
      await prisma.ruta.deleteMany({
        where: {
          id: { in: routesToDelete },
        },
      });
    }

    // Actualizar o crear rutas
    for (const ruta of rutas) {
      if (ruta.id) {
        // Actualizar ruta existente
        await prisma.ruta.update({
          where: { id: ruta.id },
          data: {
            nombre: ruta.nombre,
            ruta: ruta.ruta,
            icono: ruta.icono,
          },
        });
      } else {
        // Crear nueva ruta
        await prisma.ruta.create({
          data: {
            nombre: ruta.nombre,
            ruta: ruta.ruta,
            icono: ruta.icono,
            moduloId: parseInt(id),
          },
        });
      }
    }

    req.flash('success_msg', 'Módulo actualizado exitosamente.');
    res.status(201).redirect('/modulos');
  } catch (error) {
    console.error('Error al actualizar el módulo:', error);
    req.flash('error_msg', 'Error al actualizar el módulo.');
    return res.status(500).redirect('/modulos');
  } finally {
    await prisma.$disconnect();
  }
};

// Controlador para eliminar un módulo
exports.deleteModulo = async (req, res) => {
  try {
    const { id } = req.params;

    // Eliminar las rutas asociadas al módulo
    await prisma.ruta.deleteMany({ where: { moduloId: parseInt(id) } });

    // Eliminar el módulo
    await prisma.modulo.delete({ where: { id: parseInt(id) } });

    req.flash('success_msg', 'Módulo eliminado exitosamente.');
    res.status(200).redirect('/modulos');
  } catch (error) {
    console.error('Error al eliminar el módulo:', error);
    req.flash('error_msg', 'Error al eliminar el módulo.');
    return res.status(500).redirect('/modulos');
  } finally {
    await prisma.$disconnect();
  }
};
