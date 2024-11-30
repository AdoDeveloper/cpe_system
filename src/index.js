// Configuración Inicial
require('dotenv').config();
const express = require('express');
const path = require('path');
const session = require('express-session');
const flash = require('connect-flash');
const morgan = require('morgan');
const exphbs = require('express-handlebars');
const methodOverride = require('method-override');
const http = require('http');
const axios = require('axios');
const cron = require('node-cron');
const rateLimit = require('express-rate-limit');
const { PrismaClient } = require('@prisma/client');
const { authMiddleware, redirectIfAuthenticated } = require('./middlewares/middleware');
const prisma = new PrismaClient();

const app = express();
const server = http.createServer(app);
const io = require('socket.io')(server);

// Configuración del Servidor
app.set('port', process.env.PORT || 4500);
app.set('trust proxy', 1);
app.set('views', path.join(__dirname, 'views'));

// Configuración del Motor de Plantillas (Handlebars)
app.engine('.hbs', exphbs.engine({
  defaultLayout: 'main',
  layoutsDir: path.join(app.get('views'), 'layouts'),
  partialsDir: path.join(app.get('views'), 'partials'),
  extname: '.hbs',
  Handlebars: require('./lib/handlebars'),
}));
app.set('view engine', '.hbs');

// Middlewares Globales

// Registro de solicitudes HTTP
app.use(morgan('dev'));

// Parseo de solicitudes con límites de tamaño
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: false, limit: '10mb' }));

// Sobrescritura de métodos HTTP
app.use(methodOverride('_method'));

// Cachear archivos estáticos en 'public'
app.use(express.static(path.join(__dirname, '..', 'public'), {
  maxAge: '1d', // 1 día
  etag: true,   // Activar ETag para validación del caché
  setHeaders: (res, filePath) => {
    if (filePath.endsWith('.html')) {
      res.setHeader('Cache-Control', 'no-cache'); // Evitar cachear HTML dinámico
    } else {
      res.setHeader('Cache-Control', 'public, max-age=86400'); // Cache de 1 día
    }
  },
}));

// Configuración de Límite de Solicitudes
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutos
  max: 100, // Limita a 100 solicitudes por IP
  message: "Demasiadas solicitudes desde esta IP, por favor intenta nuevamente más tarde.",
});
app.use(limiter);

// Middleware para establecer encabezados de seguridad
app.use((req, res, next) => {
  res.setHeader('X-Frame-Options', 'DENY'); // Evitar embebido en iframes
  res.setHeader('X-XSS-Protection', '1; mode=block'); // Protección contra XSS
  res.setHeader('Referrer-Policy', 'no-referrer'); // Controla la información referrer
  res.setHeader('Permissions-Policy', 'geolocation=(self), microphone=()'); // Controla permisos
  next();
});

// Configuración de Sesiones
app.use(session({
  secret: process.env.SESSION_SECRET,
  resave: false,
  saveUninitialized: false,
  cookie: {
    maxAge: 24 * 60 * 60 * 1000, // 24 horas
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production', // Seguro en producción
    sameSite: 'lax',
  },
}));

// Middleware para Mensajes Flash
app.use(flash());

// Middlewares Personalizados
const notificacionesMiddleware = require('./middlewares/notificacionesMiddleware');
const loggingMiddleware = require('./middlewares/loggingMiddleware');
app.use(notificacionesMiddleware);
app.use(loggingMiddleware);

// Variables Globales para las Vistas
app.use((req, res, next) => {
  res.locals.success_msg = req.flash('success_msg');
  res.locals.error_msg = req.flash('error_msg');
  res.locals.layout = req.session.user ? (req.session.isAdmin ? 'main' : 'user') : 'auth';
  res.locals.isAdmin = req.session.isAdmin || false;
  res.locals.userName = req.session.userName || null;
  next();
});

// Desactivar Cabecera "X-Powered-By"
app.disable('x-powered-by');

// Conexión a Base de Datos
require('./lib/mongoose');

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
const politicasRoutes = require('./routes/politicasRoutes');
const configuracionesRoutes = require('./routes/configuracionesRoutes');
const perfilRoute = require('./routes/perfilRoute');
const ticketsRoutes = require('./routes/ticketsRoutes');
const facturacionRoutes = require('./routes/facturacionRoutes');
const movimientosRoutes = require('./routes/movimientosRoutes');
const pagosRoutes = require('./routes/pagosRoutes');
const dashboardRoute = require('./routes/dashboardRoute');
const bitacorasRoutes = require('./routes/bitacorasRoutes');
const costosRoutes = require('./routes/costosRoutes');

// Rutas Públicas
app.use('/login', redirectIfAuthenticated, loginRoutes);
app.use('/logout', authMiddleware, logoutRoute);

// Rutas Protegidas
app.use('/servicios', authMiddleware, serviciosRoutes);
app.use('/clientes', authMiddleware, clientesRoutes);
app.use('/usuarios', authMiddleware, usuariosRoutes);
app.use('/roles', authMiddleware, rolesRoutes);
app.use('/equipos', authMiddleware, equiposRoutes);
app.use('/modulos', authMiddleware, modulosRoutes);
app.use('/contratos', authMiddleware, contratosRoutes);
app.use('/politicas', authMiddleware, politicasRoutes);
app.use('/configuraciones', authMiddleware, configuracionesRoutes);
app.use('/tickets', authMiddleware, ticketsRoutes);
app.use('/facturacion', authMiddleware, facturacionRoutes);
app.use('/movimientos', authMiddleware, movimientosRoutes);
app.use('/pagos', authMiddleware, pagosRoutes);
app.use('/costos',authMiddleware, costosRoutes);
app.use('/dashboard', authMiddleware, dashboardRoute);
app.use('/bitacoras', authMiddleware, bitacorasRoutes);
app.use('/', authMiddleware, homeRoutes, loginRoutes);
app.use('/perfil', authMiddleware, perfilRoute);

// Manejo de Errores 404
app.use((req, res, next) => {
  res.status(404).render('errors/404', { layout: 'error', title: '404 - Página no encontrada' });
});

// Cron Jobs
cron.schedule('0 0 1 * *', async () => {
  console.log('Ejecución mensual...');
  try {
    await prisma.$executeRaw`CALL public.generarpagosfactmensual()`;
    console.log('Procedimiento ejecutado.');
  } catch (error) {
    console.error('Error:', error.message);
  }
});

cron.schedule('*/14 * * * *', async () => {
  try {
    await axios.get('https://cpe-system-0pgi.onrender.com/');
    console.log('Ping exitoso.');
  } catch (error) {
    console.error('Error en el ping:', error.message);
  }
});

// Inicializar Socket.IO
const { initializeSocket } = require('./controllers/ticketsController');
initializeSocket(io);

// Iniciar Servidor
server.listen(app.get('port'), () => {
  console.log(`Servidor iniciado en: http://localhost:${app.get('port')}`);
});

// Exportar la Aplicación
module.exports = { app };