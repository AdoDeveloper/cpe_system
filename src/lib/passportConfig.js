const passport = require('passport');
const LocalStrategy = require('passport-local').Strategy;
const bcrypt = require('bcrypt');

// Simulación de base de datos para usuarios
const users = [
  {
    id: 1,
    username: 'admin',
    password: '$2b$10$E.aFgOs8upfyre8Lcs/qy.kAhlGNYKYovS8Q4RZk5m0djff5IC0Gm', // Contraseña encriptada: "password123"
  }
];

// Estrategia local para autenticar usuarios
passport.use(new LocalStrategy(
  (username, password, done) => {
    const user = users.find(u => u.username === username);
    if (!user) {
      return done(null, false, { message: 'Usuario no encontrado' });
    }

    // Comparar contraseña ingresada con la contraseña almacenada (bcrypt)
    bcrypt.compare(password, user.password, (err, isMatch) => {
      if (err) throw err;
      if (isMatch) {
        return done(null, user);
      } else {
        return done(null, false, { message: 'Contraseña incorrecta' });
      }
    });
  }
));

// Serializar y deserializar el usuario para la sesión
passport.serializeUser((user, done) => {
  done(null, user.id);
});

passport.deserializeUser((id, done) => {
  const user = users.find(u => u.id === id);
  done(null, user);
});

module.exports = passport;
