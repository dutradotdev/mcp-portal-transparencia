/**
 * MCP Portal da Transparência
 * Multi-step Call Planner for the Brazilian Government Transparency Portal API
 *
 * @author Lucas Dutra
 * @version 1.0.0
 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.Logger = exports.SwaggerLoader = void 0;
// Export core classes
var SwaggerLoader_1 = require("./core/SwaggerLoader");
Object.defineProperty(exports, "SwaggerLoader", { enumerable: true, get: function () { return SwaggerLoader_1.SwaggerLoader; } });
// Export logging utilities
var Logger_1 = require("./logging/Logger");
Object.defineProperty(exports, "Logger", { enumerable: true, get: function () { return Logger_1.Logger; } });
// Export core types and interfaces (to be implemented)
// export * from '@/types';
// Export utility functions
// export * from '@/utils';
// Export error classes
// export * from '@/errors';
// Default export (to be replaced with main client)
exports.default = {
    name: 'mcp-portal-transparencia',
    version: '1.0.0',
    description: 'Multi-step Call Planner for Portal da Transparência API',
};
//# sourceMappingURL=index.esm.js.map
