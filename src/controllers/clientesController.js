// Importaciones necesarias
const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();
const { check, validationResult } = require('express-validator');

// Validaciones antes de actualizar cliente
exports.validateUpdateCliente = [
    check('nombres')
        .notEmpty().withMessage('El nombre es obligatorio.')
        .isLength({ max: 50 }).withMessage('El nombre no debe exceder los 50 caracteres.'),
    check('apellidos')
        .notEmpty().withMessage('Los apellidos son obligatorios.')
        .isLength({ max: 50 }).withMessage('Los apellidos no deben exceder los 50 caracteres.'),
    check('alias')
        .notEmpty().withMessage('El alias es obligatorio.')
        .isLength({ max: 30 }).withMessage('El alias no debe exceder los 30 caracteres.'),
    check('telefono')
        .notEmpty().withMessage('El teléfono es obligatorio.')
        .isNumeric().withMessage('El teléfono debe ser numérico.')
        .isLength({ min: 8, max: 15 }).withMessage('El teléfono debe tener entre 8 y 15 dígitos.'),
    check('correo')
        .optional({ checkFalsy: true })
        .isEmail().withMessage('El correo electrónico no es válido.')
        .normalizeEmail(),
    check('dui')
        .notEmpty().withMessage('El DUI es obligatorio.')
        .matches(/^\d{8}-\d$/).withMessage('El DUI debe tener el formato ########-#.')
        .isLength({ min: 10, max: 10 }).withMessage('El DUI debe tener 10 caracteres.'),
];

// Validaciones antes de crear cliente
exports.validateCreateCliente = [
    check('nombres')
        .notEmpty().withMessage('El nombre es obligatorio.')
        .isLength({ max: 50 }).withMessage('El nombre no debe exceder los 50 caracteres.'),
    check('apellidos')
        .notEmpty().withMessage('Los apellidos son obligatorios.')
        .isLength({ max: 50 }).withMessage('Los apellidos no deben exceder los 50 caracteres.'),
    check('alias')
        .notEmpty().withMessage('El alias es obligatorio.')
        .isLength({ max: 30 }).withMessage('El alias no debe exceder los 30 caracteres.'),
    check('telefono')
        .notEmpty().withMessage('El teléfono es obligatorio.')
        .isNumeric().withMessage('El teléfono debe ser numérico.')
        .isLength({ min: 8, max: 15 }).withMessage('El teléfono debe tener entre 8 y 15 dígitos.'),
    check('correo')
        .optional({ checkFalsy: true })
        .isEmail().withMessage('El correo electrónico no es válido.')
        .normalizeEmail(),
    check('dui')
        .notEmpty().withMessage('El DUI es obligatorio.')
        .matches(/^\d{8}-\d$/).withMessage('El DUI debe tener el formato ########-#.')
        .isLength({ min: 10, max: 10 }).withMessage('El DUI debe tener 10 caracteres.'),
];

// Controlador para listar los clientes
exports.listClientes = async (req, res) => {
    try {
        const clientes = await prisma.cliente.findMany({
            orderBy: [
                { id: 'asc' },
                { nombres: 'asc' },
            ],
        });

        res.render('pages/clientes/listado', { clientes, title: 'Clientes' });
    } catch (error) {
        console.error('Error al listar los clientes:', error);
        req.flash('error_msg', 'Error al listar los clientes.');
        return res.status(500).redirect('/clientes');
    } finally {
        await prisma.$disconnect();
    }
};

// Renderiza el formulario para crear un nuevo cliente
exports.renderCreateForm = (req, res) => {
    res.render('pages/clientes/agregar', { action: 'new', cliente: {}, errors: [], title: 'Agregar Cliente' });
};

