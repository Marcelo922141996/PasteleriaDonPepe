/**
 * Rutas del Dashboard
 * Pastelería Don Pepe - Chiclayo, Perú
 * VERSIÓN CORREGIDA Y OPTIMIZADA
 */

const express = require('express');
const router = express.Router();
const pool = require('../base-datos/conexion');
const { verificarSesion } = require('../middleware/autenticacion');

/**
 * GET /api/dashboard/estadisticas
 * Obtener estadísticas del dashboard
 */
router.get('/estadisticas', verificarSesion, async (req, res) => {
  try {
    // Total de productos activos
    const [totalProductos] = await pool.query(
      'SELECT COUNT(*) as total FROM productos WHERE estado = ?',
      ['activo']
    );
    
    // Valor total del inventario
    const [valorInventario] = await pool.query(
      'SELECT COALESCE(SUM(stock_actual * precio_venta), 0) as valor_total FROM productos WHERE estado = ?',
      ['activo']
    );
    
    // Productos con stock bajo
    const [stockBajo] = await pool.query(
      'SELECT COUNT(*) as total FROM productos WHERE stock_actual <= stock_minimo AND estado = ?',
      ['activo']
    );
    
    // Movimientos de hoy
    const [movimientosHoy] = await pool.query(
      'SELECT COUNT(*) as total FROM movimientos WHERE DATE(fecha_movimiento) = CURDATE()'
    );
    
    // Inventario por categoría (para el gráfico)
    const [inventarioPorCategoria] = await pool.query(
      `SELECT 
        categoria,
        COUNT(*) as total_productos,
        COALESCE(SUM(stock_actual), 0) as total_stock,
        COALESCE(SUM(stock_actual * precio_venta), 0) as valor_total
      FROM productos 
      WHERE estado = ?
      GROUP BY categoria
      ORDER BY valor_total DESC`,
      ['activo']
    );
    
    // Productos más movidos (últimos 30 días)
    const [productosMasMovidos] = await pool.query(
      `SELECT 
        p.nombre,
        p.categoria,
        COUNT(m.id_movimiento) as total_movimientos,
        SUM(m.cantidad) as cantidad_total
      FROM movimientos m
      JOIN productos p ON m.id_producto = p.id_producto
      WHERE m.fecha_movimiento >= DATE_SUB(NOW(), INTERVAL 30 DAY)
      GROUP BY p.id_producto, p.nombre, p.categoria
      ORDER BY total_movimientos DESC
      LIMIT 5`
    );
    
    // Movimientos por tipo (últimos 7 días)
    const [movimientosPorTipo] = await pool.query(
      `SELECT 
        tipo_movimiento,
        COUNT(*) as total,
        SUM(cantidad) as cantidad_total
      FROM movimientos
      WHERE fecha_movimiento >= DATE_SUB(NOW(), INTERVAL 7 DAY)
      GROUP BY tipo_movimiento`
    );
    
    return res.status(200).json({
      success: true,
      total_productos: totalProductos[0]?.total || 0,
      valor_inventario: parseFloat(valorInventario[0]?.valor_total || 0),
      productos_stock_bajo: stockBajo[0]?.total || 0,
      movimientos_hoy: movimientosHoy[0]?.total || 0,
      inventario_por_categoria: inventarioPorCategoria.map(item => ({
        categoria: item.categoria,
        total_productos: parseInt(item.total_productos) || 0,
        total_stock: parseInt(item.total_stock) || 0,
        valor_total: parseFloat(item.valor_total) || 0
      })),
      productos_mas_movidos: productosMasMovidos.map(item => ({
        nombre: item.nombre,
        categoria: item.categoria,
        total_movimientos: parseInt(item.total_movimientos) || 0,
        cantidad_total: parseInt(item.cantidad_total) || 0
      })),
      movimientos_por_tipo: movimientosPorTipo.map(item => ({
        tipo: item.tipo_movimiento,
        total: parseInt(item.total) || 0,
        cantidad: parseInt(item.cantidad_total) || 0
      }))
    });
    
  } catch (error) {
    console.error('Error al obtener estadísticas del dashboard:', error);
    return res.status(500).json({
      success: false,
      mensaje: 'Error al obtener estadísticas del dashboard',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
});

/**
 * GET /api/dashboard/stock-bajo
 * Obtener listado de productos con stock bajo
 */
router.get('/stock-bajo', verificarSesion, async (req, res) => {
  try {
    const [productosStockBajo] = await pool.query(
      `SELECT 
        id_producto,
        nombre,
        categoria,
        stock_actual,
        stock_minimo,
        unidad_medida,
        precio_venta,
        (stock_minimo - stock_actual) as unidades_faltantes,
        CASE 
          WHEN stock_actual = 0 THEN 'critico'
          WHEN stock_actual <= (stock_minimo * 0.5) THEN 'muy_bajo'
          ELSE 'bajo'
        END as nivel_alerta
      FROM productos 
      WHERE stock_actual <= stock_minimo AND estado = ?
      ORDER BY 
        CASE 
          WHEN stock_actual = 0 THEN 1
          WHEN stock_actual <= (stock_minimo * 0.5) THEN 2
          ELSE 3
        END,
        (stock_minimo - stock_actual) DESC`,
      ['activo']
    );
    
    return res.status(200).json({
      success: true,
      total: productosStockBajo.length,
      productos: productosStockBajo.map(item => ({
        id_producto: item.id_producto,
        nombre: item.nombre,
        categoria: item.categoria,
        stock_actual: parseInt(item.stock_actual) || 0,
        stock_minimo: parseInt(item.stock_minimo) || 0,
        unidad_medida: item.unidad_medida,
        precio_venta: parseFloat(item.precio_venta) || 0,
        unidades_faltantes: parseInt(item.unidades_faltantes) || 0,
        nivel_alerta: item.nivel_alerta
      }))
    });
    
  } catch (error) {
    console.error('Error al obtener productos con stock bajo:', error);
    return res.status(500).json({
      success: false,
      mensaje: 'Error al obtener productos con stock bajo',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
});

/**
 * GET /api/dashboard/ultimos-movimientos
 * Obtener últimos movimientos
 */
router.get('/ultimos-movimientos', verificarSesion, async (req, res) => {
  try {
    const limite = parseInt(req.query.limite) || 10;
    
    const [ultimosMovimientos] = await pool.query(
      `SELECT 
        m.id_movimiento,
        m.tipo_movimiento,
        m.cantidad,
        m.fecha_movimiento,
        m.motivo,
        m.observaciones,
        m.stock_anterior,
        m.stock_nuevo,
        p.nombre as nombre_producto,
        p.categoria,
        u.nombre_completo as nombre_usuario
      FROM movimientos m
      JOIN productos p ON m.id_producto = p.id_producto
      JOIN usuarios u ON m.id_usuario = u.id_usuario
      ORDER BY m.fecha_movimiento DESC
      LIMIT ?`,
      [limite]
    );
    
    return res.status(200).json({
      success: true,
      total: ultimosMovimientos.length,
      movimientos: ultimosMovimientos.map(item => ({
        id_movimiento: item.id_movimiento,
        tipo_movimiento: item.tipo_movimiento,
        cantidad: parseInt(item.cantidad) || 0,
        fecha_movimiento: item.fecha_movimiento,
        motivo: item.motivo,
        observaciones: item.observaciones,
        stock_anterior: parseInt(item.stock_anterior) || 0,
        stock_nuevo: parseInt(item.stock_nuevo) || 0,
        nombre_producto: item.nombre_producto,
        categoria: item.categoria,
        nombre_usuario: item.nombre_usuario
      }))
    });
    
  } catch (error) {
    console.error('Error al obtener últimos movimientos:', error);
    return res.status(500).json({
      success: false,
      mensaje: 'Error al obtener últimos movimientos',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
});

/**
 * GET /api/dashboard/resumen-semanal
 * Obtener resumen de movimientos de la última semana
 */
router.get('/resumen-semanal', verificarSesion, async (req, res) => {
  try {
    const [resumenSemanal] = await pool.query(
      `SELECT 
        DATE(fecha_movimiento) as fecha,
        tipo_movimiento,
        COUNT(*) as total_movimientos,
        SUM(cantidad) as cantidad_total
      FROM movimientos
      WHERE fecha_movimiento >= DATE_SUB(NOW(), INTERVAL 7 DAY)
      GROUP BY DATE(fecha_movimiento), tipo_movimiento
      ORDER BY fecha DESC, tipo_movimiento`
    );
    
    return res.status(200).json({
      success: true,
      resumen: resumenSemanal
    });
    
  } catch (error) {
    console.error('Error al obtener resumen semanal:', error);
    return res.status(500).json({
      success: false,
      mensaje: 'Error al obtener resumen semanal',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
});

/**
 * GET /api/dashboard/productos-sin-movimiento
 * Obtener productos sin movimientos en X días
 */
router.get('/productos-sin-movimiento', verificarSesion, async (req, res) => {
  try {
    const dias = parseInt(req.query.dias) || 30;
    
    const [productosSinMovimiento] = await pool.query(
      `SELECT 
        p.id_producto,
        p.nombre,
        p.categoria,
        p.stock_actual,
        p.precio_venta,
        MAX(m.fecha_movimiento) as ultimo_movimiento,
        DATEDIFF(NOW(), MAX(m.fecha_movimiento)) as dias_sin_movimiento
      FROM productos p
      LEFT JOIN movimientos m ON p.id_producto = m.id_producto
      WHERE p.estado = ?
      GROUP BY p.id_producto
      HAVING dias_sin_movimiento > ? OR dias_sin_movimiento IS NULL
      ORDER BY dias_sin_movimiento DESC`,
      ['activo', dias]
    );
    
    return res.status(200).json({
      success: true,
      total: productosSinMovimiento.length,
      dias_filtro: dias,
      productos: productosSinMovimiento
    });
    
  } catch (error) {
    console.error('Error al obtener productos sin movimiento:', error);
    return res.status(500).json({
      success: false,
      mensaje: 'Error al obtener productos sin movimiento',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
});

/**
 * GET /api/dashboard/valor-por-categoria
 * Obtener valor del inventario agrupado por categoría
 */
router.get('/valor-por-categoria', verificarSesion, async (req, res) => {
  try {
    const [valorPorCategoria] = await pool.query(
      `SELECT 
        categoria,
        COUNT(*) as total_productos,
        SUM(stock_actual) as stock_total,
        SUM(stock_actual * precio_costo) as valor_costo,
        SUM(stock_actual * precio_venta) as valor_venta,
        SUM(stock_actual * (precio_venta - precio_costo)) as ganancia_potencial
      FROM productos
      WHERE estado = ?
      GROUP BY categoria
      ORDER BY valor_venta DESC`,
      ['activo']
    );
    
    return res.status(200).json({
      success: true,
      categorias: valorPorCategoria.map(item => ({
        categoria: item.categoria,
        total_productos: parseInt(item.total_productos) || 0,
        stock_total: parseInt(item.stock_total) || 0,
        valor_costo: parseFloat(item.valor_costo) || 0,
        valor_venta: parseFloat(item.valor_venta) || 0,
        ganancia_potencial: parseFloat(item.ganancia_potencial) || 0,
        margen_porcentaje: item.valor_costo > 0 
          ? ((item.ganancia_potencial / item.valor_costo) * 100).toFixed(2)
          : 0
      }))
    });
    
  } catch (error) {
    console.error('Error al obtener valor por categoría:', error);
    return res.status(500).json({
      success: false,
      mensaje: 'Error al obtener valor por categoría',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
});

module.exports = router;