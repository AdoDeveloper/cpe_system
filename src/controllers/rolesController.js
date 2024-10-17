const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

// Controlador para listar roles
exports.listRoles = async (req, res) => {
    try {
        const roles = await prisma.rol.findMany();
        res.render('pages/roles/listado', { roles });
    } catch (error) {
        console.error('Error al listar los roles:', error);
        req.flash('error_msg', 'Error al listar los roles.'); // Guardar el mensaje de error flash
        res.status(500).redirect('/servicios'); // Redirigir a la página de roles
    } finally {
        await prisma.$disconnect(); // Cierra la conexión
    }
};

// Controlador para agregar rol
exports.createRol = async (req, res) => {
    try {
        const { nombre } = req.body;
        await prisma.rol.create({ data: { nombre } });
        res.redirect('/roles');
    } catch (error) {
        console.error('Error al crear el rol:', error);
        req.flash('error_msg', 'Error al crear el rol.'); // Guardar el mensaje de error flash
        res.status(500).redirect('/servicios'); // Redirigir a la página de roles
    } finally {
        await prisma.$disconnect(); // Cierra la conexión
    }
};

// Controlador para eliminar un rol
exports.deleteRol = async (req, res) => {
    try {
        const { id } = req.params;
        await prisma.rol.delete({ where: { id: parseInt(id) } });
        res.redirect('/roles');
    } catch (error) {
        console.error('Error al eliminar el rol:', error);
        req.flash('error_msg', 'Error al eliminar el rol.'); // Guardar el mensaje de error flash
        res.status(500).redirect('/servicios'); // Redirigir a la página de roles
    } finally {
        await prisma.$disconnect(); // Cierra la conexión
    }
};