// Importaciones necesarias
const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();
const { check, validationResult } = require('express-validator');

// Validaciones antes de crear política
exports.validateCreatePolitica = [
    check('titulo')
        .notEmpty().withMessage('El título es obligatorio.')
        .isLength({ max: 100 }).withMessage('El título no debe exceder los 100 caracteres.'),
    check('contenido')
        .notEmpty().withMessage('El contenido es obligatorio.')
];

// Validaciones antes de actualizar política
exports.validateUpdatePolitica = [
    check('titulo')
        .notEmpty().withMessage('El título es obligatorio.')
        .isLength({ max: 100 }).withMessage('El título no debe exceder los 100 caracteres.'),
    check('contenido')
        .notEmpty().withMessage('El contenido es obligatorio.')
];

// Controlador para listar todas las políticas
exports.listPoliticas = async (req, res) => {
    try {
        const politicas = await prisma.politica.findMany({
            orderBy: { id: 'asc' },
        }); // Obtener todas las políticas
        res.render('pages/politicas/listado', { politicas, title: 'Políticas' });
    } catch (error) {
        console.error('Error al listar las políticas:', error);
        req.flash('error_msg', 'Error al listar las políticas.');
        return res.status(500).redirect('/politicas');
    } finally {
        await prisma.$disconnect();
    }
};

// Renderiza el formulario para crear una nueva política
exports.renderCreateForm = (req, res) => {
    res.render('pages/politicas/agregar', { action: 'new', politica: {}, errors: [], title: 'Agregar Política' });
};

// Controlador para crear una nueva política
exports.createPolitica = async (req, res) => {
    const errors = validationResult(req); // Verificar si hay errores de validación
    if (!errors.isEmpty()) {
        // Unir los mensajes de error con '<br>' para saltos de línea
        const errorMessages = errors.array().map(err => err.msg).join('<br>');
        req.flash('error_msg', errorMessages);
        return res.redirect('/politicas/new');
    }

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
            req.flash('error_msg', 'Política no encontrada.');
            return res.redirect('/politicas');
        }
        res.render('pages/politicas/modificar', { action: 'edit', politica, errors: [], title: 'Editar Política' });
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
    const errors = validationResult(req); // Verificar si hay errores de validación
    const { id } = req.params;

    if (!errors.isEmpty()) {
        // Unir los mensajes de error con '<br>' para saltos de línea
        const errorMessages = errors.array().map(err => err.msg).join('<br>');
        req.flash('error_msg', errorMessages);
        return res.redirect(`/politicas/edit/${id}`);
    }

    try {
        const { titulo, contenido } = req.body;

        await prisma.politica.update({
            where: { id: parseInt(id) },
            data: {
                titulo,
                contenido,
            },
        });

        req.flash('success_msg', 'Política actualizada exitosamente.');
        res.status(200).redirect('/politicas');
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