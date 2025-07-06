const typescript = require('@rollup/plugin-typescript');
const { nodeResolve } = require('@rollup/plugin-node-resolve');
const commonjs = require('@rollup/plugin-commonjs');
const terser = require('@rollup/plugin-terser');
const dts = require('rollup-plugin-dts').default;

const input = 'src/index.ts';

module.exports = [
  // CommonJS build
  {
    input,
    output: {
      file: 'dist/index.js',
      format: 'cjs',
      sourcemap: true,
    },
    external: ['axios', 'swagger-parser', 'openapi-typescript', 'winston', 'dotenv'],
    plugins: [
      nodeResolve({
        preferBuiltins: true,
      }),
      commonjs(),
      typescript({
        tsconfig: './tsconfig.json',
        declaration: false,
        sourceMap: true,
      }),
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
    external: ['axios', 'swagger-parser', 'openapi-typescript', 'winston', 'dotenv'],
    plugins: [
      nodeResolve({
        preferBuiltins: true,
      }),
      commonjs(),
      typescript({
        tsconfig: './tsconfig.json',
        declaration: false,
        sourceMap: true,
      }),
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
    external: ['axios', 'swagger-parser', 'openapi-typescript', 'winston', 'dotenv'],
    plugins: [
      nodeResolve({
        preferBuiltins: true,
      }),
      commonjs(),
      typescript({
        tsconfig: './tsconfig.json',
        declaration: false,
        sourceMap: true,
      }),
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
    external: ['axios', 'swagger-parser', 'openapi-typescript', 'winston', 'dotenv'],
    plugins: [dts()],
  },
];
