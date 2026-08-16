import { mkdir, readFile, rm } from 'node:fs/promises';
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
const distDirectory = resolve(projectRoot, 'dist');
const outputs = debug
    ? [ { filename: 'jitsi-meet-pip.js', minify: false, sourcemap: true } ]
    : [
        { filename: 'jitsi-meet-pip.js', minify: false, sourcemap: false },
        { filename: 'jitsi-meet-pip.min.js', minify: true, sourcemap: false }
    ];

await mkdir(distDirectory, { recursive: true });

if (!debug) {
    await rm(resolve(distDirectory, 'jitsi-meet-pip.js.map'), { force: true });
}

for (const output of outputs) {
    const outfile = resolve(distDirectory, output.filename);

    await build({
        banner: {
            js: `/*!\n${legalBanner}\n */`
        },
        bundle: true,
        entryPoints: [ resolve(projectRoot, 'src/index.ts') ],
        format: 'iife',
        legalComments: 'none',
        minify: output.minify,
        outfile,
        platform: 'browser',
        sourcemap: output.sourcemap,
        target: [ 'chrome120', 'edge120', 'firefox115', 'safari16' ],
        treeShaking: true
    });

    console.log(`Built ${outfile}`);
}
