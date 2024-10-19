const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();
const crypto = require('crypto');

// Controlador para listar los módulos
exports.listModulos = async (req, res) => {
    try {
        const modulos = await prisma.modulo.findMany({
            include: {
                permisos: true, // Incluir permisos relacionados si es necesario
            },
        });
        res.render('pages/modulos/listado', { modulos });
    } catch (error) {
        console.error('Error al listar los módulos:', error);
        req.flash('error_msg', 'Error al listar los módulos.'); // Guardar el mensaje de error flash
        return res.status(500).redirect('/modulos'); // Redirigir con estado 500
    } finally {
        await prisma.$disconnect(); // Cierra la conexión
    }
};

// Renderiza el formulario para crear un nuevo módulo
exports.renderCreateForm = (req, res) => {
    res.render('pages/modulos/agregar', { action: 'new', modulo: {}, errors: [] });
};

// Controlador para crear un nuevo módulo
exports.createModulo = async (req, res) => {
  try {
      // Extraer los datos del formulario
      const { nombre, descripcion, activo} = req.body;

      // Convertir el valor de "activo" a booleano
    const isActive = activo === 'true';

    // Crear el nuevo módulo en la base de datos
    await prisma.modulo.create({
      data: {
        nombre,
        descripcion,
        activo: isActive  // Asegurarse de que sea booleano
      }
    });

      // Redirigir a la lista de módulos después de crear el módulo
      req.flash('success_msg', 'Módulo creado exitosamente.');
      res.status(201).redirect('/modulos');
  } catch (error) {
      console.error('Error al crear el módulo:', error);
      req.flash('error_msg', 'Error al crear el módulo.'); // Guardar el mensaje de error flash
      return res.status(500).redirect('/modulos'); // Redirigir con estado 500
  } finally {
    await prisma.$disconnect(); // Cierra la conexión
  }
};

// Renderiza el formulario para editar un módulo existente
exports.renderEditForm = async (req, res) => {
    try {
        const { id } = req.params;
        const modulo = await prisma.modulo.findUnique({ where: { id: parseInt(id) } });
        if (!modulo) {
            return res.redirect('/modulos');
        }
        res.render('pages/modulos/modificar', { action: 'edit', modulo, errors: [] });
    } catch (error) {
        console.error('Error al obtener el módulo para editar:', error);
        req.flash('error_msg', 'Error al obtener el módulo.'); // Guardar el mensaje de error flash
        return res.status(500).redirect('/modulos'); // Redirigir con estado 500
    } finally {
        await prisma.$disconnect(); // Cierra la conexión
    }
};

// Controlador para actualizar un módulo existente
exports.updateModulo = async (req, res) => {
    try {
        const { id } = req.params;
        const { nombre, descripcion, activo} = req.body;

        // Convertir el valor de "activo" a booleano
        const isActive = activo === 'true';

        await prisma.modulo.update({
            where: { id: parseInt(id) },
            data: {
                nombre,
                descripcion,
                activo: isActive  // Asegurarse de que sea booleano
            }
        });
        req.flash('success_msg', 'Módulo actualizado exitosamente.');
        res.status(201).redirect('/modulos');
    } catch (error) {
        console.error('Error al actualizar el módulo:', error);
        req.flash('error_msg', 'Error al actualizar el módulo.'); // Guardar el mensaje de error flash
        return res.status(500).redirect('/modulos'); // Redirigir con estado 500
    } finally {
        await prisma.$disconnect(); // Cierra la conexión
    }
};

// Controlador para eliminar un módulo
exports.deleteModulo = async (req, res) => {
    try {
        const { id } = req.params;
        await prisma.modulo.delete({ where: { id: parseInt(id) } });
        req.flash('success_msg', 'Módulo eliminado exitosamente.');
        res.status(200).redirect('/modulos');
    } catch (error) {
        console.error('Error al eliminar el módulo:', error);
        req.flash('error_msg', 'Error al eliminar el módulo.'); // Guardar el mensaje de error flash
        return res.status(500).redirect('/modulos'); // Redirigir con estado 500
    } finally {
        await prisma.$disconnect(); // Cierra la conexión
    }
};
