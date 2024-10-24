const { PrismaClient } = require("@prisma/client");
const prisma = new PrismaClient();

// Controlador para listar roles
exports.listRoles = async (req, res) => {
  console.log("--- INICIO listRoles ---"); // Inicio del controlador
  try {
    console.log("Obteniendo roles desde la base de datos...");
    const roles = await prisma.rol.findMany({
      include: {
        permisos: {
          include: {
            permiso: {
              include: {
                moduloPermisos: { 
                  include: { modulo: true }, // Incluir la información de los módulos
                },
              },
            },
          },
        },
      },
      orderBy: { id: "asc" },
    });

    console.log("Roles obtenidos:", roles.length);

    const rolesFormateados = roles.map((rol) => {
      const formateado = {
        id: rol.id,
        nombre: rol.nombre,
        esAdmin: rol.esAdmin,
        permisos: rol.permisos.map((rolPermiso) => ({
          ruta: rolPermiso.permiso.ruta,
          metodo: rolPermiso.permiso.metodo,
          descripcion: rolPermiso.permiso.descripcion,
          tipo: rolPermiso.permiso.tipo,
          modulo: rolPermiso.permiso.moduloPermisos.length > 0
            ? rolPermiso.permiso.moduloPermisos.map((m) => m.modulo.nombre).join(", ")
            : "Sin módulo",
        })),
        modulos: [...new Set(rol.permisos.flatMap((rolPermiso) =>
          rolPermiso.permiso.moduloPermisos.map((m) => m.modulo.nombre)
        ))],
      };
      console.log(`Rol formateado: ${formateado.nombre}`, formateado);
      return formateado;
    });

    console.log("Roles formateados:", rolesFormateados.length);
    res.render("pages/roles/listado", { roles: rolesFormateados });
  } catch (error) {
    console.error("Error al listar los roles:", error);
    req.flash("error_msg", "Error al listar los roles.");
    res.status(500).redirect("/roles");
  } finally {
    await prisma.$disconnect();
    console.log("--- FIN listRoles ---");
  }
};


// Renderiza el formulario para crear un nuevo rol
exports.renderCreateForm = async (req, res) => {
  console.log("--- INICIO renderCreateForm ---");
  try {
    console.log("Obteniendo módulos disponibles...");
    const modulosDisponibles = await prisma.modulo.findMany();
    console.log("Módulos disponibles:", modulosDisponibles.length);

    res.render("pages/roles/agregar", {
      action: "new",
      rol: {},
      permisos: [],
      modulosDisponibles,
      errors: [],
    });
  } catch (error) {
    console.error("Error al cargar el formulario de creación:", error);
    req.flash("error_msg", "Error al cargar el formulario.");
    res.status(500).redirect("/roles");
  } finally {
    await prisma.$disconnect();
    console.log("--- FIN renderCreateForm ---");
  }
};

// Controlador para agregar un rol con permisos y módulos
// Controlador para agregar un rol con permisos y módulos
exports.createRol = async (req, res) => {
  const { nombre, esAdmin } = req.body;

  if (!nombre) {
    req.flash("error_msg", "Debe proporcionar un nombre para el rol.");
    return res.redirect("/roles/new");
  }

  const permisos = [];
  const modulosAsignados = new Set(); // Utilizamos un Set para evitar duplicados de módulos
  let i = 0;

  while (req.body[`permisos[${i}][ruta]`]) {
    const ruta = req.body[`permisos[${i}][ruta]`];
    const metodo = req.body[`permisos[${i}][metodo]`];
    const descripcion = req.body[`permisos[${i}][descripcion]`] || "";
    const tipo = req.body[`permisos[${i}][tipo]`] || "lectura";
    const moduloId = req.body[`permisos[${i}][moduloId]`]
      ? parseInt(req.body[`permisos[${i}][moduloId]`])
      : null;

    if (!metodo) {
      req.flash("error_msg", `Debe seleccionar un método HTTP para el permiso ${ruta}.`);
      return res.redirect("/roles/new");
    }

    // Agregar el módulo al Set de módulos asignados
    if (moduloId) {
      modulosAsignados.add(moduloId);
    }

    permisos.push({ ruta, metodo, descripcion, tipo, moduloId });
    i++;
  }

  try {
    const createdRol = await prisma.rol.create({
      data: { nombre, esAdmin: esAdmin === "on" },
    });

    // Crear permisos y relacionarlos con el rol
    for (const permiso of permisos) {
      const createdPermiso = await prisma.permiso.create({
        data: {
          ruta: permiso.ruta,
          metodo: permiso.metodo,
          descripcion: permiso.descripcion,
          tipo: permiso.tipo,
          moduloPermisos: permiso.moduloId
            ? { create: { moduloId: permiso.moduloId } }
            : undefined, // Conectar al módulo si está presente
        },
      });

      await prisma.rolPermiso.create({
        data: { rolId: createdRol.id, permisoId: createdPermiso.id },
      });
    }

    // Crear las relaciones en RolModulo
    for (const moduloId of modulosAsignados) {
      console.log(`Asignando módulo ${moduloId} al rol ${createdRol.id}`);
      await prisma.rolModulo.create({
        data: { rolId: createdRol.id, moduloId },
      });
    }

    req.flash("success_msg", "Rol creado correctamente.");
    res.redirect("/roles");
  } catch (error) {
    console.error("Error al crear el rol:", error);
    req.flash("error_msg", "Error al crear el rol.");
    res.status(500).redirect("/roles");
  } finally {
    await prisma.$disconnect();
  }
};



