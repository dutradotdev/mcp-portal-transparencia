#!/usr/bin/env node

const path = require('path');
const fs = require('fs');

// Check if we're in development mode or production
const isDev = fs.existsSync(path.join(__dirname, '../src/mcp-server.ts'));

if (isDev) {
  // Development mode - use ts-node to run TypeScript directly
  require('ts-node/register');
  require('tsconfig-paths/register');
  const { MCPPortalServer } = require('../src/mcp-server.ts');

  async function main() {
    try {
      const server = new MCPPortalServer();
      await server.start();
    } catch (error) {
      console.error('Failed to start MCP server:', error);
      process.exit(1);
    }
  }

  main().catch(console.error);
} else {
  // Production mode - use compiled JavaScript
  const { MCPPortalServer } = require('../dist/mcp-server.js');

  async function main() {
    try {
      const server = new MCPPortalServer();
      await server.start();
    } catch (error) {
      console.error('Failed to start MCP server:', error);
      process.exit(1);
    }
  }

  main().catch(console.error);
}
