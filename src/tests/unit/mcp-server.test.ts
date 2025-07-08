import { MCPPortalServer } from '../../mcp-server';
import { SwaggerLoader } from '../../core/SwaggerLoader';
import { Authentication } from '../../core/Authentication';
import { Logger } from '../../logging/Logger';

// Mock dependencies
jest.mock('../../core/SwaggerLoader');
jest.mock('../../core/Authentication');
jest.mock('../../logging/Logger');

describe('MCPPortalServer', () => {
  let server: MCPPortalServer;
  let mockSwaggerLoader: jest.Mocked<SwaggerLoader>;
  let mockAuth: jest.Mocked<Authentication>;
  let mockLogger: jest.Mocked<Logger>;

  beforeEach(() => {
    // Clear all mocks
    jest.clearAllMocks();

    // Clear environment variables
    delete process.env.PORTAL_API_KEY;
    delete process.env.LOG_LEVEL;

    // Mock Logger
    mockLogger = {
      info: jest.fn(),
      error: jest.fn(),
      warn: jest.fn(),
      debug: jest.fn(),
    } as any;

    // Mock SwaggerLoader
    mockSwaggerLoader = {
      loadSpec: jest.fn(),
    } as any;

    // Mock Authentication
    mockAuth = {
      getAuthHeaders: jest.fn().mockReturnValue({}),
      hasApiKey: jest.fn().mockReturnValue(false),
      getMaskedApiKey: jest.fn().mockReturnValue(null),
      testApiKey: jest.fn().mockResolvedValue(true),
    } as any;

    // Mock the constructors
    (Logger as jest.MockedClass<typeof Logger>).mockImplementation(() => mockLogger);
    (SwaggerLoader as jest.MockedClass<typeof SwaggerLoader>).mockImplementation(
      () => mockSwaggerLoader
    );
    (Authentication as jest.MockedClass<typeof Authentication>).mockImplementation(() => mockAuth);
  });

  describe('constructor', () => {
    it('should initialize with correct default values', () => {
      server = new MCPPortalServer();

      expect(Logger).toHaveBeenCalledWith('info');
      expect(SwaggerLoader).toHaveBeenCalledWith(
        'https://api.portaldatransparencia.gov.br/swagger-ui/swagger.json',
        mockLogger,
        {} // Empty auth headers when no API key is provided
      );
      expect(Authentication).toHaveBeenCalledWith(
        {
          apiKey: undefined,
          headerName: 'chave-api-portal',
          testEndpoint: 'https://api.portaldatransparencia.gov.br/swagger-ui/swagger.json',
        },
        mockLogger
      );
    });

    it('should use environment variables when provided', () => {
      process.env.PORTAL_API_KEY = 'test-key';
      process.env.LOG_LEVEL = 'debug';

      server = new MCPPortalServer();

      expect(Logger).toHaveBeenCalledWith('debug');
      expect(Authentication).toHaveBeenCalledWith(
        {
          apiKey: 'test-key',
          headerName: 'chave-api-portal',
          testEndpoint: 'https://api.portaldatransparencia.gov.br/swagger-ui/swagger.json',
        },
        mockLogger
      );
    });
  });

  describe('initialize', () => {
    beforeEach(() => {
      server = new MCPPortalServer();
      server['auth'] = mockAuth;
      server['logger'] = mockLogger;
      server['swaggerLoader'] = mockSwaggerLoader;
    });

    it('should initialize successfully with valid swagger spec', async () => {
      const mockSpec = {
        info: { title: 'Test API', version: '1.0.0' },
        paths: {
          '/test': {
            get: {
              summary: 'Test endpoint',
              operationId: 'testEndpoint',
              parameters: [],
              responses: { '200': { description: 'Success' } },
            },
          },
        },
      };

      mockSwaggerLoader.loadSpec.mockResolvedValue(mockSpec as any);
      mockAuth.hasApiKey.mockReturnValue(false);

      await server.initialize();

      expect(mockSwaggerLoader.loadSpec).toHaveBeenCalled();
      expect(mockLogger.info).toHaveBeenCalledWith(
        'Initializing MCP Portal da Transparência server...'
      );
      expect(mockLogger.info).toHaveBeenCalledWith('✅ API specification loaded successfully');
      expect(server['isInitialized']).toBe(true);
    });

    it('should handle initialization errors gracefully', async () => {
      const initError = new Error('Failed to load swagger spec');
      mockSwaggerLoader.loadSpec.mockRejectedValue(initError);

      await expect(server.initialize()).rejects.toThrow('Failed to load swagger spec');
      expect(mockLogger.error).toHaveBeenCalledWith('Failed to initialize MCP server', {
        error: 'Failed to load swagger spec',
      });
    });

    it('should not initialize twice', async () => {
      const mockSpec = {
        info: { title: 'Test API', version: '1.0.0' },
        paths: {},
      };

      mockSwaggerLoader.loadSpec.mockResolvedValue(mockSpec as any);
      mockAuth.hasApiKey.mockReturnValue(false);

      await server.initialize();
      await server.initialize(); // Second call

      expect(mockSwaggerLoader.loadSpec).toHaveBeenCalledTimes(1);
    });

    it('should log API key status during initialization', async () => {
      const mockSpec = {
        info: { title: 'Test API', version: '1.0.0' },
        paths: {},
      };

      mockSwaggerLoader.loadSpec.mockResolvedValue(mockSpec as any);
      mockAuth.hasApiKey.mockReturnValue(true);
      mockAuth.testApiKey.mockResolvedValue(true);

      await server.initialize();

      expect(mockLogger.info).toHaveBeenCalledWith('✅ API key found, testing validity...');
      expect(mockLogger.info).toHaveBeenCalledWith('✅ API key validated successfully');
      expect(mockAuth.testApiKey).toHaveBeenCalled();
    });

    it('should handle API key validation errors', async () => {
      const mockSpec = {
        info: { title: 'Test API', version: '1.0.0' },
        paths: {},
      };

      mockSwaggerLoader.loadSpec.mockResolvedValue(mockSpec as any);
      mockAuth.hasApiKey.mockReturnValue(true);
      mockAuth.testApiKey.mockRejectedValue(new Error('Network error'));

      await server.initialize();

      expect(mockLogger.warn).toHaveBeenCalledWith(
        '⚠️ Could not validate API key due to network error'
      );
      expect(mockLogger.info).toHaveBeenCalledWith(
        '🔄 Will proceed with initialization - test your key later'
      );
    });
  });

  describe('API key validation method', () => {
    beforeEach(() => {
      server = new MCPPortalServer();
      server['auth'] = mockAuth;
      server['logger'] = mockLogger;
      server['tools'] = new Map();
    });

    it('should handle missing API key', async () => {
      mockAuth.hasApiKey.mockReturnValue(false);

      const result = await server['checkApiKeyStatus']();

      expect(result.isError).toBe(true);
      expect(result.content[0].text).toContain('❌ Chave da API não configurada');
      expect(result.content[0].text).toContain('https://api.portaldatransparencia.gov.br/');
    });

    it('should handle valid API key', async () => {
      mockAuth.hasApiKey.mockReturnValue(true);
      mockAuth.getMaskedApiKey.mockReturnValue('abcd****1234');
      mockAuth.testApiKey.mockResolvedValue(true);

      const result = await server['checkApiKeyStatus']();

      expect(result.isError).toBeFalsy();
      expect(result.content[0].text).toContain('✅ Chave da API configurada e funcionando');
      expect(result.content[0].text).toContain('abcd****1234');
    });

    it('should handle invalid API key', async () => {
      mockAuth.hasApiKey.mockReturnValue(true);
      mockAuth.getMaskedApiKey.mockReturnValue('abcd****1234');
      mockAuth.testApiKey.mockResolvedValue(false);

      const result = await server['checkApiKeyStatus']();

      expect(result.isError).toBe(true);
      expect(result.content[0].text).toContain('❌ Chave da API configurada mas inválida');
      expect(result.content[0].text).toContain('abcd****1234');
    });

    it('should handle API key test errors', async () => {
      mockAuth.hasApiKey.mockReturnValue(true);
      mockAuth.getMaskedApiKey.mockReturnValue('abcd****1234');
      mockAuth.testApiKey.mockRejectedValue(new Error('Network error'));

      const result = await server['checkApiKeyStatus']();

      expect(result.isError).toBe(true);
      expect(result.content[0].text).toContain('⚠️ Erro ao testar chave da API');
      expect(result.content[0].text).toContain('Network error');
    });
  });

  describe('tool generation', () => {
    beforeEach(() => {
      server = new MCPPortalServer();
      server['auth'] = mockAuth;
      server['logger'] = mockLogger;
      server['swaggerLoader'] = mockSwaggerLoader;
      server['tools'] = new Map();
    });

    it('should generate tools with correct naming and structure', async () => {
      const mockSpec = {
        info: { title: 'Test API', version: '1.0.0' },
        paths: {
          '/servidores': {
            get: {
              summary: 'Get servidores',
              operationId: 'getServidores',
              parameters: [
                {
                  name: 'nome',
                  in: 'query',
                  description: 'Nome do servidor',
                  required: false,
                  schema: { type: 'string' },
                },
              ],
              responses: { '200': { description: 'Success' } },
            },
          },
        },
      };

      mockSwaggerLoader.loadSpec.mockResolvedValue(mockSpec as any);
      mockAuth.hasApiKey.mockReturnValue(false);

      await server.initialize();

      expect(server['tools'].size).toBe(1);

      // Check if any tool was generated (the exact name generation might vary)
      const toolNames = Array.from(server['tools'].keys());
      expect(toolNames.length).toBe(1);

      const tool = server['tools'].get(toolNames[0]);
      expect(tool?.method).toBe('GET');
      expect(tool?.path).toBe('/servidores');
      expect(tool?.category).toBe('servidores');
    });

    it('should categorize endpoints correctly', async () => {
      const mockSpec = {
        info: { title: 'Test API', version: '1.0.0' },
        paths: {
          '/servidores': {
            get: {
              summary: 'Get servidores',
              operationId: 'getServidores',
              parameters: [],
              responses: { '200': { description: 'Success' } },
            },
          },
          '/transferencias': {
            get: {
              summary: 'Get transferencias',
              operationId: 'getTransferencias',
              parameters: [],
              responses: { '200': { description: 'Success' } },
            },
          },
        },
      };

      mockSwaggerLoader.loadSpec.mockResolvedValue(mockSpec as any);
      mockAuth.hasApiKey.mockReturnValue(false);

      await server.initialize();

      expect(server['tools'].size).toBe(2);

      // Check that tools were generated and categorized correctly
      const tools = Array.from(server['tools'].values());
      const categories = tools.map(t => t.category);

      expect(categories).toContain('servidores');
      expect(categories).toContain('transferencias');
    });
  });

  describe('error handling', () => {
    beforeEach(() => {
      server = new MCPPortalServer();
      server['auth'] = mockAuth;
      server['logger'] = mockLogger;
      server['swaggerLoader'] = mockSwaggerLoader;
      server['tools'] = new Map();
    });

    it('should handle unknown errors gracefully', async () => {
      const mockSpec = {
        info: { title: 'Test API', version: '1.0.0' },
        paths: {},
      };

      mockSwaggerLoader.loadSpec.mockResolvedValue(mockSpec as any);
      mockAuth.hasApiKey.mockReturnValue(false);

      await server.initialize();

      // This should not throw
      expect(() => server['isInitialized']).not.toThrow();
    });

    it('should create user-friendly error messages', () => {
      const mockTool = {
        name: 'test_tool',
        description: 'Test tool',
        inputSchema: { type: 'object', properties: {}, required: [] },
        method: 'GET',
        path: '/test',
        operation: {},
        category: 'test',
      };

      mockAuth.hasApiKey.mockReturnValue(false);

      const error401 = server['createUserFriendlyError'](401, 'Unauthorized', mockTool);
      expect(error401).toContain('🔑 **API KEY NECESSÁRIA:**');
      expect(error401).toContain('https://api.portaldatransparencia.gov.br/');

      const error403 = server['createUserFriendlyError'](403, 'Forbidden', mockTool);
      expect(error403).toContain('🔑 **API KEY NECESSÁRIA:**');
      expect(error403).toContain('Acesso negado');
    });

    it('should create different error messages when API key is present', () => {
      const mockTool = {
        name: 'test_tool',
        description: 'Test tool',
        inputSchema: { type: 'object', properties: {}, required: [] },
        method: 'GET',
        path: '/test',
        operation: {},
        category: 'test',
      };

      mockAuth.hasApiKey.mockReturnValue(true);
      mockAuth.getMaskedApiKey.mockReturnValue('abcd****1234');

      const error401 = server['createUserFriendlyError'](401, 'Unauthorized', mockTool);
      expect(error401).toContain('❌ Erro de autenticação');
      expect(error401).toContain('abcd****1234');

      const error403 = server['createUserFriendlyError'](403, 'Forbidden', mockTool);
      expect(error403).toContain('❌ Acesso negado');
      expect(error403).toContain('abcd****1234');
    });
  });
});
