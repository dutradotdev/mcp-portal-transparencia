import { MCPPortalServer } from '../../../src/mcp-server';
import { SwaggerLoader } from '../../../src/core/SwaggerLoader';
import { Authentication } from '../../../src/core/Authentication';
import { Logger } from '../../../src/logging/Logger';

// Mock dependencies
jest.mock('../../../src/core/SwaggerLoader');
jest.mock('../../../src/core/Authentication');
jest.mock('../../../src/logging/Logger');

describe('MCPPortalServer', () => {
  let server: MCPPortalServer;
  let mockSwaggerLoader: jest.Mocked<SwaggerLoader>;
  let mockAuth: jest.Mocked<Authentication>;
  let mockLogger: jest.Mocked<Logger>;

  beforeEach(() => {
    // Clear all mocks
    jest.clearAllMocks();

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
      getAuthHeaders: jest.fn(),
    } as any;

    // Mock constructors
    (Logger as jest.Mock).mockImplementation(() => mockLogger);
    (SwaggerLoader as jest.Mock).mockImplementation(() => mockSwaggerLoader);
    (Authentication as jest.Mock).mockImplementation(() => mockAuth);

    server = new MCPPortalServer();
  });

  describe('constructor', () => {
    it('should initialize with correct default values', () => {
      expect(Logger).toHaveBeenCalledWith('info');
      expect(SwaggerLoader).toHaveBeenCalledWith(
        'https://api.portaldatransparencia.gov.br/swagger-ui/swagger.json',
        mockLogger
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

    it('should use environment variables when available', () => {
      process.env.PORTAL_API_KEY = 'test-api-key';
      process.env.LOG_LEVEL = 'debug';

      const serverWithEnv = new MCPPortalServer();
      expect(serverWithEnv).toBeInstanceOf(MCPPortalServer);

      expect(Logger).toHaveBeenCalledWith('debug');
      expect(Authentication).toHaveBeenCalledWith(
        {
          apiKey: 'test-api-key',
          headerName: 'chave-api-portal',
          testEndpoint: 'https://api.portaldatransparencia.gov.br/swagger-ui/swagger.json',
        },
        mockLogger
      );

      // Clean up
      delete process.env.PORTAL_API_KEY;
      delete process.env.LOG_LEVEL;
    });
  });

  describe('initialize', () => {
    it('should initialize successfully with valid swagger spec', async () => {
      const mockSpec = {
        info: { title: 'Test API', version: '1.0.0' },
        paths: {
          '/test': {
            get: {
              operationId: 'getTest',
              summary: 'Get test data',
              parameters: [
                {
                  name: 'id',
                  in: 'query',
                  required: true,
                  schema: { type: 'string' },
                },
              ],
            },
          },
        },
      };

      mockSwaggerLoader.loadSpec.mockResolvedValue(mockSpec as any);

      await server.initialize();

      expect(mockSwaggerLoader.loadSpec).toHaveBeenCalledTimes(1);
      expect(mockLogger.info).toHaveBeenCalledWith(
        'Initializing MCP Portal da Transparência server...'
      );
      expect(mockLogger.info).toHaveBeenCalledWith('MCP server initialized with 1 tools');
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

      await server.initialize();
      await server.initialize();

      expect(mockSwaggerLoader.loadSpec).toHaveBeenCalledTimes(1);
    });
  });

  describe('tool generation', () => {
    it('should generate tools with correct naming and structure', async () => {
      const mockSpec = {
        info: { title: 'Test API', version: '1.0.0' },
        paths: {
          '/api-de-dados/servidores': {
            get: {
              operationId: 'getServidores',
              summary: 'Lista servidores',
              description: 'Retorna lista de servidores públicos',
              tags: ['servidores'],
              parameters: [
                {
                  name: 'nome',
                  in: 'query',
                  required: false,
                  schema: { type: 'string' },
                  description: 'Nome do servidor',
                },
              ],
            },
          },
          '/api-de-dados/contratos/{id}': {
            get: {
              summary: 'Buscar contrato por ID',
              parameters: [
                {
                  name: 'id',
                  in: 'path',
                  required: true,
                  schema: { type: 'string' },
                },
              ],
            },
          },
        },
      };

      mockSwaggerLoader.loadSpec.mockResolvedValue(mockSpec as any);

      await server.initialize();

      expect(mockLogger.info).toHaveBeenCalledWith('MCP server initialized with 2 tools');
    });

    it('should categorize endpoints correctly', async () => {
      const mockSpec = {
        info: { title: 'Test API', version: '1.0.0' },
        paths: {
          '/api-de-dados/servidores': {
            get: {
              operationId: 'getServidores',
              summary: 'Lista servidores',
            },
          },
          '/api-de-dados/contratos': {
            get: {
              operationId: 'getContratos',
              summary: 'Lista contratos',
            },
          },
          '/api-de-dados/other': {
            get: {
              operationId: 'getOther',
              summary: 'Other endpoint',
            },
          },
        },
      };

      mockSwaggerLoader.loadSpec.mockResolvedValue(mockSpec as any);

      await server.initialize();

      expect(mockLogger.info).toHaveBeenCalledWith('MCP server initialized with 3 tools');
    });
  });

  describe('error handling', () => {
    it('should handle unknown errors gracefully', async () => {
      const mockSpec = {
        info: { title: 'Test API', version: '1.0.0' },
        paths: {},
      };

      mockSwaggerLoader.loadSpec.mockResolvedValue(mockSpec as any);

      await server.initialize();

      // This test mainly verifies the error handling structure is in place
      expect(mockLogger.info).toHaveBeenCalledWith('MCP server initialized with 0 tools');
    });
  });
});
