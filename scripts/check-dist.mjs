import { readFile, stat } from 'node:fs/promises';
import { dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

const projectRoot = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const bundlePath = resolve(projectRoot, 'dist/jitsi-meet-pip.min.js');
const bundle = await readFile(bundlePath, 'utf8');
const metadata = await stat(bundlePath);

const failures = [];

if (!bundle.includes('JitsiBrowserPiP')) {
    failures.push('public global API marker is missing');
}
if (/\b(?:import|export)\s+(?:["'{*]|from\b)/u.test(bundle)) {
    failures.push('bundle still contains an ESM import/export');
}
if (/\brequire\s*\(/u.test(bundle)) {
    failures.push('bundle contains a CommonJS require call');
}
if (metadata.size > 100_000) {
    failures.push(`bundle is unexpectedly large: ${metadata.size} bytes`);
}

if (failures.length) {
    throw new Error(`Distribution check failed:\n- ${failures.join('\n- ')}`);
}

console.log(`Distribution OK: one standalone JS, ${metadata.size} bytes`);
