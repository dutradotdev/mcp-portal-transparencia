import { Authentication, AuthConfig } from '../../../src/core/Authentication';
import { Logger } from '../../../src/logging/Logger';
import axios from 'axios';

// Mock axios
jest.mock('axios');
const mockedAxios = axios as jest.Mocked<typeof axios>;

// Mock Logger
jest.mock('@/logging/Logger');
const MockedLogger = Logger as jest.MockedClass<typeof Logger>;

describe('Authentication', () => {
  let authentication: Authentication;
  let mockLogger: jest.Mocked<Logger>;

  beforeEach(() => {
    jest.clearAllMocks();
    mockLogger = new MockedLogger() as jest.Mocked<Logger>;
    authentication = new Authentication({}, mockLogger);
  });

  describe('constructor', () => {
    it('should initialize with default configuration', () => {
      expect(authentication.hasApiKey()).toBe(false);
      expect(authentication.getHeaderName()).toBe('chave-api-portal');
      expect(mockLogger.info).toHaveBeenCalledWith('Authentication system initialized', {
        hasApiKey: false,
        headerName: 'chave-api-portal',
        testEndpoint: 'https://api.portaldatransparencia.gov.br/v3/api-docs',
      });
    });

    it('should initialize with custom configuration', () => {
      const config: AuthConfig = {
        apiKey: 'test-api-key',
        headerName: 'custom-header',
        testEndpoint: 'https://custom-endpoint.com',
      };

      const customAuth = new Authentication(config, mockLogger);

      expect(customAuth.hasApiKey()).toBe(true);
      expect(customAuth.getHeaderName()).toBe('custom-header');
    });
  });

  describe('setApiKey', () => {
    it('should set API key successfully', () => {
      const apiKey = 'valid-api-key-123';

      authentication.setApiKey(apiKey);

      expect(authentication.hasApiKey()).toBe(true);
      expect(mockLogger.info).toHaveBeenCalledWith('API key updated successfully');
    });

    it('should throw error for empty API key', () => {
      expect(() => authentication.setApiKey('')).toThrow('API key cannot be empty');
      expect(() => authentication.setApiKey('   ')).toThrow('API key cannot be empty');
    });

    it('should trim whitespace from API key', () => {
      authentication.setApiKey('  valid-api-key-123  ');
      expect(authentication.hasApiKey()).toBe(true);
    });
  });

  describe('getAuthHeaders', () => {
    it('should return empty object when no API key is set', () => {
      const headers = authentication.getAuthHeaders();

      expect(headers).toEqual({});
      expect(mockLogger.warn).toHaveBeenCalledWith('No API key provided for authentication');
    });

    it('should return headers with API key', () => {
      authentication.setApiKey('test-api-key');

      const headers = authentication.getAuthHeaders();

      expect(headers).toEqual({ 'chave-api-portal': 'test-api-key' });
    });

    it('should use override API key when provided', () => {
      authentication.setApiKey('original-key');

      const headers = authentication.getAuthHeaders('override-key');

      expect(headers).toEqual({ 'chave-api-portal': 'override-key' });
    });

    it('should use custom header name', () => {
      authentication.setHeaderName('custom-header');
      authentication.setApiKey('test-key');

      const headers = authentication.getAuthHeaders();

      expect(headers).toEqual({ 'custom-header': 'test-key' });
    });
  });

  describe('hasApiKey', () => {
    it('should return false when no API key is set', () => {
      expect(authentication.hasApiKey()).toBe(false);
    });

    it('should return true when API key is set', () => {
      authentication.setApiKey('test-key');
      expect(authentication.hasApiKey()).toBe(true);
    });
  });

  describe('validateApiKey', () => {
    it('should return false for no API key', () => {
      expect(authentication.validateApiKey()).toBe(false);
      expect(mockLogger.debug).toHaveBeenCalledWith('API key validation failed: no key provided');
    });

    it('should return false for short API key', () => {
      expect(authentication.validateApiKey('short')).toBe(false);
      expect(mockLogger.debug).toHaveBeenCalledWith('API key validation failed: key too short');
    });

    it('should return false for invalid format', () => {
      expect(authentication.validateApiKey('invalid@key#123')).toBe(false);
      expect(mockLogger.debug).toHaveBeenCalledWith('API key validation failed: invalid format');
    });

    it('should return true for valid API key', () => {
      const validKey = 'valid-api-key-123';
      expect(authentication.validateApiKey(validKey)).toBe(true);
      expect(mockLogger.debug).toHaveBeenCalledWith('API key validation passed');
    });

    it('should validate set API key when no parameter provided', () => {
      authentication.setApiKey('valid-api-key-123');
      expect(authentication.validateApiKey()).toBe(true);
    });
  });

  describe('testApiKey', () => {
    it('should return false when no API key provided', async () => {
      const result = await authentication.testApiKey();

      expect(result).toBe(false);
      expect(mockLogger.warn).toHaveBeenCalledWith('Cannot test API key: no key provided');
    });

    it('should return true for successful API test', async () => {
      mockedAxios.get.mockResolvedValue({ status: 200 });

      const result = await authentication.testApiKey('valid-key');

      expect(result).toBe(true);
      expect(mockLogger.info).toHaveBeenCalledWith('Testing API key validity', {
        endpoint: 'https://api.portaldatransparencia.gov.br/v3/api-docs',
      });
      expect(mockLogger.info).toHaveBeenCalledWith('API key test successful');
      expect(mockedAxios.get).toHaveBeenCalledWith(
        'https://api.portaldatransparencia.gov.br/v3/api-docs',
        {
          headers: { 'chave-api-portal': 'valid-key' },
          timeout: 10000,
        }
      );
    });

    it('should return false for non-200 response', async () => {
      mockedAxios.get.mockResolvedValue({ status: 404 });

      const result = await authentication.testApiKey('valid-key');

      expect(result).toBe(false);
      expect(mockLogger.warn).toHaveBeenCalledWith('API key test failed', { status: 404 });
    });

    it('should handle authentication errors (401/403)', async () => {
      const error = {
        isAxiosError: true,
        response: { status: 401 },
      };
      mockedAxios.get.mockRejectedValue(error);
      mockedAxios.isAxiosError.mockReturnValue(true);

      const result = await authentication.testApiKey('invalid-key');

      expect(result).toBe(false);
      expect(mockLogger.warn).toHaveBeenCalledWith('API key test failed: authentication error', {
        status: 401,
      });
    });

    it('should handle network errors', async () => {
      const error = {
        isAxiosError: true,
        message: 'Network Error',
        response: { status: 500 },
      };
      mockedAxios.get.mockRejectedValue(error);
      mockedAxios.isAxiosError.mockReturnValue(true);

      const result = await authentication.testApiKey('valid-key');

      expect(result).toBe(false);
      expect(mockLogger.error).toHaveBeenCalledWith('API key test failed: network error', {
        message: 'Network Error',
        status: 500,
      });
    });

    it('should handle unexpected errors', async () => {
      const error = new Error('Unexpected error');
      mockedAxios.get.mockRejectedValue(error);
      mockedAxios.isAxiosError.mockReturnValue(false);

      const result = await authentication.testApiKey('valid-key');

      expect(result).toBe(false);
      expect(mockLogger.error).toHaveBeenCalledWith('API key test failed: unexpected error', {
        message: 'Unexpected error',
      });
    });

    it('should use set API key when no parameter provided', async () => {
      authentication.setApiKey('set-api-key');
      mockedAxios.get.mockResolvedValue({ status: 200 });

      const result = await authentication.testApiKey();

      expect(result).toBe(true);
      expect(mockedAxios.get).toHaveBeenCalledWith(
        expect.any(String),
        expect.objectContaining({
          headers: { 'chave-api-portal': 'set-api-key' },
        })
      );
    });
  });

  describe('clearApiKey', () => {
    it('should clear the API key', () => {
      authentication.setApiKey('test-key');
      expect(authentication.hasApiKey()).toBe(true);

      authentication.clearApiKey();

      expect(authentication.hasApiKey()).toBe(false);
      expect(mockLogger.info).toHaveBeenCalledWith('API key cleared');
    });
  });

  describe('getHeaderName and setHeaderName', () => {
    it('should get current header name', () => {
      expect(authentication.getHeaderName()).toBe('chave-api-portal');
    });

    it('should set new header name', () => {
      authentication.setHeaderName('new-header');

      expect(authentication.getHeaderName()).toBe('new-header');
      expect(mockLogger.info).toHaveBeenCalledWith('Authentication header name updated', {
        headerName: 'new-header',
      });
    });

    it('should throw error for empty header name', () => {
      expect(() => authentication.setHeaderName('')).toThrow('Header name cannot be empty');
      expect(() => authentication.setHeaderName('   ')).toThrow('Header name cannot be empty');
    });

    it('should trim whitespace from header name', () => {
      authentication.setHeaderName('  trimmed-header  ');
      expect(authentication.getHeaderName()).toBe('trimmed-header');
    });
  });

  describe('getMaskedApiKey', () => {
    it('should return null when no API key is set', () => {
      expect(authentication.getMaskedApiKey()).toBeNull();
    });

    it('should return **** for short API keys', () => {
      authentication.setApiKey('short123');
      expect(authentication.getMaskedApiKey()).toBe('****');
    });

    it('should mask API key correctly for longer keys', () => {
      authentication.setApiKey('very-long-api-key-12345');
      const masked = authentication.getMaskedApiKey();

      expect(masked).toBe('very***************2345');
      expect(masked?.startsWith('very')).toBe(true);
      expect(masked?.endsWith('2345')).toBe(true);
    });
  });
});
