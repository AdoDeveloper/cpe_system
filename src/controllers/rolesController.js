const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

// Controlador para listar roles
exports.listRoles = async (req, res) => {
  try {
    // Obtener roles con permisos y módulos
    const roles = await prisma.rol.findMany({
      include: {
        permisos: {
          include: {
            permiso: {
              include: {
                modulos: true, // Incluir la información de los módulos
              },
            },
          },
        },
      },
    });

    // Transformar los datos para que sean más fáciles de manejar en la plantilla
    const rolesFormateados = roles.map((rol) => ({
      id: rol.id,
      nombre: rol.nombre,
      permisos: rol.permisos.map((rolPermiso) => ({
        ruta: rolPermiso.permiso.ruta,
        metodo: rolPermiso.permiso.metodo,
        descripcion: rolPermiso.permiso.descripcion,
        tipo: rolPermiso.permiso.tipo, // Agregar el tipo
        modulo: rolPermiso.permiso.modulos.length > 0 ? rolPermiso.permiso.modulos.map((m) => m.nombre).join(', ') : 'Sin módulo',
      })),
      modulos: [...new Set(rol.permisos.flatMap((rolPermiso) => rolPermiso.permiso.modulos.map((m) => m.nombre)))],
    }));

    res.render('pages/roles/listado', { roles: rolesFormateados });
  } catch (error) {
    console.error('Error al listar los roles:', error);
    req.flash('error_msg', 'Error al listar los roles.');
    res.status(500).redirect('/roles');
  } finally {
    await prisma.$disconnect();
  }
};

// Renderiza el formulario para crear un nuevo rol
exports.renderCreateForm = async (req, res) => {
  try {
    const modulosDisponibles = await prisma.modulo.findMany(); // Obtener todos los módulos
    res.render('pages/roles/agregar', { action: 'new', rol: {}, permisos: [], modulosDisponibles, errors: [] });
  } catch (error) {
    console.error('Error al cargar el formulario de creación:', error);
    req.flash('error_msg', 'Error al cargar el formulario.');
    res.status(500).redirect('/roles');
  } finally {
    await prisma.$disconnect();
  }
};

// Controlador para agregar un rol con permisos opcionales y módulos opcionales
exports.createRol = async (req, res) => {
    const { nombre } = req.body;
  
    // Validar que se haya proporcionado un nombre
    if (!nombre) {
      req.flash('error_msg', 'Debe proporcionar un nombre para el rol.');
      return res.redirect('/roles/new');
    }
  
    const permisos = [];
    let i = 0;
  
    // Recorrer los permisos enviados en el formulario
    while (req.body[`permisos[${i}][ruta]`]) {
      const ruta = req.body[`permisos[${i}][ruta]`];
      const metodo = req.body[`permisos[${i}][metodo]`]; // Asegurarse de obtener correctamente el método HTTP
      const descripcion = req.body[`permisos[${i}][descripcion]`] || '';
      const tipo = req.body[`permisos[${i}][tipo]`] || 'lectura'; // Tipo por defecto a 'lectura'
      const moduloId = req.body[`permisos[${i}][moduloId]`] ? parseInt(req.body[`permisos[${i}][moduloId]`]) : null; // Modulo opcional
      
      // Verificar que el método esté presente
      if (!metodo) {
        req.flash('error_msg', `Debe seleccionar un método HTTP para el permiso ${ruta}.`);
        return res.redirect('/roles/new');
      }
  
      permisos.push({ ruta, metodo, descripcion, tipo, moduloId });
      i++;
    }
  
    try {
      // Crear el rol
      const createdRol = await prisma.rol.create({ data: { nombre } });
  
      // Si hay permisos, crear la relación con permisos
      for (const permiso of permisos) {
        const createdPermiso = await prisma.permiso.create({
          data: {
            ruta: permiso.ruta,
            metodo: permiso.metodo, // Método HTTP
            descripcion: permiso.descripcion,
            tipo: permiso.tipo, // Tipo de permiso (lectura, escritura, eliminación)
            modulos: permiso.moduloId ? { connect: { id: permiso.moduloId } } : undefined, // Asignar el módulo solo si existe
          },
        });
  
        // Crear la relación entre el rol y el permiso
        await prisma.rolPermiso.create({ data: { rolId: createdRol.id, permisoId: createdPermiso.id } });
      }
  
      req.flash('success_msg', 'Rol creado correctamente.');
      res.redirect('/roles');
    } catch (error) {
      console.error('Error al crear el rol:', error);
      req.flash('error_msg', 'Error al crear el rol.');
      res.status(500).redirect('/roles');
    } finally {
      await prisma.$disconnect();
    }
  };
  
