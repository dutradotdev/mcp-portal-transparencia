import { OpenAPI } from 'openapi-types';

interface LogContext {
    [key: string]: unknown;
}
declare class Logger {
    private logger;
    constructor(level?: string);
    info(message: string, context?: LogContext): void;
    error(message: string, context?: LogContext): void;
    warn(message: string, context?: LogContext): void;
    debug(message: string, context?: LogContext): void;
}

declare class SwaggerLoader {
    private specUrl;
    private cachedSpec;
    private logger;
    constructor(specUrl: string | undefined, logger: Logger);
    loadSpec(): Promise<OpenAPI.Document>;
    getSpec(): Promise<OpenAPI.Document>;
    detectSpecChanges(newSpecUrl?: string): Promise<boolean>;
    /**
     * Validates the loaded spec for required fields and structure
     */
    validateSpecStructure(spec: OpenAPI.Document): boolean;
    /**
     * Gets basic information about the loaded spec
     */
    getSpecInfo(): {
        title: string;
        version: string;
        pathCount: number;
    } | null;
    /**
     * Clears the cached spec to force reload on next access
     */
    clearCache(): void;
}

/**
 * MCP Portal da Transparência
 * Multi-step Call Planner for the Brazilian Government Transparency Portal API
 *
 * @author Lucas Dutra
 * @version 1.0.0
 */

declare const _default: {
    name: string;
    version: string;
    description: string;
};

export { Logger, SwaggerLoader, _default as default };
