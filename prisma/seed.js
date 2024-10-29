// seed.js
const { PrismaClient } = require('@prisma/client');
const bcrypt = require('bcryptjs');
const prisma = new PrismaClient();

async function main() {
  // Verificar si ya existe el rol Administrador
  const existingAdminRole = await prisma.rol.findUnique({
    where: { nombre: 'Administrador' },
  });

  if (!existingAdminRole) {
    // Crear los módulos con su estado activo
    const dashboardModulo = await prisma.modulo.create({
      data: {
        nombre: 'dashboard',
        descripcion: 'Módulo de panel de control',
        activo: true,
      },
    });

    const facturacionModulo = await prisma.modulo.create({
      data: {
        nombre: 'facturacion',
        descripcion: 'Módulo de facturación',
        activo: true,
      },
    });

    const contratosServiciosModulo = await prisma.modulo.create({
      data: {
        nombre: 'contratos_servicios',
        descripcion: 'Módulo de contratos y servicios',
        activo: true,
      },
    });

    const clientesModulo = await prisma.modulo.create({
      data: {
        nombre: 'clientes',
        descripcion: 'Módulo de gestión de clientes',
        activo: true,
      },
    });

    const gestionCpesModulo = await prisma.modulo.create({
      data: {
        nombre: 'gestion_cpes',
        descripcion: 'Módulo de gestión de CPEs',
        activo: true,
      },
    });

    const gestionUsuariosModulo = await prisma.modulo.create({
      data: {
        nombre: 'gestion_usuarios',
        descripcion: 'Módulo de gestión de usuarios',
        activo: true,
      },
    });

    const gestionModulosModulo = await prisma.modulo.create({
      data: {
        nombre: 'gestion_modulos',
        descripcion: 'Módulo de gestión de módulos',
        activo: true,
      },
    });

    const helpdeskModulo = await prisma.modulo.create({
      data: {
        nombre: 'helpdesk',
        descripcion: 'Módulo de gestión de soporte y tickets',
        activo: true,
      },
    });

    // Crear el rol Administrador y asignarle los módulos
    const adminRole = await prisma.rol.create({
      data: {
        nombre: 'Administrador',
        esAdmin: true,
      },
    });

    // Asignar módulos al rol Administrador a través de RolModulo
    const modulosAsignados = [
      dashboardModulo.id,
      facturacionModulo.id,
      contratosServiciosModulo.id,
      clientesModulo.id,
      gestionCpesModulo.id,
      gestionUsuariosModulo.id,
      gestionModulosModulo.id,
      helpdeskModulo.id,
    ];

    for (const moduloId of modulosAsignados) {
      await prisma.rolModulo.create({
        data: {
          rolId: adminRole.id,
          moduloId,
        },
      });
    }

    // Crear las rutas para cada módulo con sus íconos
    const rutasData = [
      // Dashboard Rutas
      {
        nombre: 'Inicio',
        ruta: '/',
        icono: 'fas fa-chart-line',
        moduloId: dashboardModulo.id,
      },

      // Facturación Rutas
      {
        nombre: 'Generar Facturas',
        ruta: '/facturacion/generar',
        icono: 'fas fa-file-invoice-dollar',
        moduloId: facturacionModulo.id,
      },
      {
        nombre: 'Movimientos',
        ruta: '/movimientos',
        icono: 'fas fa-hand-holding-usd',
        moduloId: facturacionModulo.id,
      },
      {
        nombre: 'Historial de Pagos',
        ruta: '/facturacion/historial',
        icono: 'far fa-clock',
        moduloId: facturacionModulo.id,
      },

      // Contratos y Servicios Rutas
      {
        nombre: 'Servicios',
        ruta: '/servicios',
        icono: 'fas fa-box-open',
        moduloId: contratosServiciosModulo.id,
      },
      {
        nombre: 'Contratos de Clientes',
        ruta: '/contratos',
        icono: 'fas fa-handshake',
        moduloId: contratosServiciosModulo.id,
      },
      {
        nombre: 'Politicas de Contratos',
        ruta: '/politicas',
        icono: 'fas fa-hands-helping',
        moduloId: contratosServiciosModulo.id,
      },
      // Gestión de Clientes Rutas
      {
        nombre: 'Clientes',
        ruta: '/clientes',
        icono: 'fas fa-users',
        moduloId: clientesModulo.id,
      },

      // Gestión de CPEs Rutas
      {
        nombre: 'Equipos',
        ruta: '/equipos',
        icono: 'fas fa-satellite-dish',
        moduloId: gestionCpesModulo.id,
      },
      {
        nombre: 'Configuraciones',
        ruta: '/configuraciones',
        icono: 'fas fa-cog',
        moduloId: gestionCpesModulo.id,
      },

      // Gestión de Usuarios Rutas
      {
        nombre: 'Usuarios',
        ruta: '/usuarios',
        icono: 'fas fa-user',
        moduloId: gestionUsuariosModulo.id,
      },
      {
        nombre: 'Roles',
        ruta: '/roles',
        icono: 'fas fa-user-tag',
        moduloId: gestionUsuariosModulo.id,
      },

      // Gestión de Módulos Rutas
      {
        nombre: 'Módulos',
        ruta: '/modulos',
        icono: 'fas fa-th-large',
        moduloId: gestionModulosModulo.id,
      },
      // Rutas de Helpdesk
      {
        nombre: 'Gestión de Tickets',
        ruta: '/tickets',
        icono: 'fas fa-ticket-alt',
        moduloId: helpdeskModulo.id,
      },
    ];

    // Crear las rutas
    const createdRutas = [];
    for (const ruta of rutasData) {
      const createdRuta = await prisma.ruta.create({
        data: {
          nombre: ruta.nombre,
          ruta: ruta.ruta,
          icono: ruta.icono,
          moduloId: ruta.moduloId,
        },
      });
      createdRutas.push(createdRuta);
    }

    // Crear los permisos incluyendo las rutas CRUD existentes
    const permisosData = [
      // Permisos de clientes
      { ruta: '/clientes', metodo: 'GET', descripcion: 'Listar clientes', tipo: 'lectura', moduloId: clientesModulo.id },
      { ruta: '/clientes/new', metodo: 'GET', descripcion: 'Formulario agregar cliente', tipo: 'lectura', moduloId: clientesModulo.id },
      { ruta: '/clientes/new', metodo: 'POST', descripcion: 'Crear cliente', tipo: 'escritura', moduloId: clientesModulo.id },
      { ruta: '/clientes/edit/:id', metodo: 'GET', descripcion: 'Formulario editar cliente', tipo: 'lectura', moduloId: clientesModulo.id },
      { ruta: '/clientes/edit/:id', metodo: 'PUT', descripcion: 'Actualizar cliente', tipo: 'escritura', moduloId: clientesModulo.id },
      { ruta: '/clientes/delete/:id', metodo: 'DELETE', descripcion: 'Eliminar cliente', tipo: 'eliminación', moduloId: clientesModulo.id },

      // Permisos de equipos CPE
      { ruta: '/equipos', metodo: 'GET', descripcion: 'Listar equipos', tipo: 'lectura', moduloId: gestionCpesModulo.id },
      { ruta: '/equipos/new', metodo: 'GET', descripcion: 'Formulario agregar equipo', tipo: 'lectura', moduloId: gestionCpesModulo.id },
      { ruta: '/equipos/new', metodo: 'POST', descripcion: 'Crear equipo', tipo: 'escritura', moduloId: gestionCpesModulo.id },
      { ruta: '/equipos/edit/:id', metodo: 'GET', descripcion: 'Formulario editar equipo', tipo: 'lectura', moduloId: gestionCpesModulo.id },
      { ruta: '/equipos/edit/:id', metodo: 'PUT', descripcion: 'Actualizar equipo', tipo: 'escritura', moduloId: gestionCpesModulo.id },
      { ruta: '/equipos/delete/:id', metodo: 'DELETE', descripcion: 'Eliminar equipo', tipo: 'eliminación', moduloId: gestionCpesModulo.id },

      // Permisos de configuraciones CPE
      { ruta: '/configuraciones', metodo: 'GET', descripcion: 'Listar configuracion', tipo: 'lectura', moduloId: gestionCpesModulo.id },
      { ruta: '/configuraciones/new', metodo: 'GET', descripcion: 'Formulario agregar configuracion', tipo: 'lectura', moduloId: gestionCpesModulo.id },
      { ruta: '/configuraciones/new', metodo: 'POST', descripcion: 'Crear configuracion', tipo: 'escritura', moduloId: gestionCpesModulo.id },
      { ruta: '/configuraciones/edit/:id', metodo: 'GET', descripcion: 'Formulario editar configuracion', tipo: 'lectura', moduloId: gestionCpesModulo.id },
      { ruta: '/configuraciones/edit/:id', metodo: 'PUT', descripcion: 'Actualizar configuracion', tipo: 'escritura', moduloId: gestionCpesModulo.id },
      { ruta: '/configuraciones/delete/:id', metodo: 'DELETE', descripcion: 'Eliminar configuracion', tipo: 'eliminación', moduloId: gestionCpesModulo.id },

      // Permisos de roles
      { ruta: '/roles', metodo: 'GET', descripcion: 'Listar roles', tipo: 'lectura', moduloId: gestionUsuariosModulo.id },
      { ruta: '/roles/new', metodo: 'GET', descripcion: 'Formulario agregar rol', tipo: 'lectura', moduloId: gestionUsuariosModulo.id },
      { ruta: '/roles/new', metodo: 'POST', descripcion: 'Crear rol', tipo: 'escritura', moduloId: gestionUsuariosModulo.id },
      { ruta: '/roles/edit/:id', metodo: 'GET', descripcion: 'Formulario editar rol', tipo: 'lectura', moduloId: gestionUsuariosModulo.id },
      { ruta: '/roles/edit/:id', metodo: 'PUT', descripcion: 'Actualizar rol', tipo: 'escritura', moduloId: gestionUsuariosModulo.id },
      { ruta: '/roles/delete/:id', metodo: 'DELETE', descripcion: 'Eliminar rol', tipo: 'eliminación', moduloId: gestionUsuariosModulo.id },

      // Permisos de usuarios
      { ruta: '/usuarios', metodo: 'GET', descripcion: 'Listar usuarios', tipo: 'lectura', moduloId: gestionUsuariosModulo.id },
      { ruta: '/usuarios/new', metodo: 'GET', descripcion: 'Formulario agregar usuario', tipo: 'lectura', moduloId: gestionUsuariosModulo.id },
      { ruta: '/usuarios/new', metodo: 'POST', descripcion: 'Crear usuario', tipo: 'escritura', moduloId: gestionUsuariosModulo.id },
      { ruta: '/usuarios/edit/:id', metodo: 'GET', descripcion: 'Formulario editar usuario', tipo: 'lectura', moduloId: gestionUsuariosModulo.id },
      { ruta: '/usuarios/edit/:id', metodo: 'PUT', descripcion: 'Actualizar usuario', tipo: 'escritura', moduloId: gestionUsuariosModulo.id },
      { ruta: '/usuarios/delete/:id', metodo: 'DELETE', descripcion: 'Eliminar usuario', tipo: 'eliminación', moduloId: gestionUsuariosModulo.id },

      // Permisos de servicios
      { ruta: '/servicios', metodo: 'GET', descripcion: 'Listar servicios', tipo: 'lectura', moduloId: contratosServiciosModulo.id },
      { ruta: '/servicios/new', metodo: 'GET', descripcion: 'Formulario agregar servicio', tipo: 'lectura', moduloId: contratosServiciosModulo.id },
      { ruta: '/servicios/new', metodo: 'POST', descripcion: 'Crear servicio', tipo: 'escritura', moduloId: contratosServiciosModulo.id },
      { ruta: '/servicios/edit/:id', metodo: 'GET', descripcion: 'Formulario editar servicio', tipo: 'lectura', moduloId: contratosServiciosModulo.id },
      { ruta: '/servicios/edit/:id', metodo: 'PUT', descripcion: 'Actualizar servicio', tipo: 'escritura', moduloId: contratosServiciosModulo.id },
      { ruta: '/servicios/delete/:id', metodo: 'DELETE', descripcion: 'Eliminar servicio', tipo: 'eliminación', moduloId: contratosServiciosModulo.id },

      // Permisos de contratos
      { ruta: '/contratos', metodo: 'GET', descripcion: 'Listar contratos', tipo: 'lectura', moduloId: contratosServiciosModulo.id },
      { ruta: '/contratos/new', metodo: 'GET', descripcion: 'Formulario agregar contrato', tipo: 'lectura', moduloId: contratosServiciosModulo.id },
      { ruta: '/contratos/new', metodo: 'POST', descripcion: 'Crear contrato', tipo: 'escritura', moduloId: contratosServiciosModulo.id },
      { ruta: '/contratos/edit/:id', metodo: 'GET', descripcion: 'Formulario editar contrato', tipo: 'lectura', moduloId: contratosServiciosModulo.id },
      { ruta: '/contratos/edit/:id', metodo: 'PUT', descripcion: 'Actualizar contrato', tipo: 'escritura', moduloId: contratosServiciosModulo.id },
      { ruta: '/contratos/delete/:id', metodo: 'DELETE', descripcion: 'Eliminar contrato', tipo: 'eliminación', moduloId: contratosServiciosModulo.id },
      { ruta: '/contratos/pdf/:id', metodo: 'GET', descripcion: 'Generar contrato', tipo: 'lectura', moduloId: contratosServiciosModulo.id },
      
      // Permisos de politicas
      { ruta: '/politicas', metodo: 'GET', descripcion: 'Listar politicas', tipo: 'lectura', moduloId: contratosServiciosModulo.id },
      { ruta: '/politicas/new', metodo: 'GET', descripcion: 'Formulario agregar politica', tipo: 'lectura', moduloId: contratosServiciosModulo.id },
      { ruta: '/politicas/new', metodo: 'POST', descripcion: 'Crear politica', tipo: 'escritura', moduloId: contratosServiciosModulo.id },
      { ruta: '/politicas/edit/:id', metodo: 'GET', descripcion: 'Formulario editar politica', tipo: 'lectura', moduloId: contratosServiciosModulo.id },
      { ruta: '/politicas/edit/:id', metodo: 'PUT', descripcion: 'Actualizar politica', tipo: 'escritura', moduloId: contratosServiciosModulo.id },
      { ruta: '/politicas/delete/:id', metodo: 'DELETE', descripcion: 'Eliminar politica', tipo: 'eliminación', moduloId: contratosServiciosModulo.id },

      // Permisos de módulos
      { ruta: '/modulos', metodo: 'GET', descripcion: 'Listar módulos', tipo: 'lectura', moduloId: gestionModulosModulo.id },
      { ruta: '/modulos/new', metodo: 'GET', descripcion: 'Formulario agregar módulo', tipo: 'lectura', moduloId: gestionModulosModulo.id },
      { ruta: '/modulos/new', metodo: 'POST', descripcion: 'Crear módulo', tipo: 'escritura', moduloId: gestionModulosModulo.id },
      { ruta: '/modulos/edit/:id', metodo: 'GET', descripcion: 'Formulario editar módulo', tipo: 'lectura', moduloId: gestionModulosModulo.id },
      { ruta: '/modulos/edit/:id', metodo: 'PUT', descripcion: 'Actualizar módulo', tipo: 'escritura', moduloId: gestionModulosModulo.id },
      { ruta: '/modulos/delete/:id', metodo: 'DELETE', descripcion: 'Eliminar módulo', tipo: 'eliminación', moduloId: gestionModulosModulo.id },

      // Permisos de helpdesk
      { ruta: '/tickets', metodo: 'GET', descripcion: 'Listar tickets', tipo: 'lectura', moduloId: helpdeskModulo.id },
      { ruta: '/tickets/new', metodo: 'GET', descripcion: 'Formulario agregar tickets', tipo: 'lectura', moduloId: helpdeskModulo.id },
      { ruta: '/tickets/new', metodo: 'POST', descripcion: 'Crear tickets', tipo: 'escritura', moduloId: helpdeskModulo.id },
      { ruta: '/tickets/edit/:id', metodo: 'GET', descripcion: 'Formulario editar tickets', tipo: 'lectura', moduloId: helpdeskModulo.id },
      { ruta: '/tickets/edit/:id', metodo: 'PUT', descripcion: 'Actualizar tickets', tipo: 'escritura', moduloId: helpdeskModulo.id },
      { ruta: '/tickets/delete/:id', metodo: 'DELETE', descripcion: 'Eliminar tickets', tipo: 'eliminación', moduloId: helpdeskModulo.id },
      // Permisos de home y login
      //{ ruta: '/', metodo: 'GET', descripcion: 'Acceso al home', tipo: 'lectura', moduloId: dashboardModulo.id},
      //{ ruta: '/login', metodo: 'GET', descripcion: 'Acceso al login', tipo: 'lectura'},
      //{ ruta: '/login', metodo: 'POST', descripcion: 'Procesar login', tipo: 'escritura'},
      //{ ruta: '/logout', metodo: 'GET', descripcion: 'Procesar logout', tipo: 'lectura'},
    ];

    // Crear los permisos (manteniendo la asignación actual de rutas)
    const createdPermisos = [];
    for (const permiso of permisosData) {
      const createdPermiso = await prisma.permiso.create({
        data: {
          ruta: permiso.ruta,
          metodo: permiso.metodo,
          descripcion: permiso.descripcion,
          tipo: permiso.tipo,
        },
      });

      // Relacionar los permisos con los módulos en la tabla intermedia
      await prisma.moduloPermiso.create({
        data: {
          permisoId: createdPermiso.id,
          moduloId: permiso.moduloId,
        },
      });

      createdPermisos.push(createdPermiso);
    }

    // Conectar el rol Administrador a los permisos mediante RolPermiso
    for (const permiso of createdPermisos) {
      await prisma.rolPermiso.create({
        data: {
          rolId: adminRole.id,
          permisoId: permiso.id,
        },
      });
    }

    // Crear un usuario administrador por defecto
    const hashedPassword = await bcrypt.hash('adminpassword', 10); // Cambia la contraseña si es necesario
    await prisma.usuario.create({
      data: {
        email: 'admin@airlink.com',
        password: hashedPassword,
        nombre: 'Administrador',
        activo: true,
        rol: { connect: { id: adminRole.id } },
      },
    });

    // Insertar un cliente
    await prisma.cliente.create({
      data: {
        nombres: 'Juan Carlos',
        apellidos: 'Cortez Barrera',
        alias: 'FAMILIA CORTEZ',
        telefono: '76542388',
        correo: 'juan@gmail.com',
        dui: '9834567-5',
      },
    });

    // Insertar servicios
    const serviciosData = [
      {
        servicio: 'Servicio de Internet 8mps',
        precio: 25.0,
        descripcion:
          'Velocidad de 8 Megas para que puedas conectar tu SmartTV, ver Netflix, ver televisión (IPTV), escuchar música y más.',
        tipo_pago: 'Recurrente',
      },
      {
        servicio: 'Servicio de Internet 3mps',
        precio: 15.0,
        descripcion:
          'Velocidad de 3 Megas para que puedas navegar por internet, estudiar, ver videos y escuchar música.',
        tipo_pago: 'Recurrente',
      },
      {
        servicio: 'Instalacion de equipo CPE',
        precio: 25.0,
        descripcion: 'Instalación de equipo para el contrato del servicio.',
        tipo_pago: 'Unico',
      },
      {
        servicio: 'Servicio de canales IPTV',
        precio: 5.5,
        descripcion:
          'Ahora puedes ver televisión por internet desde tu Smart TV con la nueva tecnología IPTV donde podrás disfrutar tus canales nacionales e internacionales.',
        tipo_pago: 'Recurrente',
      },
    ];

    for (const servicio of serviciosData) {
      await prisma.servicio.create({
        data: servicio,
      });
    }

    // Insertar políticas en la tabla Politica
    const politicasData = [
      {
        titulo: 'POLITICA PERIODO DE CONTRATACION Y RENOVACION',
        contenido: `
          <p class="ql-indent-1 ql-align-justify"><strong>I.</strong> La duración del contrato tiene una vigencia de 12 meses a partir desde el momento que los dos representantes realicen la firma de éste.</p>
          <p class="ql-indent-1 ql-align-justify"><strong>II.</strong> El contrato se renueva automáticamente a menos que EL CLIENTE notifique su deseo de cancelación con al menos 30 días de anticipación.</p>
          <p class="ql-indent-1 ql-align-justify"><strong>III.</strong> El servicio se suspenderá automáticamente luego de 3 días de la fecha de pago y este no ha sido cancelado.</p>
          <p class="ql-indent-1 ql-align-justify"><strong>IV.</strong> EL CLIENTE puede cancelar el servicio cuando desee, sin embargo, tiene la obligación a cumplir la POLITICA DE USO DE EQUIPO CPE.</p>
        `,
      },
      {
        titulo: 'POLITICA DE USO DE EQUIPO CPE',
        contenido: `
          <p class="ql-indent-1 ql-align-justify"><strong>I.</strong> El equipo que te brindamos para que te conectes a Internet es prestado y será retirado cuando EL CLIENTE ya no requiera del servicio.</p>
          <p class="ql-indent-1 ql-align-justify"><strong>II.</strong> Cualquier daño irreversible realizado al equipo será agregado su valor a la factura del representante EL CLIENTE.</p>
        `,
      },
      {
        titulo: 'OBLIGACIONES DEL PROVEEDOR',
        contenido: `
          <p class="ql-indent-1 ql-align-justify"><strong>I.</strong> Proveer una conexión a Internet estable y confiable, dentro de los parámetros de velocidad y calidad especificados en el contrato.</p>
          <p class="ql-indent-1 ql-align-justify"><strong>II.</strong> Ofrecer asistencia técnica a EL CLIENTE en caso de problemas con la conexión.</p>
          <p class="ql-indent-1 ql-align-justify"><strong>III.</strong> Notificar a EL CLIENTE cualquier interrupción del servicio con la mayor anticipación posible.</p>
          <p class="ql-indent-1 ql-align-justify"><strong>IV.</strong> Respetar la privacidad de EL CLIENTE y no divulgar información personal a terceros sin su consentimiento.</p>
        `,
      },
      {
        titulo: 'OBLIGACIONES DEL CLIENTE',
        contenido: `
          <p class="ql-indent-1"><strong>I.</strong> Pagar el precio del servicio de forma puntual, según las condiciones establecidas en el contrato.</p>
          <p class="ql-indent-1"><strong>II.</strong> Utilizar el servicio de forma responsable, evitando actividades que puedan afectar la calidad de la conexión para otros usuarios.</p>
          <p class="ql-indent-1"><strong>III.</strong> No compartir la contraseña de acceso con terceros.</p>
          <p class="ql-indent-1"><strong>IV.</strong> Informar a EL PROVEEDOR de cualquier cambio en sus datos de contacto.</p>
        `,
      },
      {
        titulo: 'CLAUSULAS DE INCUMPLIMIENTO',
        contenido: `
          <p class="ql-align-justify ql-indent-1"><strong>I.</strong> En caso de incumplimiento por parte de EL CLIENTE, EL PROVEEDOR se reserva el derecho de suspender el servicio temporal o definitivamente.</p>
          <p class="ql-align-justify ql-indent-1"><strong>II.</strong> Si EL PROVEEDOR incumple con sus obligaciones, EL CLIENTE tiene derecho a rescindir el contrato sin penalización alguna.</p>
        `,
      },
      {
        titulo: 'RESOLUCION DE CONTROVERSIAS',
        contenido: `
          <p class="ql-align-justify">Ambas partes acuerdan que cualquier disputa o reclamación derivada de este contrato será resuelta de conformidad con las leyes vigentes y ante los tribunales competentes de la ciudad de ____________________.</p>
        `,
      },
    ];

    for (const politica of politicasData) {
      await prisma.politica.create({
        data: politica,
      });
    }

    // Insertar registros en la tabla CuentasContables
    const cuentasContablesData = [
      { tipocc: 'CCI', nombre_cuenta: 'Cuenta de Ingreso', descripcion: null },
      { tipocc: 'CCC', nombre_cuenta: 'Cuenta de Costos', descripcion: null },
      { tipocc: 'CCG', nombre_cuenta: 'Cuenta de Gastos', descripcion: null },
      { tipocc: 'CCCxP', nombre_cuenta: 'Cuentas por Pagar', descripcion: null },
      { tipocc: 'CCPR', nombre_cuenta: 'Cuentas de préstamos', descripcion: null },
    ];

    for (const cuenta of cuentasContablesData) {
      await prisma.cuentaContable.create({
        data: cuenta,
      });
    }

    // Agregar los tipos de tickets solicitados
    const tiposTicket = [
      { nombre: 'resolucion', descripcion: 'Soporte técnico para resolver problemas' },
      { nombre: 'instalacion', descripcion: 'Instalación de equipo nuevo' },
      { nombre: 'mantenimiento', descripcion: 'Mantenimiento de equipos ya instalados' },
    ];

    for (const tipo of tiposTicket) {
      await prisma.tipoTicket.create({
        data: tipo,
      });
    }

    // Crear roles por defecto
    const rolesData = [
      { nombre: 'Cliente', esAdmin: false },
      { nombre: 'Tecnico', esAdmin: true },
      { nombre: 'Instalador', esAdmin: true },
      { nombre: 'Soporte Tecnico', esAdmin: true },
    ];

    const createdRoles = [];
    for (const rol of rolesData) {
      const createdRol = await prisma.rol.create({ data: rol });
      createdRoles.push(createdRol);
    }

    // Asignar módulos a los nuevos roles
    const clienteRole = createdRoles.find(r => r.nombre === 'Cliente');
    const tecnicoRole = createdRoles.find(r => r.nombre === 'Tecnico');
    const instaladorRole = createdRoles.find(r => r.nombre === 'Instalador');
    const soporteTecnicoRole = createdRoles.find(r => r.nombre === 'Soporte Tecnico');

    // Asignar módulos a Tecnico
    await prisma.rolModulo.create({
      data: { rolId: tecnicoRole.id, moduloId: gestionCpesModulo.id },
    });
    await prisma.rolModulo.create({
      data: { rolId: tecnicoRole.id, moduloId: helpdeskModulo.id },
    });

    // Asignar módulos a Instalador
    await prisma.rolModulo.create({
      data: { rolId: instaladorRole.id, moduloId: gestionCpesModulo.id },
    });
    await prisma.rolModulo.create({
      data: { rolId: instaladorRole.id, moduloId: helpdeskModulo.id },
    });

    // Asignar módulos a Soporte Tecnico
    await prisma.rolModulo.create({
      data: { rolId: soporteTecnicoRole.id, moduloId: helpdeskModulo.id },
    });

    // Crear permisos específicos para cada rol

    // Permisos para Cliente
    const permisosCliente = [
      { ruta: '/', metodo: 'GET', descripcion: 'Acceso al home', tipo: 'lectura', moduloId: dashboardModulo.id },
      { ruta: '/perfil', metodo: 'GET', descripcion: 'Ver perfil', tipo: 'lectura', moduloId: clientesModulo.id },
      { ruta: '/perfil', metodo: 'PUT', descripcion: 'Actualizar perfil', tipo: 'escritura', moduloId: clientesModulo.id },
      { ruta: '/tickets', metodo: 'GET', descripcion: 'Listar sus tickets', tipo: 'lectura', moduloId: helpdeskModulo.id },
      { ruta: '/tickets/new', metodo: 'GET', descripcion: 'Formulario agregar tickets', tipo: 'lectura', moduloId: helpdeskModulo.id },
      { ruta: '/tickets/new', metodo: 'POST', descripcion: 'Crear tickets', tipo: 'escritura', moduloId: helpdeskModulo.id },
      { ruta: '/tickets/timeline:id', metodo: 'GET', descripcion: 'Ver detalles del ticket', tipo: 'lectura', moduloId: helpdeskModulo.id },
      { ruta: '/tickets/timeline/:id', metodo: 'POST', descripcion: 'Responder al ticket', tipo: 'escritura', moduloId: helpdeskModulo.id },
    ];

    for (const permiso of permisosCliente) {
      const createdPermiso = await prisma.permiso.create({
        data: {
          ruta: permiso.ruta,
          metodo: permiso.metodo,
          descripcion: permiso.descripcion,
          tipo: permiso.tipo,
        },
      });

      // Relacionar los permisos con los módulos en la tabla intermedia
      await prisma.moduloPermiso.create({
        data: {
          permisoId: createdPermiso.id,
          moduloId: permiso.moduloId,
        },
      });

      // Asignar permisos al rol Cliente
      await prisma.rolPermiso.create({
        data: {
          rolId: clienteRole.id,
          permisoId: createdPermiso.id,
        },
      });
    }

    // Permisos para Tecnico
    const permisosTecnico = [
      { ruta: '/equipos', metodo: 'GET', descripcion: 'Listar equipos', tipo: 'lectura', moduloId: gestionCpesModulo.id },
      { ruta: '/equipos/edit/:id', metodo: 'PUT', descripcion: 'Actualizar equipo', tipo: 'escritura', moduloId: gestionCpesModulo.id },
      { ruta: '/tickets', metodo: 'GET', descripcion: 'Listar tickets asignados', tipo: 'lectura', moduloId: helpdeskModulo.id },
      { ruta: '/tickets/timeline/:id', metodo: 'GET', descripcion: 'Ver detalles del ticket asignado', tipo: 'lectura', moduloId: helpdeskModulo.id },
      { ruta: '/tickets/timeline/:id', metodo: 'POST', descripcion: 'Responder al ticket asignado', tipo: 'escritura', moduloId: helpdeskModulo.id },
    ];

    for (const permiso of permisosTecnico) {
      const createdPermiso = await prisma.permiso.create({
        data: {
          ruta: permiso.ruta,
          metodo: permiso.metodo,
          descripcion: permiso.descripcion,
          tipo: permiso.tipo,
        },
      });

      // Relacionar los permisos con los módulos en la tabla intermedia
      await prisma.moduloPermiso.create({
        data: {
          permisoId: createdPermiso.id,
          moduloId: permiso.moduloId,
        },
      });

      // Asignar permisos al rol Tecnico
      await prisma.rolPermiso.create({
        data: {
          rolId: tecnicoRole.id,
          permisoId: createdPermiso.id,
        },
      });
    }

    // Permisos para Instalador
    const permisosInstalador = [
      { ruta: '/equipos', metodo: 'GET', descripcion: 'Listar equipos', tipo: 'lectura', moduloId: gestionCpesModulo.id },
      { ruta: '/equipos/edit/:id', metodo: 'PUT', descripcion: 'Actualizar equipo', tipo: 'escritura', moduloId: gestionCpesModulo.id },
      { ruta: '/tickets', metodo: 'GET', descripcion: 'Listar tickets asignados', tipo: 'lectura', moduloId: helpdeskModulo.id },
      { ruta: '/tickets/timeline/:id', metodo: 'GET', descripcion: 'Ver detalles del ticket asignado', tipo: 'lectura', moduloId: helpdeskModulo.id },
      { ruta: '/tickets/timeline/:id', metodo: 'POST', descripcion: 'Responder al ticket asignado', tipo: 'escritura', moduloId: helpdeskModulo.id },
    ];

    for (const permiso of permisosInstalador) {
      const createdPermiso = await prisma.permiso.create({
        data: {
          ruta: permiso.ruta,
          metodo: permiso.metodo,
          descripcion: permiso.descripcion,
          tipo: permiso.tipo,
        },
      });

      // Relacionar los permisos con los módulos en la tabla intermedia
      await prisma.moduloPermiso.create({
        data: {
          permisoId: createdPermiso.id,
          moduloId: permiso.moduloId,
        },
      });

      // Asignar permisos al rol Instalador
      await prisma.rolPermiso.create({
        data: {
          rolId: instaladorRole.id,
          permisoId: createdPermiso.id,
        },
      });
    }

    // Permisos para Soporte Tecnico
    const permisosSoporte = [
      // Permisos de helpdesk
      { ruta: '/tickets', metodo: 'GET', descripcion: 'Listar tickets', tipo: 'lectura', moduloId: helpdeskModulo.id },
      { ruta: '/tickets/new', metodo: 'GET', descripcion: 'Formulario agregar tickets', tipo: 'lectura', moduloId: helpdeskModulo.id },
      { ruta: '/tickets/new', metodo: 'POST', descripcion: 'Crear tickets', tipo: 'escritura', moduloId: helpdeskModulo.id },
      { ruta: '/tickets/edit/:id', metodo: 'GET', descripcion: 'Formulario editar tickets', tipo: 'lectura', moduloId: helpdeskModulo.id },
      { ruta: '/tickets/edit/:id', metodo: 'PUT', descripcion: 'Actualizar tickets', tipo: 'escritura', moduloId: helpdeskModulo.id },
      { ruta: '/tickets/delete/:id', metodo: 'DELETE', descripcion: 'Eliminar tickets', tipo: 'eliminación', moduloId: helpdeskModulo.id },
    ];

    for (const permiso of permisosSoporte) {
      const createdPermiso = await prisma.permiso.create({
        data: {
          ruta: permiso.ruta,
          metodo: permiso.metodo,
          descripcion: permiso.descripcion,
          tipo: permiso.tipo,
        },
      });

      // Relacionar los permisos con los módulos en la tabla intermedia
      await prisma.moduloPermiso.create({
        data: {
          permisoId: createdPermiso.id,
          moduloId: permiso.moduloId,
        },
      });

      // Asignar permisos al rol Soporte Tecnico
      await prisma.rolPermiso.create({
        data: {
          rolId: soporteTecnicoRole.id,
          permisoId: createdPermiso.id,
        },
      });
    }

    // Crear permisos adicionales para asignar tickets (solo Administrador y Soporte Tecnico)
    //const permisosAsignacion = [
    //  { ruta: '/tickets/assign', metodo: 'POST', descripcion: 'Asignar ticket a sí mismo o a Tecnico/Instalador', tipo: 'escritura', moduloId: helpdeskModulo.id },
   // ];

    // for (const permiso of permisosAsignacion) {
    //   const createdPermiso = await prisma.permiso.create({
    //     data: {
    //       ruta: permiso.ruta,
    //       metodo: permiso.metodo,
    //       descripcion: permiso.descripcion,
    //       tipo: permiso.tipo,
    //     },
    //   });

       // Relacionar el permiso con el módulo helpdesk
    //   await prisma.moduloPermiso.create({
    //     data: {
    //       permisoId: createdPermiso.id,
    //       moduloId: permiso.moduloId,
    //     },
    //   });

       // Asignar permisos de asignación al rol Administrador y Soporte Tecnico
    //   await prisma.rolPermiso.create({
    //     data: {
    //       rolId: adminRole.id,
    //       permisoId: createdPermiso.id,
    //     },
    //   });

    //   await prisma.rolPermiso.create({
    //     data: {
    //       rolId: soporteTecnicoRole.id,
    //       permisoId: createdPermiso.id,
    //     },
    //   });
    // }

    // === Agregar Usuarios Adicionales ===

// Definir los datos de los nuevos usuarios
const nuevosUsuarios = [
  {
    email: 'carlos.instalador@airlink.com',
    password: 'PasswordInstalador123',
    nombre: 'Carlos Alberto González Hernández',
    rol: 'Instalador',
  },
  {
    email: 'sergio.tecnico@airlink.com',
    password: 'PasswordTecnico123',
    nombre: 'Sergio Agustin Rivas Torres',
    rol: 'Tecnico',
  },
  {
    email: 'maria.soporte@airlink.com',
    password: 'PasswordSoporte123',
    nombre: 'María Isabel Ramírez Leonor',
    rol: 'Soporte Tecnico',
  },
];

// Crear los nuevos usuarios
for (const usuario of nuevosUsuarios) {
  // Verificar si el usuario ya existe
  const usuarioExistente = await prisma.usuario.findUnique({
    where: { email: usuario.email },
  });

  if (!usuarioExistente) {
    // Hash de la contraseña
    const hashedPassword = await bcrypt.hash(usuario.password, 10);

    // Encontrar el rol correspondiente
    let rolAsignado;
    switch (usuario.rol) {
      case 'Instalador':
        rolAsignado = instaladorRole;
        break;
      case 'Tecnico':
        rolAsignado = tecnicoRole;
        break;
      case 'Soporte Tecnico':
        rolAsignado = soporteTecnicoRole;
        break;
      default:
        console.log(`Rol ${usuario.rol} no encontrado para el usuario ${usuario.email}.`);
        continue; // Salta a la siguiente iteración si el rol no existe
    }

    // Crear el usuario
    await prisma.usuario.create({
      data: {
        email: usuario.email,
        password: hashedPassword,
        nombre: usuario.nombre,
        activo: true,
        rol: { connect: { id: rolAsignado.id } },
      },
    });

    console.log(`Usuario ${usuario.email} creado exitosamente.`);
  } else {
    console.log(`El usuario ${usuario.email} ya existe. Se omitió la creación.`);
  }
}

    console.log('Semilla completada con exito.');
  } else {
    console.log('El rol Administrador ya existe.');
  }
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });