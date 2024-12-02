// Importaciones necesarias
const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();
const { check, validationResult } = require('express-validator');

// Validaciones antes de crear configuración
exports.validateCreateConfiguracion = [
    check('user_antena')
        .notEmpty().withMessage('El usuario de la antena es obligatorio.')
        .isLength({ max: 50 }).withMessage('El usuario de la antena no debe exceder los 50 caracteres.'),
    check('pass_antena')
        .notEmpty().withMessage('La contraseña de la antena es obligatoria.')
        .isLength({ max: 100 }).withMessage('La contraseña de la antena no debe exceder los 100 caracteres.'),
    check('ip_antena')
        .notEmpty().withMessage('La IP de la antena es obligatoria.')
        .matches(/^(25[0-5]|2[0-4]\d|1\d{2}|[1-9]?\d)(\.(25[0-5]|2[0-4]\d|1\d{2}|[1-9]?\d)){3}$/).withMessage('La IP de la antena no es válida.'),
    check('cpe_antenaId')
        .notEmpty().withMessage('El ID de la antena es obligatorio.')
        .isInt({ min: 1 }).withMessage('El ID de la antena debe ser un número entero positivo.'),
    check('user_router')
        .notEmpty().withMessage('El usuario del router es obligatorio.')
        .isLength({ max: 50 }).withMessage('El usuario del router no debe exceder los 50 caracteres.'),
    check('pass_admin_router')
        .notEmpty().withMessage('La contraseña del router es obligatoria.')
        .isLength({ max: 100 }).withMessage('La contraseña del router no debe exceder los 100 caracteres.'),
    check('cpe_routerId')
        .notEmpty().withMessage('El ID del router es obligatorio.')
        .isInt({ min: 1 }).withMessage('El ID del router debe ser un número entero positivo.'),
    check('clienteId')
        .notEmpty().withMessage('El cliente es obligatorio.')
        .isInt({ min: 1 }).withMessage('El ID del cliente debe ser un número entero positivo.'),
    check('lat')
        .optional({ checkFalsy: true })
        .isFloat().withMessage('La latitud debe ser un número decimal.'),
    check('clong')
        .optional({ checkFalsy: true })
        .isFloat().withMessage('La longitud debe ser un número decimal.'),
    check('ssid')
        .optional({ checkFalsy: true })
        .isLength({ max: 50 }).withMessage('El SSID no debe exceder los 50 caracteres.'),
    check('pass_pin_router')
        .optional({ checkFalsy: true })
        .isLength({ max: 20 }).withMessage('El PIN del router no debe exceder los 20 caracteres.'),
    check('pass_wifi_router')
        .optional({ checkFalsy: true })
        .isLength({ max: 100 }).withMessage('La contraseña WiFi del router no debe exceder los 100 caracteres.'),
];

// Validaciones antes de actualizar configuración
exports.validateUpdateConfiguracion = [
    check('user_antena')
        .notEmpty().withMessage('El usuario de la antena es obligatorio.')
        .isLength({ max: 50 }).withMessage('El usuario de la antena no debe exceder los 50 caracteres.'),
    check('pass_antena')
        .notEmpty().withMessage('La contraseña de la antena es obligatoria.')
        .isLength({ max: 100 }).withMessage('La contraseña de la antena no debe exceder los 100 caracteres.'),
    check('ip_antena')
        .notEmpty().withMessage('La IP de la antena es obligatoria.')
        .matches(/^(25[0-5]|2[0-4]\d|1\d{2}|[1-9]?\d)(\.(25[0-5]|2[0-4]\d|1\d{2}|[1-9]?\d)){3}$/).withMessage('La IP de la antena no es válida.'),
    check('cpe_antenaId')
        .notEmpty().withMessage('El ID de la antena es obligatorio.')
        .isInt({ min: 1 }).withMessage('El ID de la antena debe ser un número entero positivo.'),
    check('user_router')
        .notEmpty().withMessage('El usuario del router es obligatorio.')
        .isLength({ max: 50 }).withMessage('El usuario del router no debe exceder los 50 caracteres.'),
    check('pass_admin_router')
        .notEmpty().withMessage('La contraseña del router es obligatoria.')
        .isLength({ max: 100 }).withMessage('La contraseña del router no debe exceder los 100 caracteres.'),
    check('cpe_routerId')
        .notEmpty().withMessage('El ID del router es obligatorio.')
        .isInt({ min: 1 }).withMessage('El ID del router debe ser un número entero positivo.'),
    check('clienteId')
        .notEmpty().withMessage('El cliente es obligatorio.')
        .isInt({ min: 1 }).withMessage('El ID del cliente debe ser un número entero positivo.'),
    check('lat')
        .optional({ checkFalsy: true })
        .isFloat().withMessage('La latitud debe ser un número decimal.'),
    check('clong')
        .optional({ checkFalsy: true })
        .isFloat().withMessage('La longitud debe ser un número decimal.'),
    check('ssid')
        .optional({ checkFalsy: true })
        .isLength({ max: 50 }).withMessage('El SSID no debe exceder los 50 caracteres.'),
    check('pass_pin_router')
        .optional({ checkFalsy: true })
        .isLength({ max: 20 }).withMessage('El PIN del router no debe exceder los 20 caracteres.'),
    check('pass_wifi_router')
        .optional({ checkFalsy: true })
        .isLength({ max: 100 }).withMessage('La contraseña WiFi del router no debe exceder los 100 caracteres.'),
];

