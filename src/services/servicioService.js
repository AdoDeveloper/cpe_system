// src/services/servicioService.js
const prisma = require('../lib/prismaClient');

exports.getAllServicios = async () => {
  return await prisma.servicio.findMany();
};

exports.getServicioById = async (id) => {
  return await prisma.servicio.findUnique({ where: { id: parseInt(id) } });
};

exports.createServicio = async (data) => {
  return await prisma.servicio.create({ data });
};

exports.updateServicio = async (id, data) => {
  return await prisma.servicio.update({
    where: { id: parseInt(id) },
    data,
  });
};

exports.deleteServicio = async (id) => {
  return await prisma.servicio.delete({ where: { id: parseInt(id) } });
};
