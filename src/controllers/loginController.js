const { PrismaClient } = require('@prisma/client');
const bcrypt = require('bcryptjs');
const prisma = new PrismaClient();

const loginController = {};

// Renderiza el formulario de login
loginController.renderLoginForm = (req, res) => {
  res.setHeader('Cache-Control', 'no-store'); // Desactivar caché para esta página
  res.render('pages/login', { layout: 'auth', title: 'Iniciar Sesión | Airlink' });
};

// Procesa el formulario de login
loginController.processLogin = async (req, res) => {
  const { email, password, remember } = req.body;

  try {
    // Buscar al usuario por email e incluir el rol con el campo esAdmin
    const usuario = await prisma.usuario.findUnique({
      where: { email: email },
      include: { rol: true }, // Incluir el rol del usuario
    });

    // Verificar si el usuario existe
    if (!usuario) {
      req.flash('error_msg', 'Credenciales incorrectas');
      return res.redirect('/login');
    }

    // Verificar si el usuario está activo
    if (!usuario.activo) {
      req.flash('error_msg', 'Cuenta deshabilitada, ponte en contacto con el administrador.');
      return res.redirect('/login');
    }

    // Verificar la contraseña
    const validPassword = await bcrypt.compare(password, usuario.password);
    if (!validPassword) {
      req.flash('error_msg', 'Credenciales incorrectas');
      return res.redirect('/login');
    }

    // Guardar el usuario en la sesión
    req.session.user = usuario.email;
    req.session.isAdmin = usuario.rol.esAdmin;
    req.session.userName = usuario.nombre;

    // Si el checkbox "Recuérdame" está marcado, establecer una cookie persistente
    if (remember) {
      // Establecer cookie con una duración de 7 días
      res.cookie('user_email', usuario.email, { maxAge: 7 * 24 * 60 * 60 * 1000, httpOnly: true }); // 7 días
    } else {
      // Asegurarse de que no se establezca una cookie persistente
      res.clearCookie('user_email');
    }

     // Agregar mensaje flash de éxito
     req.flash('success_msg', 'Inicio de sesión exitoso');

    // Redirigir según si es administrador o no
    if (usuario.rol.esAdmin) {
      return res.status(200).redirect('/servicios');
    } else {
      return res.status(200).redirect('/');
    }
  } catch (error) {
    console.error('Error al procesar el login:', error);
    req.flash('error_msg', 'Error al procesar el login');
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
      req.flash('error_msg', 'Error al cerrar sesión');
      return res.redirect('/login');
    }
    res.clearCookie('connect.sid'); // Eliminar la cookie de sesión
    res.clearCookie('user_email'); // Eliminar la cookie de "Recuérdame"
    res.status(200).redirect('/login');
  });
};

module.exports = loginController;