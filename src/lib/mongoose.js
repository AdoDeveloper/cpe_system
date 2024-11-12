// src/lib/mongoose.js

const mongoose = require('mongoose');

mongoose.connect(process.env.MONGODB_URL);

const db = mongoose.connection;

db.on('error', console.error.bind(console, 'Error de conexión a MongoDB:'));
db.once('open', function() {
    console.log('Conexión exitosa a MongoDB');
});

module.exports = mongoose;