// Controlador para listar las configuraciones
exports.listConfiguraciones = async (req, res) => {
    try {
        const configuraciones = await prisma.configCPE.findMany({
            include: {
                cliente: true,
                cpe_antena: true,
                cpe_router: true
            },
            orderBy: { id: 'asc' },
        });

        res.render('pages/configuraciones/listado', { configuraciones, title: 'Configuraciones' });
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
        // Obtener IDs de clientes que ya tienen una configuración
        const clientesConConfiguracion = await prisma.configCPE.findMany({
            select: { clienteId: true }
        });
        const clientesIdsConConfiguracion = clientesConConfiguracion.map(config => config.clienteId);

        // Obtener clientes que no tienen configuración
        const clientes = await prisma.cliente.findMany({
            where: {
                id: { notIn: clientesIdsConConfiguracion }
            }
        });

        const equipos = await prisma.equipoCPE.findMany();

        // Filtrar antenas y routers
        const antenas = equipos.filter(equipo => equipo.tipo === 'ANTENA');
        const routers = equipos.filter(equipo => equipo.tipo === 'ROUTER');

        res.render('pages/configuraciones/agregar', {
            action: 'new',
            clientes,
            antenas,
            routers,
            mapboxAccessToken: process.env.MAPBOX_ACCESS_TOKEN,
            title: 'Configuraciones'
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
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
        // Unir los mensajes de error con '<br>' para saltos de línea
        const errorMessages = errors.array().map(err => err.msg).join('<br>');
        req.flash('error_msg', errorMessages);
        return res.redirect('/configuraciones/new');
    }

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
                lat: lat || null,
                clong: clong || null
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

        // Obtener IDs de clientes que ya tienen una configuración, excluyendo el cliente actual
        const clientesConConfiguracion = await prisma.configCPE.findMany({
            where: {
                clienteId: { not: configuracion.clienteId }
            },
            select: { clienteId: true }
        });
        const clientesIdsConConfiguracion = clientesConConfiguracion.map(config => config.clienteId);

        // Obtener clientes que no tienen configuración o el cliente actual
        const clientes = await prisma.cliente.findMany({
            where: {
                id: {
                    notIn: clientesIdsConConfiguracion
                }
            }
        });

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
            mapboxAccessToken: process.env.MAPBOX_ACCESS_TOKEN,
            errors: [],      // Lista de errores vacía
            title: 'Configuraciones'
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
    const errors = validationResult(req);
    const { id } = req.params;

    if (!errors.isEmpty()) {
        // Unir los mensajes de error con '<br>' para saltos de línea
        const errorMessages = errors.array().map(err => err.msg).join('<br>');
        req.flash('error_msg', errorMessages);
        return res.redirect(`/configuraciones/edit/${id}`);
    }

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
                lat: lat || null,
                clong: clong || null
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