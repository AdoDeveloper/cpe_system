const homeController = {};

// Renderiza el home según el rol del usuario
homeController.renderHome = (req, res) => {
  // Si el usuario no es admin, renderizar el home del usuario
  res.render('pages/home/home', { title: 'Home Airlink' });
};

module.exports = homeController;
