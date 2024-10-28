// controllers/ticketsController.js

const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();
const cloudinary = require('cloudinary').v2;

// Configuración de Cloudinary
cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
});

// Función para subir archivos a Cloudinary
const uploadFileToCloudinary = async (fileBuffer, folder, public_id, isPDF) => {
  return new Promise((resolve, reject) => {
    const options = {
      folder: folder,
      public_id: public_id,
    };
    
    // Si es PDF, no cambiar el formato
    if (!isPDF) {
      options.format = 'webp';
    }

    cloudinary.uploader.upload_stream(options, (error, result) => {
      if (error) {
        reject(error);
      } else {
        resolve(result);
      }
    }).end(fileBuffer);
  });
};

// Función para eliminar archivos de Cloudinary
const deleteFileFromCloudinary = async (public_id) => {
  return new Promise((resolve, reject) => {
    cloudinary.uploader.destroy(public_id, (error, result) => {
      if (error) reject(error);
      else resolve(result);
    });
  });
};

// Función para listar los tickets
exports.listTickets = async (req, res) => {
  try {
    const userId = req.session.userId;
    const userRole = req.session.userRole;
    let tickets = [];
    let ultimoTicketEstado;

    // Administrador y Soporte Técnico pueden ver todos los tickets
    if (userRole === 'Administrador' || userRole === 'Soporte Tecnico') {
      tickets = await prisma.ticket.findMany({
        include: {
          cliente: true,
          usuario: true,
          resolver: true,
          tipoTicket: true
        },
        orderBy: {
          createdAt: 'desc'
        }
      });
    }
    // Técnicos e Instaladores solo pueden ver los tickets asignados
    else if (userRole === 'Tecnico' || userRole === 'Instalador') {
      tickets = await prisma.ticket.findMany({
        where: {
          resolverId: userId
        },
        include: {
          cliente: true,
          usuario: true,
          resolver: true,
          tipoTicket: true
        },
        orderBy: {
          createdAt: 'desc'
        }
      });
    }
    // Clientes solo pueden ver sus propios tickets de tipo "resolucion"
    else if (userRole === 'Cliente') {
      const cliente = await prisma.cliente.findFirst({
        where: {
          usuario: {
            id: userId
          }
        }
      });

      if (cliente) {
        tickets = await prisma.ticket.findMany({
          where: {
            clienteId: cliente.id,
            tipoTicket: {
              is: {
                nombre: 'resolucion'
              }
            }
          },
          include: {
            usuario: true,
            tipoTicket: true,
            resolver: true
          },
          orderBy: {
            createdAt: 'desc'
          }
        });

        // Obtener el estado del último ticket si existe
        if (tickets.length > 0) {
          ultimoTicketEstado = tickets[0].estado; // Asumiendo que está ordenado descendentemente
        }
      }
    }

    res.render('pages/tickets/listado', {
      user: { rol: userRole },
      tickets,
      ultimoTicketEstado // Pasar el estado del último ticket
    });
  } catch (error) {
    console.error('Error al listar los tickets:', error);
    req.flash('error_msg', 'Error al cargar los tickets.');
    res.redirect('/');
  }
};

// Renderizar el formulario de creación de ticket
exports.renderCreateForm = async (req, res) => {
  try {
    const userRole = req.session.userRole;

    // Cargar tipos de tickets desde la base de datos
    const tipos = await prisma.tipoTicket.findMany();

    // Obtener usuarios con rol de cliente y sus datos de cliente asociados
    const clientes = await prisma.usuario.findMany({
      where: {
        rol: {
          nombre: 'Cliente'
        },
        cliente: { // Asegurar que el usuario esté relacionado con un cliente
          isNot: null
        }
      },
      include: {
        cliente: true // Incluir datos del cliente
      }
    });

    // Obtener resolutores según el tipo de ticket
    const resolutores = {
      resolucion: await prisma.usuario.findMany({ where: { rol: { nombre: { not: 'Cliente' } } } }),
      instalacion: await prisma.usuario.findMany({ where: { rol: { nombre: 'Instalador' } } }),
      mantenimiento: await prisma.usuario.findMany({ where: { rol: { nombre: 'Tecnico' } } })
    };

    res.render('pages/tickets/agregar', {
      user: { rol: userRole },
      tipos,
      clientes,
      resolutores
    });
  } catch (error) {
    console.error('Error al renderizar el formulario de creación de ticket:', error);
    req.flash('error_msg', 'Error al cargar el formulario.');
    res.redirect('/tickets');
  }
};

