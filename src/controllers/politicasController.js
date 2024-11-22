// src/controllers/politicasController.js

const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

// Controlador para listar todas las políticas
exports.listPoliticas = async (req, res) => {
    try {
        const politicas = await prisma.politica.findMany({
            orderBy: { id: 'asc' },
        }); // Obtener todas las políticas
        res.render('pages/politicas/listado', { politicas, title: 'Politicas' });
    } catch (error) {
        console.error('Error al listar las políticas:', error);
        req.flash('error_msg', 'Error al listar las políticas.');
        return res.status(500).redirect('/politicas');
    } finally {
        await prisma.$disconnect();
    }
};

// Renderiza el formulario para crear una nueva política
exports.renderCreateForm = async (req, res) => {
    try {
        res.render('pages/politicas/agregar', { politica: {}, errors: [], title: 'Politicas' });
    } catch (error) {
        console.error('Error al cargar el formulario de creación:', error);
        req.flash('error_msg', 'Error al cargar el formulario.');
        return res.status(500).redirect('/politicas');
    }
};

// Controlador para crear una nueva política
exports.createPolitica = async (req, res) => {
    try {
        const { titulo, contenido } = req.body;

        await prisma.politica.create({
            data: {
                titulo,
                contenido,
            },
        });

        req.flash('success_msg', 'Política creada exitosamente.');
        res.status(201).redirect('/politicas');
    } catch (error) {
        console.error('Error al crear la política:', error);
        req.flash('error_msg', 'Error al crear la política.');
        return res.status(500).redirect('/politicas');
    } finally {
        await prisma.$disconnect();
    }
};

// Renderiza el formulario para editar una política existente
exports.renderEditForm = async (req, res) => {
    try {
        const { id } = req.params;
        const politica = await prisma.politica.findUnique({ where: { id: parseInt(id) } });
        if (!politica) {
            return res.redirect('/politicas');
        }
        res.render('pages/politicas/modificar', { action: 'edit', politica, errors: [], title: 'Politicas' });
    } catch (error) {
        console.error('Error al obtener la política para editar:', error);
        req.flash('error_msg', 'Error al obtener la política.');
        return res.status(500).redirect('/politicas');
    } finally {
        await prisma.$disconnect();
    }
};

// Controlador para actualizar una política existente
exports.updatePolitica = async (req, res) => {
    try {
        const { id } = req.params;
        const { titulo, contenido } = req.body;

        await prisma.politica.update({
            where: { id: parseInt(id) },
            data: {
                titulo,
                contenido,
            },
        });

        req.flash('success_msg', 'Política actualizada exitosamente.');
        res.status(201).redirect('/politicas');
    } catch (error) {
        console.error('Error al actualizar la política:', error);
        req.flash('error_msg', 'Error al actualizar la política.');
        return res.status(500).redirect('/politicas');
    } finally {
        await prisma.$disconnect();
    }
};

// Controlador para eliminar una política
exports.deletePolitica = async (req, res) => {
    try {
        const { id } = req.params;
        await prisma.politica.delete({ where: { id: parseInt(id) } });
        req.flash('success_msg', 'Política eliminada exitosamente.');
        res.status(200).redirect('/politicas');
    } catch (error) {
        console.error('Error al eliminar la política:', error);
        req.flash('error_msg', 'Error al eliminar la política.');
        return res.status(500).redirect('/politicas');
    } finally {
        await prisma.$disconnect();
    }
};
