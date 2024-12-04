// src/model/bitacora.js

const mongoose = require('mongoose');

const bitacoraSchema = new mongoose.Schema({
    timestamp: { type: Date, default: Date.now },
    user: { type: String, default: 'Anónimo' }, // Usuario que realiza la acción
    role: { type: String, default: 'Invitado' }, // Rol del usuario
    method: { type: String, required: true }, // Método HTTP utilizado
    route: { type: String, required: true }, // Ruta accedida
    action: { type: String, required: true }, // Acción (basada en el método)
    statusCode: { type: Number }, // Código de estado HTTP
    ip: { type: String }, // Dirección IP del cliente
    browser: { type: String }, // Información del navegador (user-agent)
});

// Crear un índice TTL para eliminar documentos después de 30 días (2592000 segundos) (Opcional)
// bitacoraSchema.index({ timestamp: 1 }, { expireAfterSeconds: 2592000 });

const Bitacora = mongoose.model('Bitacora', bitacoraSchema);

module.exports = Bitacora;
