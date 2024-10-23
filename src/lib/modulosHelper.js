// src/lib/modulosHelper.js

async function getModulosActivos(permisos) {
    const permisosActivos = permisos.filter(p => p.permiso.modulos.length === 0 || p.permiso.modulos.some(modulo => modulo.activo));

    const modulosActivos = permisosActivos.map(p => p.permiso.modulos.map(m => m.nombre)).flat();

    return {
        dashboard: modulosActivos.includes('dashboard'),
        facturacion: modulosActivos.includes('facturacion'),
        contratos_servicios: modulosActivos.includes('contratos_servicios'),
        clientes: modulosActivos.includes('clientes'),
        gestion_cpes: modulosActivos.includes('gestion_cpes'),
        gestion_usuarios: modulosActivos.includes('gestion_usuarios'),
        gestion_modulos: modulosActivos.includes('gestion_modulos'),
    };
}

// Exportar la función para que pueda ser utilizada en otros archivos
module.exports = {
    getModulosActivos
};
