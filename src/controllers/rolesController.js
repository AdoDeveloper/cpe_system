const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

// Controlador para listar roles
exports.listRoles = async (req, res) => {
    try {
        const roles = await prisma.rol.findMany();
        res.render('pages/roles/listado', { roles });
    } catch (error) {
        console.error('Error al listar los roles:', error);
        res.status(500).send('Error al listar los roles');
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
        res.status(500).send('Error al crear el rol');
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
        res.status(500).send('Error al eliminar el rol');
    } finally {
        await prisma.$disconnect(); // Cierra la conexión
    }
};
