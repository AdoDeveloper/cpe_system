const { PrismaClient } = require('@prisma/client');
const { isMatch } = require('../lib/pathMatcher');
const prisma = new PrismaClient();

module.exports = {
  authMiddleware: async (req, res, next) => {
    try {
      console.log('--- INICIO MIDDLEWARE ---');

      // Define las rutas que requieren solo autenticación
      const authOnlyRoutes = new Set([
        '/logout',
        '/perfil',
        '/',
        '/tickets',               // Listar tickets
        '/tickets/new',           // Crear nuevo ticket
        '/tickets/timeline/:id',  // Ver timeline de un ticket
        '/tickets/:id/messages',    // Responder al ticket
        '/tickets//:id/updateStatus'
      ]);

      // Si la ruta es para favicon, permite el paso sin más verificaciones
      if (req.originalUrl.includes('favicon.ico')) {
        return next();
      }

      // Si el usuario no está autenticado, redirigir al login
      if (!req.session.user) {
        console.log('Usuario no autenticado. Redirigiendo a login.');
        return res.redirect('/login');
      }

      let path = req.originalUrl.split('?')[0].toLowerCase();
      if (path === '') path = '/';
      console.log('Ruta solicitada:', path);
      res.locals.currentRoute = path;

      // Obtener usuario y su rol, con módulos y permisos
      const usuario = await prisma.usuario.findUnique({
        where: { email: req.session.user },
        include: {
          rol: {
            include: {
              modulos: {
                include: { modulo: true },
              },
              permisos: {
                include: {
                  permiso: {
                    include: {
                      moduloPermisos: true,
                    },
                  },
                },
              },
            },
          },
        },
      });

      if (!usuario || !usuario.rol) {
        console.log('Usuario o rol no encontrado en la base de datos.');
        return res.redirect('/login');
      }

      console.log('Usuario:', usuario.email, 'Rol:', usuario.rol.nombre);

      const rol = usuario.rol;
      const permisos = rol.permisos.map((p) => p.permiso);
      const modulosActivos = rol.modulos
        .map((rolModulo) => rolModulo.modulo)
        .filter((modulo) => modulo.activo)
        .sort((a, b) => a.id - b.id);

      // Construir un Set de moduloIds activos para búsquedas rápidas
      const moduloIdsActivos = new Set(modulosActivos.map((mod) => mod.id));

      // Obtener todas las rutas de los módulos activos en una sola consulta
      const rutas = await prisma.ruta.findMany({
        where: { moduloId: { in: Array.from(moduloIdsActivos) } },
        orderBy: { id: 'asc' },
      });

      // Mapear las rutas por moduloId
      const rutasPorModulo = new Map();
      for (const ruta of rutas) {
        if (!rutasPorModulo.has(ruta.moduloId)) {
          rutasPorModulo.set(ruta.moduloId, []);
        }
        rutasPorModulo.get(ruta.moduloId).push(ruta);
      }

      // Construir un Map para permisos por moduloId y método
      const permisosPorModuloYMetodo = new Map();
      for (const permiso of permisos) {
        for (const mp of permiso.moduloPermisos) {
          const key = `${mp.moduloId}:${permiso.metodo}`;
          if (!permisosPorModuloYMetodo.has(key)) {
            permisosPorModuloYMetodo.set(key, []);
          }
          permisosPorModuloYMetodo.get(key).push(permiso);
        }
      }

      // Filtrar los módulos que tienen rutas permitidas para el usuario
      const modulosConPermisos = [];
      for (const modulo of modulosActivos) {
        console.log('Verificando módulo:', modulo.nombre);
        const rutasModulo = rutasPorModulo.get(modulo.id) || [];
        const key = `${modulo.id}:${req.method}`;
        const permisosModulo = permisosPorModuloYMetodo.get(key) || [];

        const rutasConPermiso = rutasModulo.filter((ruta) =>
          permisosModulo.some((permiso) => isMatch(permiso.ruta, ruta.ruta))
        );

        if (rutasConPermiso.length > 0) {
          modulo.rutas = rutasConPermiso;
          modulosConPermisos.push(modulo);
        }
      }

      console.log('Módulos con permisos permitidos:', modulosConPermisos.map((m) => m.nombre));
      res.locals.modulos_menu = modulosConPermisos;
      res.locals.userId = usuario.id;
      res.locals.userRol = usuario.rol.nombre;

      // Si la ruta está en `authOnlyRoutes`, saltar la verificación de permisos
      if (authOnlyRoutes.has(path)) {
        return next();
      }

      const method = req.method;
      console.log('Método HTTP usado:', method);

      // Verificar si el usuario tiene permiso para la ruta solicitada
      const hasPermission = permisos.some((permiso) =>
        permiso.moduloPermisos.some((mp) => moduloIdsActivos.has(mp.moduloId)) &&
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
    }
  },

  redirectIfAuthenticated: (req, res, next) => {
    if (req.session.user) {
      if (req.session.role?.esAdmin) {
        return res.redirect('/dashboard');
      }
      return res.redirect('/');
    }
    next();
  },
};
