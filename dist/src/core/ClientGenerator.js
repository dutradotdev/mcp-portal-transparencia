import * as fs from 'fs';
import * as path from 'path';
import Handlebars from 'handlebars';
/**
 * ClientGenerator class that automatically generates TypeScript client classes
 * for each endpoint in the Portal da Transparência API based on the Swagger specification.
 */
export class ClientGenerator {
    constructor(spec, outputDir = './src/clients', logger, options = {}) {
        this.spec = spec;
        this.outputDir = outputDir;
        this.logger = logger;
        this.options = {
            includeTypes: true,
            includeJsDoc: true,
            ...options,
        };
    }
    /**
     * Generate TypeScript client classes for all endpoints in the Swagger specification
     */
    async generateClients() {
        const generatedFiles = [];
        try {
            // Ensure output directory exists
            if (!fs.existsSync(this.outputDir)) {
                fs.mkdirSync(this.outputDir, { recursive: true });
            }
            // Load template
            const templateSource = this.getClientTemplate();
            const template = Handlebars.compile(templateSource);
            // Register Handlebars helpers
            this.registerHandlebarsHelpers();
            // Group endpoints by tag
            const endpointsByTag = this.groupEndpointsByTag();
            // Generate client for each tag
            for (const [tag, endpoints] of Object.entries(endpointsByTag)) {
                const clientName = this.formatClientName(tag);
                const fileName = `${this.kebabCase(tag)}.ts`;
                const filePath = path.join(this.outputDir, fileName);
                const clientCode = template({
                    clientName,
                    endpoints,
                    imports: this.generateImports(endpoints),
                    interfaces: this.generateInterfaces(endpoints),
                    baseUrl: this.getBaseUrl(),
                    includeTypes: this.options.includeTypes,
                    includeJsDoc: this.options.includeJsDoc,
                });
                fs.writeFileSync(filePath, clientCode);
                generatedFiles.push(filePath);
                this.logger.info(`Generated client for ${tag}`, {
                    filePath,
                    endpointCount: endpoints.length,
                });
            }
            // Generate index file
            this.generateIndexFile(Object.keys(endpointsByTag));
            // Generate types file if enabled
            if (this.options.includeTypes) {
                this.generateTypesFile();
            }
            return generatedFiles;
        }
        catch (error) {
            this.logger.error('Failed to generate clients', {
                error: error instanceof Error ? error.message : error,
            });
            throw new Error(`Client generation failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
        }
    }
    /**
     * Group endpoints by their OpenAPI tags
     */
    groupEndpointsByTag() {
        const endpointsByTag = {};
        if (!this.spec.paths) {
            this.logger.warn('No paths found in OpenAPI specification');
            return endpointsByTag;
        }
        // Process paths and operations
        for (const [pathString, pathItem] of Object.entries(this.spec.paths)) {
            if (!pathItem)
                continue;
            for (const [method, operation] of Object.entries(pathItem)) {
                if (!operation || typeof operation !== 'object' || !('operationId' in operation))
                    continue;
                // Type assertion for OpenAPI operation object
                const op = operation;
                const tag = op.tags?.[0] || 'Default';
                if (!endpointsByTag[tag]) {
                    endpointsByTag[tag] = [];
                }
                const endpointInfo = {
                    path: pathString,
                    method: method.toUpperCase(),
                    operationId: op.operationId || `${method}${this.formatClientName(pathString)}`,
                    summary: op.summary,
                    description: op.description,
                    parameters: op.parameters,
                    requestBody: op.requestBody,
                    responses: op.responses,
                    pathParams: this.extractPathParams(pathString),
                    queryParams: this.extractQueryParams(op.parameters),
                    hasRequestBody: !!op.requestBody,
                    responseType: this.inferResponseType(op.responses),
                };
                endpointsByTag[tag].push(endpointInfo);
            }
        }
        return endpointsByTag;
    }
    /**
     * Extract path parameters from a path string
     */
    extractPathParams(pathString) {
        const matches = pathString.match(/\{([^}]+)\}/g);
        return matches ? matches.map(match => match.slice(1, -1)) : [];
    }
    /**
     * Extract query parameters from operation parameters
     */
    extractQueryParams(parameters) {
        if (!parameters)
            return [];
        return parameters.filter(param => param.in === 'query').map(param => param.name);
    }
    /**
     * Infer response type from operation responses
     */
    inferResponseType(responses) {
        if (!responses)
            return 'any';
        // Try to get success response (200, 201, etc.)
        const successResponse = responses['200'] || responses['201'] || responses['default'];
        if (successResponse?.content?.['application/json']?.schema) {
            return 'any'; // For now, we'll use 'any' - this could be enhanced with proper type generation
        }
        return 'any';
    }
    /**
     * Format a string into a proper TypeScript class name
     */
    formatClientName(str) {
        return (str
            .split(/[-_\s/{}]/)
            .map(part => part.charAt(0).toUpperCase() + part.slice(1))
            .join('')
            .replace(/[^a-zA-Z0-9]/g, '') + 'Client');
    }
    /**
     * Convert a string to kebab-case
     */
    kebabCase(str) {
        return str
            .replace(/([a-z])([A-Z])/g, '$1-$2')
            .replace(/[\s_]+/g, '-')
            .toLowerCase();
    }
    /**
     * Generate TypeScript imports for the client
     */
    generateImports(_endpoints) {
        const imports = [
            "import axios, { AxiosInstance, AxiosResponse } from 'axios';",
            "import { Authentication } from '@/core/Authentication';",
            "import { Logger } from '@/logging/Logger';",
        ];
        if (this.options.includeTypes) {
            imports.push("import * as Types from './types';");
        }
        return imports.join('\n');
    }
    /**
     * Generate TypeScript interfaces for request/response objects
     */
    generateInterfaces(endpoints) {
        if (!this.options.includeTypes)
            return '';
        const interfaces = [];
        // Generate parameter interfaces for each endpoint
        endpoints.forEach(endpoint => {
            if (endpoint.pathParams.length > 0 || endpoint.queryParams.length > 0) {
                const interfaceName = `${this.capitalize(endpoint.operationId)}Params`;
                const properties = [];
                endpoint.pathParams.forEach(param => {
                    properties.push(`  ${param}: string;`);
                });
                endpoint.queryParams.forEach(param => {
                    properties.push(`  ${param}?: string;`);
                });
                interfaces.push(`
export interface ${interfaceName} {
${properties.join('\n')}
}`);
            }
        });
        return interfaces.join('\n');
    }
    /**
     * Capitalize first letter of a string
     */
    capitalize(str) {
        return str.charAt(0).toUpperCase() + str.slice(1);
    }
    /**
     * Get base URL from the OpenAPI specification
     */
    getBaseUrl() {
        const spec = this.spec;
        if (spec.servers && spec.servers.length > 0) {
            return spec.servers[0].url;
        }
        return 'https://api.portaldatransparencia.gov.br';
    }
    /**
     * Generate the index file that exports all clients
     */
    generateIndexFile(tags) {
        const indexPath = path.join(this.outputDir, 'index.ts');
        const exports = tags
            .map(tag => {
            const fileName = this.kebabCase(tag);
            const clientName = this.formatClientName(tag);
            return `export { ${clientName} } from './${fileName}';`;
        })
            .join('\n');
        let content = exports;
        if (this.options.includeTypes) {
            content = `export * from './types';\n\n${content}`;
        }
        fs.writeFileSync(indexPath, content);
        this.logger.info('Generated index file', { path: indexPath });
    }
    /**
     * Generate a types file with common interfaces
     */
    generateTypesFile() {
        const typesPath = path.join(this.outputDir, 'types.ts');
        const typesContent = `
/**
 * Common types for Portal da Transparência API clients
 */

export interface ApiResponse<T = any> {
  data: T;
  status: number;
  statusText: string;
  headers: any;
}

export interface PaginatedResponse<T = any> {
  data: T[];
  total: number;
  page: number;
  pageSize: number;
}

export interface ApiError {
  message: string;
  status?: number;
  code?: string;
}

export interface RequestConfig {
  timeout?: number;
  headers?: Record<string, string>;
}
`;
        fs.writeFileSync(typesPath, typesContent);
        this.logger.info('Generated types file', { path: typesPath });
    }
    /**
     * Register Handlebars helpers for template generation
     */
    registerHandlebarsHelpers() {
        Handlebars.registerHelper('capitalize', (str) => {
            return this.capitalize(str);
        });
        Handlebars.registerHelper('camelCase', (str) => {
            return str.replace(/[-_\s]+(.)?/g, (_, char) => (char ? char.toUpperCase() : ''));
        });
        Handlebars.registerHelper('eq', (a, b) => {
            return a === b;
        });
        Handlebars.registerHelper('hasParams', (endpoint) => {
            return endpoint.pathParams.length > 0 || endpoint.queryParams.length > 0;
        });
    }
    /**
     * Get the Handlebars template for client generation
     */
    getClientTemplate() {
        return `{{{imports}}}

{{#if includeJsDoc}}
/**
 * {{clientName}} - Auto-generated client for Portal da Transparência API
 * Base URL: {{baseUrl}}
 */
{{/if}}
export class {{clientName}} {
  private axiosInstance: AxiosInstance;
  private auth: Authentication;
  private logger: Logger;

  constructor(auth: Authentication, logger: Logger, baseURL: string = '{{baseUrl}}') {
    this.auth = auth;
    this.logger = logger;
    this.axiosInstance = axios.create({
      baseURL,
      timeout: 30000,
      headers: {
        'Content-Type': 'application/json',
        'Accept': 'application/json'
      }
    });

    // Add request interceptor for authentication
    this.axiosInstance.interceptors.request.use(
      (config) => {
        const authHeaders = this.auth.getAuthHeaders();
        Object.assign(config.headers, authHeaders);
        return config;
      },
      (error) => {
        this.logger.error('Request interceptor error', { error });
        return Promise.reject(error);
      }
    );

    // Add response interceptor for logging
    this.axiosInstance.interceptors.response.use(
      (response) => {
        this.logger.info('API request successful', {
          method: response.config.method,
          url: response.config.url,
          status: response.status
        });
        return response;
      },
      (error) => {
        this.logger.error('API request failed', {
          method: error.config?.method,
          url: error.config?.url,
          status: error.response?.status,
          message: error.message
        });
        return Promise.reject(error);
      }
    );
  }

{{#each endpoints}}
{{#if ../includeJsDoc}}
  /**
   * {{#if summary}}{{summary}}{{else}}{{operationId}}{{/if}}
   {{#if description}}* {{description}}{{/if}}
   {{#if pathParams}}* @param pathParams - Path parameters: {{#each pathParams}}{{this}}{{#unless @last}}, {{/unless}}{{/each}}{{/if}}
   {{#if queryParams}}* @param queryParams - Query parameters: {{#each queryParams}}{{this}}{{#unless @last}}, {{/unless}}{{/each}}{{/if}}
   {{#if hasRequestBody}}* @param data - Request body{{/if}}
   * @returns Promise<AxiosResponse<{{responseType}}>>
   */
{{/if}}
  async {{camelCase operationId}}({{#if (hasParams this)}}params: {
    {{#each pathParams}}{{this}}: string;{{/each}}
    {{#each queryParams}}{{this}}?: string;{{/each}}
  }{{#if hasRequestBody}}, data?: any{{/if}}{{else}}{{#if hasRequestBody}}data?: any{{/if}}{{/if}}): Promise<AxiosResponse<{{responseType}}>> {
    const path = '{{path}}'{{#each pathParams}}.replace('{{{this}}}', encodeURIComponent(params.{{this}})){{/each}};
    
    {{#if queryParams}}
    const queryParams = new URLSearchParams();
    {{#each queryParams}}
    if (params.{{this}} !== undefined) {
      queryParams.append('{{this}}', params.{{this}});
    }
    {{/each}}
    const url = queryParams.toString() ? \`\${path}?\${queryParams.toString()}\` : path;
    {{else}}
    const url = path;
    {{/if}}

    return this.axiosInstance.{{#eq method "GET"}}get{{/eq}}{{#eq method "POST"}}post{{/eq}}{{#eq method "PUT"}}put{{/eq}}{{#eq method "DELETE"}}delete{{/eq}}{{#eq method "PATCH"}}patch{{/eq}}(url{{#if hasRequestBody}}, data{{/if}});
  }

{{/each}}
}

{{#if includeTypes}}
{{{interfaces}}}
{{/if}}
`;
    }
}
//# sourceMappingURL=ClientGenerator.js.map