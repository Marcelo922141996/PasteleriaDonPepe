/**
 * JavaScript Principal - Sistema de Inventario
 * Pastelería Don Pepe - Chiclayo, Perú
 * VERSIÓN COMPLETAMENTE CORREGIDA - SIN ERRORES
 */

// ===================================
// VARIABLES GLOBALES
// ===================================
let usuarioActual = null;
let paginaActual = 1;
const elementosPorPagina = 10;
let graficoCategorias = null;


// ===================================
// UTILIDADES GENERALES
// ===================================

function mostrarAlerta(mensaje, tipo = 'info') {
  const contenedor = document.getElementById('contenedor-alertas');
  if (!contenedor) {
    console.warn('Contenedor de alertas no encontrado');
    return;
  }
  const alerta = document.createElement('div');
  alerta.className = `alerta alerta-${tipo}`;
  alerta.innerHTML = `
    <span>${mensaje}</span>
    <button onclick="this.parentElement.remove()" style="margin-left: auto; background: none; border: none; cursor: pointer; font-size: 1.2rem;">&times;</button>
  `;
  contenedor.appendChild(alerta);
  setTimeout(() => {
    if (alerta.parentElement) alerta.remove();
  }, 5000);
}

function formatearMoneda(numero) {
  return new Intl.NumberFormat('es-PE', {
    style: 'currency',
    currency: 'PEN'
  }).format(numero);
}

function formatearFecha(fecha) {
  return new Date(fecha).toLocaleDateString('es-PE', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit'
  });
}

function toggleModal(idModal, mostrar = true) {
  const modal = document.getElementById(idModal);
  if (!modal) {
    console.warn(`Modal ${idModal} no encontrado`);
    return;
  }
  if (mostrar) modal.classList.add('activo');
  else modal.classList.remove('activo');
}

function mostrarCargando(contenedor) {
  const elemento = document.getElementById(contenedor);
  if (!elemento) {
    console.warn(`Contenedor ${contenedor} no encontrado`);
    return;
  }
  elemento.innerHTML = '<div class="contenedor-cargando"><div class="cargando"></div><p>Cargando datos...</p></div>';
}

function removerCargando(contenedor, contenidoHTML) {
  const elemento = document.getElementById(contenedor);
  if (!elemento) {
    console.warn(`Contenedor ${contenedor} no encontrado`);
    return;
  }
  elemento.innerHTML = contenidoHTML;
}

function toggleMenuMovil() {
  const sidebar = document.querySelector('.sidebar');
  if (sidebar) sidebar.classList.toggle('activo');
}

// ===================================
// AUTENTICACIÓN
// ===================================

async function iniciarSesion(evento) {
  evento.preventDefault();
  const usuario = document.getElementById('usuario').value;
  const contrasena = document.getElementById('contrasena').value;
  if (!usuario || !contrasena) {
    mostrarAlerta('Por favor complete todos los campos', 'error');
    return;
  }
  try {
    const respuesta = await fetch('/api/auth/login', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ nombre_usuario: usuario, contrasena })
    });
    const datos = await respuesta.json();
    if (respuesta.ok) {
      mostrarAlerta('Inicio de sesión exitoso', 'exito');
      setTimeout(() => window.location.href = '/vistas/dashboard.html', 1000);
    } else {
      mostrarAlerta(datos.mensaje || 'Credenciales incorrectas', 'error');
    }
  } catch (error) {
    console.error('Error al iniciar sesión:', error);
    mostrarAlerta('Error de conexión. Intente nuevamente.', 'error');
  }
}

async function verificarSesion() {
  try {
    const respuesta = await fetch('/api/auth/verificar');
    const datos = await respuesta.json();
    if (respuesta.ok && datos.usuario) {
      usuarioActual = datos.usuario;
      actualizarInfoUsuario();
      return true;
    } else {
      window.location.href = '/vistas/login.html';
      return false;
    }
  } catch (error) {
    console.error('Error al verificar sesión:', error);
    window.location.href = '/vistas/login.html';
    return false;
  }
}

async function cerrarSesion() {
  try {
    await fetch('/api/auth/logout', { method: 'POST' });
    window.location.href = '/vistas/login.html';
  } catch (error) {
    console.error('Error al cerrar sesión:', error);
    window.location.href = '/vistas/login.html';
  }
}

function actualizarInfoUsuario() {
  if (!usuarioActual) return;
  const nombreElemento = document.getElementById('nombre-usuario');
  const rolElemento = document.getElementById('rol-usuario');
  if (nombreElemento) nombreElemento.textContent = usuarioActual.nombre_completo;
  if (rolElemento) rolElemento.textContent = usuarioActual.rol.toUpperCase();
  if (usuarioActual.rol !== 'admin') {
    document.querySelectorAll('.solo-admin').forEach(el => el.style.display = 'none');
  }
}

// ===================================
// DASHBOARD
// ===================================

async function cargarEstadisticas() {
  try {
    const respuesta = await fetch('/api/dashboard/estadisticas');
    const datos = await respuesta.json();
    if (respuesta.ok) {
      actualizarTarjetasEstadisticas(datos);
      cargarGraficos(datos);
      cargarAlertasStockBajo();
      cargarUltimosMovimientos();
    } else {
      mostrarAlerta('Error al cargar estadísticas', 'error');
    }
  } catch (error) {
    console.error('Error al cargar estadísticas:', error);
    mostrarAlerta('Error al cargar estadísticas', 'error');
  }
}

