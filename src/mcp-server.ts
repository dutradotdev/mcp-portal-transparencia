import { Server } from '@modelcontextprotocol/sdk/server/index.js';
import { StdioServerTransport } from '@modelcontextprotocol/sdk/server/stdio.js';
import {
  CallToolRequestSchema,
  ListToolsRequestSchema,
  InitializeRequestSchema,
} from '@modelcontextprotocol/sdk/types.js';
import { SwaggerLoader } from './core/SwaggerLoader.js';
import { Authentication } from './core/Authentication.js';
import { Logger } from './logging/Logger.js';
import { OpenAPI } from 'openapi-types';

export class MCPPortalServer {
  private server: Server;
  private swaggerLoader: SwaggerLoader;
  private auth: Authentication;
  private logger: Logger;
  private tools: Map<string, any> = new Map();
  private spec: OpenAPI.Document | null = null;

  constructor() {
    // Configure logger
    const logLevel = process.env.LOG_LEVEL || 'info';
    this.logger = new Logger(logLevel);

    // Initialize server
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

    // Configure authentication
    const apiKey = process.env.PORTAL_API_KEY;
    const authConfig = apiKey ? { apiKey } : {};
    this.auth = new Authentication(authConfig, this.logger);

    // Initialize components with auth headers if API key is available
    const authHeaders = apiKey ? this.auth.getAuthHeaders() : undefined;
    this.swaggerLoader = new SwaggerLoader(
      'https://api.portaldatransparencia.gov.br/v3/api-docs',
      this.logger,
      authHeaders
    );

    this.setupHandlers();
  }

  private setupHandlers(): void {
    // Handle initialization request
    this.server.setRequestHandler(InitializeRequestSchema, async _request => {
      return {
        protocolVersion: '2024-11-05',
        capabilities: {
          tools: {},
        },
        serverInfo: {
          name: 'portal-transparencia-mcp',
          version: '1.0.0',
        },
      };
    });

    this.server.setRequestHandler(ListToolsRequestSchema, async () => {
      const tools = Array.from(this.tools.values());

      // Add API key validation tool as first tool
      const validationTool = {
        name: 'portal_check_api_key',
        description:
          '⚠️ VERIFICAR API KEY - Verifica se a API key do Portal da Transparência está configurada. IMPORTANTE: Usuário precisa configurar PORTAL_API_KEY nas variáveis de ambiente.',
        inputSchema: {
          type: 'object',
          properties: {},
          required: [],
        },
      };

      return {
        tools: [validationTool, ...tools],
      };
    });

    this.server.setRequestHandler(CallToolRequestSchema, async request => {
      const { name, arguments: args } = request.params;

      // Handle API key validation tool
      if (name === 'portal_check_api_key') {
        const apiKey = process.env.PORTAL_API_KEY;
        if (!apiKey) {
          return {
            content: [
              {
                type: 'text',
                text:
                  '❌ API KEY NÃO CONFIGURADA\n\n' +
                  'Para usar o Portal da Transparência, você precisa:\n\n' +
                  '1. Obter uma API key gratuita em: https://api.portaldatransparencia.gov.br/api-de-dados\n' +
                  '2. Configurar a variável de ambiente PORTAL_API_KEY\n' +
                  '3. Reiniciar o servidor MCP\n\n' +
                  'Exemplo de configuração:\n' +
                  'PORTAL_API_KEY=sua_chave_aqui',
              },
            ],
          };
        }

        return {
          content: [
            {
              type: 'text',
              text:
                '✅ API KEY CONFIGURADA\n\n' +
                'A API key está configurada corretamente. Você pode usar todas as ferramentas do Portal da Transparência.',
            },
          ],
        };
      }

      // Handle other tools
      if (!this.tools.has(name)) {
        throw new Error(`Ferramenta não encontrada: ${name}`);
      }

      const tool = this.tools.get(name);
      return await this.executeApiCall(tool.method, tool.path, tool.operation, args || {});
    });
  }

  async initialize(): Promise<void> {
    try {
      this.logger.info('Iniciando carregamento da especificação Swagger...');

      // Load spec
      this.spec = await this.swaggerLoader.loadSpec();

      this.logger.info('Especificação carregada, gerando ferramentas MCP...');
      this.generateMCPTools();

      this.logger.info(`Servidor MCP inicializado com ${this.tools.size} ferramentas`);
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : String(error);
      this.logger.error('Falha ao inicializar servidor MCP', { error: errorMessage });
      throw error;
    }
  }

  private generateMCPTools(): void {
    if (!this.spec?.paths) {
      this.logger.warn('Nenhum path encontrado na especificação');
      return;
    }

    for (const [path, pathItem] of Object.entries(this.spec.paths)) {
      if (!pathItem) continue;

      for (const [method, operation] of Object.entries(pathItem)) {
        if (typeof operation !== 'object' || !operation || Array.isArray(operation)) continue;

        const operationObj = operation as OpenAPI.Operation;
        if (!operationObj.operationId) continue;

        const toolName = this.generateToolName(operationObj.operationId, method, path);
        const tool = this.createMCPTool(operationObj, method, path);
        this.tools.set(toolName, tool);
      }
    }
  }

  private generateToolName(operationId: string, _method: string, path: string): string {
    // Generate descriptive tool names with portal_ prefix
    const cleanOperationId = operationId
      .replace(/UsingGET\d*|UsingPOST\d*|UsingPUT\d*|UsingDELETE\d*/gi, '')
      .replace(/Controller/gi, '')
      .toLowerCase();

    // Extract category from path
    const pathParts = path.split('/').filter(part => part && !part.startsWith('{'));
    const category = pathParts[pathParts.length - 1] || 'geral';

    return `portal_${category}_${cleanOperationId}`.replace(/[^a-z0-9_]/g, '_');
  }

