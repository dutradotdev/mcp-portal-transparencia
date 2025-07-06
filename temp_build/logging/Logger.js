"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.Logger = void 0;
var winston_1 = require("winston");
var Logger = /** @class */ (function () {
    function Logger(level) {
        if (level === void 0) { level = 'info'; }
        this.logger = winston_1.default.createLogger({
            level: level,
            format: winston_1.default.format.combine(winston_1.default.format.timestamp(), winston_1.default.format.errors({ stack: true }), winston_1.default.format.json()),
            transports: [
                new winston_1.default.transports.Console({
                    format: winston_1.default.format.combine(winston_1.default.format.colorize(), winston_1.default.format.simple()),
                }),
            ],
        });
    }
    Logger.prototype.info = function (message, context) {
        this.logger.info(message, context);
    };
    Logger.prototype.error = function (message, context) {
        this.logger.error(message, context);
    };
    Logger.prototype.warn = function (message, context) {
        this.logger.warn(message, context);
    };
    Logger.prototype.debug = function (message, context) {
        this.logger.debug(message, context);
    };
    return Logger;
}());
exports.Logger = Logger;
