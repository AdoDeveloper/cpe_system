// src/middleware/middleware.js

const { PrismaClient } = require('@prisma/client');
const { isMatch } = require('../lib/pathMatcher'); // Importa la función personalizada
const prisma = new PrismaClient();

module.exports = {
  // Middleware de autenticación
  authMiddleware: async (req, res, next) => {
    try {
      // Definir las rutas que requieren solo estar autenticado, pero sin verificar permisos de rol
      const authOnlyRoutes = ['/logout'];

      // Ignorar las solicitudes de favicon
      if (req.originalUrl.includes('favicon.ico')) {
        return next();
      }

      // Si el usuario no está autenticado, redirigir al login
      if (!req.session.user) {
        return res.redirect('/login');
      }

      // Normalizar la ruta solicitada (eliminar barra final y convertir a minúsculas)
      let path = req.originalUrl.split('?')[0].toLowerCase();
      if (path === '') path = '/'; // Asegurarse de que la ruta '/' se mantiene

      // Si la ruta es solo para autenticación (como /logout), permitir el acceso sin verificar permisos
      if (authOnlyRoutes.includes(path)) {
        return next();
      }

      // Buscar el usuario y su rol en la base de datos, incluyendo los permisos y módulos activos
      const usuario = await prisma.usuario.findUnique({
        where: { email: req.session.user },
        include: {
          rol: {
            include: {
              permisos: {
                include: {
                  permiso: true,
                },
              },
              modulos: true, // Obtener los módulos asignados al rol
            },
          },
        },
      });

      // Asegurarse de que el usuario tiene un rol y permisos
      if (!usuario || !usuario.rol) {
        return res.redirect('/login');
      }

      const rol = usuario.rol;
      const permisos = rol.permisos.map((p) => p.permiso); // Obtener los permisos

      // Obtener los módulos activos asignados al rol
      const modulosActivos = rol.modulos.filter((modulo) => modulo.activo);

      // Incluir las rutas de los módulos
      for (const modulo of modulosActivos) {
        const rutas = await prisma.ruta.findMany({
          where: {
            moduloId: modulo.id,
          },
          orderBy: { id: 'asc' },
        });
        modulo.rutas = rutas;
      }

      // Guardar los módulos activos y sus rutas en res.locals
      res.locals.modulos = modulosActivos;

      const method = req.method; // Obtener el método HTTP usado

      // Función para verificar si el rol tiene permisos para la ruta actual
      const hasPermission = permisos.some((permiso) => {
        const { ruta, metodo } = permiso;

        // Verificar si la ruta solicitada coincide con el patrón del permiso
        const isRouteMatch = isMatch(ruta, path);

        return isRouteMatch && metodo === method;
      });

      console.log('¿Tiene permiso?', hasPermission);

      if (!hasPermission) {
        return res.status(403).render('errors/403', { layout: 'error', title: '403 - Acceso denegado' });
      }

      // Continuar con la ruta si el usuario está autenticado y tiene permisos
      next();
    } catch (error) {
      console.error('Error en el middleware de autenticación:', error);
      return res.status(500).render('errors/500', { layout: 'error', title: '500 - Error interno del servidor' });
    } finally {
      await prisma.$disconnect();
    }
  },

  // Middleware para redirigir al dashboard si el usuario está autenticado
  redirectIfAuthenticated: (req, res, next) => {
    if (req.session.user) {
      // Verificar si el rol del usuario tiene la propiedad `esAdmin`
      if (req.session.role?.esAdmin) {
        return res.redirect('/servicios');
      }
      return res.redirect('/'); // Redirigir a la página de usuario normal
    }
    next();
  },
};
