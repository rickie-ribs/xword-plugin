// Bundles each entry in src/ into one self-contained file in plugin/dist/, committed so users need only Node.
import { build } from 'esbuild';
import { existsSync } from 'node:fs';

const entries = ['xw', 'nyt', 'setup'].filter((name) => existsSync(`src/${name}.ts`));
await build({
  entryPoints: entries.map((name) => ({ in: `src/${name}.ts`, out: name })),
  outdir: 'plugin/dist',
  outExtension: { '.js': '.mjs' },
  bundle: true,
  platform: 'node',
  format: 'esm',
  target: 'node20',
  legalComments: 'none',
  logLevel: 'info',
});