// Renderiza el formulario para editar un rol existente
exports.renderEditForm = async (req, res) => {
  console.log("--- INICIO renderEditForm ---");
  try {
    const { id } = req.params;
    console.log("Buscando rol con id:", id);

    const rol = await prisma.rol.findUnique({
      where: { id: parseInt(id) },
      include: {
        permisos: {
          include: {
            permiso: {
              include: {
                moduloPermisos: { 
                  include: { modulo: true },
                },
              },
            },
          },
        },
      },
    });

    if (!rol) {
      console.log("Rol no encontrado.");
      req.flash("error_msg", "El rol no existe.");
      return res.redirect("/roles");
    }

    console.log("Rol encontrado:", rol.nombre);
    const modulosDisponibles = await prisma.modulo.findMany();
    console.log("Módulos disponibles:", modulosDisponibles.length);

    const permisosFormateados = rol.permisos.map((rolPermiso) => ({
      ruta: rolPermiso.permiso.ruta,
      metodo: rolPermiso.permiso.metodo,
      descripcion: rolPermiso.permiso.descripcion,
      tipo: rolPermiso.permiso.tipo,
      moduloId: rolPermiso.permiso.moduloPermisos.length > 0
        ? rolPermiso.permiso.moduloPermisos[0].modulo.id
        : null,
    }));

    res.render("pages/roles/modificar", {
      action: "edit",
      rol: { id: rol.id, nombre: rol.nombre, esAdmin: rol.esAdmin },
      permisos: permisosFormateados,
      modulosDisponibles,
      errors: [],
    });
  } catch (error) {
    console.error("Error al cargar el formulario de edición:", error);
    req.flash("error_msg", "Error al cargar el formulario de edición.");
    return res.status(500).redirect("/roles");
  } finally {
    await prisma.$disconnect();
    console.log("--- FIN renderEditForm ---");
  }
};


