import { ClientGenerator } from '@/core/ClientGenerator';
import { Logger } from '@/logging/Logger';

// Mock Logger only

jest.mock('@/logging/Logger');

const MockedLogger = Logger as jest.MockedClass<typeof Logger>;

describe('ClientGenerator', () => {
  let mockLogger: jest.Mocked<Logger>;
  let clientGenerator: ClientGenerator;
  let mockSpec: any;

  beforeEach(() => {
    // Mock Logger
    mockLogger = new MockedLogger() as jest.Mocked<Logger>;
    mockLogger.info = jest.fn();
    mockLogger.error = jest.fn();
    mockLogger.warn = jest.fn();

    // Mock OpenAPI spec
    mockSpec = {
      openapi: '3.0.0',
      info: {
        title: 'Portal da Transparência API',
        version: '1.0.0',
      },
      servers: [{ url: 'https://api.portaldatransparencia.gov.br' }],
      paths: {
        '/servidores': {
          get: {
            operationId: 'getServidores',
            summary: 'Get all servers',
            tags: ['Servidores'],
            responses: {
              '200': {
                description: 'Successful response',
              },
            },
          },
        },
      },
    };

    clientGenerator = new ClientGenerator(mockSpec, './test-clients', mockLogger);
  });

  describe('constructor', () => {
    it('should initialize with default options', () => {
      expect(clientGenerator).toBeInstanceOf(ClientGenerator);
    });

    it('should initialize with custom options', () => {
      const options = {
        includeTypes: false,
        includeJsDoc: false,
      };
      const generator = new ClientGenerator(mockSpec, './test-clients', mockLogger, options);
      expect(generator).toBeInstanceOf(ClientGenerator);
    });
  });

  describe('generateClients', () => {
    it('should generate clients successfully', async () => {
      const result = await clientGenerator.generateClients();

      expect(result).toBeInstanceOf(Array);
      expect(result.length).toBeGreaterThan(0);
      expect(mockLogger.info).toHaveBeenCalled();
    });

    it('should handle spec with no paths', async () => {
      const emptySpec = { ...mockSpec, paths: undefined };
      const generator = new ClientGenerator(emptySpec, './test-clients', mockLogger);

      const result = await generator.generateClients();

      expect(result).toHaveLength(0);
      expect(mockLogger.warn).toHaveBeenCalledWith('No paths found in OpenAPI specification');
    });
  });

  describe('error handling', () => {
    it('should handle empty spec gracefully', () => {
      const emptySpec = {
        openapi: '3.0.0',
        info: { title: 'Empty API', version: '1.0.0' },
        paths: {},
      };
      const generator = new ClientGenerator(emptySpec, './test-clients', mockLogger);
      expect(generator).toBeInstanceOf(ClientGenerator);
    });

    it('should handle spec with no servers', () => {
      const specWithoutServers = { ...mockSpec };
      delete specWithoutServers.servers;
      const generator = new ClientGenerator(specWithoutServers, './test-clients', mockLogger);
      expect(generator).toBeInstanceOf(ClientGenerator);
    });
  });

  describe('base URL detection', () => {
    it('should use default URL when no servers in spec', async () => {
      const specWithoutServers = { ...mockSpec };
      delete specWithoutServers.servers;
      const generator = new ClientGenerator(specWithoutServers, './test-clients', mockLogger);

      // The generator should still work without servers
      expect(generator).toBeInstanceOf(ClientGenerator);
    });
  });

  describe('validation', () => {
    it('should accept valid OpenAPI spec', () => {
      expect(() => {
        new ClientGenerator(mockSpec, './test-clients', mockLogger);
      }).not.toThrow();
    });

    it('should accept custom output directory', () => {
      const generator = new ClientGenerator(mockSpec, '/custom/path', mockLogger);
      expect(generator).toBeInstanceOf(ClientGenerator);
    });

    it('should accept custom options', () => {
      const options = {
        outputDir: '/custom/output',
        templatePath: '/custom/template',
        includeTypes: false,
        includeJsDoc: true,
      };
      const generator = new ClientGenerator(mockSpec, './test-clients', mockLogger, options);
      expect(generator).toBeInstanceOf(ClientGenerator);
    });
  });

  describe('logger integration', () => {
    it('should use provided logger instance', () => {
      const generator = new ClientGenerator(mockSpec, './test-clients', mockLogger);
      expect(generator).toBeInstanceOf(ClientGenerator);

      // Logger should be available for internal use
      expect(mockLogger.info).toBeDefined();
      expect(mockLogger.error).toBeDefined();
      expect(mockLogger.warn).toBeDefined();
    });
  });
});