// Función para generar un número único para el ticket que incluya letras y números
function generateTicketNumber() {
  const randomChars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
  let randomString = '';

  // Generar una cadena alfanumérica de 6 caracteres
  for (let i = 0; i < 6; i++) {
    randomString += randomChars.charAt(Math.floor(Math.random() * randomChars.length));
  }

  // Obtener la fecha y hora en la zona horaria de El Salvador
  const now = new Date();

  // Opciones para formatear la fecha y hora
  const options = {
    timeZone: 'America/El_Salvador', // Zona horaria de El Salvador
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
    hour12: false // Formato de 24 horas
  };

  // Crear un formateador de fecha con las opciones especificadas
  const formatter = new Intl.DateTimeFormat('en-GB', options);
  const parts = formatter.formatToParts(now);

  // Extraer las partes de la fecha y hora
  const year = parts.find(p => p.type === 'year').value;
  const month = parts.find(p => p.type === 'month').value;
  const day = parts.find(p => p.type === 'day').value;
  const hour = parts.find(p => p.type === 'hour').value;
  const minute = parts.find(p => p.type === 'minute').value;
  const second = parts.find(p => p.type === 'second').value;

  // Construir la fecha y hora en el formato YYYYMMDD-HHmmss
  const formattedDateTime = `${year}${month}${day}-${hour}${minute}${second}`;

  return `TKT-${randomString}-${formattedDateTime}`;
}

// Función para crear un ticket
exports.createTicket = async (req, res) => {
  try {
    const { titulo, descripcion, direccion, coordenadas } = req.body;
    const numeroTicket = generateTicketNumber();
    const userId = req.session.userId;
    let tipoTicketId = parseInt(req.body.tipoTicketId);
    let clienteId = parseInt(req.body.clienteId);
    let resolverId = parseInt(req.body.resolverId);

    // Si el usuario es Cliente, asignar el tipo de ticket de "resolución"
    if (req.session.userRole === 'Cliente') {
      const cliente = await prisma.cliente.findFirst({
        where: {
          usuario: {
            id: userId,
          },
        },
      });

      if (!cliente) {
        throw new Error("No se encontró el cliente asociado a este usuario.");
      }

      clienteId = cliente.id;
      tipoTicketId = 1; // ID del tipo de ticket "resolución" (ajusta este valor según tu base de datos)
      resolverId = null;
    }

    // Validar que tipoTicketId esté definido antes de usarlo en la consulta
    if (!tipoTicketId || isNaN(tipoTicketId)) {
      req.flash('error_msg', 'El tipo de ticket no es válido.');
      return res.redirect('/tickets/new');
    }

    // Obtener el nombre del tipo de ticket seleccionado
    const tipoTicket = await prisma.tipoTicket.findUnique({
      where: { id: tipoTicketId },
    });

    if (!tipoTicket) {
      req.flash('error_msg', 'Tipo de ticket no encontrado.');
      return res.redirect('/tickets/new');
    }

    // Validar campos de dirección y coordenadas para mantenimiento o instalación
    const tipoNombre = tipoTicket.nombre.toLowerCase();
    let latitud = null;
    let longitud = null;

    if (tipoNombre === 'mantenimiento' || tipoNombre === 'instalacion') {
      if (!direccion || !coordenadas) {
        req.flash('error_msg', 'Debe proporcionar dirección y coordenadas para tickets de mantenimiento o instalación.');
        return res.redirect('/tickets/new');
      }

      const coords = coordenadas.split(',');
      if (coords.length !== 2) {
        req.flash('error_msg', 'Coordenadas inválidas.');
        return res.redirect('/tickets/new');
      }

      latitud = parseFloat(coords[0].trim());
      longitud = parseFloat(coords[1].trim());

      if (isNaN(latitud) || isNaN(longitud)) {
        req.flash('error_msg', 'Coordenadas inválidas.');
        return res.redirect('/tickets/new');
      }
    }

    // Subir imagen a Cloudinary si se ha proporcionado una imagen
    let imgProblemaUrl = null;
    if (req.file) {
      const result = await uploadFileToCloudinary(req.file.buffer, "tickets", numeroTicket);
      imgProblemaUrl = result.secure_url;
    }

    // Crear el ticket en la base de datos
    await prisma.ticket.create({
      data: {
        numeroTicket,
        titulo,
        descripcion,
        tipoTicketId,
        clienteId,
        usuarioId: userId,
        resolverId: isNaN(resolverId) ? null : resolverId,
        img_problema: imgProblemaUrl,
        estado: "enviado",
        direccion: direccion || null,
        latitud,
        longitud,
      },
    });

    req.flash('success_msg', 'Ticket creado correctamente');
    res.redirect('/tickets');
  } catch (error) {
    console.error('Error al crear el ticket:', error);
    req.flash('error_msg', 'Error al crear el ticket.');
    res.redirect('/tickets');
  }
};

