# Test results

[Русский](TEST_RESULTS.ru.md) | English

Date: August 16, 2026.

## Automated checks

- `npm run typecheck` — passed.
- Vitest — 4 test files and 35 tests passed.
- Contract test against the adjacent local Jitsi tree — passed.
- Contract test against the exact upstream `stable/jitsi-meet_11146` archive — passed.
- esbuild production build — passed and produced both distribution variants.
- Standalone checks — passed for both files; neither contains runtime `import`, `export`, or `require` statements.
- `dist/jitsi-meet-pip.js` — 64,079 bytes; SHA-256 `71749ada783bebb9d2eb25f6c2ca1e4967c951ce1671f7bd853a2cc096e6aff4`.
- `dist/jitsi-meet-pip.min.js` — 42,339 bytes; SHA-256 `2f783a857e1938149068fd9dd4990ec1383895f7a5bc9c67986498c28e8e0f00`.
- Both bundles expose the same standalone API and contain the complete MIT copyright and permission notice.
- `npm audit` — 0 known vulnerabilities at the previous dependency audit.

## Docker

The complete `npm run check` command has passed in a local `node:24-bookworm` container through the Docker Compose project `jitsi-meet-pip-test`.

The separate `jitsi-meet-pip-local` integration stack uses official `stable-11146-1` images. Its `web`, `prosody`, `jicofo`, and `jvb` services bind only to localhost and use configuration under `test/jitsi/`.

## Browser smoke test

The local `test/browser/index.html` page was served from an isolated Docker container and opened through `127.0.0.1`.

Verified behavior:

- the bundle loads and publishes `JitsiBrowserPiP`;
- Document PiP support is detected;
- four remote tracks can be selected and reordered;
- the toolbar event produces a real `document-pip-enter` event;
- the browser console contains no plugin errors or warnings during the normal scenario.

The `1.2.x` mock includes an active screen share, a local participant, and a screen-share toggle. DOM and unit tests verify the portrait layout, local-card ordering, placeholders, controls, and counters. The embedded browser closes the secondary always-on-top window immediately after entry, so prolonged interaction with a real Document PiP window remains a manual smoke-test scenario.

## Complete local Jitsi smoke test

Official Jitsi Meet `stable-11146-1` was opened at `https://127.0.0.1:18443/` with a dedicated local CA and a certificate covering `localhost` and `127.0.0.1`. The stack uses relative BOSH with XMPP WebSocket disabled.

Verified behavior:

- `plugin.head.html` loads the current minified bundle after `app.bundle.min.js`;
- the bundle served by Jitsi matches the local production build;
- the Picture-in-Picture toolbar item remains registered after Jitsi asynchronously reloads `config.js`;
- multiple local browser clients can join the same room, and JVB completes ICE and DTLS;
- Auto PiP distinguishes `contentoccluded` from `useraction`, synchronizes Media Session capture state, and reports missing browser events after returning;
- Auto PiP registers again when a live local capture track appears and exposes protocol, secure-context, capture, and handler readiness;
- HTTP loopback origins receive accurate HTTPS diagnostics instead of a false permission prompt;
- manually closing automatic PiP suppresses further automatic openings for the current conference instance without disabling manual PiP;
- the large tile selects and detaches remote and local desktop tracks without leaks;
- the local participant remains the first card, and one or three real cards are completed to two or four positions with an accessible placeholder;
- the upper screen-share slot and lower participant section remain equal in height at the initial `240×480` size;
- microphone and camera icons follow enabled and muted states;
- the red hangup control uses the plugin's own filled SVG and has no dependency on Jitsi toolbar DOM;
- conference and lobby counts update through Redux without reopening PiP;
- all UI labels can be configured through `config.browserPip`, while the default title remains `PiP`;
- the complete MIT text is embedded in both standalone bundles.

The local HTTPS endpoint responds over HTTP/2, and its certificate chain was verified with the generated CA. The local CA was added to the current macOS login keychain only after explicit user approval; removal instructions are in [test/jitsi/README.md](../test/jitsi/README.md).

The stack was intentionally left available for manual testing. Start, log, and stop commands are documented in [test/jitsi/README.md](../test/jitsi/README.md).
