// src/lib/handlebars.js
const Handlebars = require('handlebars');

// Helper para comparar dos valores
Handlebars.registerHelper('eq', function (a, b) {
    const resultado = a === b;
    //console.log(`Comparando: ${a} === ${b} -> ${resultado}`);
    return resultado;
});

// Helper para comparar dos valores dentro de bloques condicionales
Handlebars.registerHelper('ifCond', function (v1, v2, options) {
    if (v1 === v2) {
      return options.fn(this);
    }
    return options.inverse(this);
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

// Helper para verificar si un servicio está en la lista de servicios del contrato
Handlebars.registerHelper('containsServicios', function(servicios, idServicio) {
    return servicios.some(servicio => servicio.servicioId === idServicio);
});

// Definir helper 'and' para Handlebars
Handlebars.registerHelper('and', function (a, b) {
    return a && b;
});

// Helper para convertir una cadena a mayúsculas
Handlebars.registerHelper('toUpperCase', function(str) {
    return str.toUpperCase();
});

// Helper para formatear nombres de módulos
Handlebars.registerHelper('formatModuleName', function(nombre) {
    if (typeof nombre !== 'string') return '';
    // Reemplazar guiones bajos por espacios y convertir a mayúsculas
    return nombre.replace(/_/g, ' ').toUpperCase();
    // Opcional: Si se prefiere capitalizar cada palabra, usa la siguiente línea en su lugar:
    // return nombre.replace(/_/g, ' ').replace(/\b\w/g, char => char.toUpperCase());
});

// Helper para verificar si la ruta actual está dentro de las rutas del módulo
Handlebars.registerHelper('ifActiveModule', function(rutas, currentRoute, options) {
    const isActive = rutas.some(ruta => ruta.ruta === currentRoute);
    if (isActive) {
        return options.fn(this);
    }
    return options.inverse(this);
});

Handlebars.registerHelper('createBreadcrumb', function(route) {
    const segments = route.split('/').filter(Boolean); // Divide la ruta y elimina los valores vacíos

    let breadcrumbHtml = '<a href="/" class="breadcrumb-item">Inicio</a>'; // El primer elemento es "Inicio"
    let accumulatedPath = '';

    segments.forEach((segment, index) => {
        accumulatedPath += `/${segment}`;
        const formattedSegment = segment.replace(/-/g, ' ').replace(/\b\w/g, char => char.toUpperCase()); // Capitaliza cada palabra y reemplaza guiones

        if (index === segments.length - 1) {
            // Último segmento (ruta actual)
            breadcrumbHtml += ` <span class="breadcrumb-separator">></span> <span class="breadcrumb-item active text-primary">${formattedSegment}</span>`;
        } else {
            // Segmentos intermedios con enlace
            breadcrumbHtml += ` <span class="breadcrumb-separator">></span> <a href="${accumulatedPath}" class="breadcrumb-item">${formattedSegment}</a>`;
        }
    });

    return new Handlebars.SafeString(breadcrumbHtml); // Devuelve HTML seguro para Handlebars
});

module.exports = Handlebars;