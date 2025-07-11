import { Logger } from '@/logging/Logger';
import axios from 'axios';

export interface AuthConfig {
  apiKey?: string;
  headerName?: string;
  testEndpoint?: string;
}

export interface AuthHeaders {
  [key: string]: string;
}

export class Authentication {
  private apiKey: string | null = null;
  private headerName: string;
  private testEndpoint: string;
  private logger: Logger;

  constructor(config: AuthConfig = {}, logger: Logger) {
    // Load API key from config (environment variables can be loaded by the calling code)
    this.apiKey = config.apiKey || null;
    this.headerName = config.headerName || 'chave-api-dados';
    this.testEndpoint =
      config.testEndpoint || 'https://api.portaldatransparencia.gov.br/v3/api-docs';
    this.logger = logger;

    this.logger.info('Authentication system initialized', {
      hasApiKey: this.hasApiKey(),
      headerName: this.headerName,
      testEndpoint: this.testEndpoint,
    });
  }

  /**
   * Set the API key for authentication
   */
  setApiKey(apiKey: string): void {
    if (!apiKey || apiKey.trim().length === 0) {
      throw new Error('API key cannot be empty');
    }

    this.apiKey = apiKey.trim();
    this.logger.info('API key updated successfully');
  }

  /**
   * Get authentication headers for API requests
   */
  getAuthHeaders(overrideApiKey?: string): AuthHeaders {
    const key = overrideApiKey || this.apiKey;

    if (!key) {
      this.logger.warn('No API key provided for authentication');
      return {};
    }

    return { [this.headerName]: key };
  }

  /**
   * Check if an API key is configured
   */
  hasApiKey(): boolean {
    return !!this.apiKey;
  }

  /**
   * Validate API key format (basic validation)
   */
  validateApiKey(apiKey?: string): boolean {
    const key = apiKey || this.apiKey;

    if (!key) {
      this.logger.debug('API key validation failed: no key provided');
      return false;
    }

    // Basic validation - API key should be at least 10 characters
    if (key.length < 10) {
      this.logger.debug('API key validation failed: key too short');
      return false;
    }

    // API key should contain only alphanumeric characters and hyphens
    const validFormat = /^[a-zA-Z0-9\-_]+$/.test(key);
    if (!validFormat) {
      this.logger.debug('API key validation failed: invalid format');
      return false;
    }

    this.logger.debug('API key validation passed');
    return true;
  }

  /**
   * Test API key validity by making a request to the API
   */
  async testApiKey(apiKey?: string): Promise<boolean> {
    const key = apiKey || this.apiKey;

    if (!key) {
      this.logger.warn('Cannot test API key: no key provided');
      return false;
    }

    try {
      this.logger.info('Testing API key validity', { endpoint: this.testEndpoint });

      const headers = { [this.headerName]: key };
      const response = await axios.get(this.testEndpoint, {
        headers,
        timeout: 10000, // 10 second timeout
      });

      if (response.status === 200) {
        this.logger.info('API key test successful');
        return true;
      } else {
        this.logger.warn('API key test failed', { status: response.status });
        return false;
      }
    } catch (error) {
      if (axios.isAxiosError(error)) {
        if (error.response?.status === 401 || error.response?.status === 403) {
          this.logger.warn('API key test failed: authentication error', {
            status: error.response.status,
          });
        } else {
          this.logger.error('API key test failed: network error', {
            message: error.message,
            status: error.response?.status,
          });
        }
      } else {
        this.logger.error('API key test failed: unexpected error', {
          message: error instanceof Error ? error.message : 'Unknown error',
        });
      }
      return false;
    }
  }

  /**
   * Clear the stored API key
   */
  clearApiKey(): void {
    this.apiKey = null;
    this.logger.info('API key cleared');
  }

  /**
   * Get the current header name used for authentication
   */
  getHeaderName(): string {
    return this.headerName;
  }

  /**
   * Set a new header name for authentication
   */
  setHeaderName(headerName: string): void {
    if (!headerName || headerName.trim().length === 0) {
      throw new Error('Header name cannot be empty');
    }

    this.headerName = headerName.trim();
    this.logger.info('Authentication header name updated', { headerName: this.headerName });
  }

  /**
   * Get masked API key for logging purposes (shows only first and last 4 characters)
   */
  getMaskedApiKey(): string | null {
    if (!this.apiKey) {
      return null;
    }

    if (this.apiKey.length <= 8) {
      return '****';
    }

    const start = this.apiKey.substring(0, 4);
    const end = this.apiKey.substring(this.apiKey.length - 4);
    const middle = '*'.repeat(this.apiKey.length - 8);

    return `${start}${middle}${end}`;
  }

  // TODO: Implement OAuth 2.0 flow when API supports it
  // private async authenticateOAuth(): Promise<string> {
  //   throw new Error('OAuth authentication not yet implemented');
  // }
}
