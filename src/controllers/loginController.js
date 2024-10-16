const { PrismaClient } = require('@prisma/client');
const bcrypt = require('bcryptjs');
const prisma = new PrismaClient();

const loginController = {};

// Renderiza el formulario de login
loginController.renderLoginForm = (req, res) => {
  res.setHeader('Cache-Control', 'no-store'); // Desactivar caché para esta página
    res.render('pages/login', { layout: 'auth', title: 'Iniciar Sesion | Airlink' });
};

// Procesa el formulario de login
loginController.processLogin = async (req, res) => {
  const { email, password } = req.body;

  try {
    // Buscar al usuario por email
    const usuario = await prisma.usuario.findUnique({
      where: { email: email },
      include: { rol: true }, // Incluir el rol del usuario
    });

    // Verificar si el usuario existe
    if (!usuario) {
      return res.render('pages/login', {
        layout: 'auth',
        title: 'Iniciar Sesion | Airlink',
        error_msg: 'Credenciales incorrectas',
      });
    }

    // Verificar la contraseña
    const validPassword = await bcrypt.compare(password, usuario.password);
    if (!validPassword) {
      return res.render('pages/login', {
        layout: 'auth',
        title: 'Iniciar Sesion | Airlink',
        error_msg: 'Credenciales incorrectas',
      });
    }

    // Guardar el usuario y rol en la sesión
    req.session.user = usuario.email;
    req.session.role = usuario.rol.nombre;

    // Redirigir según el rol
    if (usuario.rol.nombre === 'Administrador') {
      return res.redirect('/servicios');
    } else {
      return res.redirect('/');
    }
  } catch (error) {
    console.error('Error al procesar el login:', error);
    return res.status(500).render('errors/500', { layout: 'error', title: '500 - Error al procesar el login' });
  } finally {
    await prisma.$disconnect();
  }
};

// Procesar el logout
loginController.logout = (req, res) => {
  req.session.destroy((err) => {
      if (err) {
          console.error('Error al cerrar sesión:', err);
          res.status(500).render('errors/500', { layout: 'error', title: '500 - Error al cerrar sesión' });
      }
      res.clearCookie('connect.sid'); // Eliminar la cookie de sesión
      res.redirect('/login'); // Redirigir a login después de cerrar sesión
  });
};


module.exports = loginController;
