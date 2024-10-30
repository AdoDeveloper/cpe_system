// middlewares/notificacionesMiddleware.js
const { obtenerNotificaciones } = require('../controllers/notificacionesController');

module.exports = async (req, res, next) => {

  if ( req.session.userId) {
    const notificaciones = await obtenerNotificaciones(req.session.userId);
    res.locals.notificaciones = notificaciones;
    res.locals.notificationCount = notificaciones.length;
  } else {
    res.locals.notificaciones = [];
    res.locals.notificationCount = 0;
  }
  next();
};