// Renderizar el formulario de edición de ticket
exports.renderEditForm = async (req, res) => {
  try {
    const ticketId = parseInt(req.params.id);

    // Buscar el ticket con los datos necesarios
    const ticket = await prisma.ticket.findUnique({
      where: { id: ticketId },
      include: {
        cliente: true,
        tipoTicket: true,
        resolver: true,
      },
    });

    if (!ticket) {
      req.flash('error_msg', 'No se encontró el ticket a modificar.');
      return res.redirect('/tickets');
    }

    // Obtener todos los resolutores disponibles según el tipo de ticket
    const resolutores = {
      resolucion: await prisma.usuario.findMany({ where: { rol: { nombre: { not: 'Cliente' } } } }),
      instalacion: await prisma.usuario.findMany({ where: { rol: { nombre: 'Instalador' } } }),
      mantenimiento: await prisma.usuario.findMany({ where: { rol: { nombre: 'Tecnico' } } })
    };

    // Obtener todos los clientes disponibles
    const clientes = await prisma.usuario.findMany({
      where: {
        rol: {
          nombre: 'Cliente'
        },
        cliente: {
          isNot: null
        }
      },
      include: {
        cliente: true
      }
    });

    // Obtener tipos de tickets
    const tipos = await prisma.tipoTicket.findMany();

    // Renderizar la vista del formulario de modificación del ticket
    res.render('pages/tickets/modificar', {
      ticket,
      resolutores,
      clientes,
      tipos,
      user: { rol: req.session.userRole },  // Pasar toda la información del usuario a la vista
    });
  } catch (error) {
    console.error('Error al renderizar el formulario de modificación de ticket:', error);
    req.flash('error_msg', 'Error al cargar el formulario de modificación.');
    res.redirect('/tickets');
  }
};