// Renderiza el formulario para editar un rol existente
exports.renderEditForm = async (req, res) => {
    try {
      const { id } = req.params;
  
      // Obtener el rol con sus permisos y módulos asociados
      const rol = await prisma.rol.findUnique({
        where: { id: parseInt(id) },
        include: {
          permisos: {
            include: {
              permiso: {
                include: { modulos: true },
              },
            },
          },
        },
      });
  
      if (!rol) {
        req.flash('error_msg', 'El rol no existe.');
        return res.redirect('/roles');
      }
  
      // Obtener todos los módulos disponibles
      const modulosDisponibles = await prisma.modulo.findMany();
  
      // Formatear permisos para que sean más fáciles de usar en la vista
      const permisosFormateados = rol.permisos.map((rolPermiso) => ({
        ruta: rolPermiso.permiso.ruta,
        metodo: rolPermiso.permiso.metodo,
        descripcion: rolPermiso.permiso.descripcion,
        tipo: rolPermiso.permiso.tipo,
        moduloId: rolPermiso.permiso.modulos.length > 0 ? rolPermiso.permiso.modulos[0].id : null,
      }));
  
      res.render('pages/roles/modificar', {
        action: 'edit',
        rol: { id: rol.id, nombre: rol.nombre },
        permisos: permisosFormateados,
        modulosDisponibles,
        errors: [],
      });
    } catch (error) {
      console.error('Error al cargar el formulario de edición:', error);
      req.flash('error_msg', 'Error al cargar el formulario de edición.');
      return res.status(500).redirect('/roles');
    } finally {
      await prisma.$disconnect();
    }
  };  
// Controlador para actualizar un rol existente
exports.updateRol = async (req, res) => {
    const { id } = req.params;
    const { nombre } = req.body;
  
    if (!nombre) {
      req.flash('error_msg', 'Debe proporcionar un nombre para el rol.');
      return res.redirect(`/roles/edit/${id}`);
    }
  
    const permisos = [];
    let i = 0;
  
    while (req.body[`permisos[${i}][ruta]`]) {
      const ruta = req.body[`permisos[${i}][ruta]`];
      const metodo = req.body[`permisos[${i}][metodo]`];
      const descripcion = req.body[`permisos[${i}][descripcion]`] || '';
      const tipo = req.body[`permisos[${i}][tipo]`] || 'lectura';
      const moduloId = req.body[`permisos[${i}][moduloId]`] ? parseInt(req.body[`permisos[${i}][moduloId]`]) : null;
  
      if (!metodo) {
        req.flash('error_msg', `Debe seleccionar un método HTTP para el permiso ${ruta}.`);
        return res.redirect(`/roles/edit/${id}`);
      }
  
      permisos.push({ ruta, metodo, descripcion, tipo, moduloId });
      i++;
    }
  
    try {
      await prisma.rol.update({
        where: { id: parseInt(id) },
        data: { nombre }
      });
  
      const permisosActuales = await prisma.rolPermiso.findMany({
        where: { rolId: parseInt(id) },
        include: { permiso: true }
      });
  
      const permisosActualesMap = permisosActuales.reduce((map, rolPermiso) => {
        const key = `${rolPermiso.permiso.ruta}-${rolPermiso.permiso.metodo}`;
        map[key] = rolPermiso;
        return map;
      }, {});
  
      const permisosAEliminar = Object.keys(permisosActualesMap);
  
      for (const permiso of permisos) {
        const key = `${permiso.ruta}-${permiso.metodo}`;
  
        if (permisosActualesMap[key]) {
          // Actualizar permisos existentes
          await prisma.permiso.update({
            where: { id: permisosActualesMap[key].permisoId },
            data: {
              descripcion: permiso.descripcion,
              tipo: permiso.tipo,
              modulos: permiso.moduloId ? { connect: { id: permiso.moduloId } } : { disconnect: [] }  // Desconecta todos los módulos si no hay módulo seleccionado
            }
          });
  
          permisosAEliminar.splice(permisosAEliminar.indexOf(key), 1);
        } else {
          // Crear nuevo permiso
          const nuevoPermiso = await prisma.permiso.create({
            data: {
              ruta: permiso.ruta,
              metodo: permiso.metodo,
              descripcion: permiso.descripcion,
              tipo: permiso.tipo,
              modulos: permiso.moduloId ? { connect: { id: permiso.moduloId } } : undefined
            }
          });
  
          await prisma.rolPermiso.create({
            data: { rolId: parseInt(id), permisoId: nuevoPermiso.id }
          });
        }
      }
  
      for (const key of permisosAEliminar) {
        const rolPermiso = permisosActualesMap[key];
  
        // Eliminar permisos y relaciones con el rol
        await prisma.rolPermiso.delete({
          where: { rolId_permisoId: { rolId: parseInt(id), permisoId: rolPermiso.permisoId } }
        });
  
        await prisma.permiso.delete({
          where: { id: rolPermiso.permisoId }
        });
      }
  
      req.flash('success_msg', 'Rol actualizado exitosamente.');
      res.redirect('/roles');
    } catch (error) {
      console.error('Error al actualizar el rol:', error);
      req.flash('error_msg', 'Error al actualizar el rol.');
      res.status(500).redirect(`/roles/edit/${id}`);
    } finally {
      await prisma.$disconnect();
    }
  };

// Controlador para eliminar un rol
exports.deleteRol = async (req, res) => {
  try {
    const { id } = req.params;

    // Eliminar todas las relaciones de permisos con el rol
    await prisma.rolPermiso.deleteMany({ where: { rolId: parseInt(id) } });

    // Eliminar el rol
    await prisma.rol.delete({ where: { id: parseInt(id) } });

    req.flash('success_msg', 'Rol eliminado exitosamente.');
    res.redirect('/roles');
  } catch (error) {
    console.error('Error al eliminar el rol:', error);
    req.flash('error_msg', 'Error al eliminar el rol.');
    res.status(500).redirect('/roles');
  } finally {
    await prisma.$disconnect();
  }
};
