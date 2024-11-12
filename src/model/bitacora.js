// src/model/bitacora.js

const mongoose = require('mongoose');

const bitacoraSchema = new mongoose.Schema({
    timestamp: { type: Date, default: Date.now },
    user: { type: String },
    role: { type: String },
    method: { type: String },
    route: { type: String },
    action: { type: String },
    statusCode: { type: Number }, // Código de estado HTTP
});

// Crear un índice TTL para eliminar documentos después de 30 días (2592000 segundos)
bitacoraSchema.index({ timestamp: 1 }, { expireAfterSeconds: 2592000 });

const Bitacora = mongoose.model('Bitacora', bitacoraSchema);

module.exports = Bitacora;
