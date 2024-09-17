// logger.js

import winston from 'winston';
import 'winston-daily-rotate-file';
import { LOG_LEVEL, LOG_TO_CONSOLE } from './config.js';
import path from 'path';

const transports = [];

if (LOG_TO_CONSOLE) {
  transports.push(
    new winston.transports.Console({
      level: LOG_LEVEL,
      format: winston.format.combine(
        winston.format.colorize(),
        winston.format.simple()
      ),
    })
  );
}

transports.push(
  new winston.transports.DailyRotateFile({
    level: LOG_LEVEL,
    filename: path.join('logs', 'application-%DATE%.log'),
    datePattern: 'YYYY-MM-DD',
    maxFiles: '14d',
    format: winston.format.combine(
      winston.format.timestamp({ format: 'YYYY-MM-DD HH:mm:ss' }),
      winston.format.printf(info => `${info.timestamp} [${info.level}]: ${info.message}`)
    ),
  })
);

const logger = winston.createLogger({
  level: LOG_LEVEL,
  transports,
});

export default logger;
