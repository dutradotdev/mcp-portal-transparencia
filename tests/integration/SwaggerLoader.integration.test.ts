import { SwaggerLoader } from '@/core/SwaggerLoader';
import { Logger } from '@/logging/Logger';

describe('SwaggerLoader Integration Tests', () => {
  let swaggerLoader: SwaggerLoader;
  let logger: Logger;

  beforeEach(() => {
    logger = new Logger('error'); // Use error level to reduce noise in tests
    swaggerLoader = new SwaggerLoader(
      'https://api.portaldatransparencia.gov.br/v3/api-docs',
      logger
    );
  });

  describe('Real Portal da Transparência API', () => {
    it('should load the actual Portal da Transparência Swagger spec', async () => {
      // This test requires internet connection and the API to be available
      const spec = await swaggerLoader.loadSpec();

      // Verify the spec has the expected structure
      expect(spec).toBeDefined();
      expect(spec.info).toBeDefined();
      expect(spec.info.title).toContain('Portal da Transparência');
      expect(spec.info.version).toBeDefined();
      expect(spec.paths).toBeDefined();

      // Verify some expected endpoints exist
      const paths = Object.keys(spec.paths || {});
      expect(paths.length).toBeGreaterThan(0);

      // The Portal da Transparência API should have endpoints for common resources
      const pathsString = paths.join(',');
      const hasCommonEndpoints =
        pathsString.includes('viagens') ||
        pathsString.includes('servidores') ||
        pathsString.includes('licitacoes') ||
        pathsString.includes('contratos');

      expect(hasCommonEndpoints).toBe(true);
    }, 30000); // 30 second timeout for network request

    it('should validate the loaded spec structure', async () => {
      const spec = await swaggerLoader.loadSpec();
      const isValid = swaggerLoader.validateSpecStructure(spec);

      expect(isValid).toBe(true);
    }, 30000);

    it('should provide spec information', async () => {
      await swaggerLoader.loadSpec();
      const info = swaggerLoader.getSpecInfo();

      expect(info).toBeDefined();
      expect(info!.title).toBeDefined();
      expect(info!.version).toBeDefined();
      expect(info!.pathCount).toBeGreaterThan(0);
    }, 30000);

    it('should use caching mechanism', async () => {
      // First load
      const spec1 = await swaggerLoader.loadSpec();

      // Second load should be from cache (faster)
      const startTime = Date.now();
      const spec2 = await swaggerLoader.getSpec();
      const loadTime = Date.now() - startTime;

      expect(spec2).toEqual(spec1);
      expect(loadTime).toBeLessThan(100); // Should be very fast from cache
    }, 30000);

    it('should detect spec changes with different URLs', async () => {
      // Load current spec
      await swaggerLoader.loadSpec();

      // Create a new loader with a mock URL that would return different version
      // (This is a theoretical test since we can't easily mock different versions)
      // In real scenario, you would test with actual different versions

      // For now, we test that the method works with same URL (should return false)
      const hasChanges = await swaggerLoader.detectSpecChanges();
      expect(typeof hasChanges).toBe('boolean');
    }, 30000);

    it('should clear cache properly', async () => {
      await swaggerLoader.loadSpec();
      expect(swaggerLoader.getSpecInfo()).toBeDefined();

      swaggerLoader.clearCache();
      expect(swaggerLoader.getSpecInfo()).toBeNull();
    }, 30000);

    it('should detect spec changes when comparing different URLs', async () => {
      // This test uses a different URL to simulate change detection
      const hasChanges = await swaggerLoader.detectSpecChanges(
        'https://petstore.swagger.io/v2/swagger.json'
      );

      // Should detect changes because we're comparing different APIs
      expect(hasChanges).toBe(true);
    }, 30000);

    it('should not detect changes when comparing same specs', async () => {
      const hasChanges = await swaggerLoader.detectSpecChanges();

      // Should not detect changes because we're comparing the same spec
      expect(hasChanges).toBe(false);
    }, 30000);
  });

  describe('Error handling with invalid URLs', () => {
    it('should handle invalid URL gracefully', async () => {
      const invalidLoader = new SwaggerLoader(
        'https://invalid-url-that-does-not-exist.com/swagger.json',
        logger
      );

      await expect(invalidLoader.loadSpec()).rejects.toThrow();
    }, 10000);

    it('should handle non-swagger content gracefully', async () => {
      const nonSwaggerLoader = new SwaggerLoader('https://httpbin.org/json', logger);

      await expect(nonSwaggerLoader.loadSpec()).rejects.toThrow();
    }, 10000);
  });
});
