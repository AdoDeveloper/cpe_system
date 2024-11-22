// src/controllers/costosController.js

const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

// Validar datos de un costo fijo
const validateCostoFijo = (data) => {
    const errors = [];
    const { nombre, monto, fechaInicio, fechaFin } = data;

    if (!nombre || nombre.trim().length === 0) errors.push('El nombre es obligatorio.');
    if (!monto || isNaN(monto) || monto <= 0) errors.push('El monto debe ser un número positivo.');
    if (!fechaInicio || isNaN(Date.parse(fechaInicio))) errors.push('La fecha de inicio es obligatoria y debe ser válida.');
    if (fechaFin && isNaN(Date.parse(fechaFin))) errors.push('La fecha de fin debe ser válida.');
    if (fechaInicio && fechaFin && new Date(fechaInicio) > new Date(fechaFin)) {
        errors.push('La fecha de inicio no puede ser mayor que la fecha de fin.');
    }

    return errors;
};

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
    const { nombre, descripcion, monto, fechaInicio, fechaFin } = req.body;
    const errors = validateCostoFijo({ nombre, monto: parseFloat(monto), fechaInicio, fechaFin });

    if (errors.length > 0) {
        return res.render('pages/costos/agregar', {
            action: 'new',
            costoFijo: req.body,
            errors,
            title: 'Costos Fijos',
        });
    }

    try {
        await prisma.costoFijo.create({
            data: {
                nombre,
                descripcion,
                monto: parseFloat(monto),
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
    const { nombre, descripcion, monto, fechaInicio, fechaFin } = req.body;

    const idError = validateId(id);
    if (idError) {
        req.flash('error_msg', idError);
        return res.redirect('/costos');
    }

    const errors = validateCostoFijo({ nombre, monto: parseFloat(monto), fechaInicio, fechaFin });

    if (errors.length > 0) {
        return res.render('pages/costos/modificar', {
            action: 'edit',
            costoFijo: { id, ...req.body },
            errors,
            title: 'Costos Fijos',
        });
    }

    try {
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
