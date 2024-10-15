// src\lib\handlebars.js
const helpers = require('handlebars');

// Este helper nos permite comparar 2 valores en la plantilla handlebars
helpers.registerHelper('eq', function (a, b, options) {
    return a === b ? options.fn(this) : options.inverse(this);
});

// Helper para formatear fechas en formato dd/mm/aaaa
helpers.registerHelper('formatDate', function (date) {
    if (!date) return '';
    const d = new Date(date);
    const day = (`0${d.getDate()}`).slice(-2);
    const month = (`0${d.getMonth() + 1}`).slice(-2); // Los meses en JavaScript son de 0 a 11
    const year = d.getFullYear();
    return `${day}/${month}/${year}`;
});

// Helper para formatear fechas en formato aaaa-mm-dd para inputs de tipo date
helpers.registerHelper('formatDateForInput', function (date) {
    if (!date) return '';
    const d = new Date(date);
    const day = (`0${d.getDate()}`).slice(-2);
    const month = (`0${d.getMonth() + 1}`).slice(-2); // Los meses en JavaScript son de 0 a 11
    const year = d.getFullYear();
    return `${year}-${month}-${day}`;
});

module.exports = helpers;
