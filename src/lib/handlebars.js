// src/lib/handlebars.js
const Handlebars = require('handlebars');

// Helper para comparar dos valores y devolver verdadero si son iguales
Handlebars.registerHelper('eq', function (a, b) {
    const resultado = a === b;
    //console.log(`Comparando: ${a} === ${b} -> ${resultado}`);
    return resultado;
});

// Helper para verificar si al menos uno de los argumentos es verdadero
Handlebars.registerHelper('or', function(...args) {
    // El último argumento es el objeto de opciones de Handlebars
    const options = args.pop();
    // Retornar verdadero si al menos uno de los argumentos es verdadero
    return args.some(arg => arg);
});

// Helper para devolver la negación de un valor
Handlebars.registerHelper('not', function(value) {
    return !value;
});

// Helper para incrementar un valor numérico en 1, útil para índices de listas
Handlebars.registerHelper('inc', function(value) {
    return parseInt(value) + 1;
});

// Helper para condicionales en bloques. Ejecuta el bloque si los valores son iguales
Handlebars.registerHelper('ifCond', function (v1, v2, options) {
    if (v1 === v2) {
        return options.fn(this);
    }
    return options.inverse(this);
});

// Helper para serializar un objeto en formato JSON
Handlebars.registerHelper('json', function (context) {
    return new Handlebars.SafeString(JSON.stringify(context));
});

// Helper para convertir la primera letra de una cadena a mayúsculas
Handlebars.registerHelper('capitalize', function(str) {
    if (typeof str !== 'string') return '';
    return str.charAt(0).toUpperCase() + str.slice(1);
});

// Helper para formatear una fecha en formato dd/mm/aaaa hh:mm:ss en horario América Central/El Salvador
Handlebars.registerHelper('formatDate', function (date) {
    if (!date) return '';

    // Convertir la fecha a la zona horaria América Central/El Salvador (UTC-6)
    const options = {
        timeZone: 'America/El_Salvador',
        day: '2-digit',
        month: '2-digit',
        year: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
        second: '2-digit',
        hour12: true,
    };
    
    const formattedDate = new Date(date).toLocaleString('es-SV', options);
    
    return formattedDate.replace(',', ''); // Eliminar la coma para obtener el formato deseado
});

// Helper para formatear una fecha en formato aaaa-mm-dd para inputs de tipo date
Handlebars.registerHelper('formatDateForInput', function (date) {
    if (!date) return '';
    const d = new Date(date);
    const day = (`0${d.getDate()}`).slice(-2);
    const month = (`0${d.getMonth() + 1}`).slice(-2);
    const year = d.getFullYear();
    const hours = (`0${d.getHours()}`).slice(-2);
    const minutes = (`0${d.getMinutes()}`).slice(-2);
    const seconds = (`0${d.getSeconds()}`).slice(-2);
    return `${year}-${month}-${day}T${hours}:${minutes}:${seconds}`;
});

// Helper para verificar si un array contiene un valor específico
Handlebars.registerHelper('contains', function(array, value) {
    return array && array.includes(value);
});

// Helper para verificar si un array de módulos contiene un módulo específico por ID
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

// Helper para retornar verdadero si ambos valores son verdaderos
Handlebars.registerHelper('and', function (a, b) {
    return a && b;
});

// Helper para convertir una cadena a mayúsculas
Handlebars.registerHelper('toUpperCase', function(str) {
    return str.toUpperCase();
});

// Helper para formatear nombres de módulos, reemplazando guiones bajos por espacios y usando mayúsculas
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

// Helper para crear una ruta de navegación (breadcrumb) a partir de una ruta
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

// Helper para determinar la clase de color de una etiqueta según el tipo de ticket
Handlebars.registerHelper('getBadgeClass', function(tipo) {
    switch (tipo.toLowerCase()) {
        case 'resolucion':
            return 'primary';
        case 'instalacion':
            return 'success';
        case 'mantenimiento':
            return 'warning';
        default:
            return 'secondary';
    }
});

// Helper para asignar una clase de badge y formatear el texto del estado
Handlebars.registerHelper('getStatusBadgeClass', function(estado) {
    const estados = {
        completado: { clase: 'success', nombre: 'Completado' },
        en_revision: { clase: 'warning', nombre: 'En Revisión' },
        detenido: { clase: 'danger', nombre: 'Detenido' },
        enviado: { clase: 'secondary', nombre: 'Enviado' }
    };

    // Convertir el estado a minúsculas para evitar errores de mayúsculas/minúsculas
    const estadoInfo = estados[estado.toLowerCase()] || { clase: 'light', nombre: 'Desconocido' };

    // Devolver HTML seguro con la clase y el nombre formateado
    return new Handlebars.SafeString(`<span class="badge badge-${estadoInfo.clase}">${estadoInfo.nombre}</span>`);
});

// Helper para verificar si el último ticket está en un estado permitido para crear uno nuevo
Handlebars.registerHelper('canCreateTicket', function(estadoUltimoTicket) {
    const estadosPermitidos = ['completado', 'detenido'];
    // Verificar si estadoUltimoTicket está definido
    if (!estadoUltimoTicket) {
        return true; // Si no hay último ticket, permitir la creación de uno nuevo
    }
    // Convertir a minúsculas y verificar si el estado es permitido
    return estadosPermitidos.includes(estadoUltimoTicket.toLowerCase());
});

// Verificar si es imagen
Handlebars.registerHelper('isImage', function(url, options) {
    if (/\.(jpeg|jpg|gif|png)$/i.test(url)) {
      return options.fn(this);
    } else {
      return options.inverse(this);
    }
});

// Helper para verificar si una cadena contiene una subcadena específica
Handlebars.registerHelper('includes', function (str, substring) {
    return str && str.includes(substring);
});

module.exports = Handlebars;