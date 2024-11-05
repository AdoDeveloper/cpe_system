// controllers/notificacionesController.js
const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

// Función para obtener y limpiar notificaciones obsoletas
exports.obtenerNotificaciones = async (userId) => {
  try {
    const notificaciones = await prisma.notificacion.findMany({
      where: { usuarioId: userId },
      orderBy: { createdAt: 'desc' },
      take: 5, // Limitar a 5 notificaciones recientes
    });

    const validNotificaciones = [];
    for (const notificacion of notificaciones) {
      if (notificacion.ticketId) {
        const ticket = await prisma.ticket.findUnique({
          where: { id: notificacion.ticketId },
        });

        // Verificar si el ticket existe y si el usuario sigue asignado
        if (ticket && ticket.resolverId === userId) {
          validNotificaciones.push(notificacion);
        } else {
          // Si el ticket ya no está asignado a este usuario, reasignar o eliminar
          if (ticket) {
            // Si el ticket existe, reasignar la notificación
            await prisma.notificacion.update({
              where: { id: notificacion.id },
              data: { usuarioId: ticket.resolverId }, // Reasigna la notificación
            });
          } else {
            // Si el ticket no existe, eliminar la notificación
            await prisma.notificacion.delete({
              where: { id: notificacion.id },
            });
            console.log(`Notificación con ID ${notificacion.id} eliminada porque el ticket no existe.`);
          }
        }
      } else {
        validNotificaciones.push(notificacion); // Notificaciones sin ticket están permitidas
      }
    }

    return validNotificaciones;
  } catch (error) {
    console.error('Error al obtener notificaciones:', error);
    return [];
  }
};



// Función para crear y emitir una notificación
exports.crearYEmitirNotificacion = async (usuarioId, tipo, mensaje, ticketId = null) => {
    try {
      await prisma.notificacion.create({
        data: {
          usuarioId,
          tipo,
          mensaje,
          ticketId,
        },
      });
  
    } catch (error) {
      console.error('Error al crear y emitir la notificación:', error);
    }
};