import { Logger } from '@/logging/Logger';
export interface AuthConfig {
    apiKey?: string;
    headerName?: string;
    testEndpoint?: string;
}
export interface AuthHeaders {
    [key: string]: string;
}
export declare class Authentication {
    private apiKey;
    private headerName;
    private testEndpoint;
    private logger;
    constructor(config: AuthConfig | undefined, logger: Logger);
    /**
     * Set the API key for authentication
     */
    setApiKey(apiKey: string): void;
    /**
     * Get authentication headers for API requests
     */
    getAuthHeaders(overrideApiKey?: string): AuthHeaders;
    /**
     * Check if an API key is configured
     */
    hasApiKey(): boolean;
    /**
     * Validate API key format (basic validation)
     */
    validateApiKey(apiKey?: string): boolean;
    /**
     * Test API key validity by making a request to the API
     */
    testApiKey(apiKey?: string): Promise<boolean>;
    /**
     * Clear the stored API key
     */
    clearApiKey(): void;
    /**
     * Get the current header name used for authentication
     */
    getHeaderName(): string;
    /**
     * Set a new header name for authentication
     */
    setHeaderName(headerName: string): void;
    /**
     * Get masked API key for logging purposes (shows only first and last 4 characters)
     */
    getMaskedApiKey(): string | null;
}
//# sourceMappingURL=Authentication.d.ts.map