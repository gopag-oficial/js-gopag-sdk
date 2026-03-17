import resolve from '@rollup/plugin-node-resolve';
import commonjs from '@rollup/plugin-commonjs';
import terser from '@rollup/plugin-terser';

const production = !process.env.ROLLUP_WATCH;

export default [
  // UMD build (para CDN e uso direto no browser)
  {
    input: 'src/index.js',
    output: {
      name: 'GoPagSDK',
      file: 'dist/gopag-sdk.umd.js',
      format: 'umd',
      sourcemap: true,
      exports: 'default'
    },
    plugins: [
      resolve(),
      commonjs()
    ]
  },
  // UMD minified (para CDN)
  {
    input: 'src/index.js',
    output: {
      name: 'GoPagSDK',
      file: 'dist/gopag-sdk.umd.min.js',
      format: 'umd',
      sourcemap: true,
      exports: 'default'
    },
    plugins: [
      resolve(),
      commonjs(),
      production && terser()
    ]
  },
  // ESM build (para bundlers modernos)
  {
    input: 'src/index.js',
    output: {
      file: 'dist/gopag-sdk.esm.js',
      format: 'esm',
      sourcemap: true
    },
    plugins: [
      resolve(),
      commonjs()
    ]
  },
  // CommonJS build (para Node.js)
  {
    input: 'src/index.js',
    output: {
      file: 'dist/gopag-sdk.cjs.js',
      format: 'cjs',
      sourcemap: true,
      exports: 'default'
    },
    plugins: [
      resolve(),
      commonjs()
    ]
  }
];
