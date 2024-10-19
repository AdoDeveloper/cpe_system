// src/lib/pathMatcher.js

const UrlPattern = require('url-pattern');

/**
 * Verifica si una ruta solicitada coincide con un patrón de permiso.
 * @param {string} pattern - Patrón de la ruta con parámetros (ej. '/servicios/edit/:id').
 * @param {string} path - Ruta solicitada (ej. '/servicios/edit/1').
 * @returns {boolean} - True si coincide, false en caso contrario.
 */
function isMatch(pattern, path) {
  const urlPattern = new UrlPattern(pattern);
  const params = urlPattern.match(path);
  return params !== null;
}

module.exports = { isMatch };
