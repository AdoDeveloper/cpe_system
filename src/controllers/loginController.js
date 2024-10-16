const { PrismaClient } = require('@prisma/client');
const bcrypt = require('bcryptjs');
const prisma = new PrismaClient();

const loginController = {};

// Renderiza el formulario de login
loginController.renderLoginForm = (req, res) => {
  res.render('pages/login', { layout: 'auth', title: 'Log in' });
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
    res.status(500).render('pages/login', {
      layout: 'auth',
      title: 'Iniciar Sesion | Airlink',
      error_msg: 'Ocurrió un error, por favor intenta nuevamente.',
    });
  } finally {
    await prisma.$disconnect();
  }
};

// Procesar el logout
loginController.logout = (req, res) => {
  req.session.destroy((err) => {
    if (err) {
      console.error('Error al cerrar sesión:', err);
    }
    res.redirect('/login'); // Redirigir a la página de login después de cerrar sesión
  });
};

module.exports = loginController;
