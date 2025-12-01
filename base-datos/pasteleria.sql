-- Sistema de Control de Inventario
-- =====================================================

-- Crear base de datos si no existe
CREATE DATABASE IF NOT EXISTS pasteleria_don_pepe 
CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

USE pasteleria_don_pepe;

-- =====================================================
-- TABLA: usuarios
-- Almacena información de usuarios del sistema
-- =====================================================
CREATE TABLE IF NOT EXISTS usuarios (
  id_usuario INT AUTO_INCREMENT PRIMARY KEY,
  nombre_completo VARCHAR(100) NOT NULL,
  nombre_usuario VARCHAR(50) NOT NULL UNIQUE,
  contrasena VARCHAR(255) NOT NULL,
  rol ENUM('admin', 'almacenero') NOT NULL,
  correo VARCHAR(100),
  telefono VARCHAR(20),
  estado ENUM('activo', 'inactivo') DEFAULT 'activo',
  fecha_creacion TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  fecha_modificacion TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  INDEX idx_usuario (nombre_usuario),
  INDEX idx_rol (rol)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- =====================================================
-- TABLA: productos
-- Almacena información de productos de la pastelería
-- =====================================================
CREATE TABLE IF NOT EXISTS productos (
  id_producto INT AUTO_INCREMENT PRIMARY KEY,
  nombre VARCHAR(100) NOT NULL,
  descripcion TEXT,
  categoria ENUM('tortas', 'pasteles', 'panes', 'bocaditos', 'bebidas', 'insumos', 'otros') NOT NULL,
  precio_venta DECIMAL(10, 2) NOT NULL,
  precio_costo DECIMAL(10, 2) NOT NULL,
  stock_actual INT NOT NULL DEFAULT 0,
  stock_minimo INT NOT NULL DEFAULT 5,
  unidad_medida ENUM('unidad', 'kg', 'litro', 'caja', 'docena') DEFAULT 'unidad',
  imagen VARCHAR(255) DEFAULT '/publico/imagenes/productos/default.jpg',
  estado ENUM('activo', 'inactivo') DEFAULT 'activo',
  fecha_creacion TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  fecha_modificacion TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  INDEX idx_nombre (nombre),
  INDEX idx_categoria (categoria),
  INDEX idx_estado (estado)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- =====================================================
-- TABLA: movimientos
-- Registra todos los movimientos de inventario
-- =====================================================
CREATE TABLE IF NOT EXISTS movimientos (
  id_movimiento INT AUTO_INCREMENT PRIMARY KEY,
  id_producto INT NOT NULL,
  id_usuario INT NOT NULL,
  tipo_movimiento ENUM('entrada', 'salida', 'ajuste') NOT NULL,
  cantidad INT NOT NULL,
  stock_anterior INT NOT NULL,
  stock_nuevo INT NOT NULL,
  motivo VARCHAR(255),
  observaciones TEXT,
  fecha_movimiento TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (id_producto) REFERENCES productos(id_producto) ON DELETE CASCADE,
  FOREIGN KEY (id_usuario) REFERENCES usuarios(id_usuario) ON DELETE CASCADE,
  INDEX idx_producto (id_producto),
  INDEX idx_usuario (id_usuario),
  INDEX idx_tipo (tipo_movimiento),
  INDEX idx_fecha (fecha_movimiento)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- =====================================================
-- TABLA: proveedores
-- Almacena información de proveedores
-- =====================================================
CREATE TABLE IF NOT EXISTS proveedores (
  id_proveedor INT AUTO_INCREMENT PRIMARY KEY,
  nombre_proveedor VARCHAR(100) NOT NULL,
  ruc VARCHAR(11),
  telefono VARCHAR(20),
  correo VARCHAR(100),
  direccion TEXT,
  estado ENUM('activo', 'inactivo') DEFAULT 'activo',
  fecha_creacion TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  INDEX idx_nombre (nombre_proveedor)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- =====================================================
-- TABLA: pedidos_proveedores
-- Registra pedidos realizados a proveedores
-- =====================================================
CREATE TABLE IF NOT EXISTS pedidos_proveedores (
  id_pedido INT AUTO_INCREMENT PRIMARY KEY,
  id_proveedor INT NOT NULL,
  id_usuario INT NOT NULL,
  fecha_pedido TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  fecha_entrega_estimada DATE,
  fecha_entrega_real DATE,
  estado ENUM('pendiente', 'recibido', 'cancelado') DEFAULT 'pendiente',
  total DECIMAL(10, 2) DEFAULT 0.00,
  observaciones TEXT,
  FOREIGN KEY (id_proveedor) REFERENCES proveedores(id_proveedor) ON DELETE CASCADE,
  FOREIGN KEY (id_usuario) REFERENCES usuarios(id_usuario) ON DELETE CASCADE,
  INDEX idx_proveedor (id_proveedor),
  INDEX idx_estado (estado),
  INDEX idx_fecha (fecha_pedido)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- =====================================================
-- TABLA: detalle_pedidos
-- Detalle de productos en cada pedido
-- =====================================================
CREATE TABLE IF NOT EXISTS detalle_pedidos (
  id_detalle INT AUTO_INCREMENT PRIMARY KEY,
  id_pedido INT NOT NULL,
  id_producto INT NOT NULL,
  cantidad INT NOT NULL,
  precio_unitario DECIMAL(10, 2) NOT NULL,
  subtotal DECIMAL(10, 2) NOT NULL,
  FOREIGN KEY (id_pedido) REFERENCES pedidos_proveedores(id_pedido) ON DELETE CASCADE,
  FOREIGN KEY (id_producto) REFERENCES productos(id_producto) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- =====================================================
-- TABLA: auditoria
-- Registra todas las eliminaciones y cambios críticos
-- =====================================================
CREATE TABLE IF NOT EXISTS auditoria (
  id_auditoria INT AUTO_INCREMENT PRIMARY KEY,
  tabla_afectada VARCHAR(50) NOT NULL,
  id_registro INT NOT NULL,
  accion ENUM('eliminar', 'modificar') NOT NULL,
  datos_anteriores JSON,
  id_usuario INT,
  fecha_accion TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (id_usuario) REFERENCES usuarios(id_usuario) ON DELETE SET NULL,
  INDEX idx_tabla (tabla_afectada),
  INDEX idx_fecha (fecha_accion)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;



-- =====================================================
-- DATOS INICIALES: Usuarios
-- Contraseña "admin123" hash CORRECTO: $2b$10$8kDQ1Sz80sf9ndm3KiHHJOi/1h0WZsQ9fK9oeagfJwL/3VHO2qNGC
-- Contraseña "almacen123" hash CORRECTO: $2b$10$/NuvniTdOcQg764nn3jk4u7AvJKmaywVCBLj2IzKXfw/Cqtu9Lzt.
-- =====================================================
INSERT INTO usuarios (nombre_completo, nombre_usuario, contrasena, rol, correo, telefono) VALUES
('Marcelo Alejandro Administrador', 'admin', '$2b$10$8kDQ1Sz80sf9ndm3KiHHJOi/1h0WZsQ9fK9oeagfJwL/3VHO2qNGC', 'admin', 'admin@donpepe.pe', '922141996'),
('Pedro Almacén González', 'almacenero', '$2b$10$/NuvniTdOcQg764nn3jk4u7AvJKmaywVCBLj2IzKXfw/Cqtu9Lzt.', 'almacenero', 'almacen@donpepe.pe', '953418753');

-- =====================================================
-- DATOS INICIALES: Productos típicos de Chiclayo
-- =====================================================
INSERT INTO productos (nombre, descripcion, categoria, precio_venta, precio_costo, stock_actual, stock_minimo, unidad_medida, imagen) VALUES
-- Tortas
('Torta de Chocolate', 'Deliciosa torta de chocolate con cobertura de ganache', 'tortas', 45.00, 25.00, 15, 5, 'unidad', '/publico/imagenes/productos/torta-chocolate.png'),
('Torta Tres Leches', 'Tradicional torta tres leches casera', 'tortas', 40.00, 22.00, 20, 5, 'unidad', '/publico/imagenes/productos/torta-tres-leches.png'),
('Torta de Vainilla', 'Suave torta de vainilla con crema chantilly', 'tortas', 35.00, 20.00, 18, 5, 'unidad', '/publico/imagenes/productos/torta-vainilla.png'),
('Torta Selva Negra', 'Exquisita torta alemana con cerezas', 'tortas', 50.00, 28.00, 10, 3, 'unidad', '/publico/imagenes/productos/torta-selva-negra.png'),

-- Pasteles individuales
('Suspiro a la Limeña', 'Postre tradicional peruano con merengue', 'pasteles', 8.00, 4.00, 50, 15, 'unidad', '/publico/imagenes/productos/suspiro-limena.png'),
('Alfajor Chiclayano', 'Alfajor relleno de manjar blanco', 'pasteles', 3.50, 1.50, 100, 30, 'unidad', '/publico/imagenes/productos/alfajor.png'),
('Pionono', 'Enrollado de bizcocho con manjar blanco', 'pasteles', 6.00, 3.00, 40, 10, 'unidad', '/publico/imagenes/productos/pionono.png'),
('Mil Hojas', 'Capas de masa hojaldre con crema pastelera', 'pasteles', 7.00, 3.50, 35, 10, 'unidad', '/publico/imagenes/productos/mil-hojas.png'),

-- Panes
('Pan Francés', 'Pan francés tradicional crujiente', 'panes', 0.30, 0.15, 200, 50, 'unidad', '/publico/imagenes/productos/pan-frances.png'),
('Pan de Yema', 'Pan dulce tradicional norteño', 'panes', 2.00, 0.80, 80, 20, 'unidad', '/publico/imagenes/productos/pan-yema.png'),
('Pan Ciabatta', 'Pan artesanal italiano', 'panes', 5.00, 2.50, 30, 10, 'unidad', '/publico/imagenes/productos/ciabatta.png'),
('Pan Integral', 'Pan integral con semillas', 'panes', 4.00, 2.00, 40, 15, 'unidad', '/publico/imagenes/productos/pan-integral.png'),

-- Bocaditos
('Empanada de Pollo', 'Empanada criolla rellena de pollo', 'bocaditos', 4.50, 2.00, 60, 20, 'unidad', '/publico/imagenes/productos/empanada-pollo.png'),
('Empanada de Carne', 'Empanada jugosa de carne molida', 'bocaditos', 4.50, 2.00, 55, 20, 'unidad', '/publico/imagenes/productos/empanada-carne.png'),
('Tequeños', 'Bocaditos de queso envueltos en masa', 'bocaditos', 1.50, 0.60, 100, 30, 'unidad', '/publico/imagenes/productos/tequenos.png'),
('Mini Sándwiches', 'Sándwiches variados para eventos', 'bocaditos', 2.50, 1.00, 80, 25, 'unidad', '/publico/imagenes/productos/mini-sandwiches.png'),

-- Bebidas
('Chicha Morada', 'Bebida tradicional peruana de maíz morado', 'bebidas', 3.00, 1.20, 40, 10, 'litro', '/publico/imagenes/productos/chicha-morada.png'),
('Limonada Frozen', 'Limonada helada refrescante', 'bebidas', 4.00, 1.50, 35, 10, 'litro', '/publico/imagenes/productos/limonada.png'),
('Café Pasado', 'Café tradicional chiclayano', 'bebidas', 2.50, 0.80, 50, 15, 'litro', '/publico/imagenes/productos/cafe.png'),

-- Insumos
('Harina Blanca', 'Harina para repostería', 'insumos', 3.50, 2.50, 100, 20, 'kg', '/publico/imagenes/productos/harina.png'),
('Azúcar Blanca', 'Azúcar refinada', 'insumos', 3.00, 2.00, 150, 30, 'kg', '/publico/imagenes/productos/azucar.png'),
('Mantequilla', 'Mantequilla sin sal', 'insumos', 12.00, 8.00, 50, 10, 'kg', '/publico/imagenes/productos/mantequilla.png'),
('Huevos', 'Huevos frescos', 'insumos', 8.00, 6.00, 30, 10, 'docena', '/publico/imagenes/productos/huevos.png'),
('Leche Fresca', 'Leche entera', 'insumos', 4.50, 3.50, 40, 10, 'litro', '/publico/imagenes/productos/leche.png');


-- =====================================================
-- DATOS INICIALES: Proveedores
-- =====================================================
INSERT INTO proveedores (nombre_proveedor, ruc, telefono, correo, direccion) VALUES
('Distribuidora Norte SAC', '20123456789', '074-231234', 'ventas@distrinorte.pe', 'Av. Bolognesi 456, Chiclayo'),
('Insumos Panadería Perú', '20234567890', '074-245678', 'pedidos@insumosperu.pe', 'Jr. Balta 789, Chiclayo'),
('Productos La Europea', '20345678901', '074-256789', 'contacto@laeuropea.pe', 'Calle Real 123, Chiclayo');

-- =====================================================
-- DATOS INICIALES: Pedidos de ejemplo
-- =====================================================
INSERT INTO pedidos_proveedores (id_proveedor, id_usuario, fecha_entrega_estimada, estado, total, observaciones) VALUES
(1, 1, '2024-12-05', 'pendiente', 850.00, 'Pedido de harina y azúcar'),
(2, 1, '2024-11-28', 'recibido', 450.00, 'Insumos para repostería'),
(3, 2, '2024-12-10', 'pendiente', 320.00, 'Mantequilla y levadura');

INSERT INTO detalle_pedidos (id_pedido, id_producto, cantidad, precio_unitario, subtotal) VALUES
(1, 20, 50, 2.50, 125.00),
(1, 21, 100, 2.00, 200.00),
(2, 22, 20, 8.00, 160.00),
(3, 22, 15, 8.00, 120.00);

-- =====================================================
-- DATOS INICIALES: Auditoría de ejemplo
-- =====================================================
INSERT INTO auditoria (tabla_afectada, id_registro, accion, datos_anteriores, id_usuario) VALUES
('productos', 999, 'eliminar', '{"nombre": "Producto Test", "stock": 10}', 1),
('usuarios', 888, 'modificar', '{"nombre": "Usuario Antiguo", "rol": "almacenero"}', 1);


-- =====================================================
-- DATOS INICIALES: Movimientos de ejemplo
-- =====================================================
INSERT INTO movimientos (id_producto, id_usuario, tipo_movimiento, cantidad, stock_anterior, stock_nuevo, motivo) VALUES
(1, 1, 'entrada', 15, 0, 15, 'Stock inicial'),
(2, 1, 'entrada', 20, 0, 20, 'Stock inicial'),
(5, 1, 'entrada', 50, 0, 50, 'Stock inicial'),
(9, 1, 'entrada', 200, 0, 200, 'Stock inicial'),
(13, 2, 'salida', 5, 60, 55, 'Venta mostrador'),
(6, 2, 'salida', 10, 100, 90, 'Pedido evento');

-- =====================================================
-- PROCEDIMIENTO ALMACENADO
-- Procedimiento para registrar movimiento de inventario
-- =====================================================
DELIMITER $$

CREATE PROCEDURE registrar_movimiento(
  IN p_id_producto INT,
  IN p_id_usuario INT,
  IN p_tipo_movimiento ENUM('entrada', 'salida', 'ajuste'),
  IN p_cantidad INT,
  IN p_motivo VARCHAR(255),
  IN p_observaciones TEXT
)
BEGIN
  DECLARE v_stock_actual INT;
  DECLARE v_stock_nuevo INT;
  
  -- Obtener stock actual
  SELECT stock_actual INTO v_stock_actual
  FROM productos
  WHERE id_producto = p_id_producto;
  
  -- Calcular nuevo stock
  IF p_tipo_movimiento = 'entrada' THEN
    SET v_stock_nuevo = v_stock_actual + p_cantidad;
  ELSEIF p_tipo_movimiento = 'salida' THEN
    SET v_stock_nuevo = v_stock_actual - p_cantidad;
  ELSE
    SET v_stock_nuevo = p_cantidad;
  END IF;
  
  -- Validar que el stock no sea negativo
  IF v_stock_nuevo < 0 THEN
    SIGNAL SQLSTATE '45000'
    SET MESSAGE_TEXT = 'El stock no puede ser negativo';
  END IF;
  
  -- Iniciar transacción
  START TRANSACTION;
  
  -- Registrar movimiento
  INSERT INTO movimientos (
    id_producto, id_usuario, tipo_movimiento, 
    cantidad, stock_anterior, stock_nuevo, 
    motivo, observaciones
  ) VALUES (
    p_id_producto, p_id_usuario, p_tipo_movimiento,
    p_cantidad, v_stock_actual, v_stock_nuevo,
    p_motivo, p_observaciones
  );
  
  -- Actualizar stock del producto
  UPDATE productos
  SET stock_actual = v_stock_nuevo
  WHERE id_producto = p_id_producto;
  
  COMMIT;
END$$

DELIMITER ;

-- =====================================================
-- CONSULTAS DE VERIFICACIÓN
-- =====================================================
SHOW TABLES;

SELECT COUNT(*) as total_productos FROM productos;
SELECT COUNT(*) as total_movimientos FROM movimientos;
SELECT COUNT(*) as total_usuarios FROM usuarios;

-- Verificar rutas de imágenes (deben tener /publico/ al inicio)
SELECT id_producto, nombre, imagen 
FROM productos 
ORDER BY id_producto
LIMIT 5;

-- =====================================================
-- FIN DEL SCRIPT