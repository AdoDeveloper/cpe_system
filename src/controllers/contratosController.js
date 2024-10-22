const PDFDocument = require('pdfkit');
const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();
const axios = require('axios'); // Para descargar la imagen del logo

// Controlador para listar los contratos
exports.listContratos = async (req, res) => {
    try {
        const contratos = await prisma.contrato.findMany({
            include: {
                cliente: true, // Incluir datos del cliente
                servicios: {
                    include: {
                        servicio: true // Incluir detalles del servicio
                    }
                }
            }
        });

        // Filtrar servicios que sean solo recurrentes
        contratos.forEach(contrato => {
            contrato.servicios = contrato.servicios.filter(cs => cs.servicio.tipo_pago === 'Recurrente');
        });

        res.render('pages/contratos/listado', { contratos });
    } catch (error) {
        console.error('Error al listar los contratos:', error);
        req.flash('error_msg', 'Error al listar los contratos.');
        return res.status(500).redirect('/contratos');
    } finally {
        await prisma.$disconnect();
    }
};

// Renderiza el formulario para crear un nuevo contrato
exports.renderCreateForm = async (req, res) => {
    try {
        const clientes = await prisma.cliente.findMany(); // Obtener todos los clientes
        const servicios = await prisma.servicio.findMany(); // Obtener todos los servicios
        res.render('pages/contratos/agregar', { action: 'new', clientes, servicios, errors: [] });
    } catch (error) {
        console.error('Error al cargar el formulario de contrato:', error);
        req.flash('error_msg', 'Error al cargar el formulario de contrato.');
        return res.status(500).redirect('/contratos');
    } finally {
        await prisma.$disconnect();
    }
};

exports.createContrato = async (req, res) => {
    try {
        //console.log(req.body); // Para depuración

        const { clienteId, servicioIds, anexo, fecha_contrato, activo } = req.body;

        // Verificar si se seleccionaron servicios
        if (!servicioIds) {
            req.flash('error_msg', 'Debes seleccionar al menos un servicio.');
            return res.redirect('/contratos/new');
        }

        // Asegurarse de que servicioIds sea un array
        const serviciosSeleccionados = Array.isArray(servicioIds) ? servicioIds : [servicioIds];

        // Convertir los IDs a enteros
        const serviciosValidos = serviciosSeleccionados
            .map(servicioId => parseInt(servicioId, 10))
            .filter(servicioId => !isNaN(servicioId));

        // Verificar si hay servicios válidos
        if (serviciosValidos.length === 0) {
            req.flash('error_msg', 'Debes seleccionar al menos un servicio válido.');
            return res.redirect('/contratos/new');
        }

        // Crear el contrato
        await prisma.contrato.create({
            data: {
                anexo,
                fecha_contrato: new Date(fecha_contrato),
                clienteId: parseInt(clienteId),
                activo: activo === 'true',
                servicios: {
                    create: serviciosValidos.map(servicioId => ({
                        servicio: { connect: { id: servicioId } }
                    }))
                }
            }
        });

        req.flash('success_msg', 'Contrato creado exitosamente.');
        res.status(201).redirect('/contratos');
    } catch (error) {
        console.error('Error al crear el contrato:', error);
        req.flash('error_msg', 'Error al crear el contrato.');
        return res.status(500).redirect('/contratos');
    } finally {
        await prisma.$disconnect();
    }
};

// Renderiza el formulario para editar un contrato existente
exports.renderEditForm = async (req, res) => {
    try {
        const { id } = req.params;
        const contrato = await prisma.contrato.findUnique({
            where: { id: parseInt(id) },
            include: {
                cliente: true,
                servicios: { include: { servicio: true } }
            }
        });
        if (!contrato) {
            return res.redirect('/contratos');
        }
        const clientes = await prisma.cliente.findMany();
        const servicios = await prisma.servicio.findMany();
        res.render('pages/contratos/modificar', { contrato, clientes, servicios, errors: [] });
    } catch (error) {
        console.error('Error al cargar el contrato para editar:', error);
        req.flash('error_msg', 'Error al cargar el contrato.');
        return res.status(500).redirect('/contratos');
    } finally {
        await prisma.$disconnect();
    }
};

