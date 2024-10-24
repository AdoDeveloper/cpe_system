// src/index.js
require('dotenv').config(); // Cargar variables de entorno desde .env
const express = require('express'); // Importar express para manejar el servidor
const path = require('path'); // Para manejar rutas de archivos
const session = require('express-session'); // Para manejar sesiones del usuario
const flash = require('connect-flash'); // Para manejar mensajes flash en la sesión
const morgan = require('morgan'); // Middleware para ver las solicitudes en la consola
const exphbs = require("express-handlebars"); // Motor de plantillas handlebars
const methodOverride = require('method-override'); // Importar method-override

const { authMiddleware, redirectIfAuthenticated } = require('./middlewares/middleware');

const app = express(); // Inicializar la aplicación express

// Configurar method-override
app.use(methodOverride('_method')); // Usa el query parameter

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
    Handlebars: require("./lib/handlebars"), // Configuración de funciones (helpers) personalizadas
  })
);
app.set("view engine", ".hbs"); // Configuración para ejecutar el motor de plantillas

// Middleware para manejar datos del cuerpo de la solicitud
app.use(express.urlencoded({ extended: false })); // Para recibir datos de formularios
app.use(express.json()); // Para manejar datos en formato JSON

// Configurar la carpeta 'public' para archivos estáticos (CSS, imágenes, scripts)
app.use(express.static(path.join(__dirname, '..', 'public')));

// Configuración del middleware de sesión
app.use(session({
  secret: process.env.SESSION_SECRET, // Utiliza la clave secreta del archivo .env
  resave: false, // No guarda la sesión si no hay cambios
  saveUninitialized: false, // No guarda sesiones no inicializadas
  cookie: {
    maxAge: 24 * 60 * 60 * 1000, // Duración de la sesión: 24 horas
    httpOnly: true, // Previene el acceso a la cookie desde JavaScript
    secure: false, // Solo en true si estás usando HTTPS
    sameSite: 'lax' // Controla el acceso de la cookie en solicitudes cross-site
  }
}));

// Middleware para mostrar mensajes flash
app.use(flash());

// Middleware para ver las solicitudes HTTP en la consola
app.use(morgan('dev')); // Mostrar detalles de cada solicitud en la consola

// Variables globales para almacenar mensajes flash y determinar el layout
app.use((req, res, next) => {
  res.locals.success_msg = req.flash('success_msg'); // Mensajes de éxito
  res.locals.error_msg = req.flash('error_msg'); // Mensajes de error

  // Determinar el layout según si el usuario está autenticado y su rol
  if (req.session.user) {
    if (req.session.isAdmin) { // Validar si es admin con el campo `isAdmin`
      res.locals.layout = 'main'; // Layout principal para admin
      res.locals.isAdmin = true; // Variable para validar si es admin
    } else {
      res.locals.layout = 'user'; // Layout de usuario estándar
      res.locals.isAdmin = false;
    }
  } else {
    res.locals.layout = 'auth'; // Layout de autenticación si no está autenticado
  }

  next(); // Continuar con la siguiente middleware
});

// Middleware global para hacer que `userName` esté disponible en las vistas
app.use((req, res, next) => {
  if (req.session.userName) {
    res.locals.userName = req.session.userName;  // Hacer que userName esté disponible en las vistas
  }
  next();
});

// Rutas
const loginRoutes = require('./routes/loginRoutes');
const logoutRoute = require('./routes/logoutRoute');
const serviciosRoutes = require('./routes/serviciosRoutes');
const homeRoutes = require('./routes/homeRoutes');
const clientesRoutes = require('./routes/clientesRoutes');
const usuariosRoutes = require('./routes/usuariosRoutes');
const rolesRoutes = require('./routes/rolesRoutes');
const equiposRoutes = require('./routes/equiposRoutes');
const modulosRoutes = require('./routes/modulosRoutes');
const contratosRoutes = require('./routes/contratosRoutes');
const configuracionesRoutes = require('./routes/configuracionesRoutes');
const perfilRoute = require('./routes/perfilRoute');

// Rutas públicas
app.use('/login', redirectIfAuthenticated, loginRoutes);

// Ruta pública para logout
app.use('/logout', authMiddleware, logoutRoute);

// Rutas protegidas para usuarios admin
app.use('/servicios', authMiddleware, serviciosRoutes);
app.use('/clientes', authMiddleware, clientesRoutes);
app.use('/usuarios', authMiddleware, usuariosRoutes);
app.use('/roles', authMiddleware, rolesRoutes);
app.use('/equipos', authMiddleware, equiposRoutes);
app.use('/modulos', authMiddleware, modulosRoutes);
app.use('/contratos', authMiddleware, contratosRoutes);
app.use('/configuraciones',authMiddleware, configuracionesRoutes);

// Rutas protegidas para usuarios no admin
app.use('/', authMiddleware, homeRoutes, loginRoutes); 
app.use('/perfil', authMiddleware, perfilRoute);

// Archivos públicos (aquí se coloca todo el código al que el navegador puede acceder)
app.use(express.static(path.join(__dirname, "public"))); // Archivos estáticos

// Manejo de errores 404
app.use((req, res, next) => {
  res.status(404).render('errors/404', { layout: 'error', title: '404 - Página no encontrada' });
});

// Iniciar el servidor
app.listen(app.get("port"), () => {
  console.log(`Servidor iniciado en el puerto: http://localhost:${app.get("port")}`);
});

module.exports = app; // Exportar la aplicación express para usar en otros módulos
