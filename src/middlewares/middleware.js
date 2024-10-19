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
                  permiso: {
                    include: {
                      modulos: true, // Obtener los módulos relacionados con los permisos
                    },
                  },
                },
              },
            },
          },
        },
      });

      // Asegurarse de que el usuario tiene un rol y permisos
      if (!usuario || !usuario.rol) {
        return res.redirect('/login');
      }

      const rol = usuario.rol;
      const permisos = rol.permisos || []; // Array de RolPermiso objects

      // Filtrar permisos cuyos módulos están activos o que no tienen módulos asociados (rutas sin módulo)
      const permisosActivos = permisos.filter(p => p.permiso.modulos.length === 0 || p.permiso.modulos.some(modulo => modulo.activo));

      const method = req.method; // Obtener el método HTTP usado

      //console.log('Ruta solicitada (normalizada):', path, 'Método:', method);
      //console.log('Permisos activos del rol:', permisosActivos.map(p => `${p.permiso.ruta}:${p.permiso.metodo}`));

      // Función para verificar si el rol tiene permisos para la ruta actual
      const hasPermission = permisosActivos.some((rolPermiso) => {
        const { ruta, metodo } = rolPermiso.permiso;

        // Verificar si la ruta solicitada coincide con el patrón del permiso
        const isRouteMatch = isMatch(ruta, path);

        //console.log(`Verificando permiso para la ruta: ${ruta}, método: ${metodo}, es coincidencia: ${isRouteMatch}`);
        return isRouteMatch && metodo === method;
      });

      console.log('¿Tiene permiso?', hasPermission);

      if (!hasPermission) {
        return res.status(403).render('errors/403', { layout: 'error', title: '403 - Acceso denegado' });
      }

      // Crear un objeto de módulos para el menú (con presencia de módulos activos)
      const modulosActivos = permisosActivos.map(p => p.permiso.modulos.map(m => m.nombre)).flat();
      const modulos = {
        dashboard: modulosActivos.includes('dashboard'),
        facturacion: modulosActivos.includes('facturacion'),
        contratos_servicios: modulosActivos.includes('contratos_servicios'),
        clientes: modulosActivos.includes('clientes'),
        gestion_cpes: modulosActivos.includes('gestion_cpes'),
        gestion_usuarios: modulosActivos.includes('gestion_usuarios'),
        gestion_modulos: modulosActivos.includes('gestion_modulos'),
      };

      // Guardar los módulos accesibles en la respuesta para mostrarlos en el menú
      res.locals.modulos_active = modulos; // Objeto con módulos activos

      // Continuar con la ruta si el usuario está autenticado y tiene permisos
      next();
    } catch (error) {
      console.error('Error en el middleware de autenticación:', error);
      return res.status(500).render('errors/500', { layout: 'error', title: '500 - Error interno del servidor' });
    }
  },

  // Middleware para redirigir al dashboard si el usuario está autenticado
  redirectIfAuthenticated: (req, res, next) => {
    if (req.session.user) {
      // Si el usuario está autenticado, redirigir según su rol
      if (req.session.role === 'Administrador') {
        return res.redirect('/servicios');
      }
      return res.redirect('/'); // Redirigir a la página de usuario normal
    }
    next();
  },
};
