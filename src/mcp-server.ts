import { Server } from '@modelcontextprotocol/sdk/server/index.js';
import { StdioServerTransport } from '@modelcontextprotocol/sdk/server/stdio.js';
import { CallToolRequestSchema, ListToolsRequestSchema } from '@modelcontextprotocol/sdk/types.js';
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

    // Initialize components
    this.swaggerLoader = new SwaggerLoader(
      'https://api.portaldatransparencia.gov.br/swagger-ui/swagger.json',
      this.logger
    );

    // Configure authentication
    const apiKey = process.env.PORTAL_API_KEY;
    const authConfig = apiKey ? { apiKey } : {};
    this.auth = new Authentication(authConfig, this.logger);

    this.setupHandlers();
  }

  private setupHandlers(): void {
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

      this.logger.info('Especificação carregada com sucesso');

      await this.generateToolsFromSpec();

      this.logger.info(`${this.tools.size} ferramentas MCP geradas com sucesso`);
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : String(error);
      this.logger.error('Falha ao inicializar servidor MCP', { error: errorMessage });
      throw error;
    }
  }

  private async generateToolsFromSpec(): Promise<void> {
    if (!this.spec?.paths) {
      throw new Error('Especificação Swagger inválida');
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
    const toolName = this.generateToolName(operation.operationId!, method, path);

    // Create user-friendly description
    let description =
      operation.summary || operation.description || `${method.toUpperCase()} ${path}`;
    description = `⚠️ REQUER API KEY DO PORTAL DA TRANSPARÊNCIA - ${description}`;

    return {
      name: toolName,
      description,
      inputSchema: this.generateInputSchema(operation.parameters || []),
      method: method.toUpperCase(),
      path,
      operation,
    };
  }

  private generateInputSchema(parameters: any[]): any {
    const properties: any = {};
    const required: string[] = [];

    for (const param of parameters) {
      if (param.name && !properties[param.name]) {
        properties[param.name] = {
          type: param.schema?.type || 'string',
          description: param.description || `Parâmetro ${param.name}`,
        };

        if (param.required) {
          required.push(param.name);
        }
      }
    }

    return {
      type: 'object',
      properties,
      required,
    };
  }

  private async executeApiCall(
    method: string,
    path: string,
    operation: any,
    args: any
  ): Promise<any> {
    try {
      // Check if API key is configured
      const apiKey = process.env.PORTAL_API_KEY;
      if (!apiKey) {
        return {
          content: [
            {
              type: 'text',
              text:
                '❌ ERRO: API KEY NÃO CONFIGURADA\n\n' +
                'Para usar esta ferramenta, você precisa:\n' +
                '1. Obter uma API key gratuita em: https://api.portaldatransparencia.gov.br/api-de-dados\n' +
                '2. Configurar a variável de ambiente PORTAL_API_KEY\n' +
                '3. Reiniciar o servidor MCP',
            },
          ],
        };
      }

      // Build URL with path parameters
      let url = `https://api.portaldatransparencia.gov.br/api-de-dados${path}`;
      const pathParams = operation.parameters?.filter((p: any) => p.in === 'path') || [];

      for (const param of pathParams) {
        if (args[param.name]) {
          url = url.replace(`{${param.name}}`, encodeURIComponent(args[param.name]));
        }
      }

      // Build query parameters
      const queryParams = operation.parameters?.filter((p: any) => p.in === 'query') || [];
      const searchParams = new URLSearchParams();

      for (const param of queryParams) {
        if (args[param.name] !== undefined && args[param.name] !== null) {
          searchParams.append(param.name, String(args[param.name]));
        }
      }

      if (searchParams.toString()) {
        url += `?${searchParams.toString()}`;
      }

      // Make API call with authentication
      const headers = this.auth.getAuthHeaders();
      const response = await fetch(url, {
        method: method,
        headers,
      });

      if (!response.ok) {
        // Enhanced error handling for authentication issues
        if (response.status === 401 || response.status === 403) {
          return {
            content: [
              {
                type: 'text',
                text:
                  '🔑 ERRO DE AUTENTICAÇÃO\n\n' +
                  'Sua API key pode estar inválida ou expirada.\n\n' +
                  'Para resolver:\n' +
                  '1. Verifique se a API key está correta\n' +
                  '2. Obtenha uma nova em: https://api.portaldatransparencia.gov.br/api-de-dados\n' +
                  '3. Atualize a variável PORTAL_API_KEY\n' +
                  '4. Reinicie o servidor MCP\n\n' +
                  `Status: ${response.status} - ${response.statusText}`,
              },
            ],
          };
        }

        throw new Error(`Falha na chamada da API: ${response.status} ${response.statusText}`);
      }

      const data = await response.json();

      return {
        content: [
          {
            type: 'text',
            text:
              `✅ SUCESSO: ${operation.summary || method.toUpperCase() + ' ' + path}\n\n` +
              `📊 DADOS RETORNADOS:\n${JSON.stringify(data, null, 2)}\n\n` +
              `🔗 Endpoint: ${method.toUpperCase()} ${path}\n` +
              `📡 Status: ${response.status}\n` +
              `⏰ Timestamp: ${new Date().toISOString()}`,
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
