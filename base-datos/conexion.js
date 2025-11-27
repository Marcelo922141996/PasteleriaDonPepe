/**
 * Configuración de conexión a la base de datos MySQL
 * Pastelería Don Pepe - Chiclayo, Perú
 */

const mysql = require('mysql2/promise');
require('dotenv').config();

// Pool de conexiones para mejor rendimiento
const pool = mysql.createPool({
  host: process.env.DB_HOST || 'localhost',
  port: process.env.DB_PORT || 3306,
  user: process.env.DB_USER || 'root',
  password: process.env.DB_PASSWORD || 'Marcelo0303+',
  database: process.env.DB_NAME || 'pasteleria_don_pepe',
  waitForConnections: true,
  connectionLimit: 10,
  queueLimit: 0,
  enableKeepAlive: true,
  keepAliveInitialDelay: 0
});

// Verificar conexión inicial
pool.getConnection()
  .then(connection => {
    console.log('✅ Conexión exitosa a la base de datos MySQL');
    connection.release();
  })
  .catch(err => {
    console.error('❌ Error al conectar con la base de datos:', err.message);
    process.exit(1);
  });

module.exports = pool;