const checkRole = (roles) => {
    return (req, res, next) => {
      if (req.session.userRole && roles.includes(req.session.userRole)) {
        return next();
      } else {
        req.flash('error_msg', 'No tienes permiso para acceder a esta página.');
        return res.redirect('/');
      }
    };
  };

module.exports = { checkRole };