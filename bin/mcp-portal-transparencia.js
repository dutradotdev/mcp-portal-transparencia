#!/usr/bin/env node

import path from 'path';
import fs from 'fs';
import { fileURLToPath } from 'url';

// Get __dirname equivalent in ES modules
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Check if we're in development mode (running from source)
const isDevMode =
  process.env.NODE_ENV === 'development' || !fs.existsSync(path.join(__dirname, '..', 'dist'));

async function main() {
  try {
    if (isDevMode) {
      // Development mode - use ts-node
      try {
        const tsNode = await import('ts-node/esm');
        await tsNode.register({
          esm: true,
          tsconfig: path.join(__dirname, '..', 'tsconfig.json'),
        });

        // Load and start the MCP server from source
        const { MCPPortalServer } = await import('../src/mcp-server.ts');

        const server = new MCPPortalServer();
        await server.initialize();
        await server.start();
      } catch (tsError) {
        console.error('Development mode failed, trying production mode...', tsError.message);
        // Fallback to production mode
        const { MCPPortalServer } = await import('../dist/src/mcp-server.js');

        const server = new MCPPortalServer();
        await server.initialize();
        await server.start();
      }
    } else {
      // Production mode - use compiled JS
      const { MCPPortalServer } = await import('../dist/src/mcp-server.js');

      const server = new MCPPortalServer();
      await server.initialize();
      await server.start();
    }
  } catch (error) {
    console.error('Failed to start MCP Portal da Transparência server:', error);
    process.exit(1);
  }
}

main().catch(console.error);