function actualizarTarjetasEstadisticas(datos) {
  const elementos = {
    'total-productos': datos.total_productos || 0,
    'valor-inventario': formatearMoneda(datos.valor_inventario || 0),
    'stock-bajo': datos.productos_stock_bajo || 0,
    'movimientos-hoy': datos.movimientos_hoy || 0
  };
  Object.entries(elementos).forEach(([id, valor]) => {
    const elemento = document.getElementById(id);
    if (elemento) elemento.textContent = valor;
  });
}

function cargarGraficos(datos) {
  const canvas = document.getElementById('grafico-categorias');
  if (!canvas) return;
  if (typeof Chart === 'undefined') {
    console.error('Chart.js no está cargado');
    return;
  }
  if (graficoCategorias) graficoCategorias.destroy();
  if (!datos.inventario_por_categoria || datos.inventario_por_categoria.length === 0) return;
  const categorias = datos.inventario_por_categoria.map(item => item.categoria);
  const valores = datos.inventario_por_categoria.map(item => parseFloat(item.valor_total) || 0);
  const cantidades = datos.inventario_por_categoria.map(item => parseInt(item.total_productos) || 0);
  const colores = [
    'rgba(255, 99, 132, 0.8)', 'rgba(54, 162, 235, 0.8)', 'rgba(255, 206, 86, 0.8)',
    'rgba(75, 192, 192, 0.8)', 'rgba(153, 102, 255, 0.8)', 'rgba(255, 159, 64, 0.8)', 'rgba(199, 199, 199, 0.8)'
  ];
  graficoCategorias = new Chart(canvas, {
    type: 'bar',
    data: {
      labels: categorias,
      datasets: [{
        label: 'Valor Total (S/)',
        data: valores,
        backgroundColor: colores.slice(0, categorias.length),
        borderColor: colores.slice(0, categorias.length).map(c => c.replace('0.8', '1')),
        borderWidth: 1
      }]
    },
    options: {
      responsive: true,
      maintainAspectRatio: false,
      plugins: {
        legend: { display: true, position: 'top' },
        title: {
          display: true,
          text: 'Inventario por Categoría',
          font: { size: 16 }
        },
        tooltip: {
          callbacks: {
            label: function(context) {
              const index = context.dataIndex;
              return [
                `Valor: ${formatearMoneda(valores[index])}`,
                `Productos: ${cantidades[index]}`
              ];
            }
          }
        }
      },
      scales: {
        y: {
          beginAtZero: true,
          ticks: {
            callback: function(value) {
              return 'S/ ' + value.toLocaleString('es-PE');
            }
          }
        }
      }
    }
  });
}

async function cargarAlertasStockBajo() {
  const contenedor = document.getElementById('alertas-stock-bajo');
  if (!contenedor) return;
  try {
    const respuesta = await fetch('/api/productos?stock=bajo');
    const datos = await respuesta.json();
    if (!respuesta.ok || !datos.productos) {
      contenedor.innerHTML = '<p style="color: red;">Error al cargar alertas</p>';
      return;
    }
    const productos = datos.productos || [];
    if (productos.length === 0) {
      contenedor.innerHTML = `<div style="text-align: center; padding: 20px; color: #28a745;"><p>✓ No hay productos con stock bajo</p></div>`;
      return;
    }
    contenedor.innerHTML = `
      <div style="max-height: 300px; overflow-y: auto;">
        ${productos.map(prod => `
          <div style="border-left: 4px solid #dc3545; padding: 10px; margin-bottom: 10px; background: #fff3cd;">
            <strong>${prod.nombre}</strong>
            <div style="display: flex; justify-content: space-between; margin-top: 5px; font-size: 0.9rem;">
              <span>Stock: <strong style="color: #dc3545;">${prod.stock_actual}</strong></span>
              <span>Mínimo: <strong>${prod.stock_minimo}</strong></span>
            </div>
            <small style="color: #666;">Categoría: ${prod.categoria}</small>
          </div>
        `).join('')}
      </div>`;
  } catch (error) {
    console.error('Error al cargar alertas:', error);
    contenedor.innerHTML = '<p style="color: red;">Error al cargar alertas</p>';
  }
}

async function cargarUltimosMovimientos() {
  try {
    const respuesta = await fetch('/api/movimientos?limite=5');
    const datos = await respuesta.json();
    if (respuesta.ok && datos.movimientos) {
      mostrarUltimosMovimientos(datos.movimientos);
    }
  } catch (error) {
    console.error('Error al cargar últimos movimientos:', error);
  }
}

function mostrarUltimosMovimientos(movimientos) {
  const tbody = document.getElementById('tbody-ultimos-movimientos');
  if (!tbody) return;
  if (!movimientos || movimientos.length === 0) {
    tbody.innerHTML = '<tr><td colspan="5" class="texto-centrado">No hay movimientos recientes</td></tr>';
    return;
  }
  tbody.innerHTML = movimientos.map(mov => `
    <tr>
      <td>${mov.nombre_producto}</td>
      <td><span class="badge ${mov.tipo_movimiento === 'entrada' ? 'badge-exito' : 'badge-peligro'}">${mov.tipo_movimiento}</span></td>
      <td>${mov.cantidad}</td>
      <td>${mov.nombre_usuario}</td>
      <td>${formatearFecha(mov.fecha_movimiento)}</td>
    </tr>
  `).join('');
}

