// src/lib/pathMatcher.js

const UrlPattern = require('url-pattern');

/**
 * Verifica si una ruta solicitada coincide con un patrón de permiso.
 * @param {string} pattern - Patrón de la ruta con parámetros (ej. '/tickets/:id').
 * @param {string} path - Ruta solicitada (ej. '/tickets/1').
 * @returns {boolean} - True si coincide, false en caso contrario.
 */
function isMatch(pattern, path) {
  // Crear un patrón URL usando UrlPattern
  const urlPattern = new UrlPattern(pattern);
  const params = urlPattern.match(path); // Intenta hacer coincidir la ruta
  return params !== null; // Si hay parámetros, la ruta coincide
}

module.exports = { isMatch };
