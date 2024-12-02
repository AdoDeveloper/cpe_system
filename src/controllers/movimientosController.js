// src/controllers/movimientosController.js

const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();
const PDFDocument = require('pdfkit-table');
const ExcelJS = require('exceljs');
const axios = require('axios');
const { parse } = require('date-fns');

// Controlador para listar los movimientos
exports.listMovimientos = async (req, res) => {
    try {
        const movimientos = await prisma.movimiento.findMany({
            include: { cliente: true },
            orderBy: { createdAt: 'desc' },
        });
        res.render('pages/movimientos/listado', { movimientos, title: 'Movimientos' });
    } catch (error) {
        console.error('Error al listar los movimientos:', error);
        req.flash('error_msg', 'Error al listar los movimientos.');
        res.status(500).redirect('/movimientos');
    } finally {
        await prisma.$disconnect();
    }
};

// Renderiza el formulario para crear un nuevo movimiento
exports.renderCreateForm = async (req, res) => {
    try {
        const cuentasContables = await prisma.cuentaContable.findMany();
        const clientes = await prisma.cliente.findMany();
        const facturas = await prisma.factura.findMany();

        const currentYear = new Date().getFullYear();
        const currentMonth = new Date().getMonth() + 1; // Enero es 0, por lo que se suma 1

        res.render('pages/movimientos/agregar', {
            cuentasContables,
            clientes,
            facturas,
            movimiento: {},
            currentYear,
            currentMonth,
            errors: [],
            title: 'Movimientos'
        });
    } catch (error) {
        console.error('Error al cargar datos para crear el movimiento:', error);
        req.flash('error_msg', 'Error al cargar datos necesarios para crear el movimiento.');
        res.status(500).redirect('/movimientos');
    } finally {
        await prisma.$disconnect();
    }
};


// Controlador para crear un nuevo movimiento
exports.createMovimiento = async (req, res) => {
    try {
        const { tipocc, anio, mes, monto, concepto, clienteId } = req.body;
        await prisma.movimiento.create({
            data: {
                tipocc,
                anio: parseInt(anio),
                mes: parseInt(mes),
                monto: parseFloat(monto),
                concepto,
                clienteId: parseInt(clienteId),
            },
        });
        req.flash('success_msg', 'Movimiento creado exitosamente.');
        res.status(201).redirect('/movimientos');
    } catch (error) {
        console.error('Error al crear el movimiento:', error);
        req.flash('error_msg', 'Error al crear el movimiento.');
        res.status(500).redirect('/movimientos');
    } finally {
        await prisma.$disconnect();
    }
};

// Renderiza el formulario para editar un movimiento existente
exports.renderEditForm = async (req, res) => {
    try {
        const { id } = req.params;
        const movimiento = await prisma.movimiento.findUnique({ where: { id: parseInt(id) } });
        if (!movimiento) {
            return res.redirect('/movimientos');
        }
        const cuentasContables = await prisma.cuentaContable.findMany();
        res.render('pages/movimientos/modificar', { action: 'edit', cuentasContables, movimiento, errors: [], title: 'Movimientos' });
    } catch (error) {
        console.error('Error al obtener el movimiento para editar:', error);
        req.flash('error_msg', 'Error al obtener el movimiento.');
        res.status(500).redirect('/movimientos');
    } finally {
        await prisma.$disconnect();
    }
};

// Controlador para actualizar un movimiento existente
exports.updateMovimiento = async (req, res) => {
    try {
        const { id } = req.params;
        const { tipocc, anio, mes, monto, concepto } = req.body;
        await prisma.movimiento.update({
            where: { id: parseInt(id) },
            data: {
                tipocc,
                anio: parseInt(anio),
                mes: parseInt(mes),
                monto: parseFloat(monto),
                concepto,
            },
        });
        req.flash('success_msg', 'Movimiento actualizado exitosamente.');
        res.status(201).redirect('/movimientos');
    } catch (error) {
        console.error('Error al actualizar el movimiento:', error);
        req.flash('error_msg', 'Error al actualizar el movimiento.');
        res.status(500).redirect('/movimientos');
    } finally {
        await prisma.$disconnect();
    }
};

