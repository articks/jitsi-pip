import { mkdir, readFile } from 'node:fs/promises';
import { dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

import { build } from 'esbuild';

const projectRoot = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const packageMetadata = JSON.parse(await readFile(resolve(projectRoot, 'package.json'), 'utf8'));
const licenseText = await readFile(resolve(projectRoot, 'LICENSE'), 'utf8');
const legalBanner = [
    `Jitsi Meet Browser PiP v${packageMetadata.version}`,
    'https://github.com/articks/jitsi-pip',
    '',
    ...licenseText.trim().split('\n')
].map(line => line ? ` * ${line}` : ' *')
    .join('\n');
const debug = process.argv.includes('--debug');
const outfile = resolve(projectRoot, debug
    ? 'dist/jitsi-meet-pip.js'
    : 'dist/jitsi-meet-pip.min.js');

await mkdir(dirname(outfile), { recursive: true });
await build({
    banner: {
        js: `/*!\n${legalBanner}\n */`
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
