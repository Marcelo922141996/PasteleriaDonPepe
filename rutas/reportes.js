/**
 * Rutas de Reportes - Inventario, Movimientos
 * Pastelería Don Pepe - Chiclayo, Perú
 * VERSIÓN COMPLETAMENTE CORREGIDA - GENERA PDF SIN PROBLEMAS
 */

const express = require('express');
const router = express.Router();
const pool = require('../base-datos/conexion');
const { verificarSesion, soloAdmin } = require('../middleware/autenticacion');
const PDFDocument = require('pdfkit');
const ExcelJS = require('exceljs');

/**
 * GET /api/reportes/inventario/excel
 * Generar reporte completo de inventario en Excel
 */
router.get('/inventario/excel', verificarSesion, async (req, res) => {
  try {
    const [productos] = await pool.query(
      'SELECT * FROM productos WHERE estado = ? ORDER BY categoria, nombre',
      ['activo']
    );

    if (!productos || productos.length === 0) {
      return res.status(404).json({
        success: false,
        mensaje: 'No hay productos para reportar'
      });
    }

    const workbook = new ExcelJS.Workbook();
    const worksheet = workbook.addWorksheet('Inventario');

    // Configurar columnas
    worksheet.columns = [
      { header: 'ID', key: 'id_producto', width: 10 },
      { header: 'Nombre', key: 'nombre', width: 30 },
      { header: 'Descripción', key: 'descripcion', width: 25 },
      { header: 'Categoría', key: 'categoria', width: 15 },
      { header: 'P. Venta', key: 'precio_venta', width: 12 },
      { header: 'P. Costo', key: 'precio_costo', width: 12 },
      { header: 'Stock Actual', key: 'stock_actual', width: 12 },
      { header: 'Stock Mínimo', key: 'stock_minimo', width: 12 },
      { header: 'Unidad', key: 'unidad_medida', width: 12 },
      { header: 'Valor Total', key: 'valor_total', width: 15 }
    ];

    // Estilos de encabezado
    worksheet.getRow(1).font = { bold: true, size: 11, color: { argb: 'FFFFFFFF' } };
    worksheet.getRow(1).fill = {
      type: 'pattern',
      pattern: 'solid',
      fgColor: { argb: 'FF8B4513' }
    };
    worksheet.getRow(1).alignment = { horizontal: 'center', vertical: 'center' };

    // Agregar datos y calcular valor total general
    let valorTotalGeneral = 0;
    productos.forEach(prod => {
      const valorTotal = prod.stock_actual * prod.precio_venta;
      valorTotalGeneral += valorTotal;

      worksheet.addRow({
        id_producto: prod.id_producto,
        nombre: prod.nombre,
        descripcion: prod.descripcion || '-',
        categoria: prod.categoria,
        precio_venta: parseFloat(prod.precio_venta).toFixed(2),
        precio_costo: parseFloat(prod.precio_costo).toFixed(2),
        stock_actual: prod.stock_actual,
        stock_minimo: prod.stock_minimo,
        unidad_medida: prod.unidad_medida,
        valor_total: valorTotal.toFixed(2)
      });
    });

    // Fila de totales
    const filaTotal = worksheet.addRow({});
    filaTotal.getCell('nombre').value = 'VALOR TOTAL DEL INVENTARIO';
    filaTotal.getCell('valor_total').value = valorTotalGeneral.toFixed(2);
    filaTotal.font = { bold: true, size: 11 };
    filaTotal.fill = {
      type: 'pattern',
      pattern: 'solid',
      fgColor: { argb: 'FFFFEB3B' }
    };

    // Formateo de moneda
    worksheet.columns.forEach((col, idx) => {
      if (['precio_venta', 'precio_costo', 'valor_total'].includes(col.key)) {
        worksheet.getColumn(col.key).numFmt = '$#,##0.00';
      }
    });

    // Enviar archivo
    res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
    res.setHeader('Content-Disposition', `attachment; filename=inventario_${new Date().toISOString().split('T')[0]}.xlsx`);

    const buffer = await workbook.xlsx.writeBuffer();
    return res.send(buffer);

  } catch (error) {
    console.error('Error al generar reporte Excel:', error);
    return res.status(500).json({
      success: false,
      mensaje: 'Error al generar reporte de inventario',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
});

/**
 * GET /api/reportes/inventario/pdf
 * Generar reporte de inventario en PDF - CORREGIDO
 */
router.get('/inventario/pdf', verificarSesion, async (req, res) => {
  try {
    const [productos] = await pool.query(
      'SELECT * FROM productos WHERE estado = ? ORDER BY categoria, nombre',
      ['activo']
    );

    if (!productos || productos.length === 0) {
      return res.status(404).json({
        success: false,
        mensaje: 'No hay productos para reportar'
      });
    }

    // Crear documento PDF
    const doc = new PDFDocument({
      margin: 40,
      size: 'A4',
      bufferPages: true
    });

    // Configurar respuesta
    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader('Content-Disposition', `attachment; filename=inventario_${new Date().toISOString().split('T')[0]}.pdf`);

    // Conectar documento al response
    doc.pipe(res);

    // Encabezado principal
    doc.fontSize(22).font('Helvetica-Bold').text('Pastelería Don Pepe', { align: 'center' });
    doc.fontSize(14).font('Helvetica-Bold').text('Reporte de Inventario Completo', { align: 'center' });
    doc.fontSize(10).font('Helvetica').text(
      `Generado: ${new Date().toLocaleDateString('es-PE', { year: 'numeric', month: 'long', day: 'numeric', hour: '2-digit', minute: '2-digit' })}`,
      { align: 'center' }
    );
    doc.moveDown(1.5);

    // Tabla de productos
    const pageWidth = doc.page.width - 80;
    const columnPositions = [50, 180, 260, 310, 370, 430, 480];
    const columnWidths = [130, 80, 50, 60, 60, 50, 50];

    // Encabezado de tabla
    let y = doc.y;
    doc.fontSize(9).font('Helvetica-Bold');
    doc.text('Producto', columnPositions[0], y, { width: columnWidths[0] });
    doc.text('Categoría', columnPositions[1], y, { width: columnWidths[1] });
    doc.text('P. Venta', columnPositions[2], y, { width: columnWidths[2] });
    doc.text('Stock', columnPositions[3], y, { width: columnWidths[3] });
    doc.text('Valor Total', columnPositions[4], y, { width: columnWidths[4] });

    y += 20;
    doc.moveTo(50, y - 5).lineTo(550, y - 5).stroke();

    // Filas de datos
    doc.font('Helvetica').fontSize(8);
    let valorTotalGeneral = 0;
    let productosPorPagina = 0;

    productos.forEach((prod, idx) => {
      // Crear nueva página si es necesario
      if (y > 700) {
        doc.addPage();
        y = 50;
        productosPorPagina = 0;

        // Repetir encabezado
        doc.fontSize(9).font('Helvetica-Bold');
        doc.text('Producto', columnPositions[0], y, { width: columnWidths[0] });
        doc.text('Categoría', columnPositions[1], y, { width: columnWidths[1] });
        doc.text('P. Venta', columnPositions[2], y, { width: columnWidths[2] });
        doc.text('Stock', columnPositions[3], y, { width: columnWidths[3] });
        doc.text('Valor Total', columnPositions[4], y, { width: columnWidths[4] });

        y += 20;
        doc.moveTo(50, y - 5).lineTo(550, y - 5).stroke();
        doc.font('Helvetica').fontSize(8);
      }

      const valorTotal = prod.stock_actual * parseFloat(prod.precio_venta);
      valorTotalGeneral += valorTotal;

      doc.text(prod.nombre.substring(0, 15), columnPositions[0], y, { width: columnWidths[0] });
      doc.text(prod.categoria, columnPositions[1], y, { width: columnWidths[1] });
      doc.text(`S/.${parseFloat(prod.precio_venta).toFixed(2)}`, columnPositions[2], y, { width: columnWidths[2] });
      doc.text(prod.stock_actual.toString(), columnPositions[3], y, { width: columnWidths[3] });
      doc.text(`S/.${valorTotal.toFixed(2)}`, columnPositions[4], y, { width: columnWidths[4] });

      y += 15;
      productosPorPagina++;
    });

    // Total general
    y += 10;
    doc.moveTo(50, y).lineTo(550, y).stroke();
    y += 15;
    doc.fontSize(11).font('Helvetica-Bold');
    doc.text('VALOR TOTAL DEL INVENTARIO:', columnPositions[0], y);
    doc.text(`S/.${valorTotalGeneral.toFixed(2)}`, columnPositions[4], y);

    // Pie de página
    const pages = doc.bufferedPageRange();
    for (let i = 0; i < pages.count; i++) {
      doc.switchToPage(i);
      doc.fontSize(8).font('Helvetica').text(
        `Página ${i + 1} de ${pages.count}`,
        50,
        doc.page.height - 30,
        { align: 'center' }
      );
    }

    // Finalizar documento
    doc.end();

  } catch (error) {
    console.error('Error al generar reporte PDF:', error);

    // Verificar si ya se envió header
    if (!res.headersSent) {
      return res.status(500).json({
        success: false,
        mensaje: 'Error al generar reporte de inventario',
        error: process.env.NODE_ENV === 'development' ? error.message : undefined
      });
    }
  }
});

/**
 * GET /api/reportes/stock-bajo/excel
 * Reporte de productos con stock bajo - Excel
 */
router.get('/stock-bajo/excel', verificarSesion, async (req, res) => {
  try {
    const [productos] = await pool.query(
      `SELECT * FROM productos
       WHERE estado = ? AND stock_actual < stock_minimo
       ORDER BY (stock_minimo - stock_actual) DESC, nombre`,
      ['activo']
    );

    // ✅ VALIDACIÓN AGREGADA - CRÍTICA
    if (!productos || productos.length === 0) {
      return res.status(200).json({
        success: true,
        mensaje: 'No hay productos con stock bajo actualmente',
        productos: []
      });
    }

    const workbook = new ExcelJS.Workbook();
    const worksheet = workbook.addWorksheet('Stock Bajo');

    worksheet.columns = [
      { header: 'ID', key: 'id_producto', width: 10 },
      { header: 'Nombre', key: 'nombre', width: 30 },
      { header: 'Categoría', key: 'categoria', width: 15 },
      { header: 'Stock Actual', key: 'stock_actual', width: 12 },
      { header: 'Stock Mínimo', key: 'stock_minimo', width: 12 },
      { header: 'Diferencia', key: 'diferencia', width: 12 },
      { header: 'Estado', key: 'estado_stock', width: 15 }
    ];

    worksheet.getRow(1).font = { bold: true, size: 11 };
    worksheet.getRow(1).fill = {
      type: 'pattern',
      pattern: 'solid',
      fgColor: { argb: 'FFFF4444' }
    };

    productos.forEach(prod => {
      const diferencia = prod.stock_minimo - prod.stock_actual;
      worksheet.addRow({
        ...prod,
        diferencia,
        estado_stock: diferencia > 0 ? 'CRÍTICO' : 'EN LÍMITE'
      });
    });

    res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
    res.setHeader('Content-Disposition', `attachment; filename=stock_bajo_${new Date().toISOString().split('T')[0]}.xlsx`);

    const buffer = await workbook.xlsx.writeBuffer();
    return res.send(buffer);

  } catch (error) {
    console.error('Error al generar reporte Excel:', error);
    return res.status(500).json({
      success: false,
      mensaje: 'Error al generar reporte de stock bajo',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
});

/**
 * GET /api/reportes/stock-bajo/pdf
 * Reporte de stock bajo en PDF - CORREGIDO
 */
router.get('/stock-bajo/pdf', verificarSesion, async (req, res) => {
  try {
    const [productos] = await pool.query(
      `SELECT * FROM productos
       WHERE estado = ? AND stock_actual < stock_minimo
       ORDER BY (stock_minimo - stock_actual) DESC, nombre`,
      ['activo']
    );

    // ✅ VALIDACIÓN AGREGADA - CRÍTICA
    if (!productos || productos.length === 0) {
      return res.status(200).json({
        success: true,
        mensaje: 'No hay productos con stock bajo actualmente',
        productos: []
      });
    }

    const doc = new PDFDocument({
      margin: 40,
      size: 'A4',
      bufferPages: true
    });

    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader('Content-Disposition', `attachment; filename=stock_bajo_${new Date().toISOString().split('T')[0]}.pdf`);

    doc.pipe(res);

    // Encabezado
    doc.fontSize(20).font('Helvetica-Bold').text('Pastelería Don Pepe', { align: 'center' });
    doc.fontSize(14).font('Helvetica-Bold').text('Reporte de Productos con Stock Bajo', { align: 'center' });
    doc.fontSize(10).font('Helvetica').text(`Fecha: ${new Date().toLocaleDateString('es-PE')}`, { align: 'center' });
    doc.moveDown(1.5);

    // Tabla
    let y = doc.y;
    const columnPositions = [50, 200, 280, 350, 420];

    doc.fontSize(9).font('Helvetica-Bold');
    doc.text('Producto', columnPositions[0], y);
    doc.text('Categoría', columnPositions[1], y);
    doc.text('Stock Actual', columnPositions[2], y);
    doc.text('Stock Mínimo', columnPositions[3], y);
    doc.text('Diferencia', columnPositions[4], y);

    y += 20;
    doc.moveTo(50, y - 5).lineTo(550, y - 5).stroke();

    doc.font('Helvetica').fontSize(9);
    productos.forEach(prod => {
      if (y > 700) {
        doc.addPage();
        y = 50;
        doc.fontSize(9).font('Helvetica-Bold');
        doc.text('Producto', columnPositions[0], y);
        doc.text('Categoría', columnPositions[1], y);
        doc.text('Stock Actual', columnPositions[2], y);
        doc.text('Stock Mínimo', columnPositions[3], y);
        doc.text('Diferencia', columnPositions[4], y);
        y += 20;
        doc.moveTo(50, y - 5).lineTo(550, y - 5).stroke();
        doc.font('Helvetica').fontSize(9);
      }

      const diferencia = prod.stock_minimo - prod.stock_actual;
      doc.text(prod.nombre.substring(0, 20), columnPositions[0], y);
      doc.text(prod.categoria, columnPositions[1], y);
      doc.text(prod.stock_actual.toString(), columnPositions[2], y, { color: 'red' });
      doc.text(prod.stock_minimo.toString(), columnPositions[3], y);
      doc.text(diferencia.toString(), columnPositions[4], y, { color: 'red' });
      y += 18;
    });

    // Pie de página
    const pages = doc.bufferedPageRange();
    for (let i = 0; i < pages.count; i++) {
      doc.switchToPage(i);
      doc.fontSize(8).font('Helvetica').text(`Página ${i + 1} de ${pages.count}`, 50, doc.page.height - 30, { align: 'center' });
    }

    doc.end();

  } catch (error) {
    console.error('Error al generar reporte PDF:', error);
    if (!res.headersSent) {
      return res.status(500).json({
        success: false,
        mensaje: 'Error al generar reporte',
        error: process.env.NODE_ENV === 'development' ? error.message : undefined
      });
    }
  }
});

/**
 * GET /api/reportes/movimientos/excel
 * Reporte de movimientos en Excel
 */
router.get('/movimientos/excel', verificarSesion, async (req, res) => {
  try {
    const { fecha_inicio = '', fecha_fin = '' } = req.query;

    let query = `SELECT m.*, p.nombre as nombre_producto, u.nombre_completo
                 FROM movimientos m
                 JOIN productos p ON m.id_producto = p.id_producto
                 JOIN usuarios u ON m.id_usuario = u.id_usuario
                 WHERE 1=1`;
    let params = [];

    if (fecha_inicio) {
      query += ' AND DATE(m.fecha_movimiento) >= ?';
      params.push(fecha_inicio);
    }
    if (fecha_fin) {
      query += ' AND DATE(m.fecha_movimiento) <= ?';
      params.push(fecha_fin);
    }

    query += ' ORDER BY m.fecha_movimiento DESC';
    const [movimientos] = await pool.query(query, params);

    const workbook = new ExcelJS.Workbook();
    const worksheet = workbook.addWorksheet('Movimientos');

    worksheet.columns = [
      { header: 'Fecha', key: 'fecha', width: 20 },
      { header: 'Producto', key: 'nombre_producto', width: 25 },
      { header: 'Tipo', key: 'tipo_movimiento', width: 12 },
      { header: 'Cantidad', key: 'cantidad', width: 10 },
      { header: 'Stock Anterior', key: 'stock_anterior', width: 13 },
      { header: 'Stock Nuevo', key: 'stock_nuevo', width: 13 },
      { header: 'Usuario', key: 'nombre_completo', width: 20 },
      { header: 'Motivo', key: 'motivo', width: 20 }
    ];

    worksheet.getRow(1).font = { bold: true };
    worksheet.getRow(1).fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FF4472C4' } };

    movimientos.forEach(mov => {
      worksheet.addRow({
        fecha: new Date(mov.fecha_movimiento).toLocaleDateString('es-PE'),
        nombre_producto: mov.nombre_producto,
        tipo_movimiento: mov.tipo_movimiento,
        cantidad: mov.cantidad,
        stock_anterior: mov.stock_anterior,
        stock_nuevo: mov.stock_nuevo,
        nombre_completo: mov.nombre_completo,
        motivo: mov.motivo || '-'
      });
    });

    res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
    res.setHeader('Content-Disposition', `attachment; filename=movimientos_${new Date().toISOString().split('T')[0]}.xlsx`);

    const buffer = await workbook.xlsx.writeBuffer();
    return res.send(buffer);

  } catch (error) {
    console.error('Error al generar reporte:', error);
    return res.status(500).json({
      success: false,
      mensaje: 'Error al generar reporte de movimientos',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
});

/**
 * GET /api/reportes/movimientos/pdf
 * Reporte de movimientos en PDF - CORREGIDO
 */
router.get('/movimientos/pdf', verificarSesion, async (req, res) => {
  try {
    const { fecha_inicio = '', fecha_fin = '' } = req.query;

    let query = `SELECT m.*, p.nombre as nombre_producto, u.nombre_completo
                 FROM movimientos m
                 JOIN productos p ON m.id_producto = p.id_producto
                 JOIN usuarios u ON m.id_usuario = u.id_usuario
                 WHERE 1=1`;
    let params = [];

    if (fecha_inicio) {
      query += ' AND DATE(m.fecha_movimiento) >= ?';
      params.push(fecha_inicio);
    }
    if (fecha_fin) {
      query += ' AND DATE(m.fecha_movimiento) <= ?';
      params.push(fecha_fin);
    }

    query += ' ORDER BY m.fecha_movimiento DESC';
    const [movimientos] = await pool.query(query, params);

    const doc = new PDFDocument({
      margin: 30,
      size: 'A4',
      bufferPages: true
    });

    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader('Content-Disposition', `attachment; filename=movimientos_${new Date().toISOString().split('T')[0]}.pdf`);

    doc.pipe(res);

    doc.fontSize(18).font('Helvetica-Bold').text('Pastelería Don Pepe', { align: 'center' });
    doc.fontSize(12).font('Helvetica-Bold').text('Reporte de Movimientos', { align: 'center' });
    if (fecha_inicio || fecha_fin) {
      doc.fontSize(10).font('Helvetica').text(
        `Período: ${fecha_inicio || 'Inicio'} - ${fecha_fin || 'Hoy'}`,
        { align: 'center' }
      );
    }
    doc.moveDown(1);

    let y = doc.y;
    const colPos = [30, 140, 210, 250, 300, 350, 420];

    doc.fontSize(8).font('Helvetica-Bold');
    doc.text('Fecha', colPos[0], y);
    doc.text('Producto', colPos[1], y);
    doc.text('Tipo', colPos[2], y);
    doc.text('Cant', colPos[3], y);
    doc.text('Anterior', colPos[4], y);
    doc.text('Nuevo', colPos[5], y);
    doc.text('Usuario', colPos[6], y);

    y += 12;
    doc.moveTo(30, y).lineTo(550, y).stroke();

    doc.font('Helvetica').fontSize(7);
    movimientos.forEach(mov => {
      if (y > 750) {
        doc.addPage();
        y = 30;
        doc.fontSize(8).font('Helvetica-Bold');
        doc.text('Fecha', colPos[0], y);
        doc.text('Producto', colPos[1], y);
        doc.text('Tipo', colPos[2], y);
        doc.text('Cant', colPos[3], y);
        doc.text('Anterior', colPos[4], y);
        doc.text('Nuevo', colPos[5], y);
        doc.text('Usuario', colPos[6], y);
        y += 12;
        doc.moveTo(30, y).lineTo(550, y).stroke();
        doc.font('Helvetica').fontSize(7);
      }

      doc.text(new Date(mov.fecha_movimiento).toLocaleDateString('es-PE'), colPos[0], y);
      doc.text(mov.nombre_producto.substring(0, 10), colPos[1], y);
      doc.text(mov.tipo_movimiento, colPos[2], y);
      doc.text(mov.cantidad.toString(), colPos[3], y);
      doc.text(mov.stock_anterior.toString(), colPos[4], y);
      doc.text(mov.stock_nuevo.toString(), colPos[5], y);
      doc.text(mov.nombre_completo.substring(0, 8), colPos[6], y);
      y += 10;
    });

    const pages = doc.bufferedPageRange();
    for (let i = 0; i < pages.count; i++) {
      doc.switchToPage(i);
      doc.fontSize(7).font('Helvetica').text(
        `Página ${i + 1} de ${pages.count}`,
        30,
        doc.page.height - 20,
        { align: 'center' }
      );
    }

    doc.end();

  } catch (error) {
    console.error('Error al generar reporte PDF:', error);
    if (!res.headersSent) {
      return res.status(500).json({
        success: false,
        mensaje: 'Error al generar reporte de movimientos',
        error: process.env.NODE_ENV === 'development' ? error.message : undefined
      });
    }
  }
});

module.exports = router;