// Controlador para eliminar un movimiento
exports.deleteMovimiento = async (req, res) => {
    try {
        const { id } = req.params;
        await prisma.movimiento.delete({ where: { id: parseInt(id) } });
        req.flash('success_msg', 'Movimiento eliminado exitosamente.');
        res.status(200).redirect('/movimientos');
    } catch (error) {
        console.error('Error al eliminar el movimiento:', error);
        req.flash('error_msg', 'Error al eliminar el movimiento.');
        res.status(500).redirect('/movimientos');
    } finally {
        await prisma.$disconnect();
    }
};

exports.generatePDFReport = async (req, res) => {
    try {
        // Obtener las fechas del query string (si no se pasan, tomar valores por defecto)
        const { startDate, endDate } = req.query;

        // Validar y parsear las fechas si se proporcionan
        let startDateParsed = startDate ? parse(startDate, 'yyyy-MM-dd', new Date()) : new Date('2000-01-01');
        let endDateParsed = endDate ? parse(endDate, 'yyyy-MM-dd', new Date()) : new Date();

        // Filtrar los movimientos por el rango de fechas
        const movimientos = await prisma.movimiento.findMany({
            where: {
                createdAt: {
                    gte: startDateParsed,
                    lte: endDateParsed,
                },
            },
            include: { cliente: true },
            orderBy: { createdAt: 'desc' },
        });

        // Crear un buffer para el PDF
        const buffers = [];
        const doc = new PDFDocument({ margin: 50, bufferPages: true });

        // Manejar los datos del PDF en buffers
        doc.on('data', buffers.push.bind(buffers));
        doc.on('end', () => {
            const pdfData = Buffer.concat(buffers);
            // Configurar el tipo de contenido y las cabeceras para forzar la descarga
            res.setHeader('Content-Type', 'application/pdf');
            res.setHeader('Content-Disposition', 'attachment; filename=movimientos_report.pdf');
            res.end(pdfData);
        });

        // **Descargar la imagen del encabezado**
        const logoUrl = 'https://res.cloudinary.com/dldgicsdi/image/upload/v1729533127/img/image_contrato.png';  // Cambia esta URL si es necesario
        const response = await axios.get(logoUrl, { responseType: 'arraybuffer' });
        const logoImage = response.data;
        const pageWidth = doc.page.width;
        const imageWidth = 300;
        const xPosition = (pageWidth - imageWidth) / 2;
        doc.image(logoImage, xPosition, 40, { width: imageWidth, height: 150 });

        // Mover el cursor debajo de la imagen
        doc.moveDown(9);

        // Título del reporte
        doc.fontSize(18).text('REPORTE DE MOVIMIENTOS', { align: 'center', underline: false }).moveDown(0.5);

        // Información de la empresa
        doc.fontSize(10).text('Airlink Internet Satelital', { align: 'center' }).moveDown(0.5);
        doc.fontSize(10).text('Col. Las Marías, Sonzacate, Sonsonate', { align: 'center' }).moveDown(0.5);
        doc.fontSize(10).text('Contacto: 7747-9525', { align: 'center' }).moveDown(1);

        // **Generar la tabla**
        const table = {
            headers: ['Concepto', 'Monto', 'Fecha', 'Cliente'],
            rows: movimientos.map(mov => {
                const monto = mov.tipocc === 'CCI' ? parseFloat(mov.monto) : -parseFloat(mov.monto);
                const fecha = new Date(mov.createdAt).toLocaleDateString('es-ES');
                const clienteNombre = mov.cliente ? `${mov.cliente.nombres} ${mov.cliente.apellidos}` : 'Sin cliente';
                return [
                    mov.concepto,
                    `$${Math.abs(monto).toFixed(2)}`,
                    fecha,
                    clienteNombre,
                ];
            }),
        };

        // Configuración de la tabla
        const tableOptions = {
            columnSpacing: 5,
            padding: [5, 10],
            prepareHeader: () => doc.font('Helvetica-Bold').fontSize(10),
            prepareRow: (row, indexColumn, indexRow, rectRow, rectCell) => {
                doc.font('Helvetica').fontSize(9);
            },
            columnsSize: [180, 80, 100, 150],
        };

        // Agregar la tabla al documento
        await doc.table(table, tableOptions);

        // **Cálculo de totales y balance**
        let totalIngresos = 0;
        let totalEgresos = 0;

        movimientos.forEach(mov => {
            const monto = parseFloat(mov.monto);
            if (mov.tipocc === 'CCI') {
                totalIngresos += monto;
            } else {
                totalEgresos += monto;
            }
        });

        const balanceTotal = totalIngresos - totalEgresos;

        // Mostrar totales y balance
        doc.moveDown(1);
        doc.fontSize(10).font('Helvetica-Bold');
        doc.text(`Total Ingresos: $${totalIngresos.toFixed(2)}`, { align: 'left' });
        doc.text(`Total Egresos: $${totalEgresos.toFixed(2)}`, { align: 'left' });
        doc.text(`Balance Total: $${balanceTotal.toFixed(2)}`, { align: 'left' });

        // **Global Edits to All Pages (Header/Footer, etc)**
        const pages = doc.bufferedPageRange();

        // Realizamos las ediciones globales a todas las páginas (encabezado, pie de página)
        for (let i = 0; i < pages.count; i++) {
            doc.switchToPage(i);
            // **Pie de Página**: Añadir número de página en el pie
            let oldBottomMargin = doc.page.margins.bottom;
            doc.page.margins.bottom = 0; // Necesario para escribir en el margen inferior
            doc.fontSize(9).text(
                `Página: ${i + 1} de ${pages.count} - Reporte generado el ${new Date().toLocaleString('es-ES')}`,
                50,
                doc.page.height - (oldBottomMargin / 2), // Centrado verticalmente en el margen inferior
                { align: 'left' }
            );
            doc.page.margins.bottom = oldBottomMargin; // Restaurar el margen inferior
        }

        // Finalizar documento
        doc.end();

    } catch (error) {
  console.error('Error al generar el reporte PDF:', error);
  res.status(500).send('Error al generar el reporte PDF.');
}
};


