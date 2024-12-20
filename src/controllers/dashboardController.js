// src/controllers/dashboardController.js

const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();
const moment = require('moment');

exports.renderDashboard = async (req, res) => {
  const userId = req.session.userId;
  const userRole = req.session.userRole;

  try {
    if (userRole === 'Administrador') {
      // Obtener el año y mes actuales
      const currentYear = moment().year();
      const currentMonth = moment().month() + 1; // Los meses en moment van de 0 a 11

      // **1. Caja Principal**
      // Calculamos totalIngresos y totalEgresos utilizando la sintaxis de Prisma

      // Total Ingresos (tipocc = 'CCI')
      const totalIngresosResult = await prisma.movimiento.aggregate({
        where: {
          tipocc: 'CCI',
          anio: currentYear,
          mes: currentMonth,
        },
        _sum: {
          monto: true,
        },
      });
      const totalIngresos = totalIngresosResult._sum.monto || 0;

      // Total Egresos (tipocc in ['CCC', 'CCCxP', 'CCG', 'CCPR', 'CCF'])
      const totalEgresosResult = await prisma.movimiento.aggregate({
        where: {
          tipocc: { in: ['CCC', 'CCCxP', 'CCG', 'CCPR', 'CCF'] },
          anio: currentYear,
          mes: currentMonth,
        },
        _sum: {
          monto: true,
        },
      });
      const totalEgresos = totalEgresosResult._sum.monto || 0;

      const cajaPrincipalTotal = totalIngresos - totalEgresos;

      // **2. Facturación Actual (Facturas canceladas)**
      // Sumamos los subtotales de los detalles de facturas canceladas del mes actual

      const facturacionActualResult = await prisma.detalleFactura.aggregate({
        where: {
          factura: {
            cancelada: true,
            fecha: {
              gte: moment().startOf('month').toDate(),
              lte: moment().endOf('month').toDate(),
            },
          },
        },
        _sum: {
          subtotal: true,
        },
      });
      const facturacionActualTotal = facturacionActualResult._sum.subtotal || 0;

      // **3. Por Facturar (Facturas no canceladas)**

      const porFacturasResult = await prisma.detalleFactura.aggregate({
        where: {
          factura: {
            cancelada: false,
            fecha: {
              gte: moment().startOf('month').toDate(),
              lte: moment().endOf('month').toDate(),
            },
          },
        },
        _sum: {
          subtotal: true,
        },
      });
      const porFacturasTotal = porFacturasResult._sum.subtotal || 0;

      // **4. Datos para Gráficos**
      // Obtener datos de movimientos del último año utilizando 'createdAt' en lugar de 'fecha'

      const metricsData = await prisma.movimiento.findMany({
        where: {
          createdAt: {
            gte: moment().subtract(1, 'year').startOf('month').toDate(),
            lte: moment().endOf('month').toDate(),
          },
        },
        select: {
          createdAt: true, // Cambiado de 'fecha' a 'createdAt'
          monto: true,
          tipocc: true,
        },
      });

      // **5. Datos para Mapbox**
      // Obtener configuraciones de CPE de clientes con contratos activos

      const configuraciones = await prisma.configCPE.findMany({
        where: {
          cliente: {
            contratos: {
              some: {
                activo: true,
              },
            },
          },
        },
        include: {
          cliente: true,
        },
      });

      // Renderizar la vista del dashboard para Administrador
      res.render('pages/dashboard/dashboard', {
        user: { rol: userRole },
        cajaPrincipalTotal: cajaPrincipalTotal.toFixed(2),
        facturacionActualTotal: facturacionActualTotal.toFixed(2),
        porFacturasTotal: porFacturasTotal.toFixed(2),
        metricsData,
        configuraciones,
        mapboxAccessToken: process.env.MAPBOX_ACCESS_TOKEN,
        title: 'Admin Dashboard'
      });
    } else {
      // Para otros roles (Técnico, Instalador, Soporte Técnico, Cliente)
      // Obtener tickets asignados al usuario
      const ticketsAsignados = await prisma.ticket.findMany({
        where: {
          resolverId: userId,
        },
        include: {
          mensajes: true,
        },
        orderBy: {
          createdAt: 'desc',
        },
      });

      // Calcular tiempo de resolución para cada ticket
      const ticketsConTiempo = ticketsAsignados.map((ticket) => {
        let tiempoResolucion = 0;
        if (ticket.estado === 'completado') {
          tiempoResolucion = ticket.updatedAt - ticket.createdAt;
        }
        return {
          ...ticket,
          tiempoResolucion,
        };
      });

      // Renderizar la vista del Dashboard
      res.render('pages/dashboard/dashboard', {
        user: { id: userId, rol: userRole }, // Información del usuario
        ticketsConTiempo, // Datos adicionales para la vista
        title: `${userRole}` // Incluir el rol en el título
      });
    }
  } catch (error) {
    console.error('Error al renderizar el dashboard:', error);
    req.flash('error_msg', 'Ocurrió un error al cargar el dashboard.');
    res.redirect('/login');
  } finally {
    await prisma.$disconnect();
  }
};