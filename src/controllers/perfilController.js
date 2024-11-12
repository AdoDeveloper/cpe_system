// src/controllers/perfilController.js

const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

const perfilController = {};

// Renderiza el perfil del usuario según su rol
perfilController.renderProfile = async (req, res) => {
    const user = req.session.user; // Aquí obtienes el usuario de la sesión
    if (!user) {
      return res.redirect('/login'); // Redirige si no está autenticado
    }
    // Buscar el usuario en la base de datos, incluyendo su rol y cliente (si aplica)
    const usuario = await prisma.usuario.findUnique({
        where: { email: user },
        include: { rol: true, cliente: true }, // Incluir el rol y datos del cliente si existen
    });
    
    // Eliminar la contraseña del objeto antes de continuar
    if (usuario) {
        delete usuario.password;
    }
  
    // Imprimir el usuario en la consola
    // console.log('Usuario: ', usuario);
  
    if (!usuario) {
      return res.status(404).send("Usuario no encontrado");
    }
  
    // Determina si es Administrador o Cliente
    const isAdmin = usuario.rol.esAdmin;
  
    // Renderiza la vista con los datos del usuario
    res.render('pages/perfil', {
      title: 'Perfil de Usuario',
      user: usuario,
      isAdmin: isAdmin, // Enviar el valor isAdmin para saber qué mostrar en la vista
      title: 'Perfil'
    });
  };

  module.exports = perfilController;