/**
 * Backend Configuration — loads from .env with defaults.
 */
require('dotenv').config()
require('dotenv').config({ path: require('path').join(__dirname, '..', '.env') })

module.exports = {
  db: {
    host: process.env.DB_HOST || 'localhost',
    port: parseInt(process.env.DB_PORT || '3306'),
    user: process.env.DB_USER || 'root',
    password: process.env.DB_PASSWORD || '',
    database: process.env.DB_NAME || 'f1',
    connectionLimit: parseInt(process.env.DB_POOL_SIZE || '10'),
    waitForConnections: true,
    queueLimit: 0,
  },
  server: {
    port: parseInt(process.env.PORT || '3001'),
  },
  cache: {
    ttlSeconds: parseInt(process.env.CACHE_TTL_SECONDS || '30'),
  },
  logging: {
    level: process.env.LOG_LEVEL || 'info',
  },
}
