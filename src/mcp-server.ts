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

    this.auth = new Authentication(
      {
        apiKey: apiKey,
        headerName: 'chave-api-portal',
        testEndpoint: 'https://api.portaldatransparencia.gov.br/swagger-ui/swagger.json',
      },
      this.logger
    );

    // Pass authentication headers to SwaggerLoader
    this.swaggerLoader = new SwaggerLoader(
      'https://api.portaldatransparencia.gov.br/swagger-ui/swagger.json',
      this.logger,
      this.auth.getAuthHeaders()
    );

    this.setupRequestHandlers();
  }

  private setupRequestHandlers(): void {
    this.server.setRequestHandler(ListToolsRequestSchema, async () => {
      if (!this.isInitialized) {
        await this.initialize();
      }

      // Always include API key validation tool as the first tool
      const tools = [
        {
          name: 'portal_check_api_key',
          description:
            '🔑 [CONFIGURAÇÃO] Verificar se a chave da API do Portal da Transparência está configurada. IMPORTANTE: Todas as outras ferramentas requerem uma chave de API válida do Portal da Transparência. Solicite ao usuário para obter uma chave em https://api.portaldatransparencia.gov.br/ se não estiver configurada.',
          inputSchema: {
            type: 'object',
            properties: {},
            required: [],
          },
        },
        ...Array.from(this.tools.values()).map(tool => ({
          name: tool.name,
          description: `${tool.description} ⚠️ REQUER API KEY DO PORTAL DA TRANSPARÊNCIA`,
          inputSchema: tool.inputSchema,
        })),
      ];

      return { tools };
    });

    this.server.setRequestHandler(CallToolRequestSchema, async request => {
      if (!this.isInitialized) {
        await this.initialize();
      }

      const { name, arguments: args } = request.params;

      // Handle special API key validation tool
      if (name === 'portal_check_api_key') {
        return await this.checkApiKeyStatus();
      }

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

      // Check API key status first
      const hasApiKey = this.auth.hasApiKey();
      if (!hasApiKey) {
        this.logger.warn('⚠️ No API key configured - tools will fail until key is provided');
        this.logger.info('💡 Use "portal_check_api_key" tool to get configuration instructions');
      } else {
        this.logger.info('✅ API key found, testing validity...');
        try {
          const isValid = await this.auth.testApiKey();
          if (isValid) {
            this.logger.info('✅ API key validated successfully');
          } else {
            this.logger.warn('❌ API key validation failed - check your key');
            this.logger.info('💡 Use "portal_check_api_key" tool for detailed diagnostics');
          }
        } catch (error) {
          this.logger.warn('⚠️ Could not validate API key due to network error');
          this.logger.info('🔄 Will proceed with initialization - test your key later');
        }
      }

      // Load Swagger specification
      this.logger.info('Loading Portal da Transparência API specification...');
      const spec = await this.swaggerLoader.loadSpec();
      this.logger.info('✅ API specification loaded successfully');

      // Generate MCP tools
      this.logger.info('Generating MCP tools from API specification...');
      await this.generateToolsFromSpec(spec);

      this.logger.info(`✅ MCP server initialized successfully with ${this.tools.size} tools`);

      if (!hasApiKey) {
        this.logger.warn(
          '⚠️ IMPORTANT: Configure PORTAL_API_KEY environment variable to use tools'
        );
        this.logger.info('📝 Get your key at: https://api.portaldatransparencia.gov.br/');
      }

      this.isInitialized = true;
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : String(error);
      this.logger.error('Failed to initialize MCP server', { error: errorMessage });

      // If it's an authentication error, provide helpful guidance
      if (errorMessage.includes('401') || errorMessage.includes('403')) {
        this.logger.error('🔑 API key authentication failed during initialization');
        this.logger.info('💡 Use "portal_check_api_key" tool for configuration help');
      }

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

  private async checkApiKeyStatus(): Promise<any> {
    const hasApiKey = this.auth.hasApiKey();
    const apiKeyMasked = this.auth.getMaskedApiKey();

    if (!hasApiKey) {
      return {
        content: [
          {
            type: 'text',
            text: JSON.stringify(
              {
                success: false,
                configured: false,
                message: '❌ Chave da API não configurada',
                instructions: {
                  'pt-BR': [
                    '🔑 Para usar as ferramentas do Portal da Transparência, você precisa de uma chave de API:',
                    '',
                    '📝 **Como obter sua chave:**',
                    '1. Acesse: https://api.portaldatransparencia.gov.br/',
                    '2. Clique em "Solicitar Token"',
                    '3. Preencha o formulário com seus dados',
                    '4. Aguarde o email com sua chave de API',
                    '',
                    '⚙️ **Como configurar:**',
                    '- No Terminal/CLI: export PORTAL_API_KEY=sua-chave-aqui',
                    '- No Claude Desktop: adicione PORTAL_API_KEY no arquivo de configuração',
                    '- No Cursor: configure a variável de ambiente PORTAL_API_KEY',
                    '',
                    '❗ **IMPORTANTE:** Sem a chave de API, nenhuma ferramenta funcionará.',
                    '💡 **Dica:** Execute novamente esta ferramenta após configurar para verificar.',
                  ],
                  'en-US': [
                    '🔑 To use Portal da Transparência tools, you need an API key:',
                    '',
                    '📝 **How to get your key:**',
                    '1. Visit: https://api.portaldatransparencia.gov.br/',
                    '2. Click "Solicitar Token"',
                    '3. Fill out the form with your information',
                    '4. Wait for the email with your API key',
                    '',
                    '⚙️ **How to configure:**',
                    '- Terminal/CLI: export PORTAL_API_KEY=your-key-here',
                    '- Claude Desktop: add PORTAL_API_KEY to config file',
                    '- Cursor: set PORTAL_API_KEY environment variable',
                    '',
                    '❗ **IMPORTANT:** Without the API key, no tools will work.',
                    '💡 **Tip:** Run this tool again after configuring to verify.',
                  ],
                },
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

    // Test the API key
    try {
      const isValid = await this.auth.testApiKey();

      if (isValid) {
        return {
          content: [
            {
              type: 'text',
              text: JSON.stringify(
                {
                  success: true,
                  configured: true,
                  valid: true,
                  message: '✅ Chave da API configurada e funcionando',
                  details: {
                    api_key_masked: apiKeyMasked,
                    status: 'Válida e testada com sucesso',
                    tools_available: this.tools.size,
                    categories: [...new Set(Array.from(this.tools.values()).map(t => t.category))],
                  },
                  'pt-BR':
                    '🎉 Perfeito! Sua chave de API está funcionando. Agora você pode usar todas as ferramentas do Portal da Transparência.',
                  'en-US':
                    '🎉 Perfect! Your API key is working. You can now use all Portal da Transparência tools.',
                  timestamp: new Date().toISOString(),
                },
                null,
                2
              ),
            },
          ],
        };
      } else {
        return {
          content: [
            {
              type: 'text',
              text: JSON.stringify(
                {
                  success: false,
                  configured: true,
                  valid: false,
                  message: '❌ Chave da API configurada mas inválida',
                  details: {
                    api_key_masked: apiKeyMasked,
                    status: 'Configurada mas falhou no teste',
                  },
                  instructions: {
                    'pt-BR': [
                      '🔑 Sua chave de API está configurada, mas não está funcionando:',
                      '',
                      '🔍 **Possíveis problemas:**',
                      '- Chave de API expirada',
                      '- Chave de API inválida ou digitada incorretamente',
                      '- Problemas temporários no Portal da Transparência',
                      '',
                      '✅ **Soluções:**',
                      '1. Verifique se a chave foi copiada corretamente',
                      '2. Gere uma nova chave em: https://api.portaldatransparencia.gov.br/',
                      '3. Aguarde alguns minutos e tente novamente',
                      '4. Confirme se a chave não expirou',
                    ],
                    'en-US': [
                      '🔑 Your API key is configured but not working:',
                      '',
                      '🔍 **Possible issues:**',
                      '- Expired API key',
                      '- Invalid or incorrectly typed API key',
                      '- Temporary issues with Portal da Transparência',
                      '',
                      '✅ **Solutions:**',
                      '1. Check if the key was copied correctly',
                      '2. Generate a new key at: https://api.portaldatransparencia.gov.br/',
                      '3. Wait a few minutes and try again',
                      '4. Confirm the key has not expired',
                    ],
                  },
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
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : String(error);

      return {
        content: [
          {
            type: 'text',
            text: JSON.stringify(
              {
                success: false,
                configured: true,
                valid: false,
                message: '⚠️ Erro ao testar chave da API',
                error: errorMessage,
                details: {
                  api_key_masked: apiKeyMasked,
                  status: 'Erro durante teste de validação',
                },
                instructions: {
                  'pt-BR': [
                    '⚠️ Ocorreu um erro ao testar sua chave de API:',
                    '',
                    '🔍 **Possíveis causas:**',
                    '- Problemas de conectividade',
                    '- Portal da Transparência temporariamente indisponível',
                    '- Chave de API com formato incorreto',
                    '',
                    '✅ **Próximos passos:**',
                    '1. Verifique sua conexão com a internet',
                    '2. Tente novamente em alguns minutos',
                    '3. Confirme o formato da chave de API',
                    '4. Se persistir, gere uma nova chave',
                  ],
                  'en-US': [
                    '⚠️ An error occurred while testing your API key:',
                    '',
                    '🔍 **Possible causes:**',
                    '- Connectivity issues',
                    '- Portal da Transparência temporarily unavailable',
                    '- API key with incorrect format',
                    '',
                    '✅ **Next steps:**',
                    '1. Check your internet connection',
                    '2. Try again in a few minutes',
                    '3. Confirm the API key format',
                    '4. If it persists, generate a new key',
                  ],
                },
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
    const hasApiKey = this.auth.hasApiKey();
    const maskedKey = this.auth.getMaskedApiKey();

    switch (status) {
      case 400:
        return `❌ Requisição inválida para ${tool.category}: Verifique os parâmetros fornecidos. ${errorText}`;
      case 401:
        if (!hasApiKey) {
          return `🔑 **API KEY NECESSÁRIA:** Para usar as ferramentas do Portal da Transparência, você precisa configurar uma chave de API.\n\n📝 **Como obter:** Acesse https://api.portaldatransparencia.gov.br/ → "Solicitar Token"\n⚙️ **Como configurar:** Defina a variável de ambiente PORTAL_API_KEY=sua-chave-aqui\n💡 **Dica:** Use a ferramenta 'portal_check_api_key' para verificar sua configuração.`;
        }
        return `❌ Erro de autenticação: Sua chave da API (${maskedKey}) está inválida ou expirou. Configure uma nova chave ou use 'portal_check_api_key' para verificar.`;
      case 403:
        if (!hasApiKey) {
          return `🔑 **API KEY NECESSÁRIA:** Acesso negado - você precisa de uma chave de API válida do Portal da Transparência.\n\n📝 **Como obter:** https://api.portaldatransparencia.gov.br/ → "Solicitar Token"\n⚙️ **Como configurar:** PORTAL_API_KEY=sua-chave-aqui\n🔍 **Verificar:** Use 'portal_check_api_key' para validar sua configuração.`;
        }
        return `❌ Acesso negado: Sua chave da API (${maskedKey}) não tem permissão para acessar este recurso ou pode estar expirada. Verifique com 'portal_check_api_key'.`;
      case 404:
        return `❌ Recurso não encontrado: O endpoint '${tool.path}' ou recurso solicitado não existe. Verifique os parâmetros.`;
      case 429:
        return `⏳ Limite de taxa excedido: Muitas requisições para ${tool.category}. Aguarde um momento antes de tentar novamente.`;
      case 500:
        return `⚠️ Erro interno do servidor: Problema temporário no Portal da Transparência. Tente novamente em alguns minutos.`;
      default:
        return `❌ Erro HTTP ${status}: ${errorText}`;
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
