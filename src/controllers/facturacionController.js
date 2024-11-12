// src/controllers/facturacionController.js

const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

// Controlador para listar las facturas
exports.listFacturas = async (req, res) => {
    try {
        const facturas = await prisma.factura.findMany({
            include: {
                cliente: true,
                detalles: true
            },
            orderBy: { fecha: 'desc' },
        });

        res.render('pages/facturacion/listado', { facturas, title: 'Facturas' });
    } catch (error) {
        console.error('Error al listar las facturas:', error);
        req.flash('error_msg', 'Error al listar las facturas.');
        return res.status(500).redirect('/facturacion');
    } finally {
        await prisma.$disconnect();
    }
};

// Controlador para mostrar detalles de una factura específica en HTML
exports.viewFacturaDetails = async (req, res) => {
    try {
        const { id } = req.params;
        const factura = await prisma.factura.findUnique({
            where: { id: parseInt(id) },
            include: {
                cliente: true,
                detalles: true
            }
        });

        if (!factura) {
            return res.status(404).send('Factura no encontrada.');
        }

        res.render('pages/facturacion/detalle', { factura, layout: false }); // Renderiza la vista parcial sin el layout principal
    } catch (error) {
        console.error('Error al obtener los detalles de la factura:', error);
        req.flash('error_msg', 'Error al obtener los detalles de la factura.');
        res.status(500).send('Error al obtener los detalles de la factura.');
    } finally {
        await prisma.$disconnect();
    }
};


// Controlador para generar el pago y facturar
exports.generatePaymentAndInvoice = async (req, res) => {
    try {
        const { id } = req.params;

        // Encontrar la factura por su ID
        const factura = await prisma.factura.findUnique({
            where: { id: parseInt(id) },
            include: {
                cliente: true,
                detalles: true
            }
        });

        if (!factura) {
            req.flash('error_msg', 'Factura no encontrada.');
            return res.redirect('/facturacion');
        }

        // Verificar si la factura ya está cancelada
        if (factura.cancelada) {
            req.flash('error_msg', 'Esta factura ya ha sido cancelada.');
            return res.redirect('/facturacion');
        }

        // Actualizar el estado de la factura a cancelada
        await prisma.factura.update({
            where: { id: parseInt(id) },
            data: {
                cancelada: true,
                updatedAt: new Date()
            }
        });

        // Generar un registro en la tabla PagoCliente con la información de la factura
        await prisma.pagoCliente.create({
            data: {
                id_factura: factura.id,
                anexo: factura.numero, // Asigna el número de la factura al campo 'anexo'
                fecha_pago: new Date(),
                id_cliente: factura.cliente.id,
                alias: factura.cliente.alias,
                nombre_completo: `${factura.cliente.nombres} ${factura.cliente.apellidos}`,
                contacto: factura.cliente.telefono || '', // Ajusta si el campo de contacto existe
                total: factura.total,
                concepto: `ABONO DE FACTURACION - ${factura.cliente.alias}`, // Incluye alias del cliente
                createdAt: new Date(),
                updatedAt: new Date()
            }
        });

        req.flash('success_msg', 'Pago y facturación generados exitosamente.');
        res.status(201).redirect('/facturacion');
    } catch (error) {
        console.error('Error al generar el pago y la facturación:', error);
        req.flash('error_msg', 'Error al generar el pago y la facturación.');
        return res.status(500).redirect('/facturacion');
    } finally {
        await prisma.$disconnect();
    }
};