// ===================================
// PRODUCTOS
// ===================================

async function cargarProductos(busqueda = '', categoria = '') {
  const contenedorTabla = document.getElementById('contenedor-tabla-productos');
  if (!contenedorTabla) {
    console.error('❌ Contenedor tabla productos no encontrado');
    return;
  }
  mostrarCargando('contenedor-tabla-productos');
  try {
    let url = '/api/productos?';
    if (busqueda) url += `busqueda=${encodeURIComponent(busqueda)}&`;
    if (categoria) url += `categoria=${encodeURIComponent(categoria)}&`;
    const respuesta = await fetch(url);
    const datos = await respuesta.json();
    
    if (respuesta.ok && datos.success && datos.productos) {
      // ✅ CORRECTO: Crear estructura completa de tabla con encabezados
      const tablaHTML = `
        <table class="tabla">
          <thead>
            <tr>
              <th>Imagen</th>
              <th>Nombre</th>
              <th>Categoría</th>
              <th>Precio</th>
              <th>Stock</th>
              <th>Stock Mín.</th>
              <th>Estado</th>
              <th>Acciones</th>
            </tr>
          </thead>
          <tbody id="tbody-productos"></tbody>
        </table>
      `;
      // ✅ Remueve el "Cargando..." y coloca la tabla vacía
      removerCargando('contenedor-tabla-productos', tablaHTML);
      // ✅ Ahora sí llena el tbody con los datos
      mostrarProductos(datos.productos);
    } else {
      const tablaError = '<table class="tabla"><tbody><tr><td colspan="8" class="texto-centrado" style="color: red;">Error al cargar productos</td></tr></tbody></table>';
      removerCargando('contenedor-tabla-productos', tablaError);
      mostrarAlerta(datos.mensaje || 'Error al cargar productos', 'error');
    }
  } catch (error) {
    console.error('💥 Error al cargar productos:', error);
    const tablaError = '<table class="tabla"><tbody><tr><td colspan="8" class="texto-centrado" style="color: red;">Error de conexión</td></tr></tbody></table>';
    removerCargando('contenedor-tabla-productos', tablaError);
    mostrarAlerta('Error de conexión al cargar productos', 'error');
  }
}

function mostrarProductos(productos) {
  const tbody = document.getElementById('tbody-productos');
  if (!tbody) {
    console.error('❌ tbody-productos no encontrado');
    return;
  }
  
  if (!productos || productos.length === 0) {
    tbody.innerHTML = '<tr><td colspan="8" class="texto-centrado">No se encontraron productos</td></tr>';
    return;
  }
  
  tbody.innerHTML = productos.map(prod => {
    // ✅ SOLUCIÓN DEFINITIVA: Usar la ruta exacta de la base de datos
    // Las rutas en la BD YA tienen /publico/, no agregar nada
    let rutaImagen = prod.imagen || '/publico/imagenes/productos/default.jpg';
    
    // Solo agregar /publico si la ruta empieza con / pero NO tiene /publico
    if (rutaImagen.startsWith('/imagenes/')) {
      rutaImagen = '/publico' + rutaImagen;
    }
    
    // Debug para verificar rutas (puedes eliminar estas 2 líneas después)
    console.log(`🖼️ ${prod.nombre}`);
    console.log(`   BD: "${prod.imagen}" → Final: "${rutaImagen}"`);
    
    return `
    <tr>
      <td><img src="${rutaImagen}" alt="${prod.nombre}" class="imagen-producto" onerror="this.src='/publico/imagenes/productos/default.jpg'" style="width: 50px; height: 50px; object-fit: cover;"></td>
      <td>${prod.nombre}</td>
      <td><span class="badge badge-info">${prod.categoria}</span></td>
      <td>${formatearMoneda(prod.precio_venta)}</td>
      <td class="${prod.stock_actual <= prod.stock_minimo ? 'texto-peligro' : ''}">${prod.stock_actual}</td>
      <td>${prod.stock_minimo}</td>
      <td><span class="badge ${prod.estado === 'activo' ? 'badge-exito' : 'badge-peligro'}">${prod.estado}</span></td>
      <td>
        <button class="boton boton-editar" onclick="editarProducto(${prod.id_producto})">✏️</button>
        <button class="boton boton-eliminar solo-admin" onclick="eliminarProducto(${prod.id_producto})">🗑️</button>
      </td>
    </tr>
  `}).join('');
}

function abrirModalProducto(idProducto = null) {
  const modal = document.getElementById('modal-producto');
  const titulo = document.getElementById('titulo-modal-producto');
  const formulario = document.getElementById('formulario-producto');
  if (!modal || !titulo || !formulario) return;
  if (idProducto) {
    titulo.textContent = 'Editar Producto';
    cargarDatosProducto(idProducto);
  } else {
    titulo.textContent = 'Nuevo Producto';
    formulario.reset();
    document.getElementById('id-producto').value = '';
  }
  toggleModal('modal-producto', true);
}

function editarProducto(idProducto) {
  abrirModalProducto(idProducto);
}

