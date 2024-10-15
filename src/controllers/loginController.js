exports.renderLoginForm = (req, res) => {
    res.render('pages/login');
  };
  
  exports.processLogin = (req, res) => {
    const { username, password } = req.body;
  
    // Aquí iría la lógica de autenticación
    if (username === 'admin' && password === 'password') {
      req.session.user = { username };
      res.redirect('/');
    } else {
      req.flash('error_msg', 'Credenciales incorrectas');
      res.redirect('/login');
    }
  };
  