/**
 * Middleware de Autenticación y Control de Roles
 * Pastelería Don Pepe - Chiclayo, Perú
 */

/**
 * Middleware: Verificar que el usuario tiene sesión activa
 */
function verificarSesion(req, res, next) {
  if (req.session && req.session.usuario) {
    // Usuario autenticado, continuar
    next();
  } else {
    // No hay sesión, retornar error
    return res.status(401).json({
      mensaje: 'No autorizado. Por favor inicie sesión.'
    });
  }
}

/**
 * Middleware: Verificar que el usuario es administrador
 */
function soloAdmin(req, res, next) {
  if (req.session && req.session.usuario && req.session.usuario.rol === 'admin') {
    // Usuario es admin, continuar
    next();
  } else {
    // No es admin, retornar error
    return res.status(403).json({
      mensaje: 'Acceso denegado. Solo administradores pueden realizar esta acción.'
    });
  }
}

/**
 * Middleware: Verificar que el usuario es admin o almacenero
 */
function adminOAlmacenero(req, res, next) {
  if (req.session && req.session.usuario) {
    const rol = req.session.usuario.rol;
    if (rol === 'admin' || rol === 'almacenero') {
      // Usuario tiene permisos, continuar
      next();
    } else {
      return res.status(403).json({
        mensaje: 'Acceso denegado. No tiene permisos suficientes.'
      });
    }
  } else {
    return res.status(401).json({
      mensaje: 'No autorizado. Por favor inicie sesión.'
    });
  }
}

module.exports = {
  verificarSesion,
  soloAdmin,
  adminOAlmacenero
};