async function cargarDatosProducto(idProducto) {
  try {
    const respuesta = await fetch(`/api/productos/${idProducto}`);
    const datos = await respuesta.json();
    if (respuesta.ok && datos.success) {
      const prod = datos.producto;
      document.getElementById('id-producto').value = prod.id_producto;
      document.getElementById('nombre-producto').value = prod.nombre;
      document.getElementById('descripcion-producto').value = prod.descripcion || '';
      document.getElementById('categoria-producto').value = prod.categoria;
      document.getElementById('precio-venta').value = prod.precio_venta;
      document.getElementById('precio-costo').value = prod.precio_costo;
      document.getElementById('stock-actual').value = prod.stock_actual;
      document.getElementById('stock-minimo').value = prod.stock_minimo;
      document.getElementById('unidad-medida').value = prod.unidad_medida;
      document.getElementById('estado-producto').value = prod.estado;
    }
  } catch (error) {
    console.error('Error al cargar producto:', error);
    mostrarAlerta('Error al cargar datos del producto', 'error');
  }
}

async function guardarProducto(evento) {
  evento.preventDefault();
  const idProducto = document.getElementById('id-producto').value;
  const formData = new FormData(evento.target);
  try {
    const url = idProducto ? `/api/productos/${idProducto}` : '/api/productos';
    const metodo = idProducto ? 'PUT' : 'POST';
    const respuesta = await fetch(url, {
      method: metodo,
      body: formData
    });
    const datos = await respuesta.json();
    if (respuesta.ok && datos.success) {
      mostrarAlerta(datos.mensaje, 'exito');
      toggleModal('modal-producto', false);
      cargarProductos();
    } else {
      mostrarAlerta(datos.mensaje || 'Error al guardar producto', 'error');
    }
  } catch (error) {
    console.error('Error al guardar producto:', error);
    mostrarAlerta('Error al guardar producto', 'error');
  }
}

async function eliminarProducto(idProducto) {
  if (!confirm('¿Está seguro de eliminar este producto?')) return;
  try {
    const respuesta = await fetch(`/api/productos/${idProducto}`, { method: 'DELETE' });
    const datos = await respuesta.json();
    if (respuesta.ok && datos.success) {
      mostrarAlerta(datos.mensaje, 'exito');
      cargarProductos();
    } else {
      mostrarAlerta(datos.mensaje || 'Error al eliminar producto', 'error');
    }
  } catch (error) {
    console.error('Error al eliminar producto:', error);
    mostrarAlerta('Error al eliminar producto', 'error');
  }
}

// ===================================
// MOVIMIENTOS
// ===================================

async function cargarMovimientos(fechaInicio = '', fechaFin = '', tipo = '') {
  const contenedorTabla = document.getElementById('contenedor-tabla-movimientos');
  if (!contenedorTabla) return;
  mostrarCargando('contenedor-tabla-movimientos');
  try {
    let url = '/api/movimientos?';
    if (fechaInicio) url += `fecha_inicio=${fechaInicio}&`;
    if (fechaFin) url += `fecha_fin=${fechaFin}&`;
    if (tipo) url += `tipo=${tipo}&`;
    const respuesta = await fetch(url);
    const datos = await respuesta.json();
    
    if (respuesta.ok && datos.success && datos.movimientos) {
      // ✅ CORRECTO: Crear estructura completa de tabla con encabezados
      const tablaHTML = `
        <table class="tabla">
          <thead>
            <tr>
              <th>Fecha</th>
              <th>Producto</th>
              <th>Tipo</th>
              <th>Cantidad</th>
              <th>Stock Anterior</th>
              <th>Stock Nuevo</th>
              <th>Usuario</th>
            </tr>
          </thead>
          <tbody id="tbody-movimientos"></tbody>
        </table>
      `;
      // ✅ Remueve el "Cargando..." y coloca la tabla vacía
      removerCargando('contenedor-tabla-movimientos', tablaHTML);
      // ✅ Ahora sí llena el tbody con los datos
      mostrarMovimientos(datos.movimientos);
    } else {
      const tablaError = '<table class="tabla"><tbody><tr><td colspan="7" class="texto-centrado" style="color: red;">Error al cargar movimientos</td></tr></tbody></table>';
      removerCargando('contenedor-tabla-movimientos', tablaError);
      mostrarAlerta('Error al cargar movimientos', 'error');
    }
  } catch (error) {
    console.error('Error al cargar movimientos:', error);
    const tablaError = '<table class="tabla"><tbody><tr><td colspan="7" class="texto-centrado" style="color: red;">Error de conexión</td></tr></tbody></table>';
    removerCargando('contenedor-tabla-movimientos', tablaError);
    mostrarAlerta('Error de conexión al cargar movimientos', 'error');
  }
}

function mostrarMovimientos(movimientos) {
  const tbody = document.getElementById('tbody-movimientos');
  if (!tbody) return;
  
  // ✅ CORRECTO: Solo actualizar el <tbody>, NO crear nueva tabla
  if (!movimientos || movimientos.length === 0) {
    tbody.innerHTML = '<tr><td colspan="7" class="texto-centrado">No se encontraron movimientos</td></tr>';
    return;
  }
  
  tbody.innerHTML = movimientos.map(mov => `
    <tr>
      <td>${formatearFecha(mov.fecha_movimiento)}</td>
      <td>${mov.nombre_producto}</td>
      <td><span class="badge ${mov.tipo_movimiento === 'entrada' ? 'badge-exito' : mov.tipo_movimiento === 'salida' ? 'badge-peligro' : 'badge-advertencia'}">${mov.tipo_movimiento}</span></td>
      <td>${mov.cantidad}</td>
      <td>${mov.stock_anterior || '-'}</td>
      <td>${mov.stock_nuevo || '-'}</td>
      <td>${mov.nombre_usuario}</td>
    </tr>
  `).join('');
}

