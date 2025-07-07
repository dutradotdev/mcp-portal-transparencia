import { Server } from '@modelcontextprotocol/sdk/server/index.js';
import { StdioServerTransport } from '@modelcontextprotocol/sdk/server/stdio.js';
import { CallToolRequestSchema, ListToolsRequestSchema } from '@modelcontextprotocol/sdk/types.js';
import { SwaggerLoader } from './core/SwaggerLoader';
import { Authentication } from './core/Authentication';
import { Logger } from './logging/Logger';
import { OpenAPI } from 'openapi-types';
import * as dotenv from 'dotenv';

// Load environment variables
dotenv.config();

interface MCPTool {
  name: string;
  description: string;
  inputSchema: {
    type: string;
    properties: Record<string, any>;
    required?: string[];
  };
  method: string;
  path: string;
  operation: any;
  category: string;
}

export class MCPPortalServer {
  private server: Server;
  private swaggerLoader: SwaggerLoader;
  private auth: Authentication;
  private logger: Logger;
  private tools: Map<string, MCPTool> = new Map();
  private isInitialized = false;

  constructor() {
    this.logger = new Logger(process.env.LOG_LEVEL || 'info');
    this.server = new Server(
      {
        name: 'portal-transparencia-mcp',
        version: '1.0.0',
      },
      {
        capabilities: {
          tools: {},
        },
      }
    );

    // Initialize with environment variables
    const apiKey = process.env.PORTAL_API_KEY;

    this.swaggerLoader = new SwaggerLoader(
      'https://api.portaldatransparencia.gov.br/swagger-ui/swagger.json',
      this.logger
    );

    this.auth = new Authentication(
      {
        apiKey: apiKey,
        headerName: 'chave-api-portal',
        testEndpoint: 'https://api.portaldatransparencia.gov.br/swagger-ui/swagger.json',
      },
      this.logger
    );

    this.setupRequestHandlers();
  }

  private setupRequestHandlers(): void {
    this.server.setRequestHandler(ListToolsRequestSchema, async () => {
      if (!this.isInitialized) {
        await this.initialize();
      }

      return {
        tools: Array.from(this.tools.values()).map(tool => ({
          name: tool.name,
          description: tool.description,
          inputSchema: tool.inputSchema,
        })),
      };
    });

    this.server.setRequestHandler(CallToolRequestSchema, async request => {
      if (!this.isInitialized) {
        await this.initialize();
      }

      const { name, arguments: args } = request.params;
      const tool = this.tools.get(name);

      if (!tool) {
        throw new Error(`Tool ${name} not found`);
      }

      return await this.executeApiCall(tool, args || {});
    });
  }

  async initialize(): Promise<void> {
    if (this.isInitialized) {
      return;
    }

    try {
      this.logger.info('Initializing MCP Portal da Transparência server...');

      // Load Swagger specification
      const spec = await this.swaggerLoader.loadSpec();

      // Generate tools from specification
      await this.generateToolsFromSpec(spec);

      this.isInitialized = true;
      this.logger.info(`MCP server initialized with ${this.tools.size} tools`);
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : String(error);
      this.logger.error('Failed to initialize MCP server', { error: errorMessage });
      throw error;
    }
  }

  private async generateToolsFromSpec(spec: OpenAPI.Document): Promise<void> {
    this.logger.info('Generating MCP tools from Swagger specification...');

    const paths = spec.paths || {};
    let toolCount = 0;

    for (const [path, pathItem] of Object.entries(paths)) {
      if (!pathItem || typeof pathItem !== 'object') continue;

      for (const [method, operation] of Object.entries(pathItem)) {
        if (typeof operation !== 'object' || !operation || method === 'parameters') continue;

        const toolName = this.generateToolName(operation, method, path);
        const tool = this.createMCPTool(operation, method, path);

        this.tools.set(toolName, tool);
        toolCount++;
      }
    }

    this.logger.info(`Generated ${toolCount} MCP tools`);
  }

