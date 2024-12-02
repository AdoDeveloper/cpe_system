// src/controllers/costosController.js

const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();
const { check, validationResult } = require('express-validator');

// Validaciones antes de crear costo fijo
exports.validateCreateCostoFijo = [
    check('nombre')
        .notEmpty().withMessage('El nombre es obligatorio.')
        .isLength({ max: 100 }).withMessage('El nombre no debe exceder los 100 caracteres.'),
    check('monto')
        .notEmpty().withMessage('El monto es obligatorio.')
        .isNumeric().withMessage('El monto debe ser un número.')
        .custom(value => value > 0).withMessage('El monto debe ser mayor a 0.'),
    check('fechaInicio')
        .notEmpty().withMessage('La fecha de inicio es obligatoria.'),
    check('fechaFin')
        .optional(),
    check('fechaInicio').custom((value, { req }) => {
        if (req.body.fechaFin && new Date(value) > new Date(req.body.fechaFin)) {
            throw new Error('La fecha de inicio no puede ser mayor que la fecha de fin.');
        }
        return true;
    }),
    check('estado')
        .notEmpty().withMessage('El estado es obligatorio.')
        .isIn(['true', 'false']).withMessage('El estado debe ser "true" o "false".'),
];

// Validaciones antes de actualizar costo fijo
exports.validateUpdateCostoFijo = [
    check('nombre')
        .notEmpty().withMessage('El nombre es obligatorio.')
        .isLength({ max: 100 }).withMessage('El nombre no debe exceder los 100 caracteres.'),
    check('monto')
        .notEmpty().withMessage('El monto es obligatorio.')
        .isNumeric().withMessage('El monto debe ser un número.')
        .custom(value => value > 0).withMessage('El monto debe ser mayor a 0.'),
    check('fechaInicio')
        .notEmpty().withMessage('La fecha de inicio es obligatoria.'),
    check('fechaFin')
        .optional(),
    check('fechaInicio').custom((value, { req }) => {
        if (req.body.fechaFin && new Date(value) > new Date(req.body.fechaFin)) {
            throw new Error('La fecha de inicio no puede ser mayor que la fecha de fin.');
        }
        return true;
    }),
    check('estado')
        .notEmpty().withMessage('El estado es obligatorio.')
        .isIn(['true', 'false']).withMessage('El estado debe ser "true" o "false".'),
];

// Validar ID
const validateId = (id) => {
    if (!id || isNaN(parseInt(id))) {
        return 'El ID proporcionado no es válido.';
    }
    return null;
};

// Controlador para listar los costos fijos
exports.listCostosFijos = async (req, res) => {
    try {
        const costosFijos = await prisma.costoFijo.findMany({
            orderBy: { id: 'asc' },
        });
        res.render('pages/costos/listado', { costosFijos, title: 'Costos Fijos' });
    } catch (error) {
        console.error('Error al listar los costos fijos:', error);
        req.flash('error_msg', 'Error al listar los costos fijos.');
        return res.status(500).redirect('/costos');
    } finally {
        await prisma.$disconnect();
    }
};

// Renderiza el formulario para crear un nuevo costo fijo
exports.renderCreateForm = (req, res) => {
    res.render('pages/costos/agregar', { action: 'new', costoFijo: {}, errors: [], title: 'Costos Fijos' });
};

// Controlador para crear un nuevo costo fijo
exports.createCostoFijo = async (req, res) => {
    const errors = validationResult(req); // Verificar si hay errores de validación
    if (!errors.isEmpty()) {
        // Unir los mensajes de error con '<br>' para saltos de línea
        const errorMessages = errors.array().map(err => err.msg).join('<br>');
        req.flash('error_msg', errorMessages);
        return res.redirect('/costos/new'); // Redirigir al formulario de nuevo
    }

    try {
        const { nombre, descripcion, monto, estado, fechaInicio, fechaFin } = req.body;

        await prisma.costoFijo.create({
            data: {
                nombre,
                descripcion,
                monto: parseFloat(monto),
                estado: estado === 'true',
                fechaInicio: new Date(fechaInicio),
                fechaFin: fechaFin ? new Date(fechaFin) : null,
            },
        });

        req.flash('success_msg', 'Costo fijo creado exitosamente.');
        res.status(201).redirect('/costos');
    } catch (error) {
        console.error('Error al crear el costo fijo:', error);
        req.flash('error_msg', 'Error al crear el costo fijo.');
        return res.status(500).redirect('/costos');
    } finally {
        await prisma.$disconnect();
    }
};