async function abrirModalMovimiento() {
  try {
    const respuesta = await fetch('/api/productos?estado=activo');
    const datos = await respuesta.json();
    if (respuesta.ok && datos.success) {
      const select = document.getElementById('producto-movimiento');
      if (select) {
        select.innerHTML = '<option value="">Seleccione un producto</option>' +
          datos.productos.map(p => `<option value="${p.id_producto}">${p.nombre} (Stock: ${p.stock_actual})</option>`).join('');
      }
    }
  } catch (error) {
    console.error('Error al cargar productos:', error);
  }
  toggleModal('modal-movimiento', true);
}

async function registrarMovimiento(evento) {
  evento.preventDefault();
  const datos = {
    id_producto: document.getElementById('producto-movimiento').value,
    tipo_movimiento: document.getElementById('tipo-movimiento').value,
    cantidad: parseInt(document.getElementById('cantidad-movimiento').value),
    motivo: document.getElementById('motivo-movimiento').value,
    observaciones: document.getElementById('observaciones-movimiento').value
  };
  try {
    const respuesta = await fetch('/api/movimientos', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(datos)
    });
    const resultado = await respuesta.json();
    if (respuesta.ok) {
      mostrarAlerta(resultado.mensaje, 'exito');
      toggleModal('modal-movimiento', false);
      cargarMovimientos();
    } else {
      mostrarAlerta(resultado.mensaje || 'Error al registrar movimiento', 'error');
    }
  } catch (error) {
    console.error('Error al registrar movimiento:', error);
    mostrarAlerta('Error al registrar movimiento', 'error');
  }
}

// ===================================
// REPORTES
// ===================================

async function generarReporteInventarioExcel() {
  try {
    mostrarAlerta('Generando reporte Excel...', 'info');
    const respuesta = await fetch('/api/reportes/inventario/excel');
    if (respuesta.ok) {
      const blob = await respuesta.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `inventario_${new Date().toISOString().split('T')[0]}.xlsx`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      window.URL.revokeObjectURL(url);
      mostrarAlerta('Reporte generado exitosamente', 'exito');
    } else {
      const error = await respuesta.json();
      mostrarAlerta(error.mensaje || 'Error al generar reporte', 'error');
    }
  } catch (error) {
    console.error('Error al generar reporte:', error);
    mostrarAlerta('Error al generar reporte Excel', 'error');
  }
}

async function generarReporteInventarioPDF() {
  try {
    mostrarAlerta('Generando reporte PDF...', 'info');
    const respuesta = await fetch('/api/reportes/inventario/pdf');
    if (respuesta.ok) {
      const blob = await respuesta.blob();
      if (blob.type !== 'application/pdf') {
        console.error('El archivo recibido no es un PDF:', blob.type);
        mostrarAlerta('Error: El servidor no devolvió un PDF válido', 'error');
        return;
      }
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `inventario_${new Date().toISOString().split('T')[0]}.pdf`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      window.URL.revokeObjectURL(url);
      mostrarAlerta('Reporte PDF generado exitosamente', 'exito');
    } else {
      const error = await respuesta.json().catch(() => ({ mensaje: 'Error desconocido' }));
      mostrarAlerta(error.mensaje || 'Error al generar reporte PDF', 'error');
    }
  } catch (error) {
    console.error('Error al generar reporte PDF:', error);
    mostrarAlerta('Error al generar reporte PDF', 'error');
  }
}

async function generarReporteStockBajoPDF() {
  try {
    mostrarAlerta('Generando reporte de stock bajo...', 'info');
    const respuesta = await fetch('/api/reportes/stock-bajo/pdf');
    
    // ✅ VALIDAR SI ES JSON (sin productos)
    const contentType = respuesta.headers.get('content-type');
    if (contentType && contentType.includes('application/json')) {
      const data = await respuesta.json();
      mostrarAlerta(data.mensaje || 'Sin datos para reportar', 'info');
      return;
    }
    
    if (respuesta.ok) {
      const blob = await respuesta.blob();
      if (blob.type !== 'application/pdf') {
        console.error('El archivo recibido no es un PDF:', blob.type);
        mostrarAlerta('Error: El servidor no devolvió un PDF válido', 'error');
        return;
      }
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `stock_bajo_${new Date().toISOString().split('T')[0]}.pdf`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      window.URL.revokeObjectURL(url);
      mostrarAlerta('Reporte de stock bajo generado exitosamente', 'exito');
    } else {
      const error = await respuesta.json().catch(() => ({ mensaje: 'Error desconocido' }));
      mostrarAlerta(error.mensaje || 'Error al generar reporte', 'error');
    }
  } catch (error) {
    console.error('Error al generar reporte de stock bajo:', error);
    mostrarAlerta('Error al generar reporte de stock bajo', 'error');
  }
}

