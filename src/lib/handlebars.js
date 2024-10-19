// src/lib/handlebars.js
const Handlebars = require('handlebars');

// Helper para comparar dos valores
Handlebars.registerHelper('eq', function (a, b) {
    const resultado = a === b;
    console.log(`Comparando: ${a} === ${b} -> ${resultado}`);
    return resultado;
});

// Helper para serializar objetos a JSON
Handlebars.registerHelper('json', function (context) {
    return new Handlebars.SafeString(JSON.stringify(context));
});

// Registrar el helper `capitalize`
Handlebars.registerHelper('capitalize', function(str) {
    if (typeof str !== 'string') return '';
    return str.charAt(0).toUpperCase() + str.slice(1);
});

// Helper para formatear fechas en formato dd/mm/aaaa
Handlebars.registerHelper('formatDate', function (date) {
    if (!date) return '';
    const d = new Date(date);
    const day = (`0${d.getDate()}`).slice(-2);
    const month = (`0${d.getMonth() + 1}`).slice(-2); // Los meses en JavaScript son de 0 a 11
    const year = d.getFullYear();
    return `${day}/${month}/${year}`;
});

// Helper para formatear fechas en formato aaaa-mm-dd para inputs de tipo date
Handlebars.registerHelper('formatDateForInput', function (date) {
    if (!date) return '';
    const d = new Date(date);
    const day = (`0${d.getDate()}`).slice(-2);
    const month = (`0${d.getMonth() + 1}`).slice(-2); // Los meses en JavaScript son de 0 a 11
    const year = d.getFullYear();
    return `${year}-${month}-${day}`;
});

// Helper para verificar si un array contiene un valor
Handlebars.registerHelper('contains', function(array, value) {
    return array && array.includes(value);
});

// Helper para verificar si un array de módulos contiene un módulo específico
Handlebars.registerHelper('containsModulos', function(modulos, idModulo) {
    // Verificar si 'modulos' es un array válido
    if (!Array.isArray(modulos)) {
        return false; // Si no es un array, devolver false
    }
    return modulos.some(modulo => modulo.id === idModulo); // Verificar si el módulo está presente
});


module.exports = Handlebars;
