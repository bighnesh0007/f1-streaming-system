/**
 * Database Connection Pool — promise-based with env config.
 */
const mysql = require('mysql2')
const config = require('./config')
const logger = require('./logger')

const pool = mysql.createPool(config.db)

// Promisify for async/await
const promisePool = pool.promise()

// Test connection on startup
pool.getConnection((err, connection) => {
  if (err) {
    logger.error('MySQL connection failed', { error: err.message })
  } else {
    logger.info('MySQL connection pool established', {
      host: config.db.host,
      database: config.db.database,
      poolSize: config.db.connectionLimit,
    })
    connection.release()
  }
})

module.exports = promisePool