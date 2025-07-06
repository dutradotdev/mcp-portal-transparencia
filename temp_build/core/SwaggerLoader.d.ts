import { OpenAPI } from 'openapi-types';
import { Logger } from '@/logging/Logger';
export declare class SwaggerLoader {
    private specUrl;
    private cachedSpec;
    private logger;
    constructor(specUrl: string, logger: Logger);
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
