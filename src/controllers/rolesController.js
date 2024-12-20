// src/controllers/rolesController.js

// Importaciones necesarias
const { PrismaClient } = require("@prisma/client");
const prisma = new PrismaClient();
const { check, validationResult } = require('express-validator');

// Validaciones antes de crear rol
exports.validateCreateRol = [
  check('nombre')
    .notEmpty().withMessage('Debe proporcionar un nombre para el rol.')
    .isLength({ max: 100 }).withMessage('El nombre del rol no debe exceder los 100 caracteres.'),
];

// Validaciones antes de actualizar rol
exports.validateUpdateRol = [
  check('nombre')
    .notEmpty().withMessage('Debe proporcionar un nombre para el rol.')
    .isLength({ max: 100 }).withMessage('El nombre del rol no debe exceder los 100 caracteres.'),
];

// Controlador para listar roles
exports.listRoles = async (req, res) => {
  try {
    const roles = await prisma.rol.findMany({
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
      orderBy: { id: "asc" },
    });

    const rolesFormateados = roles
      .filter((rol) => rol && rol.nombre)
      .map((rol) => {
        const formateado = {
          id: rol.id,
          nombre: rol.nombre || "Nombre no disponible",
          esAdmin: rol.esAdmin,
          permisos: (rol.permisos || []).map((rolPermiso) => {
            const permiso = rolPermiso.permiso;
            if (!permiso) {
              console.warn(`Permiso no definido para el rol con id: ${rol.id}`);
              return {
                ruta: "Ruta no disponible",
                metodo: "Método no disponible",
                descripcion: "Descripción no disponible",
                tipo: "Tipo no disponible",
                modulo: "Sin módulo",
              };
            }

            return {
              ruta: permiso.ruta || "Ruta no disponible",
              metodo: permiso.metodo || "Método no disponible",
              descripcion: permiso.descripcion || "Descripción no disponible",
              tipo: permiso.tipo || "Tipo no disponible",
              modulo:
                permiso.moduloPermisos && permiso.moduloPermisos.length > 0
                  ? permiso.moduloPermisos
                      .map((m) => (m.modulo ? m.modulo.nombre : "Módulo desconocido"))
                      .join(", ")
                  : "Sin módulo",
            };
          }),
          modulos: [
            ...new Set(
              (rol.permisos || []).flatMap((rolPermiso) =>
                rolPermiso.permiso?.moduloPermisos?.map((m) => m.modulo?.nombre || "Módulo desconocido") || []
              )
            ),
          ],
        };
        return formateado;
      });

    res.render("pages/roles/listado", { roles: rolesFormateados, title: 'Roles - Permisos' });
  } catch (error) {
    console.error("Error al listar los roles:", error);
    req.flash("error_msg", "Error al listar los roles.");
    res.status(500).redirect("/roles");
  } finally {
    await prisma.$disconnect();
  }
};

// Renderiza el formulario para crear un nuevo rol
exports.renderCreateForm = async (req, res) => {
  try {
    const modulosDisponibles = await prisma.modulo.findMany();

    res.render("pages/roles/agregar", {
      action: "new",
      rol: {},
      permisos: [],
      modulosDisponibles,
      errors: [],
      title: 'Roles - Permisos',
    });
  } catch (error) {
    console.error("Error al cargar el formulario de creación:", error);
    req.flash("error_msg", "Error al cargar el formulario.");
    res.status(500).redirect("/roles");
  } finally {
    await prisma.$disconnect();
  }
};

