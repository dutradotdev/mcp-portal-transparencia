/**
 * MCP Portal da Transparência
 * Multi-step Call Planner for the Brazilian Government Transparency Portal API
 *
 * @author Lucas Dutra
 * @version 1.0.0
 */

// Export main components
export { ClientGenerator } from './core/ClientGenerator.js';
export { SwaggerLoader } from './core/SwaggerLoader.js';
export { Authentication } from './core/Authentication.js';
export { Logger } from './logging/Logger.js';

// Export core types and interfaces (to be implemented)
// export * from '@/types';

// Export utility functions
// export * from '@/utils';

// Export error classes
// export * from '@/errors';

// Default export (to be replaced with main client)
export default {
  name: 'mcp-portal-transparencia',
  version: '1.0.0',
  description: 'Multi-step Call Planner for Portal da Transparência API',
};
