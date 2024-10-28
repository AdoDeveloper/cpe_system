const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

// Controlador para generar facturas automáticamente
exports.generarFacturas = async (req, res) => {
  try {
    // Obtener los contratos activos y los datos de clientes
    const contratos = await prisma.contrato.findMany({
      where: { activo: true },
      include: {
        cliente: true,
        servicios: {
          include: { servicio: true },
        },
      },
    });

    // Recorrer cada contrato para generar facturas
    for (const contrato of contratos) {
      const fechaPago = new Date(); // Cambia la fecha para pruebas
      const total = contrato.servicios.reduce((acc, serv) => acc + serv.servicio.precio, 0);

      // Crear factura
      await prisma.factura.create({
        data: {
          clienteId: contrato.clienteId,
          fecha: fechaPago,
          total,
          observacion: 'Generación automática de factura',
          detalles: {
            create: contrato.servicios.map((serv) => ({
              cantidad: 1,
              concepto: serv.servicio.servicio,
              subtotal: serv.servicio.precio,
            })),
          },
        },
      });

      console.log(`Factura generada para el cliente ${contrato.cliente.nombres} ${contrato.cliente.apellidos}`);
    }

    if (res) {
      res.status(201).send('Facturas generadas automáticamente.');
    } else {
      console.log('Facturas generadas automáticamente.');
    }
  } catch (error) {
    console.error('Error al generar facturas automáticamente:', error);
    if (res) {
      res.status(500).send('Error al generar facturas.');
    }
  } finally {
    await prisma.$disconnect();
  }
};
