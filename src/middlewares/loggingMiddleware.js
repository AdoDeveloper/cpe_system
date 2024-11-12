// src/middlewares/loggingMiddleware.js

const Bitacora = require('../model/bitacora');

function loggingMiddleware(req, res, next) {
    // Opcional: Puedes limitar los métodos HTTP que deseas registrar
    const methodsToLog = ['POST', 'PUT', 'DELETE'];
    if (!methodsToLog.includes(req.method)) {
        return next();
    }

    // Escuchar el evento 'finish' de la respuesta para obtener el código de estado
    res.on('finish', () => {
        // Obtener información del usuario desde la sesión
        const user = req.session.userName || 'Anónimo';
        const role = req.session.userRole || 'Invitado';

        // Crear una nueva entrada en la bitácora
        const logEntry = new Bitacora({
            user: user,
            role: role,
            method: req.method,
            route: req.originalUrl,
            action: req.method,
            statusCode: res.statusCode, // Código de estado HTTP
        });

        // Guardar la entrada en MongoDB
        logEntry.save()
            .then(() => {
                // Bitácora guardada exitosamente
            })
            .catch((err) => {
                console.error('Error al guardar la bitácora en MongoDB:', err);
            });
    });

    next();
}

module.exports = loggingMiddleware;
