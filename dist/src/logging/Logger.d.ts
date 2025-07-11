export interface LogContext {
    [key: string]: unknown;
}
export declare class Logger {
    private logger;
    constructor(level?: string);
    info(message: string, context?: LogContext): void;
    error(message: string, context?: LogContext): void;
    warn(message: string, context?: LogContext): void;
    debug(message: string, context?: LogContext): void;
}
//# sourceMappingURL=Logger.d.ts.map