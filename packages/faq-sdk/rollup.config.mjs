import commonjs from '@rollup/plugin-commonjs';
import nodeResolve from '@rollup/plugin-node-resolve';
import typescript from '@rollup/plugin-typescript';

export default {
  input: './src/index.ts',
  output: [
    {
      file: './dist/index.js',
      format: 'esm',
      sourcemap: false,
    },
  ],
  external: ['@windrun-huaiin/faq-contracts', '@windrun-huaiin/faq-contracts/outer/v1'],
  plugins: [
    nodeResolve({
      extensions: ['.ts', '.js'],
    }),
    commonjs(),
    typescript({
      tsconfig: './tsconfig.json',
      declaration: true,
      declarationDir: './dist',
      outDir: './dist',
      rootDir: './src',
    }),
  ],
};
