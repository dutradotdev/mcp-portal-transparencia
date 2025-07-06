import { SwaggerLoader } from '@/core/SwaggerLoader';
import { Logger } from '@/logging/Logger';
import axios from 'axios';
import SwaggerParser from '@apidevtools/swagger-parser';

// Mock axios
jest.mock('axios');
const mockedAxios = axios as jest.Mocked<typeof axios>;

// Mock SwaggerParser
jest.mock('@apidevtools/swagger-parser');
const mockedSwaggerParser = SwaggerParser as jest.Mocked<typeof SwaggerParser>;

// Mock Logger
jest.mock('@/logging/Logger');
const MockedLogger = Logger as jest.MockedClass<typeof Logger>;

describe('SwaggerLoader', () => {
  let swaggerLoader: SwaggerLoader;
  let mockLogger: jest.Mocked<Logger>;

  const mockSpec = {
    openapi: '3.0.0',
    info: {
      title: 'Portal da Transparência API',
      version: '1.0.0',
    },
    paths: {
      '/test': {
        get: {
          summary: 'Test endpoint',
        },
      },
    },
  };

  beforeEach(() => {
    mockLogger = new MockedLogger() as jest.Mocked<Logger>;
    swaggerLoader = new SwaggerLoader('https://test-api.com/swagger.json', mockLogger);
    jest.clearAllMocks();
  });

  describe('loadSpec', () => {
    it('should load and validate swagger specification successfully', async () => {
      // Arrange
      mockedAxios.get.mockResolvedValue({ data: mockSpec });
      mockedSwaggerParser.validate.mockResolvedValue(mockSpec as any);

      // Act
      const result = await swaggerLoader.loadSpec();

      // Assert
      expect(mockedAxios.get).toHaveBeenCalledWith('https://test-api.com/swagger.json');
      expect(mockedSwaggerParser.validate).toHaveBeenCalledWith(mockSpec);
      expect(mockLogger.info).toHaveBeenCalledWith('Loading Swagger specification', {
        url: 'https://test-api.com/swagger.json',
      });
      expect(mockLogger.info).toHaveBeenCalledWith('Swagger specification loaded successfully');
      expect(result).toEqual(mockSpec);
    });

    it('should handle axios errors', async () => {
      // Arrange
      const axiosError = new Error('Network error');
      mockedAxios.get.mockRejectedValue(axiosError);

      // Act & Assert
      await expect(swaggerLoader.loadSpec()).rejects.toThrow(
        'Failed to load Swagger specification: Network error'
      );
      expect(mockLogger.error).toHaveBeenCalledWith('Failed to load Swagger specification', {
        error: axiosError,
      });
    });

    it('should handle swagger validation errors', async () => {
      // Arrange
      mockedAxios.get.mockResolvedValue({ data: mockSpec });
      const validationError = new Error('Invalid swagger spec');
      mockedSwaggerParser.validate.mockRejectedValue(validationError);

      // Act & Assert
      await expect(swaggerLoader.loadSpec()).rejects.toThrow(
        'Failed to load Swagger specification: Invalid swagger spec'
      );
      expect(mockLogger.error).toHaveBeenCalledWith('Failed to load Swagger specification', {
        error: validationError,
      });
    });
  });

  describe('getSpec', () => {
    it('should return cached spec if available', async () => {
      // Arrange
      mockedAxios.get.mockResolvedValue({ data: mockSpec });
      mockedSwaggerParser.validate.mockResolvedValue(mockSpec as any);

      // Load spec first to cache it
      await swaggerLoader.loadSpec();
      jest.clearAllMocks();

      // Act
      const result = await swaggerLoader.getSpec();

      // Assert
      expect(mockedAxios.get).not.toHaveBeenCalled();
      expect(result).toEqual(mockSpec);
    });

    it('should load spec if not cached', async () => {
      // Arrange
      mockedAxios.get.mockResolvedValue({ data: mockSpec });
      mockedSwaggerParser.validate.mockResolvedValue(mockSpec as any);

      // Act
      const result = await swaggerLoader.getSpec();

      // Assert
      expect(mockedAxios.get).toHaveBeenCalledWith('https://test-api.com/swagger.json');
      expect(result).toEqual(mockSpec);
    });
  });

  describe('detectSpecChanges', () => {
    it('should detect version changes', async () => {
      // Arrange
      const oldSpec = { ...mockSpec, info: { ...mockSpec.info, version: '1.0.0' } };
      const newSpec = { ...mockSpec, info: { ...mockSpec.info, version: '2.0.0' } };

      mockedAxios.get
        .mockResolvedValueOnce({ data: oldSpec })
        .mockResolvedValueOnce({ data: newSpec });
      mockedSwaggerParser.validate
        .mockResolvedValueOnce(oldSpec as any)
        .mockResolvedValueOnce(newSpec as any);

      // Act
      const hasChanges = await swaggerLoader.detectSpecChanges();

      // Assert
      expect(hasChanges).toBe(true);
    });

    it('should return false when versions are the same', async () => {
      // Arrange
      mockedAxios.get
        .mockResolvedValueOnce({ data: mockSpec })
        .mockResolvedValueOnce({ data: mockSpec });
      mockedSwaggerParser.validate
        .mockResolvedValueOnce(mockSpec as any)
        .mockResolvedValueOnce(mockSpec as any);

      // Act
      const hasChanges = await swaggerLoader.detectSpecChanges();

      // Assert
      expect(hasChanges).toBe(false);
    });
  });

  describe('validateSpecStructure', () => {
    it('should validate valid OpenAPI spec', () => {
      // Act
      const isValid = swaggerLoader.validateSpecStructure(mockSpec as any);

      // Assert
      expect(isValid).toBe(true);
      expect(mockLogger.info).toHaveBeenCalledWith(
        'Swagger specification structure validation passed'
      );
    });

    it('should reject spec without version', () => {
      // Arrange
      const invalidSpec = { ...mockSpec };
      delete (invalidSpec as any).openapi;

      // Act
      const isValid = swaggerLoader.validateSpecStructure(invalidSpec as any);

      // Assert
      expect(isValid).toBe(false);
      expect(mockLogger.error).toHaveBeenCalledWith(
        'Swagger specification structure validation failed',
        { error: 'Missing OpenAPI/Swagger version' }
      );
    });

    it('should reject spec without info section', () => {
      // Arrange
      const invalidSpec = { ...mockSpec };
      delete (invalidSpec as any).info;

      // Act
      const isValid = swaggerLoader.validateSpecStructure(invalidSpec as any);

      // Assert
      expect(isValid).toBe(false);
      expect(mockLogger.error).toHaveBeenCalledWith(
        'Swagger specification structure validation failed',
        { error: 'Missing info section' }
      );
    });

    it('should reject spec without paths section', () => {
      // Arrange
      const invalidSpec = { ...mockSpec };
      delete (invalidSpec as any).paths;

      // Act
      const isValid = swaggerLoader.validateSpecStructure(invalidSpec as any);

      // Assert
      expect(isValid).toBe(false);
      expect(mockLogger.error).toHaveBeenCalledWith(
        'Swagger specification structure validation failed',
        { error: 'Missing paths section' }
      );
    });
  });

  describe('getSpecInfo', () => {
    it('should return spec info when spec is loaded', async () => {
      // Arrange
      mockedAxios.get.mockResolvedValue({ data: mockSpec });
      mockedSwaggerParser.validate.mockResolvedValue(mockSpec as any);
      await swaggerLoader.loadSpec();

      // Act
      const info = swaggerLoader.getSpecInfo();

      // Assert
      expect(info).toEqual({
        title: 'Portal da Transparência API',
        version: '1.0.0',
        pathCount: 1,
      });
    });

    it('should return null when spec is not loaded', () => {
      // Act
      const info = swaggerLoader.getSpecInfo();

      // Assert
      expect(info).toBeNull();
    });
  });

  describe('clearCache', () => {
    it('should clear cached spec', async () => {
      // Arrange
      mockedAxios.get.mockResolvedValue({ data: mockSpec });
      mockedSwaggerParser.validate.mockResolvedValue(mockSpec as any);
      await swaggerLoader.loadSpec();

      // Act
      swaggerLoader.clearCache();

      // Assert
      expect(mockLogger.debug).toHaveBeenCalledWith('Swagger specification cache cleared');

      // Verify cache is cleared by checking if getSpec loads again
      jest.clearAllMocks();
      mockedAxios.get.mockResolvedValue({ data: mockSpec });
      mockedSwaggerParser.validate.mockResolvedValue(mockSpec as any);

      await swaggerLoader.getSpec();
      expect(mockedAxios.get).toHaveBeenCalled();
    });
  });
});
