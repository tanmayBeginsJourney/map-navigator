const pino = require('pino');

// Simple logger for scripts - uses pretty printing for readability
const logger = pino({
  level: process.env.LOG_LEVEL || 'info',
  transport: {
    target: 'pino-pretty',
    options: {
      colorize: true,
      translateTime: 'SYS:standard',
      ignore: 'pid,hostname',
    },
  },
  base: {
    service: 'campus-navigation-scripts',
    environment: process.env.NODE_ENV || 'development',
  },
});

module.exports = logger; 