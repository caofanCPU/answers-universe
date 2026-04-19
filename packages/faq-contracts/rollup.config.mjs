import commonjs from '@rollup/plugin-commonjs';
import nodeResolve from '@rollup/plugin-node-resolve';
import typescript from '@rollup/plugin-typescript';

export default {
  input: {
    index: './src/index.ts',
    'outer/v1/index': './src/outer/v1/index.ts',
  },
  output: [
    {
      dir: './dist',
      entryFileNames: '[name].js',
      format: 'esm',
      sourcemap: false,
    },
  ],
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
