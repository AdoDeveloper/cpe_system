const { PrismaClient } = require('@prisma/client');
const { isMatch } = require('../lib/pathMatcher');
const prisma = new PrismaClient();

module.exports = {
  authMiddleware: async (req, res, next) => {
    try {
      console.log('--- INICIO MIDDLEWARE ---');

      const authOnlyRoutes = ['/logout', '/perfil', '/'];

      if (req.originalUrl.includes('favicon.ico')) {
        return next();
      }

      if (!req.session.user) {
        console.log('Usuario no autenticado. Redirigiendo a login.');
        return res.redirect('/login');
      }

      let path = req.originalUrl.split('?')[0].toLowerCase();
      if (path === '') path = '/';
      console.log('Ruta solicitada:', path);

      res.locals.currentRoute = path;

      // Buscar el usuario y su rol, incluyendo los módulos asignados a través de RolModulo
      const usuario = await prisma.usuario.findUnique({
        where: { email: req.session.user },
        include: {
          rol: {
            include: {
              modulos: {
                include: {
                  modulo: true, // Obtenemos los detalles de los módulos
                },
              },
              permisos: {
                include: {
                  permiso: {
                    include: {
                      moduloPermisos: {
                        include: { modulo: true },
                      },
                    },
                  },
                },
              },
            },
          },
        },
      });

      if (!usuario) {
        console.log('Usuario no encontrado en la base de datos.');
        return res.redirect('/login');
      }

      const rol = usuario.rol;
      if (!rol) {
        console.log('Rol no asignado al usuario.');
        return res.redirect('/login');
      }

      console.log('Usuario:', usuario.email, 'Rol:', rol.nombre);
      const permisos = rol.permisos.map((p) => p.permiso);

      // Verificar módulos activos a través de RolModulo y ordenar por id ascendente
      const modulosActivos = rol.modulos
        .map((rolModulo) => rolModulo.modulo)
        .filter((modulo) => modulo.activo)
        .sort((a, b) => a.id - b.id); // Ordenar por ID de módulo ascendente

      // Filtrar los módulos con permisos
      const modulosConPermisos = [];
      for (const modulo of modulosActivos) {
        console.log('Verificando módulo:', modulo.nombre);
        const rutas = await prisma.ruta.findMany({
          where: { moduloId: modulo.id },
          orderBy: { id: 'asc' }, // Ordenar las rutas por ID ascendente
        });

        // Filtrar las rutas a las que el usuario tiene acceso
        const rutasConPermiso = rutas.filter((ruta) =>
          permisos.some((permiso) =>
            permiso.moduloPermisos.some(mp => mp.moduloId === modulo.id) &&
            isMatch(permiso.ruta, ruta.ruta) &&
            permiso.metodo === req.method
          )
        );

        // Solo agregar el módulo si tiene rutas permitidas
        if (rutasConPermiso.length > 0) {
          modulo.rutas = rutasConPermiso;
          modulosConPermisos.push(modulo);
        }
      }

      console.log('Módulos con permisos permitidos:', modulosConPermisos.map(m => m.nombre));

      res.locals.modulos_menu = modulosConPermisos; // Enviar los módulos permitidos al menú

      // Si la ruta está en authOnlyRoutes, saltar la verificación de permisos
      if (authOnlyRoutes.includes(path)) {
        return next();
      }

      const method = req.method;
      console.log('Método HTTP usado:', method);

      // Verificar si el usuario tiene permiso para la ruta solicitada
      const hasPermission = permisos.some((permiso) =>
        permiso.moduloPermisos.some(mp => modulosActivos.map(mod => mod.id).includes(mp.moduloId)) &&
        isMatch(permiso.ruta, path) &&
        permiso.metodo === method
      );

      console.log('¿Tiene permiso?', hasPermission);

      if (!hasPermission) {
        console.log('Acceso denegado a la ruta:', path);
        return res.status(403).render('errors/403', { layout: 'error', title: '403 - Acceso denegado' });
      }

      next();
    } catch (error) {
      console.error('Error en el middleware de autenticación:', error);
      return res.status(500).render('errors/500', { layout: 'error', title: '500 - Error interno del servidor' });
    } finally {
      await prisma.$disconnect();
      console.log('--- FIN MIDDLEWARE ---');
    }
  },

  redirectIfAuthenticated: (req, res, next) => {
    if (req.session.user) {
      if (req.session.role?.esAdmin) {
        return res.redirect('/servicios');
      }
      return res.redirect('/');
    }
    next();
  },
};