async function generarReporteStockBajoExcel() {
  try {
    mostrarAlerta('Generando reporte Excel...', 'info');
    const respuesta = await fetch('/api/reportes/stock-bajo/excel');
    
    // ✅ VALIDAR SI ES JSON (sin productos)
    const contentType = respuesta.headers.get('content-type');
    if (contentType && contentType.includes('application/json')) {
      const data = await respuesta.json();
      mostrarAlerta(data.mensaje || 'Sin datos para reportar', 'info');
      return;
    }
    
    if (respuesta.ok) {
      const blob = await respuesta.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `stock_bajo_${new Date().toISOString().split('T')[0]}.xlsx`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      window.URL.revokeObjectURL(url);
      mostrarAlerta('Reporte Excel generado exitosamente', 'exito');
    } else {
      const error = await respuesta.json().catch(() => ({ mensaje: 'Error desconocido' }));
      mostrarAlerta(error.mensaje || 'Error al generar reporte', 'error');
    }
  } catch (error) {
    console.error('Error al generar reporte Excel:', error);
    mostrarAlerta('Error al generar reporte de stock bajo', 'error');
  }
}


async function generarReporteMovimientosExcel() {
  const fechaInicio = document.getElementById('fecha-inicio-reporte')?.value || '';
  const fechaFin = document.getElementById('fecha-fin-reporte')?.value || '';
  try {
    mostrarAlerta('Generando reporte de movimientos...', 'info');
    let url = '/api/reportes/movimientos/excel?';
    if (fechaInicio) url += `fecha_inicio=${fechaInicio}&`;
    if (fechaFin) url += `fecha_fin=${fechaFin}`;
    const respuesta = await fetch(url);
    if (respuesta.ok) {
      const blob = await respuesta.blob();
      const urlBlob = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = urlBlob;
      a.download = `movimientos_${new Date().toISOString().split('T')[0]}.xlsx`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      window.URL.revokeObjectURL(urlBlob);
      mostrarAlerta('Reporte generado exitosamente', 'exito');
    } else {
      const error = await respuesta.json().catch(() => ({ mensaje: 'Error desconocido' }));
      mostrarAlerta(error.mensaje || 'Error al generar reporte', 'error');
    }
  } catch (error) {
    console.error('Error al generar reporte:', error);
    mostrarAlerta('Error al generar reporte', 'error');
  }
}

async function generarReporteMovimientosPDF() {
  const fechaInicio = document.getElementById('fecha-inicio-reporte')?.value || '';
  const fechaFin = document.getElementById('fecha-fin-reporte')?.value || '';
  try {
    mostrarAlerta('Generando reporte de movimientos PDF...', 'info');
    let url = '/api/reportes/movimientos/pdf?';
    if (fechaInicio) url += `fecha_inicio=${fechaInicio}&`;
    if (fechaFin) url += `fecha_fin=${fechaFin}`;
    const respuesta = await fetch(url);
    if (respuesta.ok) {
      const blob = await respuesta.blob();
      if (blob.type !== 'application/pdf') {
        console.error('El archivo recibido no es un PDF:', blob.type);
        mostrarAlerta('Error: El servidor no devolvió un PDF válido', 'error');
        return;
      }
      const urlBlob = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = urlBlob;
      a.download = `movimientos_${new Date().toISOString().split('T')[0]}.pdf`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      window.URL.revokeObjectURL(urlBlob);
      mostrarAlerta('Reporte generado exitosamente', 'exito');
    } else {
      const error = await respuesta.json().catch(() => ({ mensaje: 'Error desconocido' }));
      mostrarAlerta(error.mensaje || 'Error al generar reporte', 'error');
    }
  } catch (error) {
    console.error('Error al generar reporte:', error);
    mostrarAlerta('Error al generar reporte', 'error');
  }
}

// ===================================
// INICIALIZACIÓN
// ===================================

document.addEventListener('DOMContentLoaded', () => {
  const pathname = window.location.pathname;
  
  // ✅ Verificar sesión y cargar contenido inicial
  if (!pathname.includes('login.html')) {
    verificarSesion().then(sesionValida => {
      if (sesionValida) {
        if (pathname.includes('dashboard.html')) {
          cargarEstadisticas();
        } else if (pathname.includes('productos.html')) {
          cargarProductos();
        } else if (pathname.includes('movimientos.html')) {
          cargarMovimientos();
        }
      }
    });
  }
  
  // ✅ Event listeners para PRODUCTOS (solo en página de productos)
  if (pathname.includes('productos.html')) {
    const busquedaProducto = document.getElementById('busqueda-producto');
    const filtroCategoria = document.getElementById('filtro-categoria');
    
    if (busquedaProducto) {
      busquedaProducto.addEventListener('input', (e) => {
        const categoria = filtroCategoria?.value || '';
        cargarProductos(e.target.value, categoria);
      });
    }
    
    if (filtroCategoria) {
      filtroCategoria.addEventListener('change', (e) => {
        const busqueda = busquedaProducto?.value || '';
        cargarProductos(busqueda, e.target.value);
      });
    }
  }
  
  // ✅ Event listeners para MOVIMIENTOS (solo en página de movimientos)
  if (pathname.includes('movimientos.html')) {
    const filtroFechaInicio = document.getElementById('filtro-fecha-inicio');
    const filtroFechaFin = document.getElementById('filtro-fecha-fin');
    const filtroTipoMovimiento = document.getElementById('filtro-tipo-movimiento');
    
    if (filtroFechaInicio) {
      filtroFechaInicio.addEventListener('change', () => {
        const fechaInicio = filtroFechaInicio.value;
        const fechaFin = filtroFechaFin?.value || '';
        const tipo = filtroTipoMovimiento?.value || '';
        cargarMovimientos(fechaInicio, fechaFin, tipo);
      });
    }
    
    if (filtroFechaFin) {
      filtroFechaFin.addEventListener('change', () => {
        const fechaInicio = filtroFechaInicio?.value || '';
        const fechaFin = filtroFechaFin.value;
        const tipo = filtroTipoMovimiento?.value || '';
        cargarMovimientos(fechaInicio, fechaFin, tipo);
      });
    }
    
    if (filtroTipoMovimiento) {
      filtroTipoMovimiento.addEventListener('change', (e) => {
        const fechaInicio = filtroFechaInicio?.value || '';
        const fechaFin = filtroFechaFin?.value || '';
        cargarMovimientos(fechaInicio, fechaFin, e.target.value);
      });
    }
  }
});

