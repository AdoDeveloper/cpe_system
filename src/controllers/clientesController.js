// src/controllers/clientesController.js
const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();
const crypto = require('crypto');

// Controlador para listar los clientes
exports.listClientes = async (req, res) => {
    try {
        const clientes = await prisma.cliente.findMany(); // Obtener todos los clientes
        console.log("Datos de clientes: ", clientes); // Verifica que los datos estén presentes
        res.render('pages/clientes/listado', { clientes });
    } catch (error) {
        console.error('Error al listar los clientes:', error);
        return res.status(500).render('errors/500', { layout: 'error', title: '500 - Error interno del servidor' });
    } finally {
        await prisma.$disconnect(); // Cierra la conexión
    }
};

// Renderiza el formulario para crear un nuevo cliente
exports.renderCreateForm = (req, res) => {
    res.render('pages/clientes/agregar', { action: 'new', cliente: {}, errors: [] });
};

// Controlador para crear un nuevo cliente
exports.createCliente = async (req, res) => {
  try {
      // Extraer los datos del formulario
      const { nombres, apellidos, alias, telefono, correo, dui, cpe_hash } = req.body;
      
      // Generar un hash único para el nuevo cliente
      const hash = crypto.randomBytes(16).toString('hex');
      
      // Crear el nuevo cliente en la base de datos
      await prisma.cliente.create({
          data: {
              hash,
              nombres,
              apellidos,
              alias,
              telefono,
              correo,
              dui,
              cpe_hash: cpe_hash || null
          }
      });
      
      // Redirigir a la lista de clientes después de crear el cliente
      req.flash('success_msg', 'Cliente creado exitosamente.');
      res.status(201).redirect('/clientes');
  } catch (error) {
      console.error('Error al crear el cliente:', error);
      return res.status(500).render('errors/500', { layout: 'error', title: '500 - Error interno del servidor' });
  } finally {
    await prisma.$disconnect(); // Cierra la conexión
}
};

// Renderiza el formulario para editar un cliente existente
exports.renderEditForm = async (req, res) => {
    try {
        const { id } = req.params;
        const cliente = await prisma.cliente.findUnique({ where: { id: parseInt(id) } });
        if (!cliente) {
            return res.redirect('/clientes');
        }
        res.render('pages/clientes/modificar', { action: 'edit', cliente, errors: [] });
    } catch (error) {
        console.error('Error al obtener el cliente para editar:', error);
        return res.status(500).render('errors/500', { layout: 'error', title: '500 - Error interno del servidor' });
    } finally {
        await prisma.$disconnect(); // Cierra la conexión
    }
};

// Controlador para actualizar un cliente existente
exports.updateCliente = async (req, res) => {
    try {
        const { id } = req.params;
        const { nombres, apellidos, alias, telefono, correo, dui, cpe_hash } = req.body;
        await prisma.cliente.update({
            where: { id: parseInt(id) },
            data: {
                nombres,
                apellidos,
                alias,
                telefono,
                correo,
                dui,
                cpe_hash: cpe_hash || null
            }
        });
        req.flash('success_msg', 'Cliente actualizado exitosamente.');
        res.status(201).redirect('/clientes');
    } catch (error) {
        console.error('Error al actualizar el cliente:', error);
        return res.status(500).render('errors/500', { layout: 'error', title: '500 - Error interno del servidor' });
    } finally {
        await prisma.$disconnect(); // Cierra la conexión
    }
};

// Controlador para eliminar un cliente
exports.deleteCliente = async (req, res) => {
    try {
        const { id } = req.params;
        await prisma.cliente.delete({ where: { id: parseInt(id) } });
        req.flash('success_msg', 'Cliente eliminado exitosamente.');
        res.status(200).redirect('/clientes');
    } catch (error) {
        console.error('Error al eliminar el cliente:', error);
        return res.status(500).render('errors/500', { layout: 'error', title: '500 - Error interno del servidor' });
    } finally {
        await prisma.$disconnect(); // Cierra la conexión
    }
};
