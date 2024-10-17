const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();
const bcrypt = require('bcryptjs'); // Para encriptar las contraseñas

// Controlador para listar usuarios
exports.listUsuarios = async (req, res) => {
    try {
        const usuarios = await prisma.usuario.findMany({
            include: {
                rol: true, // Incluir el rol relacionado
                cliente: true, // Incluir el cliente relacionado si aplica
            },
        });
        res.render('pages/usuarios/listado', { usuarios });
    } catch (error) {
        console.error('Error al listar los usuarios:', error);
        return res.status(500).render('errors/500', { layout: 'error', title: '500 - Error al listar los usuarios' });
    } finally {
        await prisma.$disconnect(); // Cierra la conexión
    }
};

// Controlador para renderizar el formulario de agregar usuario
exports.renderCreateForm = async (req, res) => {
    try {
        const roles = await prisma.rol.findMany(); // Obtener todos los roles disponibles
        const clientes = await prisma.cliente.findMany(); // Obtener todos los clientes
        res.render('pages/usuarios/agregar', { roles, clientes, usuario: {}, errors: [] });
    } catch (error) {
        console.error('Error al cargar el formulario de usuario:', error);
        return res.status(500).render('errors/500', { layout: 'error', title: '500 - Error al cargar el formulario de usuario' });
    } finally {
        await prisma.$disconnect(); // Cierra la conexión
    }
};

// Controlador para crear un nuevo usuario
exports.createUsuario = async (req, res) => {
    try {
        const { email, password, nombre, rolId, clienteId } = req.body;

        // Encriptar la contraseña
        const hashedPassword = await bcrypt.hash(password, 10);

        // Verificar si el rol es Admin, en cuyo caso no se asigna clienteId
        const rol = await prisma.rol.findUnique({ where: { id: parseInt(rolId) } });
        let clienteIdValue = null;

        // Solo asignar clienteId si el rol no es Admin
        if (rol.nombre !== 'Administrador' && clienteId) {
            clienteIdValue = parseInt(clienteId);
        }

        // Crear el usuario con los datos proporcionados
        await prisma.usuario.create({
            data: {
                email,
                password: hashedPassword, // Contraseña encriptada
                nombre,
                rolId: parseInt(rolId),
                clienteId: clienteIdValue, // Relación con cliente si aplica
            },
        });
        req.flash('success_msg', 'Usuario creado exitosamente.');
        res.status(201).redirect('/usuarios');
    } catch (error) {
        console.error('Error al crear el usuario:', error);
        return res.status(500).render('errors/500', { layout: 'error', title: '500 - Error al crear el usuario' });
    } finally {
        await prisma.$disconnect(); // Cierra la conexión
    }
};

// Controlador para renderizar el formulario de editar usuario
exports.renderEditForm = async (req, res) => {
    try {
        const { id } = req.params;
        const usuario = await prisma.usuario.findUnique({
            where: { id: parseInt(id) },
            include: { rol: true, cliente: true },
        });
        const roles = await prisma.rol.findMany();
        const clientes = await prisma.cliente.findMany();

        if (!usuario) return res.redirect('/usuarios');

        // Verifica si el rol es 'Administrador'
        const isAdmin = usuario.rol.nombre === 'Administrador';

        res.render('pages/usuarios/modificar', { usuario, roles, clientes, isAdmin, errors: [] });
    } catch (error) {
        console.error('Error al cargar el formulario de usuario:', error);
        return res.status(500).render('errors/500', { layout: 'error', title: '500 - Error al cargar el formulario de usuario' });
    }
};

