const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

// Controlador para listar los servicios
exports.listServicios = async (req, res) => {
    try {
        const servicios = await prisma.servicio.findMany(); // Obtener servicios
        res.render('pages/servicios/listado', { servicios });
    } catch (error) {
        console.error('Error al listar los servicios:', error);
        req.flash('error_msg', 'Error al listar los servicios.');
        return res.status(500).redirect('/servicios');
    } finally {
        await prisma.$disconnect();
    }
};

// Renderiza el formulario para crear un nuevo servicio
exports.renderCreateForm = (req, res) => {
    res.render('pages/servicios/agregar', { action: 'new', servicio: {}, errors: [] });
};

// Controlador para crear un nuevo servicio
exports.createServicio = async (req, res) => {
  try {
      const { servicio, precio, descripcion, tipo_pago} = req.body;

      await prisma.servicio.create({
          data: {
              servicio,
              precio: parseFloat(precio),
              descripcion,
              tipo_pago
          }
      });

      req.flash('success_msg', 'Servicio creado exitosamente.');
      res.status(201).redirect('/servicios');
  } catch (error) {
      console.error('Error al crear el servicio:', error);
      req.flash('error_msg', 'Error al crear el servicio.');
      return res.status(500).redirect('/servicios');
  } finally {
    await prisma.$disconnect();
  }
};

// Renderiza el formulario para editar un servicio existente
exports.renderEditForm = async (req, res) => {
    try {
        const { id } = req.params;
        const servicio = await prisma.servicio.findUnique({ where: { id: parseInt(id) } });
        if (!servicio) {
            return res.redirect('/servicios');
        }
        res.render('pages/servicios/modificar', { action: 'edit', servicio, errors: [] });
    } catch (error) {
        console.error('Error al obtener el servicio para editar:', error);
        req.flash('error_msg', 'Error al obtener el servicio.');
        return res.status(500).redirect('/servicios');
    } finally {
        await prisma.$disconnect();
    }
};

// Controlador para actualizar un servicio existente
exports.updateServicio = async (req, res) => {
    try {
        const { id } = req.params;
        const { servicio, precio, descripcion, tipo_pago} = req.body;

        await prisma.servicio.update({
            where: { id: parseInt(id) },
            data: {
                servicio,
                precio: parseFloat(precio),
                descripcion,
                tipo_pago
            }
        });

        req.flash('success_msg', 'Servicio actualizado exitosamente.');
        res.status(201).redirect('/servicios');
    } catch (error) {
        console.error('Error al actualizar el servicio:', error);
        req.flash('error_msg', 'Error al actualizar el servicio.');
        return res.status(500).redirect('/servicios');
    } finally {
        await prisma.$disconnect();
    }
};

// Controlador para eliminar un servicio
exports.deleteServicio = async (req, res) => {
    try {
        const { id } = req.params;
        await prisma.servicio.delete({ where: { id: parseInt(id) } });
        req.flash('success_msg', 'Servicio eliminado exitosamente.');
        res.status(200).redirect('/servicios');
    } catch (error) {
        console.error('Error al eliminar el servicio:', error);
        req.flash('error_msg', 'Error al eliminar el servicio.');
        return res.status(500).redirect('/servicios');
    } finally {
        await prisma.$disconnect();
    }
};
