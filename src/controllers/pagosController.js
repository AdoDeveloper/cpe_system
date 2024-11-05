// controllers/pagosController.js

const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

// Controlador para listar los pagos de clientes
exports.listPagos = async (req, res) => {
    try {
        const pagos = await prisma.pagoCliente.findMany({
            include: {
                cliente: true,
                factura: true,
            },
            orderBy: {
                fecha_pago: 'desc',
            },
        });
        res.render('pages/pagos/listado', { pagos });
    } catch (error) {
        console.error('Error al listar los pagos de clientes:', error);
        req.flash('error_msg', 'Error al listar los pagos de clientes.');
        res.status(500).redirect('/pagosClientes');
    } finally {
        await prisma.$disconnect();
    }
};

// Controlador para ver los detalles de un pago de cliente
exports.viewPagoDetail = async (req, res) => {
    try {
        const { id } = req.params;
        const pago = await prisma.pagoCliente.findUnique({
            where: { id: parseInt(id) },
            include: {
                cliente: true,
                factura: true,
            },
        });
        if (!pago) {
            req.flash('error_msg', 'Pago no encontrado.');
            return res.redirect('/pagosClientes');
        }
        res.render('pages/pagos/detalle', { pago });
    } catch (error) {
        console.error('Error al obtener el detalle del pago de cliente:', error);
        req.flash('error_msg', 'Error al obtener el detalle del pago.');
        res.status(500).redirect('/pagosClientes');
    } finally {
        await prisma.$disconnect();
    }
};