// Función para actualizar un ticket
exports.updateTicket = async (req, res) => {
  try {
    const ticketId = parseInt(req.params.id);
    const { titulo, descripcion, estado, resolverId, clienteId, tipoTicketId, direccion, coordenadas } = req.body;

    // Registrar los datos recibidos del formulario
    console.log("Datos recibidos del formulario:", { titulo, descripcion, estado, resolverId, clienteId, tipoTicketId, direccion, coordenadas });

    // Verificar si el ticket existe antes de actualizar
    const ticket = await prisma.ticket.findUnique({
      where: { id: ticketId }
    });

    if (!ticket) {
      req.flash('error_msg', 'No se encontró el ticket a modificar.');
      return res.redirect('/tickets');
    }

    // Obtener el nombre del tipo de ticket seleccionado
    let tipoTicket = await prisma.tipoTicket.findUnique({
      where: { id: parseInt(tipoTicketId) },
    });

    // Validar que dirección y coordenadas se proporcionen si el tipo de ticket es mantenimiento o instalación
    const tipoNombre = tipoTicket.nombre.toLowerCase();
    let latitud = null;
    let longitud = null;

    if (tipoNombre === 'mantenimiento' || tipoNombre === 'instalacion') {
      if (!direccion || !coordenadas) {
        req.flash('error_msg', 'Debe proporcionar dirección y coordenadas para tickets de mantenimiento o instalación.');
        return res.redirect(`/tickets/edit/${ticketId}`);
      }

      // Separar latitud y longitud de la cadena de coordenadas
      const coords = coordenadas.split(',');
      if (coords.length !== 2) {
        req.flash('error_msg', 'Coordenadas inválidas.');
        return res.redirect(`/tickets/edit/${ticketId}`);
      }
      latitud = parseFloat(coords[0].trim());
      longitud = parseFloat(coords[1].trim());

      if (isNaN(latitud) || isNaN(longitud)) {
        req.flash('error_msg', 'Coordenadas inválidas.');
        return res.redirect(`/tickets/edit/${ticketId}`);
      }
    }

    // Subir nuevo archivo (imagen o PDF) a Cloudinary si se ha proporcionado uno
    let imgProblemaUrl = ticket.img_problema; // Mantener el archivo actual por defecto
    if (req.file) {
      // Determinar si el archivo es PDF
      const isPDF = req.file.mimetype === 'application/pdf';

      // Eliminar el archivo anterior si existe
      if (ticket.img_problema) {
        await deleteFileFromCloudinary(ticket.numeroTicket);
      }

      // Subir el nuevo archivo con formato apropiado
      const result = await uploadFileToCloudinary(req.file.buffer, "tickets", ticket.numeroTicket, isPDF);
      imgProblemaUrl = result.secure_url;
    }

    // Convertir los valores recibidos a enteros si no son nulos o vacíos
    const updatedResolverId = resolverId && resolverId.trim() !== '' ? parseInt(resolverId) : null;
    const updatedClienteId = clienteId && clienteId.trim() !== '' ? parseInt(clienteId) : ticket.clienteId;
    const updatedTipoTicketId = tipoTicketId && tipoTicketId.trim() !== '' ? parseInt(tipoTicketId) : ticket.tipoTicketId;

    // Actualizar el ticket en la base de datos
    await prisma.ticket.update({
      where: { id: ticketId },
      data: {
        titulo,
        descripcion,
        estado,
        resolverId: updatedResolverId,
        clienteId: updatedClienteId,
        tipoTicketId: updatedTipoTicketId,
        img_problema: imgProblemaUrl,
        direccion: direccion || null,
        latitud: latitud,
        longitud: longitud,
      },
    });

    req.flash('success_msg', 'Ticket actualizado correctamente');
    res.redirect('/tickets');
  } catch (error) {
    console.error('Error al actualizar el ticket:', error);
    req.flash('error_msg', 'Error al actualizar el ticket.');
    res.redirect('/tickets');
  }
};

// Función para eliminar un ticket
exports.deleteTicket = async (req, res) => {
  try {
    const ticketId = parseInt(req.params.id);

    // Verificar que el ticket existe antes de eliminar
    const ticket = await prisma.ticket.findUnique({
      where: { id: ticketId }
    });

    // Eliminar imagen de Cloudinary si existe
    if (ticket.img_problema) {
      await deleteFileFromCloudinary(ticket.numeroTicket);
    }

    // Eliminar el ticket
    await prisma.ticket.delete({
      where: { id: ticketId }
    });

    req.flash('success_msg', 'Ticket eliminado correctamente.');
    res.redirect('/tickets');
  } catch (error) {
    console.error('Error al eliminar el ticket:', error);
    req.flash('error_msg', 'Error al eliminar el ticket.');
    res.redirect('/tickets');
  }
};

// ======= TIMELINE ======= //

