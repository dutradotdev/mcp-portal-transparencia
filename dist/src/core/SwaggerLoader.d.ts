import { OpenAPI } from 'openapi-types';
import { Logger } from '@/logging/Logger';
export declare class SwaggerLoader {
    private specUrl;
    private cachedSpec;
    private logger;
    private authHeaders?;
    constructor(specUrl: string | undefined, logger: Logger, authHeaders?: Record<string, string>);
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
//# sourceMappingURL=SwaggerLoader.d.ts.map