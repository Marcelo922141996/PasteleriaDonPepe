/**
 * Rutas de Autenticación
 * Pastelería Don Pepe - Chiclayo, Perú
 */

const express = require('express');
const router = express.Router();
const bcrypt = require('bcryptjs');
const pool = require('../base-datos/conexion');

/**
 * POST /api/auth/login
 * Iniciar sesión
 */
router.post('/login', async (req, res) => {
  const { nombre_usuario, contrasena } = req.body;
  
  console.log('🔐 Intento de login:', { nombre_usuario });
  
  // Validar campos requeridos
  if (!nombre_usuario || !contrasena) {
    console.log('❌ Campos vacíos');
    return res.status(400).json({
      success: false,
      mensaje: 'Usuario y contraseña son requeridos'
    });
  }
  
  try {
    // Buscar usuario en la base de datos
    const [usuarios] = await pool.query(
      'SELECT * FROM usuarios WHERE nombre_usuario = ? AND estado = ?',
      [nombre_usuario, 'activo']
    );
    
    console.log('📊 Usuarios encontrados:', usuarios.length);
    
    if (usuarios.length === 0) {
      console.log('❌ Usuario no encontrado');
      return res.status(401).json({
        success: false,
        mensaje: 'Credenciales incorrectas'
      });
    }
    
    const usuario = usuarios[0];
    console.log('👤 Usuario encontrado:', usuario.nombre_usuario, '| Hash:', usuario.contrasena.substring(0, 20) + '...');
    
    // Verificar contraseña con bcrypt
    const contrasenaValida = await bcrypt.compare(contrasena, usuario.contrasena);
    console.log('🔑 Contraseña válida:', contrasenaValida);
    
    if (!contrasenaValida) {
      console.log('❌ Contraseña incorrecta');
      return res.status(401).json({
        success: false,
        mensaje: 'Credenciales incorrectas'
      });
    }
    
    // Guardar información del usuario en la sesión (sin la contraseña)
    req.session.usuario = {
      id_usuario: usuario.id_usuario,
      nombre_completo: usuario.nombre_completo,
      nombre_usuario: usuario.nombre_usuario,
      rol: usuario.rol,
      correo: usuario.correo
    };
    
    console.log('✅ Login exitoso para:', usuario.nombre_usuario);
    
    return res.status(200).json({
      success: true,
      mensaje: 'Inicio de sesión exitoso',
      usuario: {
        id_usuario: usuario.id_usuario,
        nombre_completo: usuario.nombre_completo,
        nombre_usuario: usuario.nombre_usuario,
        rol: usuario.rol,
        correo: usuario.correo
      }
    });
    
  } catch (error) {
    console.error('❌ Error en login:', error);
    return res.status(500).json({
      success: false,
      mensaje: 'Error del servidor al procesar el inicio de sesión'
    });
  }
});

/**
 * POST /api/auth/logout
 * Cerrar sesión
 */
router.post('/logout', (req, res) => {
  console.log('🚪 Cerrando sesión...');
  
  req.session.destroy((err) => {
    if (err) {
      console.error('❌ Error al cerrar sesión:', err);
      return res.status(500).json({
        success: false,
        mensaje: 'Error al cerrar sesión'
      });
    }
    
    res.clearCookie('connect.sid'); // Nombre por defecto de la cookie de sesión
    console.log('✅ Sesión cerrada exitosamente');
    
    return res.status(200).json({
      success: true,
      mensaje: 'Sesión cerrada exitosamente'
    });
  });
});

/**
 * GET /api/auth/verificar
 * Verificar sesión actual
 */
router.get('/verificar', (req, res) => {
  if (req.session && req.session.usuario) {
    console.log('✅ Sesión válida para:', req.session.usuario.nombre_usuario);
    return res.status(200).json({
      success: true,
      autenticado: true,
      usuario: req.session.usuario
    });
  } else {
    console.log('⚠️ No hay sesión activa');
    return res.status(401).json({
      success: false,
      autenticado: false,
      mensaje: 'No hay sesión activa'
    });
  }
});

module.exports = router;