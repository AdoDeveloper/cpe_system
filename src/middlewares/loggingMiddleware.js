// src/middlewares/loggingMiddleware.js
const morgan = require('morgan');
const UAParser = require('ua-parser-js');
const { EventEmitter } = require('events');
const Bitacora = require('../model/bitacora');

// Configurar un EventEmitter para manejar la cola de registros
const logEmitter = new EventEmitter();
const logQueue = [];
const MAX_QUEUE_SIZE = 100; // Tamaño máximo de la cola antes de escribir en la base de datos
const FLUSH_INTERVAL = 5000; // Intervalo de tiempo para escribir en la base de datos (en ms)

// Función para procesar y guardar los registros en la base de datos
const flushLogs = async () => {
  if (logQueue.length === 0) return;

  // Copiar y vaciar la cola actual
  const logsToSave = logQueue.splice(0, logQueue.length);

  try {
    await Bitacora.insertMany(logsToSave);
    // console.log('Registros guardados en la base de datos');
  } catch (err) {
    console.error('Error al guardar registros en la base de datos:', err);
  }
};

// Configurar el evento para vaciar la cola periódicamente
setInterval(flushLogs, FLUSH_INTERVAL);

// Tokens personalizados
morgan.token('user', (req) => (req.session && req.session.userName) || 'Anónimo');
morgan.token('role', (req) => (req.session && req.session.userRole) || 'Invitado');
morgan.token('ip', (req) => req.headers['x-forwarded-for'] || req.connection.remoteAddress || req.ip);
morgan.token('userAgent', (req) => req.headers['user-agent'] || 'Desconocido');

// Métodos a registrar
const methodsToLog = new Set(['GET', 'POST', 'PUT', 'DELETE']);

// Cache para el análisis de User-Agent
const userAgentCache = new Map();
const MAX_CACHE_SIZE = 1000;

// Función para obtener información del navegador y SO
const parseUserAgent = (ua) => {
  if (userAgentCache.has(ua)) {
    return userAgentCache.get(ua);
  }

  const parser = new UAParser(ua);
  const result = parser.getResult();
  const browserName = result.browser.name || 'Desconocido';
  const browserVersion = result.browser.version || '';
  const osName = result.os.name || 'Desconocido';
  const osVersion = result.os.version || '';
  const userAgentInfo = `${browserName} ${browserVersion} en ${osName} ${osVersion}`;

  // Agregar al caché
  if (userAgentCache.size >= MAX_CACHE_SIZE) {
    // Eliminar la primera entrada del caché
    const firstKey = userAgentCache.keys().next().value;
    userAgentCache.delete(firstKey);
  }
  userAgentCache.set(ua, userAgentInfo);

  return userAgentInfo;
};

const loggingMiddleware = morgan((tokens, req, res) => {
  // Verificar si el método HTTP está en la lista de métodos a registrar
  if (!methodsToLog.has(req.method)) {
    return null;
  }

  // Verificar si el usuario está autenticado
  if (!req.session || !req.session.userName) {
    return null; // Omitir el registro si el usuario no está autenticado
  }

  // Obtener los valores necesarios utilizando los tokens
  const user = tokens.user(req, res);
  const role = tokens.role(req, res);
  const ip = tokens.ip(req, res);
  const ua = tokens.userAgent(req, res);
  const browser = parseUserAgent(ua);
  const method = tokens.method(req, res);
  const route = tokens.url(req, res);
  const status = res.statusCode;

  // Crear una nueva entrada en la bitácora
  const logEntry = {
    user,
    role,
    method,
    route,
    action: method,
    statusCode: status,
    ip,
    browser,
    timestamp: new Date(),
  };

  // Agregar el registro a la cola
  logQueue.push(logEntry);

  // Si la cola alcanza el tamaño máximo, escribir en la base de datos
  if (logQueue.length >= MAX_QUEUE_SIZE) {
    flushLogs();
  }

  // Devolver null para que Morgan no escriba nada en la consola
  return null;
});

module.exports = loggingMiddleware;
