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
      req.flash('error_msg', 'Credenciales incorrectas'); // Agregar mensaje flash de error
      return res.redirect('/login');
    }

    // Verificar la contraseña
    const validPassword = await bcrypt.compare(password, usuario.password);
    if (!validPassword) {
      req.flash('error_msg', 'Credenciales incorrectas'); // Agregar mensaje flash de error
      return res.redirect('/login');
    }

    // Guardar el usuario y rol en la sesión
    req.session.user = usuario.email;
    req.session.role = usuario.rol.nombre;

    // Agregar mensaje flash de éxito
    req.flash('success_msg', 'Inicio de sesión exitoso');

    // Redirigir según el rol
    if (usuario.rol.nombre === 'Administrador') {
      return res.status(200).redirect('/servicios');
    } else {
      return res.status(200).redirect('/');
    }
  } catch (error) {
    console.error('Error al procesar el login:', error);
    req.flash('error_msg', 'Error al procesar el login'); // Mensaje flash de error
    return res.status(200).redirect('/login');
  } finally {
    await prisma.$disconnect();
  }
};

// Procesar el logout
loginController.logout = (req, res) => {
  req.session.destroy((err) => {
    if (err) {
      console.error('Error al cerrar sesión:', err);
      req.flash('error_msg', 'Error al cerrar sesión'); // Mensaje flash de error 500
      return res.redirect('/login');
    }
    res.clearCookie('connect.sid'); // Eliminar la cookie de sesión
    res.status(200).redirect('/login'); // Redirigir a login después de cerrar sesión
  });
};

module.exports = loginController;
