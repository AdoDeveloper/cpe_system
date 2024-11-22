// src/controllers/movimientosController.js

const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

// Controlador para listar los movimientos
exports.listMovimientos = async (req, res) => {
    try {
        const movimientos = await prisma.movimiento.findMany({
            include: { cliente: true },
            orderBy: { fecha: 'desc' },
        });
        res.render('pages/movimientos/listado', { movimientos, title: 'Movimientos' });
    } catch (error) {
        console.error('Error al listar los movimientos:', error);
        req.flash('error_msg', 'Error al listar los movimientos.');
        res.status(500).redirect('/movimientos');
    } finally {
        await prisma.$disconnect();
    }
};

// Renderiza el formulario para crear un nuevo movimiento
exports.renderCreateForm = async (req, res) => {
    try {
        const cuentasContables = await prisma.cuentaContable.findMany();
        const clientes = await prisma.cliente.findMany();
        const facturas = await prisma.factura.findMany();

        const currentYear = new Date().getFullYear();
        const currentMonth = new Date().getMonth() + 1; // Enero es 0, por lo que se suma 1

        res.render('pages/movimientos/agregar', {
            cuentasContables,
            clientes,
            facturas,
            movimiento: {},
            currentYear,
            currentMonth,
            errors: [],
            title: 'Movimientos'
        });
    } catch (error) {
        console.error('Error al cargar datos para crear el movimiento:', error);
        req.flash('error_msg', 'Error al cargar datos necesarios para crear el movimiento.');
        res.status(500).redirect('/movimientos');
    } finally {
        await prisma.$disconnect();
    }
};


// Controlador para crear un nuevo movimiento
exports.createMovimiento = async (req, res) => {
    try {
        const { tipocc, anio, mes, monto, concepto, clienteId } = req.body;
        await prisma.movimiento.create({
            data: {
                tipocc,
                anio: parseInt(anio),
                mes: parseInt(mes),
                monto: parseFloat(monto),
                concepto,
                clienteId: parseInt(clienteId),
            },
        });
        req.flash('success_msg', 'Movimiento creado exitosamente.');
        res.status(201).redirect('/movimientos');
    } catch (error) {
        console.error('Error al crear el movimiento:', error);
        req.flash('error_msg', 'Error al crear el movimiento.');
        res.status(500).redirect('/movimientos');
    } finally {
        await prisma.$disconnect();
    }
};

// Renderiza el formulario para editar un movimiento existente
exports.renderEditForm = async (req, res) => {
    try {
        const { id } = req.params;
        const movimiento = await prisma.movimiento.findUnique({ where: { id: parseInt(id) } });
        if (!movimiento) {
            return res.redirect('/movimientos');
        }
        const cuentasContables = await prisma.cuentaContable.findMany();
        res.render('pages/movimientos/modificar', { action: 'edit', cuentasContables, movimiento, errors: [], title: 'Movimientos' });
    } catch (error) {
        console.error('Error al obtener el movimiento para editar:', error);
        req.flash('error_msg', 'Error al obtener el movimiento.');
        res.status(500).redirect('/movimientos');
    } finally {
        await prisma.$disconnect();
    }
};

// Controlador para actualizar un movimiento existente
exports.updateMovimiento = async (req, res) => {
    try {
        const { id } = req.params;
        const { tipocc, anio, mes, monto, concepto } = req.body;
        await prisma.movimiento.update({
            where: { id: parseInt(id) },
            data: {
                tipocc,
                anio: parseInt(anio),
                mes: parseInt(mes),
                monto: parseFloat(monto),
                concepto,
            },
        });
        req.flash('success_msg', 'Movimiento actualizado exitosamente.');
        res.status(201).redirect('/movimientos');
    } catch (error) {
        console.error('Error al actualizar el movimiento:', error);
        req.flash('error_msg', 'Error al actualizar el movimiento.');
        res.status(500).redirect('/movimientos');
    } finally {
        await prisma.$disconnect();
    }
};

// Controlador para eliminar un movimiento
exports.deleteMovimiento = async (req, res) => {
    try {
        const { id } = req.params;
        await prisma.movimiento.delete({ where: { id: parseInt(id) } });
        req.flash('success_msg', 'Movimiento eliminado exitosamente.');
        res.status(200).redirect('/movimientos');
    } catch (error) {
        console.error('Error al eliminar el movimiento:', error);
        req.flash('error_msg', 'Error al eliminar el movimiento.');
        res.status(500).redirect('/movimientos');
    } finally {
        await prisma.$disconnect();
    }
};
