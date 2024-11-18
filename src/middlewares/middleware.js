const { PrismaClient } = require('@prisma/client');
const { isMatch } = require('../lib/pathMatcher');
const prisma = new PrismaClient();

module.exports = {
  authMiddleware: async (req, res, next) => {
    try {
      console.log('--- INICIO MIDDLEWARE ---');

      // Rutas que requieren solo autenticación
      const authOnlyRoutes = new Set([
        '/logout',
        '/perfil',
        '/',
        '/tickets',               // Listar tickets
        '/tickets/new',           // Crear nuevo ticket
        '/tickets/timeline/:id',  // Ver timeline de un ticket
        '/tickets/:id/messages',  // Responder al ticket
        '/tickets/:id/updatestatus',
      ]);

      // Permitir favicon sin autenticación
      if (req.originalUrl.includes('favicon.ico')) {
        return next();
      }

      // Si no está autenticado, redirigir al login
      if (!req.session.user) {
        console.log('Usuario no autenticado. Redirigiendo a login.');
        return res.redirect('/login');
      }

      // Obtener ruta y eliminar parámetros de consulta
      let path = req.originalUrl.split('?')[0].toLowerCase();
      if (path === '') path = '/';
      console.log('Ruta solicitada:', path);

      res.locals.currentRoute = path;

      // Obtener usuario y sus permisos
      const usuario = await prisma.usuario.findUnique({
        where: { email: req.session.user },
        include: {
          rol: {
            include: {
              modulos: { include: { modulo: true } },
              permisos: {
                include: {
                  permiso: { include: { moduloPermisos: true } },
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

      const moduloIdsActivos = new Set(modulosActivos.map((mod) => mod.id));

      // Obtener rutas activas
      const rutas = await prisma.ruta.findMany({
        where: { moduloId: { in: Array.from(moduloIdsActivos) } },
        orderBy: { id: 'asc' },
      });

      const rutasPorModulo = new Map();
      for (const ruta of rutas) {
        if (!rutasPorModulo.has(ruta.moduloId)) {
          rutasPorModulo.set(ruta.moduloId, []);
        }
        rutasPorModulo.get(ruta.moduloId).push(ruta);
      }

      // Permisos por módulo y método
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

      const modulosConPermisos = [];
      for (const modulo of modulosActivos) {
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

      const method = req.method;
      console.log('Método HTTP usado:', method);

      // Validar permisos
      const hasPermission = permisos.some((permiso) =>
        permiso.moduloPermisos.some((mp) => moduloIdsActivos.has(mp.moduloId)) &&
        isMatch(permiso.ruta, path) &&
        permiso.metodo === method
      );

      // Validar si la ruta está en las rutas solo de autenticación
      if ([...authOnlyRoutes].some((pattern) => isMatch(pattern, path))) {
            console.log('Ruta permitida sin verificación de permisos:', path);
            return next();
      }
      

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
      return res.redirect('/dashboard');
    }
    next();
  },
};
