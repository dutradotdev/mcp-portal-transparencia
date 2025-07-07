import axios from 'axios';
import SwaggerParser from '@apidevtools/swagger-parser';
import { OpenAPI } from 'openapi-types';
import { Logger } from '@/logging/Logger';

interface OpenAPIVersionCheck {
  openapi?: string;
  swagger?: string;
}

export class SwaggerLoader {
  private specUrl: string;
  private cachedSpec: OpenAPI.Document | null = null;
  private logger: Logger;
  private authHeaders?: Record<string, string>;

  constructor(
    specUrl: string = 'https://api.portaldatransparencia.gov.br/v3/api-docs',
    logger: Logger,
    authHeaders?: Record<string, string>
  ) {
    this.specUrl = specUrl;
    this.logger = logger;
    this.authHeaders = authHeaders;
  }

  async loadSpec(): Promise<OpenAPI.Document> {
    try {
      this.logger.info('Loading Swagger specification', {
        url: this.specUrl,
        hasAuth: !!this.authHeaders,
      });

      const response = await axios.get(this.specUrl, {
        headers: this.authHeaders || {},
      });
      const rawSpec = response.data;

      // Validate the spec
      const validatedSpec = (await SwaggerParser.validate(rawSpec)) as OpenAPI.Document;
      this.cachedSpec = validatedSpec;
      this.logger.info('Swagger specification loaded successfully');
      return validatedSpec;
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : String(error);
      this.logger.error('Failed to load Swagger specification', { error });
      throw new Error(`Failed to load Swagger specification: ${errorMessage}`);
    }
  }

  async getSpec(): Promise<OpenAPI.Document> {
    if (!this.cachedSpec) {
      return this.loadSpec();
    }
    return this.cachedSpec;
  }

  async detectSpecChanges(newSpecUrl?: string): Promise<boolean> {
    const currentSpec = await this.getSpec();
    const newSpec = await new SwaggerLoader(newSpecUrl || this.specUrl, this.logger).loadSpec();

    // Compare versions or other relevant properties
    return currentSpec.info.version !== newSpec.info.version;
  }

  /**
   * Validates the loaded spec for required fields and structure
   */
  validateSpecStructure(spec: OpenAPI.Document): boolean {
    try {
      // Check for required OpenAPI fields
      const specVersionCheck = spec as OpenAPIVersionCheck;
      if (!specVersionCheck.openapi && !specVersionCheck.swagger) {
        throw new Error('Missing OpenAPI/Swagger version');
      }

      if (!spec.info) {
        throw new Error('Missing info section');
      }

      if (!spec.info.title || !spec.info.version) {
        throw new Error('Missing required info fields (title, version)');
      }

      if (!spec.paths) {
        throw new Error('Missing paths section');
      }

      this.logger.info('Swagger specification structure validation passed');
      return true;
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : String(error);
      this.logger.error('Swagger specification structure validation failed', {
        error: errorMessage,
      });
      return false;
    }
  }

  /**
   * Gets basic information about the loaded spec
   */
  getSpecInfo(): { title: string; version: string; pathCount: number } | null {
    if (!this.cachedSpec) {
      return null;
    }

    return {
      title: this.cachedSpec.info.title,
      version: this.cachedSpec.info.version,
      pathCount: Object.keys(this.cachedSpec.paths || {}).length,
    };
  }

  /**
   * Clears the cached spec to force reload on next access
   */
  clearCache(): void {
    this.cachedSpec = null;
    this.logger.debug('Swagger specification cache cleared');
  }
}
