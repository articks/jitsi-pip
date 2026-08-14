import { access, readFile } from 'node:fs/promises';
import { dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

const projectRoot = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const jitsiRoot = resolve(process.env.JITSI_SOURCE_DIR || resolve(projectRoot, '../jitsi-meet'));

const checks = [
    {
        file: 'index.html',
        assertions: [
            [ /app\.bundle\.min\.js[\s\S]*plugin\.head\.html/u, 'plugin.head.html must be loaded after app.bundle.min.js' ]
        ]
    },
    {
        file: 'app.js',
        assertions: [
            [ /window\.APP\s*=\s*\{/u, 'window.APP must be published' ],
            [ /\bAPI\s*,[\s\S]*\bconference\s*,/u, 'APP must expose API and conference' ]
        ]
    },
    {
        file: 'react/features/base/app/components/BaseApp.tsx',
        assertions: [
            [ /APP\.store\s*=\s*store/u, 'Redux store must be published as APP.store' ]
        ]
    },
    {
        file: 'react/features/base/config/reducer.ts',
        assertions: [
            [ /case OVERWRITE_CONFIG:[\s\S]*\.\.\.action\.config/u, 'OVERWRITE_CONFIG must replace selected config properties' ]
        ]
    },
    {
        file: 'react/features/toolbox/functions.any.ts',
        assertions: [
            [ /customToolbarButtons\?\.map\(\(\{ id \}\) => id\)/u, 'custom toolbar IDs must be collected' ],
            [ /return \[ \.\.\.buttons, \.\.\.customButtons \]/u, 'custom buttons must be appended to toolbar' ]
        ]
    },
    {
        file: 'react/features/toolbox/middleware.web.ts',
        assertions: [
            [ /case OVERWRITE_CONFIG:/u, 'toolbox must react to late config overwrite' ]
        ]
    },
    {
        file: 'react/features/base/toolbox/components/AbstractButton.tsx',
        assertions: [
            [ /APP\.API\.notifyToolbarButtonClicked/u, 'custom button clicks must notify APP.API' ]
        ]
    },
    {
        file: 'react/features/base/participants/reducer.ts',
        assertions: [
            [ /(?:activeSpeakers:\s*new Set(?:<[^>]+>)?\s*\(|speakersList:\s*new Map\s*\()/u, 'participants state must expose activeSpeakers or speakersList' ],
            [ /dominantSpeaker:\s*undefined/u, 'participants state must expose dominantSpeaker' ],
            [ /remote:\s*new Map/u, 'participants state must expose remote map' ]
        ]
    },
    {
        file: 'react/features/base/tracks/reducer.ts',
        assertions: [
            [ /register<ITracksState>\('features\/base\/tracks'/u, 'tracks reducer key must remain stable' ]
        ]
    }
];

await access(jitsiRoot);
const failures = [];

for (const check of checks) {
    const path = resolve(jitsiRoot, check.file);
    let source;

    try {
        source = await readFile(path, 'utf8');
    } catch (error) {
        failures.push(`${check.file}: cannot read (${error.message})`);
        continue;
    }

    for (const [ pattern, description ] of check.assertions) {
        if (!pattern.test(source)) {
            failures.push(`${check.file}: ${description}`);
        }
    }
}

if (failures.length) {
    throw new Error(`Jitsi compatibility contract failed for ${jitsiRoot}:\n- ${failures.join('\n- ')}`);
}

console.log(`Jitsi compatibility contract OK: ${jitsiRoot}`);
console.log('Expected upstream baseline: 2.0.11146 / stable/jitsi-meet_11146 / 48d96e4');
