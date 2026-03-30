import { build } from 'esbuild';

await build({
  entryPoints: ['src/index.ts'],
  bundle: true,
  platform: 'node',
  target: 'node22',
  outfile: 'dist/index.js',
  external: ['playwright', 'pino', 'pino-pretty'], // must stay external: playwright for binary resolution, pino for worker_threads
  format: 'cjs',
});