// Controlador para actualizar un contrato existente
exports.updateContrato = async (req, res) => {
    try {
        const { id } = req.params;
        const { clienteId, servicioIds, anexo, fecha_contrato, activo} = req.body;

        // Asegurarse de que servicioIds sea un array, igual que en la creación
        const serviciosSeleccionados = Array.isArray(servicioIds) ? servicioIds : [servicioIds];

        await prisma.contrato.update({
            where: { id: parseInt(id) },
            data: {
                anexo,
                fecha_contrato: new Date(fecha_contrato),
                activo: activo === 'true',
                clienteId: parseInt(clienteId),
                servicios: {
                    deleteMany: {}, // Eliminar servicios existentes
                    create: serviciosSeleccionados.map(servicioId => ({
                        servicio: { connect: { id: parseInt(servicioId) } }
                    }))
                }
            }
        });

        req.flash('success_msg', 'Contrato actualizado exitosamente.');
        res.status(200).redirect('/contratos');
    } catch (error) {
        console.error('Error al actualizar el contrato:', error);
        req.flash('error_msg', 'Error al actualizar el contrato.');
        return res.status(500).redirect('/contratos');
    } finally {
        await prisma.$disconnect();
    }
};

// Controlador para eliminar un contrato
exports.deleteContrato = async (req, res) => {
    try {
        const { id } = req.params;

        // Primero, elimina los servicios asociados al contrato en la tabla ContratoServicio
        await prisma.contratoServicio.deleteMany({
            where: {
                contratoId: parseInt(id)
            }
        });

        // Luego, elimina el contrato
        await prisma.contrato.delete({
            where: { id: parseInt(id) }
        });

        req.flash('success_msg', 'Contrato eliminado exitosamente.');
        res.status(200).redirect('/contratos');
    } catch (error) {
        console.error('Error al eliminar el contrato:', error);
        req.flash('error_msg', 'Error al eliminar el contrato.');
        return res.status(500).redirect('/contratos');
    } finally {
        await prisma.$disconnect();
    }
};

