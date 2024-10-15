// src/index.js
require('dotenv').config(); // Cargar variables de entorno desde .env
const express = require('express'); // Importar express para manejar el servidor
const path = require('path'); // Para manejar rutas de archivos
const session = require('express-session'); // Para manejar sesiones del usuario
const flash = require('connect-flash'); // Para manejar mensajes flash en la sesión
const morgan = require('morgan'); // Middleware para ver las solicitudes en la consola
const exphbs = require("express-handlebars"); // Motor de plantillas handlebars

const app = express(); // Inicializar la aplicación express

// Ajustes del servidor
app.set("port", process.env.PORT || 4500); // Establecer el puerto del servidor
app.set("views", path.join(__dirname, "views")); // Configuración de la ruta donde se encuentran las vistas

// Configuración del motor de plantillas Handlebars
app.engine(
  ".hbs",
  exphbs.engine({
    defaultLayout: "main", // Configuración del layout principal
    layoutsDir: path.join(app.get("views"), "layouts"), // Configuración de la ruta de los layouts
    partialsDir: path.join(app.get("views"), "partials"), // Configuración de vistas parciales
    extname: ".hbs", // Configura la extensión que tendrán los archivos
    helpers: require("./lib/handlebars"), // Configuración de funciones (helpers) personalizadas
  })
);
app.set("view engine", ".hbs"); // Configuración para ejecutar el motor de plantillas

// Middleware para manejar datos del cuerpo de la solicitud
app.use(express.urlencoded({ extended: false })); // Para recibir datos de formularios
app.use(express.json()); // Para manejar datos en formato JSON

// Configurar la carpeta 'public' para archivos estáticos (CSS, imágenes, scripts)
app.use(express.static(path.join(__dirname, '..', 'public')));

// Configuración de sesiones del usuario
app.use(
  session({
    secret: 'MySecretKey345', // Llave secreta para firmar la sesión
    resave: false, // No guardar la sesión si no hay cambios
    saveUninitialized: true, // Guardar sesiones no inicializadas
  })
);

// Middleware para mostrar mensajes flash
app.use(flash());

// Middleware para ver las solicitudes HTTP en la consola
app.use(morgan('dev')); // Mostrar detalles de cada solicitud en la consola

// Variables globales para almacenar mensajes flash
app.use((req, res, next) => {
  res.locals.success_msg = req.flash('success_msg'); // Mensajes de éxito
  res.locals.error_msg = req.flash('error_msg'); // Mensajes de error
  next(); // Continuar con la siguiente middleware
});

// Rutas principales
const loginRoutes = require('./routes/loginRoutes'); // Rutas para el login
const serviciosRoutes = require('./routes/serviciosRoutes'); // Rutas para servicios

// Middlewares para proteger rutas (verifica si el usuario está autenticado)
const authMiddleware = require('./middlewares/authMiddleware'); // Middleware de autenticación

// Configurar las rutas con middleware de autenticación donde sea necesario
app.use('/servicios', serviciosRoutes); // Rutas de servicios (sin autenticación por ahora)
app.use('/login', loginRoutes); // Rutas públicas para el login

// Archivos públicos (aquí se coloca todo el código al que el navegador puede acceder)
app.use(express.static(path.join(__dirname, "public"))); // Archivos estáticos

// Iniciar el servidor
app.listen(app.get("port"), () => {
  console.log(`Servidor iniciado en el puerto: http://localhost:${app.get("port")}`);
});

module.exports = app; // Exportar la aplicación express para usar en otros módulos
