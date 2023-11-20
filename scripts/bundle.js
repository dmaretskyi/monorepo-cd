import { build } from 'esbuild'

await build({
  entryPoints: ['src/main.tsx'],
  outfile: 'bin/main-bundle.js',
  bundle: true,
  platform: 'node',
  format: 'esm',
  define: {
    'process.env.NODE_ENV': '"production"',
  },
  plugins: [
    {
      name: 'void-module',
      setup: build => {
        build.onResolve({ filter: /^react-devtools-core$/ }, args => ({ path: args.path, namespace: 'void-module' })),
        build.onLoad({ filter: /./, namespace: 'void-module' }, async () => ({
          contents: 'const error = new Error(); error.code = "MODULE_NOT_FOUND"; throw error;',
          loader: 'js',
          
        }))
      },
    }
  ]
})