// Renderiza el formulario para editar un costo fijo existente
exports.renderEditForm = async (req, res) => {
    try {
        const { id } = req.params;

        const idError = validateId(id);
        if (idError) {
            req.flash('error_msg', idError);
            return res.redirect('/costos');
        }

        const costoFijo = await prisma.costoFijo.findUnique({ where: { id: parseInt(id) } });

        if (!costoFijo) {
            req.flash('error_msg', 'El costo fijo no existe.');
            return res.redirect('/costos');
        }

        res.render('pages/costos/modificar', {
            action: 'edit',
            costoFijo,
            errors: [],
            title: 'Costos Fijos',
        });
    } catch (error) {
        console.error('Error al obtener el costo fijo para editar:', error);
        req.flash('error_msg', 'Error al obtener el costo fijo.');
        return res.status(500).redirect('/costos');
    } finally {
        await prisma.$disconnect();
    }
};

// Controlador para actualizar un costo fijo existente
exports.updateCostoFijo = async (req, res) => {
    const { id } = req.params;

    const idError = validateId(id);
    if (idError) {
        req.flash('error_msg', idError);
        return res.redirect('/costos');
    }

    const errors = validationResult(req); // Verificar si hay errores de validación
    if (!errors.isEmpty()) {
        // Unir los mensajes de error con '<br>' para saltos de línea
        const errorMessages = errors.array().map(err => err.msg).join('<br>');
        req.flash('error_msg', errorMessages);
        return res.redirect(`/costos/edit/${id}`); // Redirigir al formulario de edición
    }

    try {
        const { nombre, descripcion, monto, estado, fechaInicio, fechaFin } = req.body;

        const existingCostoFijo = await prisma.costoFijo.findUnique({ where: { id: parseInt(id) } });
        if (!existingCostoFijo) {
            req.flash('error_msg', 'El costo fijo no existe.');
            return res.redirect('/costos');
        }

        await prisma.costoFijo.update({
            where: { id: parseInt(id) },
            data: {
                nombre,
                descripcion,
                monto: parseFloat(monto),
                estado: estado === 'true',
                fechaInicio: new Date(fechaInicio),
                fechaFin: fechaFin ? new Date(fechaFin) : null,
            },
        });

        req.flash('success_msg', 'Costo fijo actualizado exitosamente.');
        res.status(201).redirect('/costos');
    } catch (error) {
        console.error('Error al actualizar el costo fijo:', error);
        req.flash('error_msg', 'Error al actualizar el costo fijo.');
        return res.status(500).redirect('/costos');
    } finally {
        await prisma.$disconnect();
    }
};

// Controlador para eliminar un costo fijo
exports.deleteCostoFijo = async (req, res) => {
    try {
        const { id } = req.params;

        const idError = validateId(id);
        if (idError) {
            req.flash('error_msg', idError);
            return res.redirect('/costos');
        }

        await prisma.costoFijo.delete({ where: { id: parseInt(id) } });

        req.flash('success_msg', 'Costo fijo eliminado exitosamente.');
        res.status(200).redirect('/costos');
    } catch (error) {
        console.error('Error al eliminar el costo fijo:', error);
        req.flash('error_msg', 'Error al eliminar el costo fijo.');
        return res.status(500).redirect('/costos');
    } finally {
        await prisma.$disconnect();
    }
};