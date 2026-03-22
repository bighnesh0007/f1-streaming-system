/**
 * Structured Logger — Winston with JSON format.
 */
const { createLogger, format, transports } = require('winston')
const config = require('./config')

const logger = createLogger({
  level: config.logging.level,
  format: format.combine(
    format.timestamp({ format: 'YYYY-MM-DD HH:mm:ss' }),
    format.errors({ stack: true }),
    format.json()
  ),
  defaultMeta: { service: 'f1-backend' },
  transports: [
    new transports.Console({
      format: format.combine(
        format.colorize(),
        format.printf(({ timestamp, level, message, service, ...meta }) => {
          const metaStr = Object.keys(meta).length ? ` ${JSON.stringify(meta)}` : ''
          return `${timestamp} [${service}] ${level}: ${message}${metaStr}`
        })
      ),
    }),
    new transports.File({
      filename: 'logs/error.log',
      level: 'error',
      maxsize: 5242880, // 5MB
      maxFiles: 5,
    }),
    new transports.File({
      filename: 'logs/combined.log',
      maxsize: 5242880,
      maxFiles: 5,
    }),
  ],
})

module.exports = logger