// Función para mostrar el timeline del ticket
exports.showTimeline = async (req, res) => {
  try {
    const ticketId = parseInt(req.params.id);
    const userId = req.session.userId;
    const userRole = req.session.userRole;

    // Obtener el ticket con los datos necesarios
    const ticket = await prisma.ticket.findUnique({
      where: { id: ticketId },
      include: {
        cliente: true,
        tipoTicket: true,
        usuario: true,
        resolver: true,
      },
    });

    // Obtener los mensajes del ticket
    const mensajes = await prisma.ticketMessage.findMany({
      where: { ticketId: ticket.id },
      include: {
        usuario: true,
      },
      orderBy: {
        createdAt: 'asc',
      },
    });

    res.render('pages/tickets/timeline', {
      ticket,
      mensajes,
      user: { id: userId, rol: userRole },
    });
  } catch (error) {
    console.error('Error al mostrar el timeline del ticket:', error);
    req.flash('error_msg', 'Error al cargar el timeline del ticket.');
    res.redirect('/tickets');
  }
};

let ioInstance; // Variable para almacenar la instancia de io

// Función para inicializar Socket.IO y manejar eventos de sockets
exports.initializeSocket = (io) => {
  ioInstance = io; // Almacenar la instancia de io

  io.on('connection', (socket) => {
    console.log('Nuevo cliente conectado');

    // Unirse a una sala específica del ticket
    socket.on('joinTicket', ({ ticketId }) => {
      socket.join(`ticket_${ticketId}`);
      console.log(`Cliente unido a la sala ticket_${ticketId}`);

      // Escuchar eventos de envío de mensaje
      socket.on('sendMessage', async (data) => {
        try {
          const { ticketId, userId, mensaje, imageData } = data;

          // Verificar el estado del ticket
          const ticket = await prisma.ticket.findUnique({
            where: { id: ticketId },
            include: { tipoTicket: true },
          });

          if (!ticket) {
            socket.emit('errorMessage', 'El ticket no existe.');
            return;
          }

          if (ticket.estado === 'completado') {
            socket.emit('errorMessage', 'No es posible enviar mensajes en un ticket completado.');
            return;
          }

          // Manejar la imagen si existe
          let mediaUrl = null;
          if (imageData) {
            // Convertir la cadena base64 a un buffer
            const imageBuffer = Buffer.from(imageData, 'base64');

            // Subir la imagen a Cloudinary
            const result = await uploadFileToCloudinary(imageBuffer, 'tickets/mensajes', `ticket_${ticketId}_msg_${Date.now()}`);
            mediaUrl = result.secure_url;
          }

          // Guardar el mensaje en la base de datos
          const newMessage = await prisma.ticketMessage.create({
            data: {
              mensaje,
              mediaUrl,
              ticket: { connect: { id: ticketId } },
              usuario: { connect: { id: userId } },
            },
            include: {
              usuario: true,
            },
          });

          // Emitir el evento 'newMessage' a los clientes conectados a la sala del ticket
          io.to(`ticket_${ticketId}`).emit('newMessage', {
            mensaje: newMessage,
          });

        } catch (error) {
          console.error('Error al enviar mensaje:', error);
          socket.emit('errorMessage', 'Error al enviar el mensaje.');
        }
      });
    });

    socket.on('disconnect', () => {
      console.log('Cliente desconectado');
    });
  });
};

// Función para actualizar el estado del ticket
exports.updateTicketStatus = async (req, res) => {
  try {
    const ticketId = parseInt(req.params.id);
    const { estado } = req.body;

    await prisma.ticket.update({
      where: { id: ticketId },
      data: { estado },
    });

    // Emitir el evento con el nuevo estado
    if (ioInstance) {
      ioInstance.to(`ticket_${ticketId}`).emit('ticketStatusChanged', { newState: estado });
    }

    req.flash('success_msg', 'Estado del ticket actualizado correctamente.');
    res.redirect(`/tickets/timeline/${ticketId}`);
  } catch (error) {
    console.error('Error al actualizar el estado del ticket:', error);
    req.flash('error_msg', 'Error al actualizar el estado del ticket.');
    res.redirect(`/tickets/timeline/${ticketId}`);
  }
};