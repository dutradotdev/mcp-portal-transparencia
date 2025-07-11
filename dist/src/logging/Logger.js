import winston from 'winston';
export class Logger {
    constructor(level = 'info') {
        this.logger = winston.createLogger({
            level,
            format: winston.format.combine(winston.format.timestamp(), winston.format.errors({ stack: true }), winston.format.json()),
            transports: [
                new winston.transports.Console({
                    stderrLevels: ['error', 'warn', 'info', 'debug'], // Force all levels to stderr
                    format: winston.format.combine(winston.format.colorize(), winston.format.simple()),
                }),
            ],
        });
    }
    info(message, context) {
        this.logger.info(message, context);
    }
    error(message, context) {
        this.logger.error(message, context);
    }
    warn(message, context) {
        this.logger.warn(message, context);
    }
    debug(message, context) {
        this.logger.debug(message, context);
    }
}
//# sourceMappingURL=Logger.js.map