// Controlador para agregar un rol con permisos y módulos
exports.createRol = [
  exports.validateCreateRol,
  async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      // Unir los mensajes de error con '<br>' para saltos de línea
      const errorMessages = errors.array().map(err => err.msg).join('<br>');
      req.flash("error_msg", errorMessages);
      return res.redirect("/roles/new");
    }

    const { nombre, esAdmin } = req.body;

    const permisos = [];
    const modulosAsignados = new Set();
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

      for (const permiso of permisos) {
        const createdPermiso = await prisma.permiso.create({
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
          data: { rolId: createdRol.id, permisoId: createdPermiso.id },
        });
      }

      for (const moduloId of modulosAsignados) {
        await prisma.rolModulo.create({
          data: { rolId: createdRol.id, moduloId },
        });
      }

      req.flash("success_msg", "Rol creado correctamente.");
      res.status(201).redirect("/roles");
    } catch (error) {
      console.error("Error al crear el rol:", error);
      req.flash("error_msg", "Error al crear el rol.");
      res.status(500).redirect("/roles");
    } finally {
      await prisma.$disconnect();
    }
  }
];

// Renderiza el formulario para editar un rol existente
exports.renderEditForm = async (req, res) => {
  try {
    const { id } = req.params;

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
      req.flash("error_msg", "El rol no existe.");
      return res.redirect("/roles");
    }

    const modulosDisponibles = await prisma.modulo.findMany();

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
      title: 'Roles - Permisos',
    });
  } catch (error) {
    console.error("Error al cargar el formulario de edición:", error);
    req.flash("error_msg", "Error al cargar el formulario de edición.");
    return res.status(500).redirect("/roles");
  } finally {
    await prisma.$disconnect();
  }
};

// Controlador para actualizar un rol existente
exports.updateRol = [
  exports.validateUpdateRol,
  async (req, res) => {
    console.log("--- INICIO updateRol ---");
    const { id } = req.params;

    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      // Unir los mensajes de error con '<br>' para saltos de línea
      const errorMessages = errors.array().map(err => err.msg).join('<br>');
      req.flash("error_msg", errorMessages);
      return res.redirect(`/roles/edit/${id}`);
    }

    const { nombre, esAdmin } = req.body;

    const permisos = [];
    const modulosAsignados = new Set();
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

      for (const permiso of permisos) {
        const key = `${permiso.ruta}-${permiso.metodo}`;

        if (permisosActualesMap[key]) {
          await prisma.permiso.update({
            where: { id: permisosActualesMap[key].permisoId },
            data: {
              descripcion: permiso.descripcion,
              tipo: permiso.tipo,
              moduloPermisos: {
                deleteMany: {},
                create: permiso.moduloId ? { moduloId: permiso.moduloId } : [],
              },
            },
          });
          permisosAEliminar.splice(permisosAEliminar.indexOf(key), 1);
        } else {
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

      for (const key of permisosAEliminar) {
        const rolPermiso = permisosActualesMap[key];

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

      await prisma.rolModulo.deleteMany({
        where: { rolId: parseInt(id) },
      });

      for (const moduloId of modulosAsignados) {
        await prisma.rolModulo.create({
          data: { rolId: parseInt(id), moduloId },
        });
      }

      req.flash("success_msg", "Rol actualizado exitosamente.");
      res.status(201).redirect("/roles");
    } catch (error) {
      console.error("Error al actualizar el rol:", error);
      req.flash("error_msg", "Error al actualizar el rol.");
      res.status(500).redirect(`/roles/edit/${id}`);
    } finally {
      await prisma.$disconnect();
      console.log("--- FIN updateRol ---");
    }
  }
];

// Controlador para eliminar un rol
exports.deleteRol = async (req, res) => {
  try {
    const { id } = req.params;

    await prisma.rolPermiso.deleteMany({ where: { rolId: parseInt(id) } });

    await prisma.rol.delete({ where: { id: parseInt(id) } });

    req.flash("success_msg", "Rol eliminado exitosamente.");
    res.status(200).redirect("/roles");
  } catch (error) {
    console.error("Error al eliminar el rol:", error);
    req.flash("error_msg", "Error al eliminar el rol.");
    res.status(500).redirect("/roles");
  } finally {
    await prisma.$disconnect();
  }
};