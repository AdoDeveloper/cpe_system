// src/controllers/bitacorasController.js

const Bitacora = require('../model/bitacora');

exports.listBitacoras = async (req, res) => {
    try {
        // Verificar si el usuario tiene permisos para ver las bitácoras
        if (!req.session.isAdmin) {
            req.flash('error_msg', 'No tienes permiso para ver las bitácoras.');
            return res.redirect('/');
        }

        // Obtener las bitácoras de MongoDB, ordenadas por fecha descendente
        const logs = await Bitacora.find().sort({ timestamp: -1 }).limit(100);

        // Transformar los datos para que sean compatibles con Handlebars
        const logsFormatted = logs.map(log => ({
            id: log._id.toString(), // Convertir ObjectId a string
            user: log.user,
            role: log.role,
            method: log.method,
            route: log.route,
            action: log.action,
            statusCode: log.statusCode, // Agregar el código de estado HTTP
            timestamp: new Date(log.timestamp).toLocaleString() // Formatear la fecha
        }));

        res.render('pages/bitacoras/listado', { logs: logsFormatted, title: 'Bitácoras' });
    } catch (error) {
        console.error('Error al listar las bitácoras:', error);
        req.flash('error_msg', 'Error al listar las bitácoras.');
        res.status(500).redirect('/');
    }
};