exports.generateExcelReport = async (req, res) => {
    try {
        // Obtener el rango de fechas desde los parámetros de la solicitud
        const { startDate, endDate } = req.query;
        
        // Verificar si las fechas están definidas; si no, tomar todos los movimientos
        let whereClause = {};
        
        if (startDate && endDate) {
            const validStartDate = new Date(startDate);
            const validEndDate = new Date(endDate);
    
            // Validar que las fechas sean válidas
            if (isNaN(validStartDate.getTime()) || isNaN(validEndDate.getTime())) {
                return res.status(400).json({ error: 'Fechas inválidas' });
            } else {
                whereClause.createdAt = {
                    gte: validStartDate,  // Fecha de inicio
                    lte: validEndDate,    // Fecha de fin
                };
            }
        }
        
        // Consultar los movimientos según las fechas
        const movimientos = await prisma.movimiento.findMany({
            where: whereClause,
            include: {
                cliente: true
            },
            orderBy: {
                createdAt: 'desc'
            }
        });

        // Descargar la imagen usando axios
        const imageUrl = 'https://res.cloudinary.com/dldgicsdi/image/upload/v1729533127/img/image_contrato.png';
        const response = await axios.get(imageUrl, { responseType: 'arraybuffer' });
        const imageData = response.data;

        // Crear el libro de Excel
        const workbook = new ExcelJS.Workbook();
        const worksheet = workbook.addWorksheet('Movimientos');

        // Agregar la imagen al workbook desde el buffer
        const imageId = workbook.addImage({
            buffer: imageData,
            extension: 'png',
        });

        // Insertar la imagen en el worksheet y centrarla, ajustando el tamaño
        worksheet.addImage(imageId, {
            tl: { col: 1, row: 0 },
            ext: { width: 400, height: 150 },
            editAs: 'oneCell',
        });

        // Ajustar la altura de la fila para acomodar la imagen
        worksheet.getRow(1).height = 150;

        // Título del reporte (sin espacio adicional)
        const titleRowNumber = 2;  // Mover el título a la fila inmediatamente después de la imagen
        worksheet.mergeCells(`A${titleRowNumber}:F${titleRowNumber}`);
        const titleCell = worksheet.getCell(`A${titleRowNumber}`);
        titleCell.value = 'Reporte de Movimientos - Airlink System CPE';
        titleCell.alignment = { horizontal: 'center', vertical: 'middle' };
        titleCell.font = { color: { argb: 'FFFFFFFF' }, size: 16, bold: true };
        titleCell.fill = {
            type: 'pattern',
            pattern: 'solid',
            fgColor: { argb: 'FF4682B4' }  // Color azul acero
        };

        // Fecha de generación del reporte
        const dateRowNumber = titleRowNumber + 1;
        worksheet.mergeCells(`A${dateRowNumber}:F${dateRowNumber}`);
        const dateCell = worksheet.getCell(`A${dateRowNumber}`);
        dateCell.value = `Fecha de generación: ${new Date().toLocaleString('es-ES')}`;
        dateCell.alignment = { horizontal: 'right', vertical: 'middle' };

        // Títulos de las columnas (actualizado para incluir nombres y apellidos)
        const headerRow = worksheet.addRow(['ID', 'Concepto', 'Tipo', 'Monto', 'Fecha', 'Cliente']);
        headerRow.eachCell((cell) => {
            cell.fill = {
                type: 'pattern',
                pattern: 'solid',
                fgColor: { argb: 'FFB0C4DE' }  // Color azul claro
            };
            cell.font = { bold: true };
            cell.alignment = { horizontal: 'center', vertical: 'middle' };
            cell.border = {
                top: { style: 'thin' },
                left: { style: 'thin' },
                bottom: { style: 'thin' },
                right: { style: 'thin' }
            };
        });

        // Variables para el cálculo de totales y estadísticas
        let totalIngresos = 0;
        let totalEgresos = 0;
        let numMovimientos = movimientos.length;
        let sumaMontos = 0;

        // Agregar los datos de los movimientos
        movimientos.forEach(mov => {
            const tipocc = mov.tipocc || '';
            const montoMovimiento = parseFloat(mov.monto) || 0;
            const tipo = tipocc === 'CCI' ? 'Ingreso' : 'Egreso';
            const signo = tipocc === 'CCI' ? '+' : '-';
            const montoFormateado = `${signo}$${Math.abs(montoMovimiento).toFixed(2)}`;
            const fecha = new Date(mov.createdAt).toLocaleDateString('es-ES');
            // Obtener nombres y apellidos del cliente
            const clienteNombre = mov.cliente && mov.cliente.nombres ? mov.cliente.nombre : '';
            const clienteApellido = mov.cliente && mov.cliente.apellidos ? mov.cliente.apellido : '';
            const clienteCompleto = (clienteNombre + ' ' + clienteApellido).trim() || 'Sin cliente';

            // Acumulamos ingresos y egresos
            if (tipocc === 'CCI') {
                totalIngresos += montoMovimiento;
            } else {
                totalEgresos += montoMovimiento;
            }
            sumaMontos += montoMovimiento;

            // Agregar una fila para cada movimiento
            const row = worksheet.addRow([
                mov.id,
                mov.concepto || '',
                tipo,
                montoFormateado,
                fecha,
                clienteCompleto
            ]);

            // Aplicar estilos a las filas
            row.eachCell((cell) => {
                cell.border = {
                    top: { style: 'thin' },
                    left: { style: 'thin' },
                    bottom: { style: 'thin' },
                    right: { style: 'thin' }
                };
                cell.alignment = { horizontal: 'center', vertical: 'middle' };
            });

            // Aplicar color según tipo de movimiento
            if (tipocc === 'CCI') {
                // Color verde para ingresos
                row.getCell(4).font = { color: { argb: 'FF008000' } };
            } else {
                // Color rojo para egresos
                row.getCell(4).font = { color: { argb: 'FFFF0000' } };
            }
        });

        // Calcular el promedio de montos
        const promedioMontos = sumaMontos / numMovimientos;

        // Agregar los totales y estadísticas al final
        worksheet.addRow([]);
        const totalIngresosRow = worksheet.addRow(['', 'Total Ingresos', '', `$${totalIngresos.toFixed(2)}`, '', '']);
        const totalEgresosRow = worksheet.addRow(['', 'Total Egresos', '', `$${totalEgresos.toFixed(2)}`, '', '']);
        const balanceTotal = totalIngresos - totalEgresos;
        const totalBalanceRow = worksheet.addRow(['', 'Balance Total', '', `$${balanceTotal.toFixed(2)}`, '', '']);
        worksheet.addRow([]);
        const statsRow = worksheet.addRow(['', 'Número de Movimientos', numMovimientos, '', '', '']);
        const avgRow = worksheet.addRow(['', 'Monto Promedio', `$${promedioMontos.toFixed(2)}`, '', '', '']);

        // Estilos para las filas de totales y estadísticas
        [totalIngresosRow, totalEgresosRow, totalBalanceRow, statsRow, avgRow].forEach((row) => {
            row.eachCell((cell) => {
                cell.font = { bold: true };
                cell.alignment = { horizontal: 'center', vertical: 'middle' };
                cell.border = {
                    top: { style: 'thin' },
                    left: { style: 'thin' },
                    bottom: { style: 'thin' },
                    right: { style: 'thin' }
                };
            });
        });

        // Aplicar colores a los totales y balance
        totalIngresosRow.getCell(4).font = { color: { argb: 'FF008000' }, bold: true }; // Verde
        totalEgresosRow.getCell(4).font = { color: { argb: 'FFFF0000' }, bold: true }; // Rojo
        totalBalanceRow.getCell(4).font = { color: { argb: 'FF0000FF' }, bold: true }; // Azul

        // Ajustar el ancho de las columnas
        worksheet.columns = [
            { key: 'id', width: 10 },
            { key: 'concepto', width: 30 },
            { key: 'tipo', width: 12 },
            { key: 'monto', width: 15 },
            { key: 'fecha', width: 15 },
            { key: 'cliente', width: 25 },
        ];

        // Aplicar filtros automáticos a las columnas
        const headerRowNumber = headerRow.number;
        const lastDataRowNumber = worksheet.lastRow.number - 5; // Ajustamos por filas añadidas
        worksheet.autoFilter = {
            from: `A${headerRowNumber}`,
            to: `F${lastDataRowNumber}`,
        };

        // Remover la congelación de paneles para scroll normal
        // No se agrega la configuración worksheet.views, permitiendo scroll libre

        // Ajustar alineación de columnas
        worksheet.getColumn(2).alignment = { horizontal: 'left' }; // Concepto
        worksheet.getColumn(6).alignment = { horizontal: 'left' }; // Cliente

        // Aplicar formato de moneda a la columna de montos
        worksheet.getColumn(4).numFmt = '"$"#,##0.00;[Red]"-$"#,##0.00';

        // Configurar las cabeceras de respuesta para descargar el archivo Excel
        res.setHeader('Content-Disposition', 'attachment; filename=movimientos_report.xlsx');
        res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');

        // Escribir el archivo Excel directamente en la respuesta
        await workbook.xlsx.write(res);
        res.end(); // Finalizar la respuesta

    } catch (error) {
        console.error('Error al generar el reporte Excel:', error);
        res.status(500).send('Error al generar el reporte Excel.');
    }
};