  private createMCPTool(operation: OpenAPI.Operation, method: string, path: string) {
    const properties: Record<string, any> = {};
    const required: string[] = [];

    // Process parameters
    if (operation.parameters) {
      for (const param of operation.parameters) {
        if ('$ref' in param) continue;

        const parameter = param as any; // Simplified type handling
        if (parameter.name && !properties[parameter.name]) {
          properties[parameter.name] = {
            type: this.mapOpenAPITypeToJSON(parameter.schema?.type || 'string'),
            description: parameter.description || `Parâmetro ${parameter.name}`,
          };

          if (parameter.required) {
            required.push(parameter.name);
          }
        }
      }
    }

    // Process request body if available
    const requestBody = (operation as any).requestBody;
    if (requestBody && !('$ref' in requestBody)) {
      const content = requestBody.content?.['application/json'];
      if (content?.schema && !('$ref' in content.schema)) {
        const schema = content.schema as any;
        if (schema.properties) {
          for (const [propName, propSchema] of Object.entries(schema.properties)) {
            if (propSchema && typeof propSchema === 'object' && !('$ref' in propSchema)) {
              const prop = propSchema as any;
              properties[propName] = {
                type: this.mapOpenAPITypeToJSON(prop.type || 'string'),
                description: prop.description || `Propriedade ${propName}`,
              };
            }
          }
        }
      }
    }

    // Category detection
    const pathParts = path.split('/').filter(part => part && !part.startsWith('{'));
    const category = pathParts[pathParts.length - 1] || 'geral';

    return {
      name: this.generateToolName(operation.operationId!, method, path),
      description: `[${category.toUpperCase()}] ${operation.summary || operation.description || 'Operação da API Portal da Transparência'}`,
      inputSchema: {
        type: 'object',
        properties,
        required,
      },
      method: method.toUpperCase(),
      path,
      operation,
      category,
    };
  }

  private mapOpenAPITypeToJSON(type: string | undefined): string {
    switch (type) {
      case 'integer':
        return 'number';
      case 'number':
        return 'number';
      case 'boolean':
        return 'boolean';
      case 'array':
        return 'array';
      case 'object':
        return 'object';
      default:
        return 'string';
    }
  }

  private async executeApiCall(
    method: string,
    path: string,
    _operation: any,
    args: Record<string, any>
  ) {
    try {
      // Make API call with authentication
      const headers = this.auth.getAuthHeaders();

      // Build URL with path parameters
      let finalPath = path;
      for (const [key, value] of Object.entries(args)) {
        if (finalPath.includes(`{${key}}`)) {
          finalPath = finalPath.replace(`{${key}}`, encodeURIComponent(String(value)));
          delete args[key];
        }
      }

      const baseUrl = 'https://api.portaldatransparencia.gov.br';
      const fullUrl = `${baseUrl}${finalPath}`;

      // Handle query parameters
      const queryParams = new URLSearchParams();
      for (const [key, value] of Object.entries(args)) {
        if (value !== undefined && value !== null) {
          queryParams.append(key, String(value));
        }
      }

      const finalUrl = queryParams.toString() ? `${fullUrl}?${queryParams}` : fullUrl;

      this.logger.info('Executando chamada da API', {
        method,
        url: finalUrl,
        headers: Object.keys(headers),
      });

      // Make the actual API call using fetch
      const response = await fetch(finalUrl, {
        method,
        headers: {
          ...headers,
          'Content-Type': 'application/json',
        },
      });

      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(`HTTP ${response.status}: ${errorText}`);
      }

      const data = await response.json();

      this.logger.info('Chamada da API executada com sucesso', {
        method,
        path,
        status: response.status,
      });

      return {
        content: [
          {
            type: 'text',
            text: JSON.stringify(data, null, 2),
          },
        ],
      };
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : String(error);
      this.logger.error('Falha na execução da API', {
        error: errorMessage,
        method,
        path,
        args,
      });

      return {
        content: [
          {
            type: 'text',
            text:
              `❌ ERRO: ${errorMessage}\n\n` +
              `🔗 Endpoint: ${method.toUpperCase()} ${path}\n` +
              `⏰ Timestamp: ${new Date().toISOString()}\n\n` +
              'Se o problema persistir, verifique:\n' +
              '• Sua conexão com a internet\n' +
              '• Se a API key está configurada corretamente\n' +
              '• Se os parâmetros estão corretos',
          },
        ],
      };
    }
  }

  async start(): Promise<void> {
    try {
      const transport = new StdioServerTransport();
      await this.server.connect(transport);
      this.logger.info('Servidor MCP Portal da Transparência iniciado com sucesso');
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : String(error);
      this.logger.error('Falha ao iniciar servidor MCP', { error: errorMessage });
      throw error;
    }
  }
}

// Initialize and start the server
async function main() {
  const server = new MCPPortalServer();
  try {
    await server.initialize();
    await server.start();
  } catch (error) {
    // Use stderr explicitly to avoid interfering with MCP protocol
    process.stderr.write(`Erro ao iniciar servidor MCP: ${error}\n`);
    process.exit(1);
  }
}

// Only run main if this file is the entry point
if (import.meta.url === `file://${process.argv[1]}`) {
  main();
}
