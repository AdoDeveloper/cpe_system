// src/controllers/usuariosController.js

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
            orderBy: { id: 'asc' },
        });

        // Remover la contraseña de cada usuario
        const usuariosSinPassword = usuarios.map(usuario => {
            const { password, ...usuarioSinPassword } = usuario; // Extraer la contraseña y quedarnos con el resto
            return usuarioSinPassword; // Devolver el usuario sin la contraseña
        });

        // Renderizar la vista con los usuarios sin contraseña
        res.render('pages/usuarios/listado', { usuarios: usuariosSinPassword, title: 'Usuarios' });
    } catch (error) {
        console.error('Error al listar los usuarios:', error);
        req.flash('error_msg', 'Error al listar los usuarios.');
        res.status(500).redirect('/usuarios');
    } finally {
        await prisma.$disconnect();
    }
};

// Controlador para renderizar el formulario de agregar usuario
exports.renderCreateForm = async (req, res) => {
    try {
        const roles = await prisma.rol.findMany();
        const clientes = await prisma.cliente.findMany();
        res.render('pages/usuarios/agregar', { roles, clientes, usuario: {}, errors: [], title: 'Usuarios' });
    } catch (error) {
        console.error('Error al cargar el formulario de usuario:', error);
        req.flash('error_msg', 'Error al cargar el formulario de usuario.');
        res.status(500).redirect('/usuarios');
    } finally {
        await prisma.$disconnect();
    }
};

// Controlador para crear un nuevo usuario
exports.createUsuario = async (req, res) => {
    try {
        const { email, password, nombre, rolId, clienteId, activo } = req.body;

        // Verificar si el email ya existe
        const existingUser = await prisma.usuario.findUnique({ where: { email } });
        if (existingUser) {
            req.flash('error_msg', 'El correo electrónico ya está en uso.');
            return res.status(400).redirect('/usuarios/new');
        }

        // Encriptar la contraseña
        const hashedPassword = await bcrypt.hash(password, 10);

        // Obtener el rol seleccionado
        const rol = await prisma.rol.findUnique({ where: { id: parseInt(rolId) } });

        // Determinar si se debe asignar clienteId
        let clienteIdValue = null;

        if (!rol.esAdmin) {
            // Si el rol no es administrador, verificar si se proporcionó clienteId
            if (clienteId) {
                clienteIdValue = parseInt(clienteId);
            } else {
                req.flash('error_msg', 'Debe asignar un cliente para este rol.');
                return res.status(400).redirect('/usuarios/new');
            }
        }

        // Crear el usuario con los datos proporcionados, incluyendo el estado (activo)
        await prisma.usuario.create({
            data: {
                email,
                password: hashedPassword, // Contraseña encriptada
                nombre,
                rolId: parseInt(rolId),
                clienteId: clienteIdValue, // Relación con cliente si aplica
                activo: activo === 'true' // Guardar el estado como booleano
            },
        });
        req.flash('success_msg', 'Usuario creado exitosamente.');
        res.status(201).redirect('/usuarios');
    } catch (error) {
        console.error('Error al crear el usuario:', error);
        req.flash('error_msg', 'Error al crear el usuario.');
        res.status(500).redirect('/usuarios');
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
        const isAdmin = usuario.rol.esAdmin;

        res.render('pages/usuarios/modificar', { action: 'edit', usuario, roles, clientes, isAdmin, errors: [], title: 'Usuarios' });
    } catch (error) {
        console.error('Error al cargar el formulario de usuario:', error);
        req.flash('error_msg', 'Error al cargar el formulario de usuario.');
        res.status(500).redirect('/usuarios');
    } finally {
        await prisma.$disconnect();
    }
};

// Controlador para actualizar un usuario
exports.updateUsuario = async (req, res) => {
    try {
        const { id } = req.params;
        const { email, nombre, rolId, clienteId, activo, currentPassword, newPassword, confirmPassword } = req.body;

        // Buscar al usuario actual en la base de datos
        const usuario = await prisma.usuario.findUnique({ where: { id: parseInt(id) }, include: { rol: true } });

        if (!usuario) {
            req.flash('error_msg', 'Usuario no encontrado.');
            return res.status(404).redirect('/usuarios');
        }

        // Verificar si el email ya existe en otro usuario
        if (email !== usuario.email) {
            const existingUser = await prisma.usuario.findUnique({ where: { email } });
            if (existingUser) {
                req.flash('error_msg', 'El correo electrónico ya está en uso por otro usuario.');
                return res.status(400).redirect(`/usuarios/edit/${id}`);
            }
        }

        // Construir el objeto de actualización
        let updatedData = {
            email,
            nombre,
            rolId: parseInt(rolId),
            activo: activo === 'true' // Actualizar el estado
        };

        // Obtener el rol seleccionado
        const rol = await prisma.rol.findUnique({ where: { id: parseInt(rolId) } });

        // Manejo de clienteId según el rol
        if (rol.esAdmin) {
            // Si el rol es administrador, no se asigna clienteId
            updatedData.clienteId = null;
        } else {
            // Si el rol no es administrador, se debe asignar clienteId
            if (clienteId) {
                updatedData.clienteId = parseInt(clienteId);
            } else {
                req.flash('error_msg', 'Debe asignar un cliente para este rol.');
                return res.status(400).redirect(`/usuarios/edit/${id}`);
            }
        }

        // Verificar si se ingresó una nueva contraseña
        if (currentPassword && newPassword && confirmPassword) {
            // Verificar si la contraseña actual es correcta
            const isMatch = await bcrypt.compare(currentPassword, usuario.password);
            if (!isMatch) {
                req.flash('error_msg', 'La contraseña actual no es correcta.');
                return res.status(400).redirect(`/usuarios/edit/${id}`);
            }

            // Verificar si la nueva contraseña coincide con la confirmación
            if (newPassword !== confirmPassword) {
                req.flash('error_msg', 'Las contraseñas no coinciden.');
                return res.status(400).redirect(`/usuarios/edit/${id}`);
            }

            // Encriptar la nueva contraseña
            const hashedPassword = await bcrypt.hash(newPassword, 10);

            // Agregar la contraseña al objeto de actualización
            updatedData.password = hashedPassword;
        }

        // Actualizar el usuario
        await prisma.usuario.update({
            where: { id: parseInt(id) },
            data: updatedData,
        });

        req.flash('success_msg', 'Usuario actualizado exitosamente.');
        res.status(200).redirect('/usuarios');
    } catch (error) {
        console.error('Error al actualizar el usuario:', error);
        req.flash('error_msg', 'Error al actualizar el usuario.');
        return res.status(500).redirect(`/usuarios`);
    } finally {
        await prisma.$disconnect();
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
        req.flash('error_msg', 'Error al eliminar el usuario.');
        return res.status(500).redirect(`/usuarios`);
    } finally {
        await prisma.$disconnect();
    }
};