// Controlador para generar el contrato en PDF y enviarlo para descarga
exports.generateContratoPDF = async (req, res) => {
    try {
        const { id } = req.params;

        // Obtener el contrato con el cliente y los servicios relacionados
        const contrato = await prisma.contrato.findUnique({
            where: { id: parseInt(id) },
            include: {
                cliente: true,
                servicios: { include: { servicio: true } }
            }
        });

        if (!contrato) {
            req.flash('error_msg', 'Contrato no encontrado.');
            return res.redirect('/contratos');
        }

        // Calcular el total
        const total = contrato.servicios.reduce((acc, serv) => acc + serv.servicio.precio, 0);

        // Crear el documento PDF en memoria con márgenes personalizados
        const doc = new PDFDocument({ margin: 50 }); // Aumentar margen superior

        // Configurar el tipo de contenido y las cabeceras para forzar la descarga
        res.setHeader('Content-Type', 'application/pdf');
        res.setHeader('Content-Disposition', `attachment; filename=Contrato-${contrato.cliente.nombres}-${contrato.cliente.apellidos}.pdf`);

        // Enviar el documento PDF al cliente
        doc.pipe(res);

        // **Descargar la imagen del encabezado**
        const logoUrl = 'https://res.cloudinary.com/dldgicsdi/image/upload/v1729533127/img/image_contrato.png';

        // Descargar la imagen usando axios
        const response = await axios.get(logoUrl, { responseType: 'arraybuffer' });
        const logoImage = response.data;

        // Obtener el ancho de la página para centrar la imagen
        const pageWidth = doc.page.width;
        const imageWidth = 300; // Ajustar el ancho de la imagen
        const imageHeight = 150; // Ajustar el alto de la imagen
        const xPosition = (pageWidth - imageWidth) / 2; // Calcular la posición para centrar

        // Agregar la imagen al PDF centrada
        doc.image(logoImage, xPosition, 40, { width: imageWidth, height: imageHeight });

        // Mover el cursor debajo de la imagen
        doc.moveDown(9); // Aumentar el espacio debajo de la imagen para que el título no se sobreponga

        // Título del contrato
        doc.fontSize(18)
            .text('CONTRATO DE SERVICIO DE INTERNET', { align: 'center', underline: true })
            .moveDown(1); // Ajustar margen entre título y contenido

        // Fecha del contrato
        const fechaContrato = contrato.fecha_contrato.toLocaleDateString('es-ES');
        doc.fontSize(12)
            .text(`Fecha del contrato: ${fechaContrato}`, { align: 'right' })
            .moveDown(1);

        // Información de las partes
        doc.fontSize(12)
            .text('Entre:', { bold: true })
            .moveDown(0.5)
            .text('Airlink, proveedor de servicios de internet inalámbrico, que en lo sucesivo se denominará "EL PROVEEDOR", y', { align: 'justify' })
            .moveDown(0.5)
            .text(`${contrato.cliente.nombres} ${contrato.cliente.apellidos}, con DUI número ${contrato.cliente.dui}, quien en lo sucesivo se denominará "EL CLIENTE".`, { align: 'justify' })
            .moveDown(1);

        // Línea separadora
        doc.moveTo(doc.page.margins.left, doc.y)
            .lineTo(doc.page.width - doc.page.margins.right, doc.y)
            .stroke();

        // Descripción del Servicio
        doc.moveDown(1)
            .fontSize(14)
            .text('Descripción del Servicio', { underline: true })
            .moveDown(0.5)
            .fontSize(12);

        // Detalles de los servicios contratados
        contrato.servicios.forEach(serv => {
            doc.text(`- ${serv.servicio.servicio}: $${serv.servicio.precio.toFixed(2)}`);
        });

        doc.moveDown(1);

        // Precio y Forma de Pago
        doc.fontSize(14)
            .text('Precio y Forma de Pago', { underline: true })
            .moveDown(0.5)
            .fontSize(12)
            .list([
                `Precio mensual del servicio: $${total.toFixed(2)}, incluyendo impuestos aplicables.`,
                'Fecha de vencimiento del pago: 10 de cada mes.',
                'Métodos de pago aceptados: Tarjeta de crédito, débito, transferencia bancaria.',
                'Política de facturación: Se emite factura electrónica.',
                'Posibles cargos adicionales: Instalación, mantenimiento.'
            ], { bulletIndent: 20 })
            .moveDown(1);

        // Periodo de Contratación y Renovación
        doc.fontSize(14)
            .text('Periodo de Contratación y Renovación', { underline: true })
            .moveDown(0.5)
            .fontSize(12)
            .text('Duración del contrato: 12 meses.')
            .text('Condiciones de renovación: El contrato se renueva automáticamente a menos que el cliente notifique su deseo de cancelación con al menos 30 días de anticipación.')
            .moveDown(1);

        // Obligaciones del Proveedor
        doc.fontSize(14)
            .text('Obligaciones del Proveedor', { underline: true })
            .moveDown(0.5)
            .fontSize(12)
            .list([
                'Proveer una conexión a Internet estable y confiable, dentro de los parámetros de velocidad y calidad especificados en el contrato.',
                'Ofrecer asistencia técnica a los usuarios en caso de problemas con la conexión.',
                'Notificar al usuario cualquier interrupción del servicio con la mayor anticipación posible.',
                'Respetar la privacidad del usuario y no divulgar información personal a terceros sin su consentimiento.'
            ], { bulletIndent: 20 })
            .moveDown(1);

        // Obligaciones del Usuario
        doc.fontSize(14)
            .text('Obligaciones del Usuario', { underline: true })
            .moveDown(0.5)
            .fontSize(12)
            .list([
                'Pagar el precio del servicio de forma puntual, según las condiciones establecidas en el contrato.',
                'Utilizar el servicio de forma responsable, evitando actividades que puedan afectar la calidad de la conexión para otros usuarios.',
                'No compartir la contraseña de acceso con terceros.',
                'Informar al proveedor de cualquier cambio en sus datos de contacto.'
            ], { bulletIndent: 20 })
            .moveDown(1);

        // Cláusulas de Incumplimiento
        doc.fontSize(14)
            .text('Cláusulas de Incumplimiento', { underline: true })
            .moveDown(0.5)
            .fontSize(12)
            .text('En caso de incumplimiento por parte del usuario, el proveedor se reserva el derecho de suspender el servicio temporal o definitivamente.')
            .text('Si el proveedor incumple con sus obligaciones, el usuario tiene derecho a rescindir el contrato sin penalización alguna.')
            .moveDown(1);

        // Resolución de Controversias
        doc.fontSize(14)
            .text('Resolución de Controversias', { underline: true })
            .moveDown(0.5)
            .fontSize(12)
            .text('Ambas partes acuerdan que cualquier disputa o reclamación derivada de este contrato será resuelta de conformidad con las leyes vigentes y ante los tribunales competentes de la ciudad de ___________.')
            .moveDown(1);

        // Firma y Fecha (con alineación horizontal)
        doc.moveDown(2)
            .fontSize(12)
            .text('Firma y Fecha', { underline: true })
            .moveDown(2)
            .text('_________________________', { align: 'left', continued: true })
            .text('_________________________', { align: 'right' })
            .moveDown(0.5)
            .text('Firma de EL CLIENTE', { align: 'left', continued: true })
            .text('Firma de EL PROVEEDOR', { align: 'right' });

        // Finalizar el documento y enviar la respuesta
        doc.end();

    } catch (error) {
        console.error('Error al generar el contrato PDF:', error);
        req.flash('error_msg', 'Error al generar el contrato en PDF.');
        return res.redirect('/contratos');
    } finally {
        await prisma.$disconnect();
    }
};