// Controlador para crear un nuevo cliente
exports.createCliente = async (req, res) => {
    const errors = validationResult(req); // Verificar si hay errores de validación
    if (!errors.isEmpty()) {
        // Unir los mensajes de error con '<br>' para saltos de línea
        const errorMessages = errors.array().map(err => err.msg).join('<br>');
        req.flash('error_msg', errorMessages);
        return res.redirect('/clientes/new');
    }

    try {
        const { nombres, apellidos, alias, telefono, correo, dui } = req.body;

        await prisma.cliente.create({
            data: {
                nombres,
                apellidos,
                alias,
                telefono,
                correo,
                dui,
            }
        });

        req.flash('success_msg', 'Cliente creado exitosamente.');
        res.status(201).redirect('/clientes');
    } catch (error) {
        console.error('Error al crear el cliente:', error);
        req.flash('error_msg', 'Error al crear el cliente.');
        return res.status(500).redirect('/clientes');
    } finally {
        await prisma.$disconnect();
    }
};

// Renderiza el formulario para editar un cliente existente
exports.renderEditForm = async (req, res) => {
    try {
        const { id } = req.params;
        const cliente = await prisma.cliente.findUnique({ where: { id: parseInt(id) } });
        if (!cliente) {
            req.flash('error_msg', 'Cliente no encontrado.');
            return res.redirect('/clientes');
        }
        res.render('pages/clientes/modificar', { action: 'edit', cliente, errors: [], title: 'Editar Cliente' });
    } catch (error) {
        console.error('Error al obtener el cliente para editar:', error);
        req.flash('error_msg', 'Error al obtener el cliente para editar.');
        return res.status(500).redirect('/clientes');
    } finally {
        await prisma.$disconnect();
    }
};

// Controlador para actualizar un cliente existente
exports.updateCliente = async (req, res) => {
    const errors = validationResult(req); // Verificar si hay errores de validación
    const { id } = req.params;

    if (!errors.isEmpty()) {
        // Unir los mensajes de error con '<br>' para saltos de línea
        const errorMessages = errors.array().map(err => err.msg).join('<br>');
        req.flash('error_msg', errorMessages);
        return res.redirect(`/clientes/edit/${id}`);
    }

    try {
        const { nombres, apellidos, alias, telefono, correo, dui } = req.body;

        await prisma.cliente.update({
            where: { id: parseInt(id) },
            data: {
                nombres,
                apellidos,
                alias,
                telefono,
                correo,
                dui
            }
        });

        req.flash('success_msg', 'Cliente actualizado exitosamente.');
        res.status(200).redirect('/clientes');
    } catch (error) {
        console.error('Error al actualizar el cliente:', error);
        req.flash('error_msg', 'Error al actualizar el cliente.');
        return res.status(500).redirect('/clientes');
    } finally {
        await prisma.$disconnect();
    }
};

// Controlador para eliminar un cliente
exports.deleteCliente = async (req, res) => {
    try {
        const { id } = req.params;

        // Verificar si el cliente tiene relaciones que impiden su eliminación
        const contratos = await prisma.contrato.findMany({
            where: { clienteId: parseInt(id) }
        });

        const pagos = await prisma.pagoCliente.findMany({
            where: { id_cliente: parseInt(id) }
        });

        const configuraciones = await prisma.configCPE.findMany({
            where: { clienteId: parseInt(id) }
        });

        if (contratos.length > 0 || pagos.length > 0 || configuraciones.length > 0) {
            req.flash('error_msg', 'No se puede eliminar el cliente porque tiene contratos, pagos o configuraciones asociadas.');
            return res.status(400).redirect('/clientes');
        }

        await prisma.cliente.delete({ where: { id: parseInt(id) } });
        req.flash('success_msg', 'Cliente eliminado exitosamente.');
        res.status(200).redirect('/clientes');
    } catch (error) {
        console.error('Error al eliminar el cliente:', error);
        req.flash('error_msg', 'Error al eliminar el cliente.');
        return res.status(500).redirect('/clientes');
    } finally {
        await prisma.$disconnect();
    }
};