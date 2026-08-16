import { readFile, stat } from 'node:fs/promises';
import { dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

const projectRoot = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const failures = [];
const bundles = [
    { filename: 'jitsi-meet-pip.js', maximumSize: 200_000 },
    { filename: 'jitsi-meet-pip.min.js', maximumSize: 100_000 }
];
const sizes = new Map();

for (const { filename, maximumSize } of bundles) {
    const bundlePath = resolve(projectRoot, 'dist', filename);
    const bundle = await readFile(bundlePath, 'utf8');
    const metadata = await stat(bundlePath);

    sizes.set(filename, metadata.size);

    if (!bundle.includes('JitsiBrowserPiP')) {
        failures.push(`${filename}: public global API marker is missing`);
    }
    if (!bundle.includes('Copyright (c) 2026 Dmitry Karasev <articks@gmail.com>')
            || !bundle.includes('Permission is hereby granted, free of charge')) {
        failures.push(`${filename}: MIT copyright and permission notice is missing`);
    }
    if (/\b(?:import|export)\s+(?:["'{*]|from\b)/u.test(bundle)) {
        failures.push(`${filename}: bundle still contains an ESM import/export`);
    }
    if (/\brequire\s*\(/u.test(bundle)) {
        failures.push(`${filename}: bundle contains a CommonJS require call`);
    }
    if (metadata.size > maximumSize) {
        failures.push(`${filename}: bundle is unexpectedly large: ${metadata.size} bytes`);
    }
}

if (sizes.get('jitsi-meet-pip.js') <= sizes.get('jitsi-meet-pip.min.js')) {
    failures.push('unminified bundle must be larger than the minified bundle');
}

if (failures.length) {
    throw new Error(`Distribution check failed:\n- ${failures.join('\n- ')}`);
}

console.log(`Distribution OK: ${bundles.map(({ filename }) => `${filename} ${sizes.get(filename)} bytes`).join(', ')}`);
