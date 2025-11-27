# 🧁 Pastelería Don Pepe - Sistema de Control de Inventario

Sistema completo de gestión de inventario desarrollado para la Pastelería Don Pepe de Chiclayo, Perú.

## 📋 Descripción

Sistema web integral que permite gestionar el inventario de una pastelería, con control de productos, movimientos de stock, generación de reportes y acceso basado en roles de usuario.

## ✨ Características Principales

- 🔐 **Autenticación y control de acceso**
  - Dos roles: Administrador y Almacenero
  - Sesiones seguras con Express Session
  - Contraseñas encriptadas con bcrypt

- 📊 **Dashboard en tiempo real**
  - Estadísticas del inventario
  - Productos con stock bajo
  - Valor total del inventario
  - Movimientos recientes

- 🧁 **Gestión de productos**
  - CRUD completo de productos
  - Categorización (tortas, panes, pasteles, etc.)
  - Subida de imágenes
  - Control de stock mínimo
  - Búsqueda y filtros

- 📦 **Control de movimientos**
  - Entradas, salidas y ajustes de inventario
  - Trazabilidad completa
  - Historial de movimientos
  - Actualización automática de stock

- 📄 **Reportes exportables**
  - Reporte de inventario (Excel y PDF)
  - Reporte de movimientos (Excel y PDF)
  - Filtros por fechas y categorías
  - Reporte de stock bajo

## 🛠️ Tecnologías Utilizadas

### Backend
- **Node.js** - Entorno de ejecución
- **Express** - Framework web
- **MySQL** - Base de datos
- **bcryptjs** - Encriptación de contraseñas
- **express-session** - Manejo de sesiones

### Frontend
- **HTML5** - Estructura
- **CSS3** - Estilos personalizados
- **JavaScript Vanilla** - Interactividad

### Generación de Reportes
- **ExcelJS** - Generación de archivos Excel
- **PDFKit** - Generación de archivos PDF

### Carga de archivos
- **Multer** - Subida de imágenes de productos

## 📦 Instalación

### Prerrequisitos

- Node.js (v14 o superior)
- MySQL (v8.0 o superior)
- npm o yarn

### Pasos de instalación

1. **Clonar el repositorio**
```bash
git clone <url-del-repositorio>
cd pasteleria-don-pepe
```

2. **Instalar dependencias**
```bash
npm install
```

3. **Configurar variables de entorno**
```bash
cp .env.example .env
```

Editar el archivo `.env` con tus configuraciones:
```env
PORT=3000
DB_HOST=localhost
DB_PORT=3306
DB_USER=root
DB_PASSWORD=tu_contraseña
DB_NAME=pasteleria_don_pepe
SESSION_SECRET=tu_secret_aleatorio_muy_seguro
NODE_ENV=development
```

4. **Crear la base de datos**
```bash
# Acceder a MySQL
mysql -u root -p

# Ejecutar el script SQL
source base-datos/pasteleria.sql
```

5. **Iniciar el servidor**
```bash
npm start
```

6. **Acceder al sistema**
Abrir navegador en: `http://localhost:3000`

## 🔑 Credenciales de Prueba

### Administrador
- **Usuario:** admin
- **Contraseña:** admin123
- **Permisos:** Acceso total al sistema

### Almacenero
- **Usuario:** almacenero
- **Contraseña:** almacen123
- **Permisos:** Acceso limitado (sin eliminar productos)

## 📁 Estructura del Proyecto

```
pasteleria-don-pepe/
│
├── 📁 base-datos/              # Base de datos MySQL
│   ├── conexion.js             # Configuración de conexión
│   └── pasteleria.sql          # Script SQL completo
│
├── 📁 publico/                 # Archivos públicos
│   ├── 📁 css/
│   │   └── estilos.css         # Estilos del sistema
│   ├── 📁 js/
│   │   └── principal.js        # JavaScript frontend
│   └── 📁 imagenes/
│       ├── sistema/            # Logo, favicon
│       ├── productos/          # Imágenes de productos
│       └── iconos/             # Iconos del sistema
│
├── 📁 vistas/                  # Páginas HTML
│   ├── login.html              # Inicio de sesión
│   ├── dashboard.html          # Panel principal
│   ├── productos.html          # Gestión de productos
│   ├── movimientos.html        # Movimientos de inventario
│   └── reportes.html           # Generación de reportes
│
├── 📁 middleware/              # Middlewares Express
│   └── autenticacion.js        # Control de acceso
│
├── 📁 rutas/                   # Rutas de la API
│   ├── autenticacion.js        # Login/Logout
│   ├── dashboard.js            # Estadísticas
│   ├── productos.js            # CRUD productos
│   ├── movimientos.js          # Movimientos
│   └── reportes.js             # Generación de reportes
│
├── 📁 subidas/                 # Archivos temporales
│   └── temp/
│
├── .env.example                # Plantilla de variables de entorno
├── .gitignore                  # Archivos ignorados por Git
├── servidor.js                 # Servidor principal
├── package.json                # Dependencias del proyecto
└── README.md                   # Este archivo
```

## 🚀 Scripts Disponibles

```bash
# Iniciar servidor en modo desarrollo
npm start

# Iniciar con nodemon (recarga automática)
npm run dev

# Ejecutar en producción
npm run prod
```

## 📱 Características Responsive

El sistema está completamente optimizado para:
- 💻 Escritorio (1920px+)
- 💻 Laptop (1366px+)
- 📱 Tablet (768px+)
- 📱 Móvil (320px+)

## 🔒 Seguridad

- ✅ Contraseñas encriptadas con bcrypt
- ✅ Sesiones seguras con express-session
- ✅ Validación de datos en servidor
- ✅ Control de acceso basado en roles
- ✅ Protección contra SQL Injection (prepared statements)
- ✅ Sanitización de inputs

## 📊 Base de Datos

### Tablas principales

1. **usuarios** - Usuarios del sistema
2. **productos** - Catálogo de productos
3. **movimientos** - Historial de movimientos

### Vistas útiles

- `vista_stock_bajo` - Productos con stock mínimo
- `vista_valor_inventario` - Valor total por categoría

### Procedimientos almacenados

- `registrar_movimiento` - Registro transaccional de movimientos

## 🎨 Paleta de Colores

- **Primario:** `#ff8c42` (Naranja cálido)
- **Secundario:** `#8b4513` (Marrón chocolate)
- **Acento:** `#ffd700` (Dorado)
- **Éxito:** `#28a745`
- **Peligro:** `#dc3545`
- **Advertencia:** `#ffc107`

## 🤝 Contribuir

1. Fork el proyecto
2. Crear una rama de feature (`git checkout -b feature/NuevaCaracteristica`)
3. Commit los cambios (`git commit -m 'Agregar nueva característica'`)
4. Push a la rama (`git push origin feature/NuevaCaracteristica`)
5. Abrir un Pull Request

## 📝 Licencia

Este proyecto es de uso educativo y demostrativo.

## 👨‍💻 Autor

Sistema desarrollado para Pastelería Don Pepe - Chiclayo, Perú

## 📧 Soporte

Para soporte o consultas, contactar a través del sistema de issues del repositorio.

---

**Hecho con ❤️ en Chiclayo, Perú 🇵🇪**