// src/controllers/homeController.js

const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

const homeController = {};

// Renderiza el home según el rol del usuario
homeController.renderHome = async (req, res) => {
  try {
    const userId = req.session.userId;
    const userRole = req.session.userRole;

    if (!userId || !userRole) {
      req.flash('error_msg', 'Debes iniciar sesión para acceder al home.');
      return res.redirect('/login');
    }

    if (userRole === 'Cliente') {
      const cliente = await prisma.cliente.findFirst({
        where: {
          usuario: {
            id: userId,
          },
        },
        include: {
          contratos: {
            include: {
              servicios: {
                where: {
                  servicio: {
                    tipo_pago: "Recurrente",
                  },
                },
                include: {
                  servicio: true,
                },
              },
            },
          },
        },
      });

      if (!cliente) {
        req.flash('error_msg', 'No se encontró el cliente asociado.');
        return res.redirect('/login');
      }

      const hoy = new Date();
      const primerDiaMes = new Date(hoy.getFullYear(), hoy.getMonth(), 1);
      const ultimoDiaMes = new Date(hoy.getFullYear(), hoy.getMonth() + 1, 0);

      const facturaActual = await prisma.factura.findFirst({
        where: {
          clienteId: cliente.id,
          fecha: {
            gte: primerDiaMes,
            lte: ultimoDiaMes,
          },
        },
        orderBy: { fecha: 'desc' },
      });

      const facturaPagada = facturaActual ? facturaActual.cancelada : false;
      const fechaPago = facturaActual ? facturaActual.fecha : null;

      let diasFaltantes = null;
      let mensaje = '';

      if (fechaPago) {
        const diffTime = fechaPago - hoy;
        diasFaltantes = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

        if (fechaPago < hoy && !facturaPagada) {
          if (diasFaltantes <= -3) {
            mensaje = `Llevas ${Math.abs(diasFaltantes)} días de retraso. Tu servicio ha sido suspendido.`;
          } else {
            mensaje = `Llevas ${Math.abs(diasFaltantes)} días de retraso. Los servicios se suspenderán automáticamente luego de 3 días sin realizar el pago.`;
          }
        } else if (fechaPago < hoy && facturaPagada) {
          const proxFechaPago = new Date(fechaPago);
          proxFechaPago.setMonth(proxFechaPago.getMonth() + 1);
          const diffProxPago = proxFechaPago - hoy;
          const diasHastaProxPago = Math.ceil(diffProxPago / (1000 * 60 * 60 * 24));
          mensaje = `Has pagado tu factura. Faltan ${diasHastaProxPago} días para la próxima fecha de pago.`;
          diasFaltantes = diasHastaProxPago;
        } else {
          mensaje = `Faltan ${diasFaltantes} días para el vencimiento del pago de tu factura.`;
        }
      }

      const contratosInfo = cliente.contratos.flatMap((contrato) => {
        return contrato.servicios.map((cs) => {
          let estadoPago = '';
          let mensajeFinal = '';

          let formattedFechaPago = 'N/A';
          if (fechaPago) {
            // Si la fecha de pago ya pasó, se muestra la fecha del siguiente mes
            if (fechaPago < hoy) {
              const proxFechaPago = new Date(fechaPago);
              proxFechaPago.setMonth(proxFechaPago.getMonth() + 1);
              formattedFechaPago = proxFechaPago.toLocaleDateString('es-ES', {
                year: 'numeric',
                month: 'long',
                day: 'numeric',
              });
            } else {
              // Si no ha pasado, mostrar la fecha actual
              formattedFechaPago = fechaPago.toLocaleDateString('es-ES', {
                year: 'numeric',
                month: 'long',
                day: 'numeric',
              });
            }
          }

          if (fechaPago) {
            if (fechaPago < hoy && !facturaPagada) {
              estadoPago = 'pendiente';
              mensajeFinal = mensaje;
            } else if (fechaPago < hoy && facturaPagada) {
              estadoPago = 'pagada';
              mensajeFinal = mensaje;
            } else {
              estadoPago = 'proximo';
              mensajeFinal = mensaje;
            }
          }

          return {
            contratoId: contrato.id,
            servicio: cs.servicio.servicio,
            precio: cs.servicio.precio,
            descripcion: cs.servicio.descripcion,
            fechaPago,
            formattedFechaPago, // Aquí ya se pasa la fecha correctamente formateada
            diasFaltantes,
            estadoPago,
            mensaje: mensajeFinal,
          };
        });
      });

      // Calcular el total mensual de servicios recurrentes
      const totalMensual = contratosInfo.reduce((acc, servicio) => acc + servicio.precio, 0);

      const estadosGrafico = {
        pagados: contratosInfo.filter((c) => c.estadoPago === 'pagada').length,
        pendientes: contratosInfo.filter((c) => c.estadoPago === 'pendiente').length,
      };

      const videos = [
        {
          titulo: 'Video Promocional 1',
          descripcion: 'Servicio de internet de 8 Mbps',
          url: 'https://res.cloudinary.com/dldgicsdi/video/upload/f_auto:video,q_auto/v1/home/1_u7vlph',
        },
        {
          titulo: 'Video Promocional 2',
          descripcion: 'Servicio de internet de 3 Mbps',
          url: 'https://res.cloudinary.com/dldgicsdi/video/upload/f_auto:video,q_auto/v1/home/2_mbm8zg',
        },
        {
          titulo: 'Video Promocional 3',
          descripcion: 'Servicio de canales IPTV',
          url: 'https://res.cloudinary.com/dldgicsdi/video/upload/f_auto:video,q_auto/v1/home/3_xcojpe',
        },
      ];

      const banners = videos.map((video, index) => ({
        titulo: video.titulo,
        descripcion: video.descripcion,
        contenido: `
          <video class="d-block w-100" autoplay loop muted>
            <source src="${video.url}" type="video/mp4">
            Tu navegador no soporta el elemento de video.
          </video>
        `,
        active: index === 0,
      }));

      const usuario = await prisma.usuario.findUnique({
        where: { id: userId },
        select: { nombre: true },
      });

      res.render('pages/home/home', {
        title: 'Home',
        contratosInfo,
        totalMensual,
        estadosGrafico,
        banners,
        user: { nombre: usuario.nombre },
      });
    } else {
      res.render('pages/home/home', { title: 'Home Airlink' });
    }
  } catch (error) {
    console.error('Error al renderizar el home:', error);
    req.flash('error_msg', 'Error al cargar el home.');
    res.redirect('/');
  }
};

module.exports = homeController;
