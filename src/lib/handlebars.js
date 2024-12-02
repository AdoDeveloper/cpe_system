// src/lib/handlebars.js
const Handlebars = require('handlebars');
const moment = require('moment');

// Helper para comparar dos valores y devolver verdadero si son iguales
Handlebars.registerHelper('eq', function (a, b) {
    const resultado = a === b;
    //console.log(`Comparando: ${a} === ${b} -> ${resultado}`);
    return resultado;
});

Handlebars.registerHelper('gt', function(a, b) {
    return a > b;
  });
  
  Handlebars.registerHelper('lt', function(a, b) {
    return a < b;
  });
  
  Handlebars.registerHelper('add', function(a, b) {
    return a + b;
  });
  
  Handlebars.registerHelper('subtract', function(a, b) {
    return a - b;
  });
  
  // Helper para generar un rango de números
  Handlebars.registerHelper('range', function(from, to, options) {
    let accum = '';
    for(let i = from; i <= to; i++) {
      accum += options.fn(i);
    }
    return accum;
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

// Condicional con operador
Handlebars.registerHelper('ifCondOp', function (v1, operator, v2, options) {
    switch (operator) {
        case '==':
            return (v1 == v2) ? options.fn(this) : options.inverse(this);
        case '===':
            return (v1 === v2) ? options.fn(this) : options.inverse(this);
        case '!=':
            return (v1 != v2) ? options.fn(this) : options.inverse(this);
        case '!==':
            return (v1 !== v2) ? options.fn(this) : options.inverse(this);
        case '<':
            return (v1 < v2) ? options.fn(this) : options.inverse(this);
        case '<=':
            return (v1 <= v2) ? options.fn(this) : options.inverse(this);
        case '>':
            return (v1 > v2) ? options.fn(this) : options.inverse(this);
        case '>=':
            return (v1 >= v2) ? options.fn(this) : options.inverse(this);
        case '&&':
            return (v1 && v2) ? options.fn(this) : options.inverse(this);
        case '||':
            return (v1 || v2) ? options.fn(this) : options.inverse(this);
        default:
            return options.inverse(this);
    }
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

// Helper para convertir una cadena a mayúsculas
Handlebars.registerHelper('toUpperCase', function(str) {
    if (typeof str !== 'string') return '';
    return str.charAt(0).toUpperCase();
});

// Helper para formatear una fecha en formato dd/mm/aaaa hh:mm:ss a.m./p.m.
Handlebars.registerHelper('formatDateBitacora', function (date) {
    if (!date) return '';

    // Si la fecha es un objeto Date, convertimos a string en formato 'YYYY-MM-DD'
    if (date instanceof Date) {
        date = date.toISOString().split('T')[0]; // 'YYYY-MM-DD'
    }

    // Ahora que date es una cadena, la dividimos y la formateamos
    const [year, month, day] = date.split('-');

    // Creamos una nueva fecha para obtener la hora
    const dateObject = new Date(date);
    let hours = dateObject.getHours();
    let minutes = dateObject.getMinutes();
    let seconds = dateObject.getSeconds();
    let ampm = hours >= 12 ? 'pm' : 'am';

    // Ajustamos el formato de 12 horas
    hours = hours % 12;
    hours = hours ? hours : 12; // La hora 0 debe ser 12
    minutes = minutes < 10 ? '0' + minutes : minutes;
    seconds = seconds < 10 ? '0' + seconds : seconds;

    return `${day}/${month}/${year} ${hours}:${minutes}:${seconds} ${ampm}`;
});

Handlebars.registerHelper('formatDate', function (date) {
    if (!date) return '';

    // Asegúrate de que la fecha es un string válido o un objeto Date
    let dateObject = new Date(date);
    
    // Si la fecha no es válida, retornar vacío
    if (isNaN(dateObject.getTime())) return '';

    // Extraemos los componentes de la fecha
    const day = String(dateObject.getDate()).padStart(2, '0');
    const month = String(dateObject.getMonth() + 1).padStart(2, '0'); // Mes comienza desde 0
    const year = dateObject.getFullYear();
    
    // Extraemos la hora, minutos y segundos
    let hours = String(dateObject.getHours()).padStart(2, '0');
    let minutes = String(dateObject.getMinutes()).padStart(2, '0');
    let seconds = String(dateObject.getSeconds()).padStart(2, '0');

    // Devolvemos el formato esperado
    return `${day}/${month}/${year} ${hours}:${minutes}:${seconds}`;
});

// Helper para formatear una fecha de tipo timestamp en formato dd/mm/aaaa hh:mm:ss
Handlebars.registerHelper('formatDateTimestamp', function (timestamp) {
    if (!timestamp) return '';

    // Aseguramos que timestamp es un número
    if (typeof timestamp !== 'number') {
        return ''; // Si no es un número, retornamos vacío
    }

    // Creamos un objeto Date a partir del timestamp (milisegundos desde la época Unix)
    const dateObject = new Date(timestamp);

    // Extraemos la fecha y hora
    const year = dateObject.getFullYear();
    const month = String(dateObject.getMonth() + 1).padStart(2, '0'); // Mes 0-11, se ajusta a 1-12
    const day = String(dateObject.getDate()).padStart(2, '0');
    let hours = dateObject.getHours();
    let minutes = dateObject.getMinutes();
    let seconds = dateObject.getSeconds();

    // Ajustamos el formato de 24 horas
    hours = String(hours).padStart(2, '0');
    minutes = String(minutes).padStart(2, '0');
    seconds = String(seconds).padStart(2, '0');

    // Devolvemos el formato dd/mm/aaaa hh:mm:ss
    return `${day}/${month}/${year} ${hours}:${minutes}:${seconds}`;
});

Handlebars.registerHelper('formatDuration', function(durationMs) {
    if (!durationMs || durationMs <= 0) return 'En proceso';
  
    let duration = moment.duration(durationMs);
    let days = duration.days();
    let hours = duration.hours();
    let minutes = duration.minutes();
    let seconds = duration.seconds();
  
    let result = '';
    if (days > 0) result += days + 'd ';
    if (hours > 0) result += hours + 'h ';
    if (minutes > 0) result += minutes + 'm ';
    result += seconds + 's';
  
    return result;
  });

// Helper para formatear una fecha en formato PDF sin modificarla
Handlebars.registerHelper('formatDatePDF', function (date) {
    if (!date) return '';

    // Si la fecha es un objeto Date, convertimos a string en formato 'YYYY-MM-DD'
    if (date instanceof Date) {
        date = date.toISOString().split('T')[0]; // 'YYYY-MM-DD'
    }

    // Ahora que date es una cadena, la dividimos y la formateamos
    const [year, month, day] = date.split('-');
    return `${day}/${month}/${year}`;
});

// Helper para formatear una fecha en formato aaaa-mm-dd para inputs de tipo date
Handlebars.registerHelper('formatDateForInput', function (date) {
    if (!date) return '';
    // Convertir directamente la fecha a cadena ISO y ajustarla al formato requerido
    const isoDate = new Date(date).toISOString(); // Formato ISO UTC
    const [datePart, timePart] = isoDate.split('T'); // Separar la fecha y la hora
    const timeWithoutMs = timePart.split('.')[0]; // Eliminar los milisegundos
    return `${datePart}T${timeWithoutMs}`; // Formato aaaa-mm-ddThh:mm:ss
});

Handlebars.registerHelper('formatDateForInput2', function (date) {
    if (!date) return '';
    // Convertir directamente la fecha al formato ISO y tomar solo la parte de la fecha
    const isoDate = new Date(date).toISOString(); // Formato ISO UTC
    const [datePart] = isoDate.split('T'); // Tomar solo la parte de la fecha
    return datePart; // Formato aaaa-mm-dd
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
    if (typeof route !== 'string') return ''; // Verifica si route es una cadena

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

// Definir el helper `times`
Handlebars.registerHelper('times', function(n, options) {
    let accum = '';
    for (let i = 0; i < n; i++) {
        accum += options.fn(this);
    }
    return accum;
});

// Helper para definir colores según el método HTTP
Handlebars.registerHelper('methodColor', (method) => {
    switch (method) {
        case 'GET': return '#0f0'; // Verde para GET
        case 'POST': return '#44d'; // Azul para POST
        case 'PUT': return '#ffa500'; // Naranja para PUT
        case 'DELETE': return '#f00'; // Rojo para DELETE
        default: return '#ff0'; // Amarillo por defecto
    }
});

// Helper para definir colores según el código de estado
Handlebars.registerHelper('statusColor', (statusCode) => {
    if (statusCode >= 200 && statusCode < 300) return '#0f0'; // Verde para códigos 2xx
    if (statusCode >= 300 && statusCode < 400) return '#00f'; // Azul para códigos 3xx
    if (statusCode >= 400 && statusCode < 500) return '#ffa500'; // Naranja para códigos 4xx
    if (statusCode >= 500) return '#f00'; // Rojo para códigos 5xx
    return '#f00'; // Rojo por defecto
});

// Helper para truncar texto si es demasiado largo
Handlebars.registerHelper('truncate', (text, maxLength) => {
    if (text.length > maxLength) {
        return text.substring(0, maxLength) + '...';
    }
    return text;
});

module.exports = Handlebars;