// ===================================
// REPORTES ADICIONALES - NUEVOS
// ===================================

/**
 * Reporte de Pedidos a Proveedores - Excel
 */
async function generarReportePedidosExcel() {
  const fechaInicio = document.getElementById('fecha-inicio-pedidos')?.value || '';
  const fechaFin = document.getElementById('fecha-fin-pedidos')?.value || '';
  const estado = document.getElementById('filtro-estado-pedidos')?.value || '';
  
  try {
    mostrarAlerta('Generando reporte de pedidos...', 'info');
    let url = '/api/reportes/pedidos-proveedores/excel?';
    if (fechaInicio) url += `fecha_inicio=${fechaInicio}&`;
    if (fechaFin) url += `fecha_fin=${fechaFin}&`;
    if (estado) url += `estado=${estado}`;
    
    const respuesta = await fetch(url);
    
    // Verificar si la respuesta es JSON (sin datos)
    const contentType = respuesta.headers.get('content-type');
    if (contentType && contentType.includes('application/json')) {
      const data = await respuesta.json();
      mostrarAlerta(data.mensaje || 'Sin datos para reportar', 'info');
      return;
    }
    
    if (respuesta.ok) {
      const blob = await respuesta.blob();
      const urlBlob = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = urlBlob;
      a.download = `pedidos_proveedores_${new Date().toISOString().split('T')[0]}.xlsx`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      window.URL.revokeObjectURL(urlBlob);
      mostrarAlerta('Reporte generado exitosamente', 'exito');
    } else {
      const error = await respuesta.json().catch(() => ({ mensaje: 'Error desconocido' }));
      mostrarAlerta(error.mensaje || 'Error al generar reporte', 'error');
    }
  } catch (error) {
    console.error('Error al generar reporte:', error);
    mostrarAlerta('Error al generar reporte de pedidos', 'error');
  }
}

/**
 * Reporte de Pedidos a Proveedores - PDF
 */
async function generarReportePedidosPDF() {
  const fechaInicio = document.getElementById('fecha-inicio-pedidos')?.value || '';
  const fechaFin = document.getElementById('fecha-fin-pedidos')?.value || '';
  const estado = document.getElementById('filtro-estado-pedidos')?.value || '';
  
  try {
    mostrarAlerta('Generando reporte de pedidos PDF...', 'info');
    let url = '/api/reportes/pedidos-proveedores/pdf?';
    if (fechaInicio) url += `fecha_inicio=${fechaInicio}&`;
    if (fechaFin) url += `fecha_fin=${fechaFin}&`;
    if (estado) url += `estado=${estado}`;
    
    const respuesta = await fetch(url);
    
    // Verificar si la respuesta es JSON (sin datos)
    const contentType = respuesta.headers.get('content-type');
    if (contentType && contentType.includes('application/json')) {
      const data = await respuesta.json();
      mostrarAlerta(data.mensaje || 'Sin datos para reportar', 'info');
      return;
    }
    
    if (respuesta.ok) {
      const blob = await respuesta.blob();
      if (blob.type !== 'application/pdf') {
        console.error('El archivo recibido no es un PDF:', blob.type);
        mostrarAlerta('Error: El servidor no devolvió un PDF válido', 'error');
        return;
      }
      const urlBlob = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = urlBlob;
      a.download = `pedidos_proveedores_${new Date().toISOString().split('T')[0]}.pdf`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      window.URL.revokeObjectURL(urlBlob);
      mostrarAlerta('Reporte PDF generado exitosamente', 'exito');
    } else {
      const error = await respuesta.json().catch(() => ({ mensaje: 'Error desconocido' }));
      mostrarAlerta(error.mensaje || 'Error al generar reporte', 'error');
    }
  } catch (error) {
    console.error('Error al generar reporte PDF:', error);
    mostrarAlerta('Error al generar reporte de pedidos', 'error');
  }
}

/**
 * Reporte de Auditoría - Excel (Solo Admin)
 */
