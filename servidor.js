/**
 * Servidor Principal - Express
 * Pastelería Don Pepe - Chiclayo, Perú
 * Sistema de Control de Inventario
 * VERSIÓN CORREGIDA Y OPTIMIZADA
 */

require('dotenv').config();
const express = require('express');
const session = require('express-session');
const path = require('path');

// Inicializar aplicación Express
const app = express();
const PORT = process.env.PORT || 3000;

console.log('🚀 Iniciando servidor Express...');
console.log('📍 Modo:', process.env.NODE_ENV || 'development');

// ===================================
// MIDDLEWARES GLOBALES - ORDEN CRÍTICO
// ===================================

// 1. Body parsers (DEBE ser PRIMERO antes de cualquier ruta)
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

console.log('✅ Body parsers configurados');

// 2. Configurar sesiones
app.use(session({
  secret: process.env.SESSION_SECRET || 'donpepe-secret-key-cambiar-en-produccion',
  resave: false,
  saveUninitialized: false,
  cookie: {
    secure: process.env.NODE_ENV === 'production',
    httpOnly: true,
    maxAge: 1000 * 60 * 60 * 8 // 8 horas
  }
}));

console.log('✅ Sesiones configuradas');

// 3. Servir archivos estáticos (CORREGIDO - SIN PREFIJO /publico)
app.use('/publico', express.static(path.join(__dirname, 'publico'), {
  maxAge: '1h',
  etag: false
}));

console.log('✅ Archivos estáticos configurados');
console.log('📁 Carpeta publico:', path.join(__dirname, 'publico'));

// 4. Headers CORS y seguridad
app.use((req, res, next) => {
  res.header('Access-Control-Allow-Origin', '*');
  res.header('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, PATCH, OPTIONS');
  res.header('Access-Control-Allow-Headers', 'Content-Type, Authorization');
  
  // Opciones preflight
  if (req.method === 'OPTIONS') {
    return res.sendStatus(200);
  }
  
  next();
});

console.log('✅ Headers CORS configurados');

// 5. Logs de desarrollo mejorados
if (process.env.NODE_ENV !== 'production') {
  app.use((req, res, next) => {
    const timestamp = new Date().toISOString();
    console.log(`\n[${timestamp}] ${req.method} ${req.url}`);
    
    // Log del body en POST/PUT
    if (['POST', 'PUT', 'PATCH'].includes(req.method) && req.body) {
      const bodyLog = JSON.stringify(req.body).substring(0, 300);
      console.log(`📤 Body: ${bodyLog}`);
    }
    
    next();
  });
}

console.log('✅ Logging configurado');

// ===================================
// RUTAS DE LA API - DESPUÉS DE MIDDLEWARES
// ===================================

console.log('\n📌 Configurando rutas de API...');

// Importar rutas
const rutasAuth = require('./rutas/autenticacion');
const rutasDashboard = require('./rutas/dashboard');
const rutasProductos = require('./rutas/productos');
const rutasMovimientos = require('./rutas/movimientos');
const rutasReportes = require('./rutas/reportes');

// Montar rutas
app.use('/api/auth', rutasAuth);
console.log('✅ Rutas /api/auth montadas');

app.use('/api/dashboard', rutasDashboard);
console.log('✅ Rutas /api/dashboard montadas');

app.use('/api/productos', rutasProductos);
console.log('✅ Rutas /api/productos montadas');

app.use('/api/movimientos', rutasMovimientos);
console.log('✅ Rutas /api/movimientos montadas');

app.use('/api/reportes', rutasReportes);
console.log('✅ Rutas /api/reportes montadas');

// ===================================
// RUTAS DE PÁGINAS HTML
// ===================================

console.log('\n📌 Configurando rutas HTML...');

// Ruta raíz redirige al login
app.get('/', (req, res) => {
  res.redirect('/vistas/login.html');
});

// Servir archivos HTML específicos
app.get('/vistas/:pagina', (req, res) => {
  const pagina = req.params.pagina;
  const rutaArchivo = path.join(__dirname, 'vistas', pagina);
  
  res.sendFile(rutaArchivo, (err) => {
    if (err) {
      console.error('❌ Error al servir página:', pagina, err);
      res.status(404).json({
        success: false,
        mensaje: 'Página no encontrada'
      });
    }
  });
});

console.log('✅ Rutas HTML configuradas');

// ===================================
// MANEJO DE ERRORES 404 Y 500
// ===================================

// Ruta 404 para API
app.use('/api', (req, res) => {
  console.warn('⚠️ Ruta API no encontrada:', req.method, req.url);
  res.status(404).json({
    success: false,
    error: 'Ruta no encontrada',
    ruta: req.url,
    metodo: req.method
  });
});

// Ruta 404 general
app.use((req, res) => {
  console.warn('⚠️ Ruta no encontrada:', req.method, req.url);
  res.status(404).sendFile(path.join(__dirname, 'vistas', 'login.html'));
});

// Manejo global de errores
app.use((err, req, res, next) => {
  console.error('❌ Error del servidor:', err);
  
  res.status(err.status || 500).json({
    success: false,
    error: err.message || 'Error interno del servidor',
    ...(process.env.NODE_ENV !== 'production' && { stack: err.stack })
  });
});

// ===================================
// INICIAR SERVIDOR
// ===================================

const server = app.listen(PORT, () => {
  console.log('\n' + '='.repeat(60));
  console.log('🎉 SERVIDOR INICIADO CORRECTAMENTE');
  console.log('='.repeat(60));
  console.log(`🌐 URL: http://localhost:${PORT}`);
  console.log(`📍 Login: http://localhost:${PORT}/vistas/login.html`);
  console.log(`⚙️  Modo: ${process.env.NODE_ENV || 'development'}`);
  console.log('='.repeat(60));
  console.log('\n✅ Sistema listo para usar');
  console.log('📝 Credenciales de prueba:');
  console.log('   Admin: admin / admin123');
  console.log('   Almacenero: almacenero / almacen123\n');
});

// Manejo de cierre graceful
process.on('SIGTERM', () => {
  console.log('⚠️  SIGTERM recibido. Cerrando servidor...');
  server.close(() => {
    console.log('✅ Servidor cerrado correctamente');
    process.exit(0);
  });
});

process.on('SIGINT', () => {
  console.log('⚠️  SIGINT recibido. Cerrando servidor...');
  server.close(() => {
    console.log('✅ Servidor cerrado correctamente');
    process.exit(0);
  });
});

// Manejo de excepciones no capturadas
process.on('uncaughtException', (err) => {
  console.error('💥 Excepción no capturada:', err);
  process.exit(1);
});

process.on('unhandledRejection', (reason, promise) => {
  console.error('💥 Promise rechazado sin manejar:', reason);
});

module.exports = app;