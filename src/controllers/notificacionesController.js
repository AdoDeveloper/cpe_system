// controllers/notificacionesController.js
const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

// Función para obtener notificaciones del usuario y eliminar aquellas con tickets inexistentes
exports.obtenerNotificaciones = async (userId) => {
  try {
    // Obtener las últimas 5 notificaciones para el usuario
    const notificaciones = await prisma.notificacion.findMany({
      where: { usuarioId: userId },
      orderBy: { createdAt: 'desc' },
      take: 5 // Limitar el número de notificaciones mostradas
    });

    // Filtrar y eliminar notificaciones con tickets inexistentes
    const validNotificaciones = [];
    for (const notificacion of notificaciones) {
      if (notificacion.ticketId) {
        const ticket = await prisma.ticket.findUnique({
          where: { id: notificacion.ticketId },
        });

        // Si el ticket no existe, eliminamos la notificación
        if (!ticket) {
          await prisma.notificacion.delete({
            where: { id: notificacion.id },
          });
          console.log(`Notificación con ID ${notificacion.id} eliminada porque el ticket no existe.`);
        } else {
          validNotificaciones.push(notificacion);
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