// Controlador para actualizar un rol existente
exports.updateRol = async (req, res) => {
  console.log("--- INICIO updateRol ---");
  const { id } = req.params;
  const { nombre, esAdmin } = req.body;

  if (!nombre) {
    console.log("Nombre del rol no proporcionado.");
    req.flash("error_msg", "Debe proporcionar un nombre para el rol.");
    return res.redirect(`/roles/edit/${id}`);
  }

  const permisos = [];
  const modulosAsignados = new Set(); // Almacena los módulos asignados
  let i = 0;

  while (req.body[`permisos[${i}][ruta]`]) {
    const permiso = {
      ruta: req.body[`permisos[${i}][ruta]`],
      metodo: req.body[`permisos[${i}][metodo]`],
      descripcion: req.body[`permisos[${i}][descripcion]`] || "",
      tipo: req.body[`permisos[${i}][tipo]`] || "lectura",
      moduloId: req.body[`permisos[${i}][moduloId]`]
        ? parseInt(req.body[`permisos[${i}][moduloId]`])
        : null,
    };
    console.log(`Permiso ${i}:`, permiso);

    if (!permiso.metodo) {
      console.log(`Error: No se seleccionó método HTTP para el permiso ${permiso.ruta}.`);
      req.flash("error_msg", `Debe seleccionar un método HTTP para el permiso ${permiso.ruta}.`);
      return res.redirect(`/roles/edit/${id}`);
    }

    // Almacenar los módulos asignados para crear la relación en RolModulo
    if (permiso.moduloId) {
      modulosAsignados.add(permiso.moduloId);
    }

    permisos.push(permiso);
    i++;
  }

  try {
    console.log("Actualizando rol...");
    await prisma.rol.update({
      where: { id: parseInt(id) },
      data: { nombre, esAdmin: esAdmin === "on" },
    });

    console.log("Buscando permisos actuales del rol...");
    const permisosActuales = await prisma.rolPermiso.findMany({
      where: { rolId: parseInt(id) },
      include: { permiso: true },
    });

    const permisosActualesMap = permisosActuales.reduce((map, rolPermiso) => {
      const key = `${rolPermiso.permiso.ruta}-${rolPermiso.permiso.metodo}`;
      map[key] = rolPermiso;
      return map;
    }, {});

    const permisosAEliminar = Object.keys(permisosActualesMap);
    console.log("Permisos actuales mapeados:", permisosActualesMap);

    for (const permiso of permisos) {
      const key = `${permiso.ruta}-${permiso.metodo}`;

      if (permisosActualesMap[key]) {
        console.log(`Actualizando permiso existente para ${permiso.ruta} con método ${permiso.metodo}`);
        await prisma.permiso.update({
          where: { id: permisosActualesMap[key].permisoId },
          data: {
            descripcion: permiso.descripcion,
            tipo: permiso.tipo,
            moduloPermisos: {
              deleteMany: {}, // Eliminar relaciones previas con módulos
              create: permiso.moduloId ? { moduloId: permiso.moduloId } : [], // Asignar nuevos módulos
            },
          },
        });
        permisosAEliminar.splice(permisosAEliminar.indexOf(key), 1);
      } else {
        console.log(`Creando nuevo permiso para ${permiso.ruta} con método ${permiso.metodo}`);
        const nuevoPermiso = await prisma.permiso.create({
          data: {
            ruta: permiso.ruta,
            metodo: permiso.metodo,
            descripcion: permiso.descripcion,
            tipo: permiso.tipo,
            moduloPermisos: permiso.moduloId
              ? { create: { moduloId: permiso.moduloId } }
              : undefined,
          },
        });

        await prisma.rolPermiso.create({
          data: { rolId: parseInt(id), permisoId: nuevoPermiso.id },
        });
      }
    }

    console.log("Permisos por eliminar:", permisosAEliminar);
    for (const key of permisosAEliminar) {
      const rolPermiso = permisosActualesMap[key];
      console.log(`Eliminando permiso con id ${rolPermiso.permisoId}`);

      await prisma.rolPermiso.delete({
        where: {
          rolId_permisoId: {
            rolId: parseInt(id),
            permisoId: rolPermiso.permisoId,
          },
        },
      });

      await prisma.permiso.delete({
        where: { id: rolPermiso.permisoId },
      });
    }

    // Eliminar todas las relaciones anteriores de RolModulo
    await prisma.rolModulo.deleteMany({
      where: { rolId: parseInt(id) },
    });

    // Crear las relaciones actualizadas en RolModulo
    for (const moduloId of modulosAsignados) {
      console.log(`Asignando módulo ${moduloId} al rol ${id}`);
      await prisma.rolModulo.create({
        data: { rolId: parseInt(id), moduloId },
      });
    }

    req.flash("success_msg", "Rol actualizado exitosamente.");
    res.redirect("/roles");
  } catch (error) {
    console.error("Error al actualizar el rol:", error);
    req.flash("error_msg", "Error al actualizar el rol.");
    res.status(500).redirect(`/roles/edit/${id}`);
  } finally {
    await prisma.$disconnect();
    console.log("--- FIN updateRol ---");
  }
};

// Controlador para eliminar un rol
exports.deleteRol = async (req, res) => {
  console.log("--- INICIO deleteRol ---");
  try {
    const { id } = req.params;
    console.log(`Eliminando rol con id: ${id}`);

    console.log("Eliminando permisos asociados al rol...");
    await prisma.rolPermiso.deleteMany({ where: { rolId: parseInt(id) } });

    console.log("Eliminando rol...");
    await prisma.rol.delete({ where: { id: parseInt(id) } });

    req.flash("success_msg", "Rol eliminado exitosamente.");
    res.redirect("/roles");
  } catch (error) {
    console.error("Error al eliminar el rol:", error);
    req.flash("error_msg", "Error al eliminar el rol.");
    res.status(500).redirect("/roles");
  } finally {
    await prisma.$disconnect();
    console.log("--- FIN deleteRol ---");
  }
};

