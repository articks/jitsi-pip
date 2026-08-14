import { mkdir } from 'node:fs/promises';
import { dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

import { build } from 'esbuild';

const projectRoot = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const debug = process.argv.includes('--debug');
const outfile = resolve(projectRoot, debug
    ? 'dist/jitsi-meet-pip.js'
    : 'dist/jitsi-meet-pip.min.js');

await mkdir(dirname(outfile), { recursive: true });
await build({
    banner: {
        js: '/*! Jitsi Meet Browser PiP v1.0.0 | Target: Jitsi Meet 2.0.11146 */'
    },
    bundle: true,
    entryPoints: [ resolve(projectRoot, 'src/index.ts') ],
    format: 'iife',
    legalComments: 'none',
    minify: !debug,
    outfile,
    platform: 'browser',
    sourcemap: debug,
    target: [ 'chrome120', 'edge120', 'firefox115', 'safari16' ],
    treeShaking: true
});

console.log(`Built ${outfile}`);