// Controlador para actualizar un usuario
exports.updateUsuario = async (req, res) => {
    try {
        const { id } = req.params;
        const { email, nombre, rolId, clienteId, currentPassword, newPassword, confirmPassword } = req.body;

        // Buscar al usuario actual en la base de datos
        const usuario = await prisma.usuario.findUnique({ where: { id: parseInt(id) }, include: { rol: true } });

        if (!usuario) {
            return res.status(404).send('Usuario no encontrado');
        }

        // Verificar si se ingresó una nueva contraseña
        if (currentPassword && newPassword && confirmPassword) {
            // Verificar si la contraseña actual es correcta
            const isMatch = await bcrypt.compare(currentPassword, usuario.password);
            if (!isMatch) {
                return res.status(400).render('pages/usuarios/modificar', {
                    usuario,
                    roles: await prisma.rol.findMany(),
                    clientes: await prisma.cliente.findMany(),
                    errors: [{ msg: 'La contraseña actual no es correcta' }]
                });
            }

            // Verificar si la nueva contraseña coincide con la confirmación
            if (newPassword !== confirmPassword) {
                return res.status(400).render('pages/usuarios/modificar', {
                    usuario,
                    roles: await prisma.rol.findMany(),
                    clientes: await prisma.cliente.findMany(),
                    errors: [{ msg: 'Las contraseñas no coinciden' }]
                });
            }

            // Encriptar la nueva contraseña
            const hashedPassword = await bcrypt.hash(newPassword, 10);

            // Actualizar el usuario incluyendo la nueva contraseña encriptada
            await prisma.usuario.update({
                where: { id: parseInt(id) },
                data: { 
                    email, 
                    nombre, 
                    rolId: parseInt(rolId), 
                    clienteId: clienteId ? parseInt(clienteId) : null,
                    password: hashedPassword
                },
            });
        } else {
            // Si se cambia el rol de "Administrador" a "Cliente", establecer clienteId
            if (usuario.rol.nombre === 'Administrador' && rolId !== usuario.rol.id) {
                // El usuario cambia de Administrador a Cliente, establecer clienteId
                if (rolId !== '1') {  // ID 1 es el del rol de "Administrador"
                    // Verificar si el cliente ya está vinculado a otro usuario
                    const clienteVinculado = await prisma.usuario.findFirst({
                        where: { clienteId: parseInt(clienteId), NOT: { id: parseInt(id) } }
                    });

                    if (clienteVinculado) {
                        return res.status(400).render('pages/usuarios/modificar', {
                            usuario,
                            roles: await prisma.rol.findMany(),
                            clientes: await prisma.cliente.findMany(),
                            errors: [{ msg: 'Este cliente ya está vinculado a otro usuario' }]
                        });
                    }
                }
            }

            // Si se cambia el rol de "Cliente" a "Administrador", eliminar clienteId
            let updatedData = {
                email,
                nombre,
                rolId: parseInt(rolId),
                clienteId: clienteId ? parseInt(clienteId) : null
            };

            if (rolId === '1') { // Si el rol es Administrador, desvincular cliente
                updatedData.clienteId = null;
            }

            // Actualizar el usuario
            await prisma.usuario.update({
                where: { id: parseInt(id) },
                data: updatedData,
            });
        }
        req.flash('success_msg', 'Usuario actualizado exitosamente.');
        res.status(201).redirect('/usuarios');
    } catch (error) {
        console.error('Error al actualizar el usuario:', error);
        return res.status(500).render('errors/500', { layout: 'error', title: '500 - Error al actualizar el usuario' });
    } finally {
        await prisma.$disconnect(); // Cierra la conexión
    }
};

// Controlador para eliminar un usuario
exports.deleteUsuario = async (req, res) => {
    try {
        const { id } = req.params;
        await prisma.usuario.delete({ where: { id: parseInt(id) } });
        req.flash('success_msg', 'Usuario eliminado exitosamente.');
        res.status(200).redirect('/usuarios');
    } catch (error) {
        console.error('Error al eliminar el usuario:', error);
        return res.status(500).render('errors/500', { layout: 'error', title: '500 - Error al eliminar el usuario' });
    } finally {
        await prisma.$disconnect(); // Cierra la conexión
    }
};
