# Test results

[Русский](TEST_RESULTS.ru.md) | English

Date: September 15, 2026.

## Automated checks

- `npm run typecheck` — passed.
- Vitest — 4 test files and 38 tests passed.
- The adjacent `../jitsi-meet` checkout is not present in this workspace; the contract test instead used the exact upstream `stable/jitsi-meet_11146` archive and passed.
- esbuild production build — passed and produced both distribution variants.
- Standalone checks — passed for both files; neither contains runtime `import`, `export`, or `require` statements.
- `dist/jitsi-meet-pip.js` — 65,580 bytes; SHA-256 `38fef316ca4b7c1f3937251bcd4c28fd87fdb89e5b7109a625bacb393c5430ea`.
- `dist/jitsi-meet-pip.min.js` — 43,050 bytes; SHA-256 `0c661e1e5fcfd01346505ac858357599fe5de2f1e9d69b2aad15a07c132f6223`.
- Both bundles expose the same standalone API and contain the complete MIT copyright and permission notice.
- `npm audit --omit=dev` — 0 runtime vulnerabilities. The full development audit reports two moderate findings in Vitest's test-only mocker dependency; remediation currently requires the next major Vitest release and does not affect either standalone bundle.

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

The `1.2.x` mock includes an active screen share, a local participant, a dominant-speaker rotation, and a screen-share toggle. Version `1.2.14` DOM and unit tests verify that the upper tile switches between the remote active speaker and screen sharing, the featured speaker is excluded before the lower-grid limit, and a speaking share owner returns to the lower grid. The embedded browser closes the secondary always-on-top window immediately after entry, so prolonged interaction with a real Document PiP window remains a manual smoke-test scenario.

## Complete local Jitsi smoke test

Official Jitsi Meet `stable-11146-1` was opened at `https://127.0.0.1:18443/` with a dedicated local CA and a certificate covering `localhost` and `127.0.0.1`. The stack uses relative BOSH with XMPP WebSocket disabled.

Verified behavior:

- `plugin.head.html` loads the current minified bundle after `app.bundle.min.js`;
- the page uses cache key `v=1.2.14`, and the bundle served by Jitsi matches the local production build byte-for-byte;
- the Picture-in-Picture toolbar item remains registered after Jitsi asynchronously reloads `config.js`;
- multiple local browser clients can join the same room, and JVB completes ICE and DTLS;
- Auto PiP distinguishes `contentoccluded` from `useraction`, synchronizes Media Session capture state, and reports missing browser events after returning;
- Auto PiP registers again when a live local capture track appears and exposes protocol, secure-context, capture, and handler readiness;
- HTTP loopback origins receive accurate HTTPS diagnostics instead of a false permission prompt;
- manually closing automatic PiP suppresses further automatic openings for the current conference instance without disabling manual PiP;
- the large tile selects and detaches remote and local desktop tracks without leaks;
- without sharing, the upper tile shows the active remote speaker or their avatar and excludes that participant from the lower grid before applying the limit;
- during sharing, normal lower-grid selection resumes, so a speaking share owner can appear below while an inactive owner is not inserted specially;
- the local participant remains the first lower card, and one or three real cards are completed to two or four positions with an accessible placeholder;
- the upper featured-media slot and lower participant section remain equal in height at the initial `240×480` size;
- microphone and camera icons follow enabled and muted states;
- the red hangup control uses the plugin's own filled SVG and has no dependency on Jitsi toolbar DOM;
- conference and lobby counts update through Redux without reopening PiP;
- all UI labels can be configured through `config.browserPip`, while the default title remains `PiP`;
- the complete MIT text is embedded in both standalone bundles.

The September 15 browser smoke test confirmed the plugin button in Jitsi's native “More actions” menu and invoked manual PiP. No console entries originated from `JitsiBrowserPiP`; unrelated local Jitsi warnings about missing TURN credentials, Wake Lock, and the bundled XML utility remain visible.

The local HTTPS endpoint responds over HTTP/2, and its certificate chain was verified with the generated CA. The local CA was added to the current macOS login keychain only after explicit user approval; removal instructions are in [test/jitsi/README.md](../test/jitsi/README.md).

The stack was intentionally left available for manual testing. Start, log, and stop commands are documented in [test/jitsi/README.md](../test/jitsi/README.md).
