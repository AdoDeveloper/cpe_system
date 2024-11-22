// src/lib/pathMatcher.js

const UrlPattern = require('url-pattern');

/**
 * Verifica si una ruta solicitada coincide con un patrón de permiso.
 * @param {string} pattern - Patrón de la ruta con parámetros (ej. '/tickets/:id').
 * @param {string} path - Ruta solicitada (ej. '/tickets/1').
 * @returns {boolean} - True si coincide, false en caso contrario.
 */

function isMatch(pattern, path) {
  try {
    if (!pattern || !path) {
      console.error('El patrón o la ruta son inválidos:', { pattern, path });
      return false;
    }

    // Sanitizar patrón y ruta eliminando espacios innecesarios
    const cleanPattern = pattern.trim();
    const cleanPath = path.trim();

    // Crear un patrón URL usando UrlPattern
    const urlPattern = new UrlPattern(cleanPattern);

    // Intenta hacer coincidir la ruta
    const params = urlPattern.match(cleanPath);

    // Devuelve true si hay coincidencias, false en caso contrario
    return params !== null;
  } catch (error) {
    console.error('Error en el proceso de coincidencia de rutas:', error.message);
    return false; // En caso de error, devuelve false
  }
}

module.exports = { isMatch };
