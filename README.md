# Jitsi Meet Browser PiP

[Русский](README.ru.md) | English

A standalone Jitsi Meet plugin that opens a separate Picture-in-Picture window with multiple active participants and conference controls.

This is open source software distributed under the [MIT License](LICENSE). Any use, modification, and distribution, including commercial use, is permitted as long as the copyright notice and license text are retained. Author: [Dmitry Karasev](https://github.com/articks) <articks@gmail.com>.

The plugin is developed and tested against Jitsi Meet `2.0.11146` (`stable/jitsi-meet_11146`, commit `48d96e4`). It uses the internal `window.APP`, `APP.store`, and `APP.conference` objects, so the contract test must be repeated after upgrading Jitsi.

## Installation

For production, copy `dist/jitsi-meet-pip.min.js` to a directory served by Jitsi, such as `/usr/share/jitsi-meet/libs/`, and add this to `plugin.head.html`:

```html
<script src="/libs/jitsi-meet-pip.min.js?v=1.2.12"></script>
```

The stock Jitsi Meet 2.0.11146 `plugin.head.html` is included after `app.bundle.min.js`. The plugin first adds its button to the global `config.customToolbarButtons` array and synchronizes it with the Redux configuration after `APP.store` becomes available. This keeps the button registered even when Jitsi asynchronously reloads `config.js`.

A regular `npm run build` produces two functionally identical standalone files with no runtime dependencies:

- `dist/jitsi-meet-pip.min.js` — minified production bundle;
- `dist/jitsi-meet-pip.js` — readable unminified bundle for auditing and debugging.

`npm run build:debug` additionally creates a source map for the unminified file.

Changing `config.js` is optional. To customize the plugin, define these settings before loading it:

```js
config.browserPip = {
    enabled: true,
    autoOpen: true,
    showScreenShare: true,
    includeLocalScreenShare: true,
    maxParticipants: 4,
    closeAutoOnReturn: true,
    buttonText: 'Picture in Picture',
    windowTitle: 'PiP',
    microphoneLabel: 'Microphone',
    cameraLabel: 'Camera',
    enableMicrophoneLabel: 'Turn on microphone',
    disableMicrophoneLabel: 'Turn off microphone',
    enableCameraLabel: 'Turn on camera',
    disableCameraLabel: 'Turn off camera',
    returnToConferenceLabel: 'Return to conference',
    hangupLabel: 'Hang up',
    noScreenShareLabel: 'No active screen share',
    waitingParticipantLabel: 'Waiting for a participant',
    noActiveSpeakerLabel: 'No active speaker',
    participantLabel: 'Participant',
    screenShareLabel: 'Screen share',
    youLabel: 'You',
    participantsLabel: 'Participants',
    lobbyLabel: 'In lobby'
};
```

## Labels and localization

The standalone plugin does not read Jitsi language files. All UI labels are configured through `config.browserPip`. The example above provides an English localization; built-in defaults remain Russian, while the default window title is `PiP`.

| Field | Usage |
| --- | --- |
| `buttonText` | Jitsi toolbar button |
| `windowTitle` | Document PiP window title |
| `microphoneLabel`, `cameraLabel` | Initial accessible button names |
| `enableMicrophoneLabel`, `disableMicrophoneLabel` | Microphone button action |
| `enableCameraLabel`, `disableCameraLabel` | Camera button action |
| `returnToConferenceLabel` | Return to the main conference window |
| `hangupLabel` | End the call |
| `screenShareLabel`, `youLabel` | Active screen-share label, including a local share |
| `participantLabel` | Participant fallback name |
| `noScreenShareLabel`, `waitingParticipantLabel` | Empty-state icon `aria-label` values |
| `noActiveSpeakerLabel` | Video PiP fallback text when no participant is available |
| `participantsLabel`, `lobbyLabel` | Dynamic counter labels |

An empty or whitespace-only label falls back to its built-in value. Auto PiP diagnostic messages about protocol, capture, and site permission are internal plugin messages and are not configurable UI labels.

## Behavior

- The first card in the lower grid is always the local user, followed by up to three active remote participants. The local camera is mirrored; if it is disabled, the card shows the participant name and initials. The maximum is four cards.
- The grid always contains two or four positions. With one or three real cards, the unused position is filled by an unlabeled participant icon placeholder.
- The area above the controls is always split into two equal sections: screen sharing at the top and participant cards at the bottom. Four cards use a `2×2` grid; two cards use one row and fill the lower section vertically.
- The initial Document PiP size is `320×640`. Chrome 130+ receives `preferInitialWindowPlacement: true`, preventing restoration of an older saved size. The user can still resize the window, and the browser may constrain it to available screen space.
- An active screen share is displayed in a large tile above the participant grid. Remote and local screen shares are supported; a separate desktop track does not replace the local camera card.
- When multiple screen shares exist, the plugin prefers the source on Jitsi's large stage, followed by the most recent remote or local share.
- The screen-share slot is always present. Without a share, it displays an unlabeled screen icon, so starting and stopping a share does not change the outer layout.
- Shared video is not added as a participant card.
- If a participant has no active camera track, the plugin shows an avatar or initials.
- Audio remains in the main Jitsi document to avoid duplicate playback and echo.
- Controls are available for microphone, camera, returning to the conference, and hanging up. Enabled microphone and camera states use regular icons; disabled states use crossed-out icons and updated accessible action labels. Like the other PiP controls, the hangup button uses its own embedded SVG and does not depend on Jitsi toolbar DOM.
- A compact `Participants: N · In lobby: M` row appears below the controls. The labels come from `participantsLabel` and `lobbyLabel`, and the values update through the Redux subscription without reopening PiP. Screen-share and other virtual participants are excluded.
- An automatically opened PiP window closes when the Jitsi tab becomes visible again. A manually opened window remains open.
- If the user manually closes an automatically opened window, Auto PiP remains suppressed until the page is reloaded or the user joins a new conference. Manual PiP remains available.
- Safari and browsers without Document PiP use standard Video PiP, showing the active screen share or one active speaker with browser-provided controls.

Automatic opening is controlled by the browser. Chrome and Edge require a real `https://` URL (local `http://127.0.0.1` is not sufficient), an active camera or microphone capture, a Media Session handler, and Automatic Picture-in-Picture site permission. Manual opening requires a user gesture. Document PiP requires a secure top-level page; trusted `localhost` and `127.0.0.1` origins are also usable for local manual development. Document PiP is not available inside an iframe.

The plugin distinguishes Media Session reasons: `contentoccluded` opens an automatic window when the tab is hidden, while `useraction` is treated as a manual request from Chrome media controls. Local camera and microphone states are synchronized with Media Session. If Chrome does not send an Auto PiP event, the plugin explains the missing capture or site permission after the user returns to Jitsi.

## Public API

```js
await window.JitsiBrowserPiP.open();
await window.JitsiBrowserPiP.close();
window.JitsiBrowserPiP.getState();
window.JitsiBrowserPiP.destroy();
```

`getState().autoPiP` exposes automatic-mode diagnostics: local capture activity, Media Session registration, secure-context and protocol eligibility, readiness, the last Chrome event reason, the last error, and the `suppressedByUser` flag.

`getState().screenShare` contains the active share identifier, label, and local flag, or is absent when no screen share is active.

If the browser did not initiate Auto PiP itself, call `open()` directly from a user-action handler.

## Development and testing

```bash
npm install
npm run check
```

Run the checks in local Docker:

```bash
docker compose -p jitsi-meet-pip-test -f test/docker/compose.yml run --rm test
```

The command uses only the project directory. It does not publish images, deploy software, or write to external systems.

Use [test/jitsi/README.md](test/jitsi/README.md) to run a complete local Jitsi instance with the plugin. Auto PiP is available at `https://127.0.0.1:18443/` after trusting the local CA. Port `18000` remains available for manual PiP only.

Manual browser smoke test:

```bash
docker run --rm --name jitsi-meet-pip-smoke \
  -p 127.0.0.1:4173:4173 \
  -v "$PWD:/workspace:ro" -w /workspace \
  node:24-bookworm node test/browser/server.mjs
```

Then open `http://127.0.0.1:4173/test/browser/`. The page contains a local mock Jitsi environment with four video streams and loads the same minified bundle intended for installation.

The contract test reads the adjacent `../jitsi-meet` directory by default. Override it with:

```bash
JITSI_SOURCE_DIR=/path/to/jitsi-meet npm run test:contract
```

## License

The project is distributed under the [MIT License](LICENSE). You may use, modify, publish, and distribute it as long as `Copyright (c) 2026 Dmitry Karasev <articks@gmail.com>` and the MIT License text are retained. See [License and authorship](docs/LEGAL.md) for details.

Additional documentation: [plan](docs/PLAN.md), [decisions](docs/DECISIONS.md), [compatibility](docs/COMPATIBILITY.md), [test results](docs/TEST_RESULTS.md), and [license and authorship](docs/LEGAL.md).
