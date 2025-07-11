import { OpenAPI } from 'openapi-types';
import { Logger } from '@/logging/Logger';
/**
 * Interface for endpoint information
 */
export interface EndpointInfo {
    path: string;
    method: string;
    operationId: string;
    summary?: string;
    description?: string;
    parameters?: any[];
    requestBody?: any;
    responses?: any;
    pathParams: string[];
    queryParams: string[];
    hasRequestBody: boolean;
    responseType: string;
}
/**
 * Interface for client generation options
 */
export interface ClientGeneratorOptions {
    outputDir?: string;
    templatePath?: string;
    includeTypes?: boolean;
    includeJsDoc?: boolean;
}
/**
 * ClientGenerator class that automatically generates TypeScript client classes
 * for each endpoint in the Portal da Transparência API based on the Swagger specification.
 */
export declare class ClientGenerator {
    private spec;
    private outputDir;
    private logger;
    private options;
    constructor(spec: OpenAPI.Document, outputDir: string | undefined, logger: Logger, options?: ClientGeneratorOptions);
    /**
     * Generate TypeScript client classes for all endpoints in the Swagger specification
     */
    generateClients(): Promise<string[]>;
    /**
     * Group endpoints by their OpenAPI tags
     */
    private groupEndpointsByTag;
    /**
     * Extract path parameters from a path string
     */
    private extractPathParams;
    /**
     * Extract query parameters from operation parameters
     */
    private extractQueryParams;
    /**
     * Infer response type from operation responses
     */
    private inferResponseType;
    /**
     * Format a string into a proper TypeScript class name
     */
    private formatClientName;
    /**
     * Convert a string to kebab-case
     */
    private kebabCase;
    /**
     * Generate TypeScript imports for the client
     */
    private generateImports;
    /**
     * Generate TypeScript interfaces for request/response objects
     */
    private generateInterfaces;
    /**
     * Capitalize first letter of a string
     */
    private capitalize;
    /**
     * Get base URL from the OpenAPI specification
     */
    private getBaseUrl;
    /**
     * Generate the index file that exports all clients
     */
    private generateIndexFile;
    /**
     * Generate a types file with common interfaces
     */
    private generateTypesFile;
    /**
     * Register Handlebars helpers for template generation
     */
    private registerHandlebarsHelpers;
    /**
     * Get the Handlebars template for client generation
     */
    private getClientTemplate;
}
//# sourceMappingURL=ClientGenerator.d.ts.map