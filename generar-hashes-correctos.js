const bcrypt = require('bcryptjs');

async function generarHashesCorrectos() {
  console.log('\n╔════════════════════════════════════════════╗');
  console.log('║  GENERADOR DE HASHES - PASTELERÍA DON PEPE ║');
  console.log('╚════════════════════════════════════════════╝\n');
  
  // Generar hash para admin123
  const hashAdmin = await bcrypt.hash('admin123', 10);
  console.log('✅ Hash para contraseña "admin123":');
  console.log(hashAdmin);
  console.log('');
  
  // Generar hash para almacen123
  const hashAlmacenero = await bcrypt.hash('almacen123', 10);
  console.log('✅ Hash para contraseña "almacen123":');
  console.log(hashAlmacenero);
  console.log('');
  
  console.log('═══════════════════════════════════════════════════');
  console.log('📋 COMANDOS SQL PARA ACTUALIZAR EN MYSQL WORKBENCH:');
  console.log('═══════════════════════════════════════════════════\n');
  
  console.log('USE pasteleria_don_pepe;\n');
  console.log(`UPDATE usuarios SET contrasena = '${hashAdmin}' WHERE nombre_usuario = 'admin';\n`);
  console.log(`UPDATE usuarios SET contrasena = '${hashAlmacenero}' WHERE nombre_usuario = 'almacenero';\n`);
  console.log('SELECT nombre_usuario, LEFT(contrasena, 40) as hash_preview, rol FROM usuarios;\n');
  
  console.log('═══════════════════════════════════════════════════');
  console.log('🔍 VERIFICACIÓN DE HASHES ACTUALES EN BD:');
  console.log('═══════════════════════════════════════════════════\n');
  
  // Verificar hashes actuales
  const hashBDActualAdmin = '$2a$10$CwTycUXWue0Thq9StjUM0uJ8fzNqzVz3vvZKnW8sJ/FqCE0P4QNDK';
  const hashBDActualAlmacen = '$2a$10$N9qo8uLOickgx2ZMRZoMye6FQ/TWhNZ7MNZfPZhCvIjzH1p9K8zJq';
  
  const validAdmin = await bcrypt.compare('admin123', hashBDActualAdmin);
  const validAlmacen = await bcrypt.compare('almacen123', hashBDActualAlmacen);
  
  console.log(`Hash BD actual ADMIN válido para "admin123": ${validAdmin ? '✅ SÍ' : '❌ NO'}`);
  console.log(`Hash BD actual ALMACENERO válido para "almacen123": ${validAlmacen ? '✅ SÍ' : '❌ NO'}`);
  
  if (!validAdmin || !validAlmacen) {
    console.log('\n  LOS HASHES ACTUALES SON INCORRECTOS');
    console.log('  DEBES EJECUTAR LOS COMANDOS SQL DE ARRIBA\n');
  } else {
    console.log('\n Los hashes actuales son correctos\n');
  }
}

generarHashesCorrectos();