async function generarReporteAuditoriaExcel() {
  const fechaInicio = document.getElementById('fecha-inicio-auditoria')?.value || '';
  const fechaFin = document.getElementById('fecha-fin-auditoria')?.value || '';
  
  try {
    mostrarAlerta('Generando reporte de auditoría...', 'info');
    let url = '/api/reportes/auditoria/excel?';
    if (fechaInicio) url += `fecha_inicio=${fechaInicio}&`;
    if (fechaFin) url += `fecha_fin=${fechaFin}`;
    
    const respuesta = await fetch(url);
    
    // Verificar si la respuesta es JSON (sin datos)
    const contentType = respuesta.headers.get('content-type');
    if (contentType && contentType.includes('application/json')) {
      const data = await respuesta.json();
      mostrarAlerta(data.mensaje || 'Sin datos para reportar', 'info');
      return;
    }
    
    if (respuesta.ok) {
      const blob = await respuesta.blob();
      const urlBlob = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = urlBlob;
      a.download = `auditoria_${new Date().toISOString().split('T')[0]}.xlsx`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      window.URL.revokeObjectURL(urlBlob);
      mostrarAlerta('Reporte de auditoría generado exitosamente', 'exito');
    } else {
      const error = await respuesta.json().catch(() => ({ mensaje: 'Error desconocido' }));
      mostrarAlerta(error.mensaje || 'Error al generar reporte', 'error');
    }
  } catch (error) {
    console.error('Error al generar reporte:', error);
    mostrarAlerta('Error al generar reporte de auditoría', 'error');
  }
}

/**
 * Reporte de Auditoría - PDF (Solo Admin)
 */
async function generarReporteAuditoriaPDF() {
  const fechaInicio = document.getElementById('fecha-inicio-auditoria')?.value || '';
  const fechaFin = document.getElementById('fecha-fin-auditoria')?.value || '';
  
  try {
    mostrarAlerta('Generando reporte de auditoría PDF...', 'info');
    let url = '/api/reportes/auditoria/pdf?';
    if (fechaInicio) url += `fecha_inicio=${fechaInicio}&`;
    if (fechaFin) url += `fecha_fin=${fechaFin}`;
    
    const respuesta = await fetch(url);
    
    // Verificar si la respuesta es JSON (sin datos)
    const contentType = respuesta.headers.get('content-type');
    if (contentType && contentType.includes('application/json')) {
      const data = await respuesta.json();
      mostrarAlerta(data.mensaje || 'Sin datos para reportar', 'info');
      return;
    }
    
    if (respuesta.ok) {
      const blob = await respuesta.blob();
      if (blob.type !== 'application/pdf') {
        console.error('El archivo recibido no es un PDF:', blob.type);
        mostrarAlerta('Error: El servidor no devolvió un PDF válido', 'error');
        return;
      }
      const urlBlob = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = urlBlob;
      a.download = `auditoria_${new Date().toISOString().split('T')[0]}.pdf`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      window.URL.revokeObjectURL(urlBlob);
      mostrarAlerta('Reporte de auditoría PDF generado exitosamente', 'exito');
    } else {
      const error = await respuesta.json().catch(() => ({ mensaje: 'Error desconocido' }));
      mostrarAlerta(error.mensaje || 'Error al generar reporte', 'error');
    }
  } catch (error) {
    console.error('Error al generar reporte PDF:', error);
    mostrarAlerta('Error al generar reporte de auditoría', 'error');
  }
}

/**
 * Reporte de Estadísticas de Stock - Excel
 */
async function generarReporteEstadisticasExcel() {
  try {
    mostrarAlerta('Generando reporte de estadísticas...', 'info');
    const respuesta = await fetch('/api/reportes/estadisticas-stock/excel');
    
    if (respuesta.ok) {
      const blob = await respuesta.blob();
      const urlBlob = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = urlBlob;
      a.download = `estadisticas_stock_${new Date().toISOString().split('T')[0]}.xlsx`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      window.URL.revokeObjectURL(urlBlob);
      mostrarAlerta('Reporte de estadísticas generado exitosamente', 'exito');
    } else {
      const error = await respuesta.json().catch(() => ({ mensaje: 'Error desconocido' }));
      mostrarAlerta(error.mensaje || 'Error al generar reporte', 'error');
    }
  } catch (error) {
    console.error('Error al generar reporte:', error);
    mostrarAlerta('Error al generar reporte de estadísticas', 'error');
  }
}

/**
 * Reporte de Estadísticas de Stock - PDF
 */
async function generarReporteEstadisticasPDF() {
  try {
    mostrarAlerta('Generando reporte de estadísticas PDF...', 'info');
    const respuesta = await fetch('/api/reportes/estadisticas-stock/pdf');
    
    if (respuesta.ok) {
      const blob = await respuesta.blob();
      if (blob.type !== 'application/pdf') {
        console.error('El archivo recibido no es un PDF:', blob.type);
        mostrarAlerta('Error: El servidor no devolvió un PDF válido', 'error');
        return;
      }
      const urlBlob = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = urlBlob;
      a.download = `estadisticas_stock_${new Date().toISOString().split('T')[0]}.pdf`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      window.URL.revokeObjectURL(urlBlob);
      mostrarAlerta('Reporte de estadísticas PDF generado exitosamente', 'exito');
    } else {
      const error = await respuesta.json().catch(() => ({ mensaje: 'Error desconocido' }));
      mostrarAlerta(error.mensaje || 'Error al generar reporte', 'error');
    }
  } catch (error) {
    console.error('Error al generar reporte PDF:', error);
    mostrarAlerta('Error al generar reporte de estadísticas', 'error');
  }
}

// Mensaje consola
console.log('%c🧁 Pastelería Don Pepe - Sistema de Inventario v2.0', 'color: #ff6b6b; font-size: 16px; font-weight: bold;');
console.log('%cSistema cargado correctamente', 'color: #51cf66; font-size: 12px;');