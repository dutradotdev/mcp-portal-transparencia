#!/usr/bin/env node

const path = require('path');
const fs = require('fs');

// Check if we're in development mode (running from source)
const isDevMode =
  process.env.NODE_ENV === 'development' || !fs.existsSync(path.join(__dirname, '..', 'dist'));

if (isDevMode) {
  // Development mode - use ts-node
  require('ts-node/register');
  const tsConfigPath = path.join(__dirname, '..', 'tsconfig.json');

  if (fs.existsSync(tsConfigPath)) {
    process.env.TS_NODE_PROJECT = tsConfigPath;
  }

  // Load and start the MCP server from source
  const { MCPPortalServer } = require('../src/mcp-server.ts');

  async function main() {
    try {
      const server = new MCPPortalServer();
      await server.initialize();
      await server.start();
    } catch (error) {
      console.error('Failed to start MCP Portal da Transparência server:', error);
      process.exit(1);
    }
  }

  main().catch(console.error);
} else {
  // Production mode - use compiled JS
  const { MCPPortalServer } = require('../dist/src/mcp-server.js');

  async function main() {
    try {
      const server = new MCPPortalServer();
      await server.initialize();
      await server.start();
    } catch (error) {
      console.error('Failed to start MCP Portal da Transparência server:', error);
      process.exit(1);
    }
  }

  main().catch(console.error);
}
