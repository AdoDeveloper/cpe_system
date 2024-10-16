module.exports = {
  // Middleware de autenticación
  authMiddleware: (req, res, next) => {
    // Si el usuario no está autenticado, redirigir al login
    if (!req.session.user) {
      return res.redirect('/login');
    }

    // Si la ruta requiere ser administrador y el usuario no lo es
    if (req.originalUrl.startsWith('/servicios') && req.session.role !== 'Administrador') {
      return res.status(403).send('Acceso prohibido: No tienes permisos para acceder a esta ruta.'); 
    }

    if (req.originalUrl.startsWith('/usuarios') && req.session.role !== 'Administrador') {
      return res.status(403).send('Acceso prohibido: No tienes permisos para acceder a esta ruta.'); 
    }

    if (req.originalUrl.startsWith('/roles') && req.session.role !== 'Administrador') {
      return res.status(403).send('Acceso prohibido: No tienes permisos para acceder a esta ruta.'); 
    }

    // Continuar con la ruta si el usuario está autenticado
    next();
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
  }
};
