const typescript = require('@rollup/plugin-typescript');
const { nodeResolve } = require('@rollup/plugin-node-resolve');
const commonjs = require('@rollup/plugin-commonjs');
const terser = require('@rollup/plugin-terser');
const alias = require('@rollup/plugin-alias');
const dts = require('rollup-plugin-dts').default;
const path = require('path');

const input = 'src/index.ts';

// Path mappings configuration
// TODO: Fix bundling with path mappings - currently only works for development/testing
const aliasConfig = {
  entries: [
    { find: '@', replacement: path.resolve(__dirname, 'src') },
    { find: '@/clients', replacement: path.resolve(__dirname, 'src/clients') },
    { find: '@/core', replacement: path.resolve(__dirname, 'src/core') },
    { find: '@/utils', replacement: path.resolve(__dirname, 'src/utils') },
    { find: '@/types', replacement: path.resolve(__dirname, 'src/types') },
    { find: '@/config', replacement: path.resolve(__dirname, 'src/config') },
    { find: '@/errors', replacement: path.resolve(__dirname, 'src/errors') },
    { find: '@/logging', replacement: path.resolve(__dirname, 'src/logging') },
  ],
};

module.exports = [
  // CommonJS build
  {
    input,
    output: {
      file: 'dist/index.js',
      format: 'cjs',
      sourcemap: true,
    },
    external: [
      'axios',
      'swagger-parser',
      '@apidevtools/swagger-parser',
      'openapi-types',
      'openapi-typescript',
      'winston',
      'dotenv',
    ],
    plugins: [
      alias(aliasConfig),
      typescript({
        tsconfig: './tsconfig.json',
        declaration: false,
        sourceMap: true,
      }),
      nodeResolve({
        preferBuiltins: true,
      }),
      commonjs(),
    ],
  },

  // ESM build
  {
    input,
    output: {
      file: 'dist/index.esm.js',
      format: 'es',
      sourcemap: true,
    },
    external: [
      'axios',
      'swagger-parser',
      '@apidevtools/swagger-parser',
      'openapi-types',
      'openapi-typescript',
      'winston',
      'dotenv',
    ],
    plugins: [
      alias(aliasConfig),
      typescript({
        tsconfig: './tsconfig.json',
        declaration: false,
        sourceMap: true,
      }),
      nodeResolve({
        preferBuiltins: true,
      }),
      commonjs(),
    ],
  },

  // Minified ESM build
  {
    input,
    output: {
      file: 'dist/index.esm.min.js',
      format: 'es',
      sourcemap: true,
    },
    external: [
      'axios',
      'swagger-parser',
      '@apidevtools/swagger-parser',
      'openapi-types',
      'openapi-typescript',
      'winston',
      'dotenv',
    ],
    plugins: [
      alias(aliasConfig),
      typescript({
        tsconfig: './tsconfig.json',
        declaration: false,
        sourceMap: true,
      }),
      nodeResolve({
        preferBuiltins: true,
      }),
      commonjs(),
      terser(),
    ],
  },

  // TypeScript declarations
  {
    input,
    output: {
      file: 'dist/index.d.ts',
      format: 'es',
    },
    external: [
      'axios',
      'swagger-parser',
      '@apidevtools/swagger-parser',
      'openapi-types',
      'openapi-typescript',
      'winston',
      'dotenv',
    ],
    plugins: [alias(aliasConfig), dts()],
  },
];