  private generateToolName(operation: any, method: string, path: string): string {
    // Use operationId if available, otherwise create from method and path
    if (operation.operationId) {
      return `portal_${operation.operationId}`;
    }

    // Clean path for tool name
    const cleanPath = path
      .replace(/^\/api-de-dados/, '')
      .replace(/[{}]/g, '')
      .replace(/\//g, '_')
      .replace(/[^a-zA-Z0-9_]/g, '')
      .replace(/^_+|_+$/g, '');

    return `portal_${method}_${cleanPath}`;
  }

  private createMCPTool(operation: any, method: string, path: string): MCPTool {
    const toolName = this.generateToolName(operation, method, path);
    const category = this.categorizeEndpoint(path, operation);
    const inputSchema = this.generateInputSchema(operation.parameters || []);

    return {
      name: toolName,
      description: this.createToolDescription(operation, method, path),
      inputSchema,
      method: method.toUpperCase(),
      path,
      operation,
      category,
    };
  }

  private categorizeEndpoint(path: string, operation: any): string {
    const tags = operation.tags || [];
    if (tags.length > 0) {
      return tags[0];
    }

    // Categorize by path
    if (path.includes('servidores')) return 'servidores';
    if (path.includes('contratos')) return 'contratos';
    if (path.includes('convenios')) return 'convenios';
    if (path.includes('viagens')) return 'viagens';
    if (path.includes('cartoes')) return 'cartoes';
    if (path.includes('beneficios')) return 'beneficios';
    if (path.includes('despesas')) return 'despesas';
    if (path.includes('receitas')) return 'receitas';
    if (path.includes('transferencias')) return 'transferencias';
    if (path.includes('licitacoes')) return 'licitacoes';

    return 'geral';
  }

  private createToolDescription(operation: any, method: string, path: string): string {
    const summary = operation.summary || '';
    const description = operation.description || '';
    const category = this.categorizeEndpoint(path, operation);

    let fullDescription = `[${category.toUpperCase()}] `;

    if (summary) {
      fullDescription += summary;
    } else {
      fullDescription += `${method.toUpperCase()} ${path}`;
    }

    if (description && description !== summary) {
      fullDescription += `. ${description}`;
    }

    return fullDescription;
  }

  private generateInputSchema(parameters: any[]): any {
    const properties: Record<string, any> = {};
    const required: string[] = [];

    for (const param of parameters) {
      if (!param.name) continue;

      const paramSchema: any = {
        type: param.schema?.type || 'string',
        description: param.description || `${param.name} parameter`,
      };

      if (param.schema?.enum) {
        paramSchema.enum = param.schema.enum;
      }

      if (param.schema?.format) {
        paramSchema.format = param.schema.format;
      }

      if (param.schema?.pattern) {
        paramSchema.pattern = param.schema.pattern;
      }

      if (param.example !== undefined) {
        paramSchema.example = param.example;
      }

      properties[param.name] = paramSchema;

      if (param.required) {
        required.push(param.name);
      }
    }

    return {
      type: 'object',
      properties,
      required: required.length > 0 ? required : undefined,
    };
  }

  private async executeApiCall(tool: MCPTool, args: Record<string, any>): Promise<any> {
    try {
      this.logger.info(`Executing tool: ${tool.name}`, { args });

      // Build URL with path parameters
      let url = `https://api.portaldatransparencia.gov.br/api-de-dados${tool.path}`;

      // Replace path parameters
      const pathParams = tool.operation.parameters?.filter((p: any) => p.in === 'path') || [];
      for (const param of pathParams) {
        if (args[param.name] !== undefined) {
          url = url.replace(`{${param.name}}`, encodeURIComponent(String(args[param.name])));
        }
      }

      // Build query parameters
      const queryParams = tool.operation.parameters?.filter((p: any) => p.in === 'query') || [];
      const searchParams = new URLSearchParams();

      for (const param of queryParams) {
        if (args[param.name] !== undefined) {
          searchParams.append(param.name, String(args[param.name]));
        }
      }

      if (searchParams.toString()) {
        url += `?${searchParams.toString()}`;
      }

      // Prepare headers
      const headers: Record<string, string> = {
        Accept: 'application/json',
        'Content-Type': 'application/json',
        ...this.auth.getAuthHeaders(),
      };

      this.logger.debug(`Making API call to: ${url}`);

      // Make the API call
      const response = await fetch(url, {
        method: tool.method,
        headers,
      });

      if (!response.ok) {
        const errorText = await response.text();
        const errorMessage = this.createUserFriendlyError(response.status, errorText, tool);
        throw new Error(errorMessage);
      }

      const data = await response.json();

      return {
        content: [
          {
            type: 'text',
            text: JSON.stringify(
              {
                success: true,
                data,
                metadata: {
                  endpoint: `${tool.method} ${tool.path}`,
                  category: tool.category,
                  status: response.status,
                  timestamp: new Date().toISOString(),
                },
              },
              null,
              2
            ),
          },
        ],
      };
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : String(error);
      this.logger.error('API call failed', {
        tool: tool.name,
        error: errorMessage,
        args,
      });

      return {
        content: [
          {
            type: 'text',
            text: JSON.stringify(
              {
                success: false,
                error: errorMessage,
                endpoint: `${tool.method} ${tool.path}`,
                category: tool.category,
                timestamp: new Date().toISOString(),
              },
              null,
              2
            ),
          },
        ],
        isError: true,
      };
    }
  }

  private createUserFriendlyError(status: number, errorText: string, tool: MCPTool): string {
    switch (status) {
      case 400:
        return `Requisição inválida para ${tool.category}: Verifique os parâmetros fornecidos. ${errorText}`;
      case 401:
        return `Erro de autenticação: Chave da API não fornecida ou inválida. Configure PORTAL_API_KEY no ambiente.`;
      case 403:
        return `Acesso negado: Sua chave da API não tem permissão para acessar este recurso.`;
      case 404:
        return `Recurso não encontrado: O endpoint ou recurso solicitado não existe.`;
      case 429:
        return `Limite de taxa excedido: Muitas requisições. Aguarde um momento antes de tentar novamente.`;
      case 500:
        return `Erro interno do servidor: Problema temporário no Portal da Transparência.`;
      default:
        return `Erro HTTP ${status}: ${errorText}`;
    }
  }

  async start(): Promise<void> {
    const transport = new StdioServerTransport();
    await this.server.connect(transport);
    this.logger.info('MCP Portal da Transparência server started');
  }
}

// Export for use in CLI
export default MCPPortalServer;
