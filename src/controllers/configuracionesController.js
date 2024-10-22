// configuracionesController.js

const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

// Controlador para listar las configuraciones
exports.listConfiguraciones = async (req, res) => {
    try {
        const configuraciones = await prisma.configCPE.findMany({
            include: {
                cliente: true,
                cpe_antena: true,
                cpe_router: true
            }
        });

        res.render('pages/configuraciones/listado', { configuraciones });
    } catch (error) {
        console.error('Error al listar las configuraciones:', error);
        req.flash('error_msg', 'Error al listar las configuraciones.');
        return res.status(500).redirect('/configuraciones');
    } finally {
        await prisma.$disconnect();
    }
};

// Renderiza el formulario para crear una nueva configuración
exports.renderCreateForm = async (req, res) => {
    try {
      const clientes = await prisma.cliente.findMany();
      const equipos = await prisma.equipoCPE.findMany();
  
      // Filtrar antenas y routers
      const antenas = equipos.filter(equipo => equipo.tipo === 'ANTENA');
      const routers = equipos.filter(equipo => equipo.tipo === 'ROUTER');
  
      res.render('pages/configuraciones/agregar', {
        action: 'new',
        clientes,
        antenas,
        routers,
        errors: []
      });
    } catch (error) {
      console.error('Error al cargar el formulario de configuración:', error);
      req.flash('error_msg', 'Error al cargar el formulario de configuración.');
      return res.status(500).redirect('/configuraciones');
    } finally {
      await prisma.$disconnect();
    }
  };
  

// Controlador para crear una nueva configuración
exports.createConfiguracion = async (req, res) => {
    try {
        const {
            user_antena,
            pass_antena,
            ip_antena,
            cpe_antenaId,
            user_router,
            pass_admin_router,
            ssid,
            pass_pin_router,
            pass_wifi_router,
            cpe_routerId,
            clienteId,
            lat,
            clong
        } = req.body;

        // Validar campos obligatorios
        if (!user_antena || !pass_antena || !ip_antena || !cpe_antenaId ||
            !user_router || !pass_admin_router || !cpe_routerId || !clienteId) {
            req.flash('error_msg', 'Por favor, complete todos los campos obligatorios.');
            return res.redirect('/configuraciones/new');
        }

        // Crear nueva configuración
        await prisma.configCPE.create({
            data: {
                user_antena,
                pass_antena,
                ip_antena,
                cpe_antenaId: parseInt(cpe_antenaId),
                user_router,
                pass_admin_router,
                ssid,
                pass_pin_router,
                pass_wifi_router,
                cpe_routerId: parseInt(cpe_routerId),
                clienteId: parseInt(clienteId),
                lat,
                clong
            }
        });

        req.flash('success_msg', 'Configuración creada exitosamente.');
        res.status(201).redirect('/configuraciones');
    } catch (error) {
        console.error('Error al crear la configuración:', error);
        req.flash('error_msg', 'Error al crear la configuración.');
        return res.status(500).redirect('/configuraciones');
    } finally {
        await prisma.$disconnect();
    }
};

// Renderiza el formulario para editar una configuración existente
exports.renderEditForm = async (req, res) => {
    try {
        const { id } = req.params;

        // Buscar la configuración específica por ID
        const configuracion = await prisma.configCPE.findUnique({
            where: { id: parseInt(id) },
            include: {
                cliente: true,       // Incluir datos del cliente asociado
                cpe_antena: true,    // Incluir datos de la antena asociada
                cpe_router: true     // Incluir datos del router asociado
            }
        });

        if (!configuracion) {
            req.flash('error_msg', 'Configuración no encontrada.');
            return res.redirect('/configuraciones');
        }

        // Obtener clientes y equipos (antenas y routers)
        const clientes = await prisma.cliente.findMany();
        const equipos = await prisma.equipoCPE.findMany();

        // Filtrar antenas y routers de los equipos
        const antenas = equipos.filter(equipo => equipo.tipo === 'ANTENA');
        const routers = equipos.filter(equipo => equipo.tipo === 'ROUTER');

        // Renderizar la vista para editar con los datos cargados
        res.render('pages/configuraciones/modificar', {
            action: 'edit',
            configuracion,  // Configuración actual a editar
            clientes,       // Lista de clientes disponibles
            antenas,        // Lista de antenas filtradas
            routers,        // Lista de routers filtrados
            errors: []      // Lista de errores vacía
        });
    } catch (error) {
        console.error('Error al cargar la configuración para editar:', error);
        req.flash('error_msg', 'Error al cargar la configuración.');
        return res.status(500).redirect('/configuraciones');
    } finally {
        await prisma.$disconnect();
    }
};

// Controlador para actualizar una configuración existente
exports.updateConfiguracion = async (req, res) => {
    try {
        const { id } = req.params;
        const {
            user_antena,
            pass_antena,
            ip_antena,
            cpe_antenaId,
            user_router,
            pass_admin_router,
            ssid,
            pass_pin_router,
            pass_wifi_router,
            cpe_routerId,
            clienteId,
            lat,
            clong
        } = req.body;

        // Validar campos obligatorios
        if (!user_antena || !pass_antena || !ip_antena || !cpe_antenaId ||
            !user_router || !pass_admin_router || !cpe_routerId || !clienteId) {
            req.flash('error_msg', 'Por favor, complete todos los campos obligatorios.');
            return res.redirect(`/configuraciones/edit/${id}`);
        }

        // Actualizar configuración
        await prisma.configCPE.update({
            where: { id: parseInt(id) },
            data: {
                user_antena,
                pass_antena,
                ip_antena,
                cpe_antenaId: parseInt(cpe_antenaId),
                user_router,
                pass_admin_router,
                ssid,
                pass_pin_router,
                pass_wifi_router,
                cpe_routerId: parseInt(cpe_routerId),
                clienteId: parseInt(clienteId),
                lat,
                clong
            }
        });

        req.flash('success_msg', 'Configuración actualizada exitosamente.');
        res.status(200).redirect('/configuraciones');
    } catch (error) {
        console.error('Error al actualizar la configuración:', error);
        req.flash('error_msg', 'Error al actualizar la configuración.');
        return res.status(500).redirect('/configuraciones');
    } finally {
        await prisma.$disconnect();
    }
};

// Controlador para eliminar una configuración
exports.deleteConfiguracion = async (req, res) => {
    try {
        const { id } = req.params;

        await prisma.configCPE.delete({
            where: { id: parseInt(id) }
        });

        req.flash('success_msg', 'Configuración eliminada exitosamente.');
        res.status(200).redirect('/configuraciones');
    } catch (error) {
        console.error('Error al eliminar la configuración:', error);
        req.flash('error_msg', 'Error al eliminar la configuración.');
        return res.status(500).redirect('/configuraciones');
    } finally {
        await prisma.$disconnect();
    }
};
