const { PrismaClient } = require('@prisma/client');
const bcrypt = require('bcryptjs');
const axios = require('axios');
const prisma = new PrismaClient();

const loginController = {};

// Renderiza el formulario de login
loginController.renderLoginForm = (req, res) => {
  res.setHeader('Cache-Control', 'no-store'); // Desactivar caché para esta página
  res.render('pages/login', { layout: 'auth', title: 'Iniciar Sesión | Airlink' });
};

// Procesa el formulario de login
loginController.processLogin = async (req, res) => {
  const { email, password, remember, 'h-captcha-response': hCaptchaToken } = req.body;

  try {
    // Verificar si el token de hCaptcha está presente
    if (!hCaptchaToken) {
      console.error('Error: No se recibió el token de hCaptcha.');
      req.flash('error_msg', 'Por favor completa la verificación de hCaptcha.');
      return res.redirect('/login');
    }

    console.log('Token de hCaptcha recibido:', hCaptchaToken);

    // Verificar el token de hCaptcha con su API
    const hCaptchaResponse = await axios.post(
      'https://hcaptcha.com/siteverify',
      new URLSearchParams({
        secret: process.env.HCAPTCHA_SECRET_KEY, // Clave secreta de hCaptcha
        response: hCaptchaToken,
      }).toString(),
      {
        headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      }
    );

    console.log('Respuesta de hCaptcha:', hCaptchaResponse.data);

    // Validar la respuesta de hCaptcha
    if (!hCaptchaResponse.data.success) {
      console.error('Error: Validación de hCaptcha fallida:', hCaptchaResponse.data['error-codes']);
      req.flash('error_msg', 'La verificación de hCaptcha falló. Inténtalo nuevamente.');
      return res.redirect('/login');
    }

    // Buscar al usuario por email
    const usuario = await prisma.usuario.findUnique({
      where: { email: email },
      include: { rol: true }, // Incluir el rol del usuario
    });

    // Verificar si el usuario existe
    if (!usuario) {
      req.flash('error_msg', 'Credenciales incorrectas.');
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
      req.flash('error_msg', 'Credenciales incorrectas.');
      return res.redirect('/login');
    }

    // Guardar el usuario en la sesión
    req.session.userId = usuario.id;
    req.session.user = usuario.email;
    req.session.isAdmin = usuario.rol.esAdmin;
    req.session.userName = usuario.nombre;
    req.session.userRole = usuario.rol.nombre;

    // Si el checkbox "Recuérdame" está marcado, establecer una cookie persistente
    if (remember) {
      res.cookie('user_email', usuario.email, { maxAge: 7 * 24 * 60 * 60 * 1000, httpOnly: true });
    } else {
      res.clearCookie('user_email');
    }

    // Agregar mensaje flash de éxito
    req.flash('success_msg', 'Inicio de sesión exitoso.');

    // Redirigir según si es administrador o no
    if (usuario.rol.esAdmin) {
      return res.status(200).redirect('/dashboard');
    } else {
      return res.status(200).redirect('/');
    }
  } catch (error) {
    console.error('Error al procesar el login:', error.message);
    req.flash('error_msg', 'Error al procesar el login.');
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
      req.flash('error_msg', 'Error al cerrar sesión.');
      return res.redirect('/login');
    }
    res.clearCookie('connect.sid'); // Eliminar la cookie de sesión
    res.clearCookie('user_email'); // Eliminar la cookie de "Recuérdame"
    res.status(200).redirect('/login');
  });
};

module.exports = loginController;
